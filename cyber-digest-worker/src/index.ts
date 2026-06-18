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

// ═══════════════════════════════════════════════════════════════════════════
// Cron Slot Detection
// The worker has two cron triggers:
//   "0 2 * * *"  → Morning run  (02:00 UTC / 07:30 IST)
//   "0 14 * * *" → Evening run  (14:00 UTC / 19:30 IST)
//
// Both runs independently produce 3 posts (article + news + blog).
// The morning run uses events ranked by the standard pipeline.
// The evening run re-fetches to catch newly published articles and
// skips only sources that were already used in a post TODAY.
// ═══════════════════════════════════════════════════════════════════════════

type CronSlot = 'morning' | 'evening' | 'manual';

function detectCronSlot(event: ScheduledEvent | { cron: string }): CronSlot {
  const cron = event.cron;
  if (cron === '0 2 * * *') return 'morning';
  if (cron === '0 14 * * *') return 'evening';
  return 'manual'; // Manual trigger via /__scheduled
}

export default {
  // Provide a fetch handler for testing the worker manually without waiting for cron
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/__scheduled') {
      await this.scheduled({ cron: 'manual', type: 'manual', scheduledTime: Date.now() } as unknown as ScheduledEvent, env, ctx);
      return new Response('Scheduled task executed manually.', { status: 200 });
    }
    return new Response('CyberDigest Worker is running. Dual cron scheduled (02:00 & 14:00 UTC).', { status: 200 });
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const slot = detectCronSlot(event);
    console.log(`══════════════════════════════════════════════════════════════`);
    console.log(`Cron triggered: slot=${slot} | time=${new Date(event.scheduledTime).toISOString()}`);
    console.log(`══════════════════════════════════════════════════════════════`);

    let postsCreated = 0;
    
    try {
      // ─── 1. Fetch from all sources in parallel ─────────────────────────
      console.log('Fetching from data sources...');
      const [nvdEvents, cisaEvents, ghEvents, rssEvents] = await Promise.all([
        fetchNVD(),
        fetchCISA(),
        fetchGitHubAdvisories(),
        fetchRSSFeeds()
      ]);

      console.log(`[Sources] NVD: ${nvdEvents.length} | CISA: ${cisaEvents.length} | GitHub: ${ghEvents.length} | RSS: ${rssEvents.length}`);

      let allEvents = [...nvdEvents, ...cisaEvents, ...ghEvents, ...rssEvents];
      console.log(`[Pipeline] Total raw events from all sources: ${allEvents.length}`);

      // ─── 2. Filter out previously published sources ─────────────────────
      // Use a shorter lookback window so the evening run isn't starved
      // by the morning run consuming all sources.
      const recentUrls = await getRecentSourceUrls(env);
      const beforeDedup = allEvents.length;
      allEvents = allEvents.filter(e => !e.source_url || !recentUrls.has(e.source_url));
      console.log(`[DB Dedup] Removed ${beforeDedup - allEvents.length} already-published sources → ${allEvents.length} remain`);

      if (allEvents.length === 0) {
        console.log('No events collected. Skipping generation.');
        await logGeneration(env, 'skipped', 0, `No events found (slot: ${slot})`);
        return;
      }

      // ─── 3. Normalization & Deduplication ───────────────────────────────
      allEvents = await normalizeEvents(allEvents);
      allEvents = deduplicateEvents(allEvents);
      console.log(`[Pipeline] After normalize + dedup: ${allEvents.length} events`);

      // ─── 4. Freshness Gate ──────────────────────────────────────────────
      // Prefer same-day (24h), fallback to 48h
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      const twoDaysAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));

      const freshEvents = allEvents.filter(e => {
        const d = new Date(e.event_date);
        return !isNaN(d.getTime()) && d >= oneDayAgo;
      });

      if (freshEvents.length > 0) {
        allEvents = freshEvents;
        console.log(`[Freshness] ${freshEvents.length} events from last 24h — using these.`);
      } else {
        const fallbackEvents = allEvents.filter(e => {
          const d = new Date(e.event_date);
          return !isNaN(d.getTime()) && d >= twoDaysAgo;
        });
        allEvents = fallbackEvents;
        console.warn(`[Freshness] 0 events in last 24h. Falling back to ${fallbackEvents.length} events from last 48h.`);
      }

      if (allEvents.length === 0) {
        console.log('No fresh events remaining after freshness gate. Skipping generation.');
        await logGeneration(env, 'skipped', 0, `No fresh events within 24-48h window (slot: ${slot})`);
        return;
      }

      // ─── 5. Rank events ────────────────────────────────────────────────
      const rankedEvents = rankEvents(allEvents);
      console.log(`[Ranking] Top event: "${rankedEvents[0]?.title}" (score: ${(rankedEvents[0] as any)?.rankScore})`);

      // ─── 6. Generate 3 posts (article, news, blog) ────────────────────
      let remainingEvents = [...rankedEvents];
      const targetPostTypes = ['article', 'news', 'blog'] as const;

      for (const pt of targetPostTypes) {
        let successForType = false;
        
        while (!successForType && remainingEvents.length > 0) {
           // Take the top event and its related CVE events
           const candidate = remainingEvents[0];
           const related = candidate.cve_id 
             ? remainingEvents.filter(e => e.id !== candidate.id && e.cve_id === candidate.cve_id) 
             : [];
           const group = [candidate, ...related];
           
           // Remove these from remainingEvents pool
           remainingEvents = remainingEvents.filter(e => !group.find(g => g.id === e.id));
           
           console.log(`[Gen] Attempting ${pt} from ${group.length} events: "${candidate.title}"`);
           const generated = await generateContent(env, group, pt);
           
           if (generated) {
             const validation = validateContent(generated, group, pt);
             if (validation.isValid) {
               const success = await savePost(env, { ...generated, type: pt }, group);
               if (success) {
                 postsCreated++;
                 successForType = true;
                 console.log(`[Gen] ✓ Published ${pt} post: "${generated.title}"`);
               } else {
                 console.error(`[Gen] ✗ Failed to save ${pt} post to database.`);
               }
             } else {
               console.warn(`[Gen] ✗ Validation failed for ${pt}: ${validation.reason}. Trying next topic...`);
             }
           } else {
             console.warn(`[Gen] ✗ AI failed to generate content for ${pt}. Trying next topic...`);
           }
        }
        
        if (!successForType) {
           console.warn(`[Gen] ⚠ Exhausted all events without successfully generating a ${pt} post.`);
        }
      }

      // ─── 7. Final log ──────────────────────────────────────────────────
      const status = postsCreated === 3 ? 'success' : (postsCreated > 0 ? 'partial' : 'failure');
      const errorMsg = postsCreated === 0 ? 'All generations failed or were rejected by validator' : null;
      await logGeneration(env, status, postsCreated, errorMsg);
      console.log(`══════════════════════════════════════════════════════════════`);
      console.log(`Run complete: slot=${slot} | posts=${postsCreated}/3 | status=${status}`);
      console.log(`══════════════════════════════════════════════════════════════`);

    } catch (err: any) {
      console.error('Fatal error during scheduled execution:', err);
      await logGeneration(env, 'failure', postsCreated, err.message || 'Unknown error');
    }
  }
};
