import type { Env, CyberEvent } from './types';
import { fetchNVD } from './fetchers/nvd';
import { fetchCISA } from './fetchers/cisa';
import { fetchGitHubAdvisories } from './fetchers/github';
import { fetchRSSFeeds } from './fetchers/rss';
import { normalizeEvents } from './pipeline/normalize';
import { deduplicateEvents } from './pipeline/deduplicate';
import { rankEvents } from './pipeline/rank';
import { generateContent } from './generation/generator';
import { validateContent } from './generation/validator';
import { savePost, logGeneration, getRecentSourceUrls } from './db/queries';

export default {
  // Provide a fetch handler for testing the worker manually without waiting for cron
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/__scheduled') {
      await this.scheduled({ cron: 'manual', type: 'manual', scheduledTime: Date.now() } as unknown as ScheduledEvent, env, ctx);
      return new Response('Scheduled task executed manually.', { status: 200 });
    }
    return new Response('CyberDigest Worker is running. Daily cron scheduled.', { status: 200 });
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log(`Cron triggered at ${new Date(event.scheduledTime).toISOString()}`);
    let postsCreated = 0;
    
    try {
      // 1. Fetch from all sources in parallel
      console.log('Fetching from data sources...');
      const [nvdEvents, cisaEvents, ghEvents, rssEvents] = await Promise.all([
        fetchNVD(), // Optional: pass API key if configured via env vars
        fetchCISA(),
        fetchGitHubAdvisories(), // Optional: pass PAT if configured
        fetchRSSFeeds()
      ]);

      let allEvents = [...nvdEvents, ...cisaEvents, ...ghEvents, ...rssEvents];
      console.log(`Collected ${allEvents.length} raw events.`);

      // Filter out events that we have already published recently
      const recentUrls = await getRecentSourceUrls(env);
      allEvents = allEvents.filter(e => !e.source_url || !recentUrls.has(e.source_url));
      console.log(`After DB deduplication: ${allEvents.length} events remain.`);

      if (allEvents.length === 0) {
        console.log('No events collected today. Skipping generation.');
        await logGeneration(env, 'skipped', 0, 'No events found');
        return;
      }

      // 2. Normalization & Deduplication & Ranking
      allEvents = await normalizeEvents(allEvents);
      allEvents = deduplicateEvents(allEvents);
      const rankedEvents = rankEvents(allEvents);
      
      console.log(`Pipeline yielded ${rankedEvents.length} unique ranked topics.`);

      // 3 & 4. Topic Selection & Generation with Fallback
      let remainingEvents = [...rankedEvents];
      const targetPostTypes = ['article', 'news', 'blog'] as const;

      for (const pt of targetPostTypes) {
        let successForType = false;
        
        while (!successForType && remainingEvents.length > 0) {
           // Take the top event and its related CVE events
           const candidate = remainingEvents[0];
           const related = candidate.cve_id ? remainingEvents.filter(e => e.id !== candidate.id && e.cve_id === candidate.cve_id) : [];
           const group = [candidate, ...related];
           
           // Remove these from remainingEvents pool
           remainingEvents = remainingEvents.filter(e => !group.find(g => g.id === e.id));
           
           console.log(`Attempting to generate ${pt} post from ${group.length} events (Candidate: ${candidate.title})...`);
           const generated = await generateContent(env, group, pt);
           
           if (generated) {
             const validation = validateContent(generated, group, pt);
             if (validation.isValid) {
               const success = await savePost(env, { ...generated, type: pt }, group);
               if (success) {
                 postsCreated++;
                 successForType = true;
                 console.log(`Successfully published ${pt} post.`);
               } else {
                 console.error(`Failed to save ${pt} post to database.`);
               }
             } else {
               console.warn(`Validation failed for ${pt}: ${validation.reason}. Trying next topic...`);
             }
           } else {
             console.warn(`AI failed to generate content for ${pt}. Trying next topic...`);
           }
        }
        
        if (!successForType) {
           console.warn(`Exhausted all events without successfully generating a ${pt} post.`);
        }
      }

      // 5. Finalize log
      const status = postsCreated === 3 ? 'success' : (postsCreated > 0 ? 'partial' : 'failure');
      const errorMsg = postsCreated === 0 ? 'All generations failed or were rejected by validator' : null;
      await logGeneration(env, status, postsCreated, errorMsg);

    } catch (err: any) {
      console.error('Fatal error during scheduled execution:', err);
      await logGeneration(env, 'failure', postsCreated, err.message || 'Unknown error');
    }
  }
};
