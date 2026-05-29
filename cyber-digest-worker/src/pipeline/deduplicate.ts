import type { CyberEvent } from '../types';

export function deduplicateEvents(events: CyberEvent[]): CyberEvent[] {
  const deduplicated: CyberEvent[] = [];
  const seenUrls = new Set<string>();
  const seenCves = new Set<string>();
  
  // Sort events by severity (descending) so if we deduplicate, we keep the one with the highest severity
  const sorted = [...events].sort((a, b) => {
    const scoreA = a.severity || 0;
    const scoreB = b.severity || 0;
    return scoreB - scoreA;
  });

  for (const event of sorted) {
    if (!event.source_url || !event.title) continue;

    // Dedupe by URL
    if (seenUrls.has(event.source_url)) {
      continue;
    }

    // Dedupe by CVE ID (if present)
    if (event.cve_id) {
      if (seenCves.has(event.cve_id)) {
        // If we already have this CVE, we might want to merge sources later.
        // For now, we just skip it because we sorted by severity and kept the best one.
        continue;
      }
      seenCves.add(event.cve_id);
    }

    // Fuzzy title deduplication (very basic)
    const normalizedTitle = event.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    let isFuzzyDuplicate = false;
    for (const existing of deduplicated) {
       const existingNormalized = existing.title.toLowerCase().replace(/[^a-z0-9]/g, '');
       
       // If strings are very similar in length and one contains the other, consider it a duplicate
       if (normalizedTitle.length > 20 && existingNormalized.length > 20) {
           if (normalizedTitle.includes(existingNormalized) || existingNormalized.includes(normalizedTitle)) {
               isFuzzyDuplicate = true;
               break;
           }
       }
    }

    if (isFuzzyDuplicate) {
        continue;
    }

    seenUrls.add(event.source_url);
    deduplicated.push(event);
  }

  return deduplicated;
}
