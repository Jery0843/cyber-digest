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

      console.log(`[Sources] NVD: ${nvdEvents.length} | CISA: ${cisaEvents.length} | GitHub: ${ghEvents.length} | RSS: ${rssEvents.length}`);

      let allEvents = [...nvdEvents, ...cisaEvents, ...ghEvents, ...rssEvents];
      console.log(`[Pipeline] Total raw events from all sources: ${allEvents.length}`);

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

      // 2.5 Strict freshness gate — prefer same-day (24h), fallback to 48h
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      const twoDaysAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));

      const freshEvents = allEvents.filter(e => {
        const d = new Date(e.event_date);
        return !isNaN(d.getTime()) && d >= oneDayAgo;
      });

      if (freshEvents.length > 0) {
        allEvents = freshEvents;
        console.log(`Freshness gate: ${freshEvents.length} events from last 24h — using these.`);
      } else {
        // Fallback: use up to 48h events but log a warning
        const fallbackEvents = allEvents.filter(e => {
          const d = new Date(e.event_date);
          return !isNaN(d.getTime()) && d >= twoDaysAgo;
        });
        allEvents = fallbackEvents;
        console.warn(`Freshness gate: 0 events in last 24h. Falling back to ${fallbackEvents.length} events from last 48h.`);
      }

      if (allEvents.length === 0) {
        console.log('No fresh events remaining after freshness gate. Skipping generation.');
        await logGeneration(env, 'skipped', 0, 'No fresh events (within 24-48h window)');
        return;
      }

      const rankedEvents = rankEvents(allEvents);

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
