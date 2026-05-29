import type { Env, CyberEvent } from './types';
import { fetchNVD } from './fetchers/nvd';
import { fetchCISA } from './fetchers/cisa';
import { fetchGitHubAdvisories } from './fetchers/github';
import { fetchRSSFeeds } from './fetchers/rss';
import { normalizeEvents } from './pipeline/normalize';
import { deduplicateEvents } from './pipeline/deduplicate';
import { rankEvents } from './pipeline/rank';
import { selectTopics } from './pipeline/select';
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

      // 3. Topic Selection
      const topics = selectTopics(rankedEvents);

      // 4. Generate & Validate Posts
      const postTypes = [
        { type: 'article' as const, events: topics.articleTopic },
        { type: 'news' as const, events: topics.newsTopic },
        { type: 'blog' as const, events: topics.blogTopic }
      ];

      for (const pt of postTypes) {
        if (pt.events.length === 0) continue;
        
        console.log(`Generating ${pt.type} post...`);
        const generated = await generateContent(env, pt.events, pt.type);
        
        if (generated) {
           const validation = validateContent(generated, pt.events, pt.type);
           if (validation.isValid) {
             const success = await savePost(env, { ...generated, type: pt.type }, pt.events);
             if (success) {
               postsCreated++;
               console.log(`Successfully published ${pt.type} post.`);
             }
           } else {
             console.warn(`Validation failed for ${pt.type}: ${validation.reason}`);
           }
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
