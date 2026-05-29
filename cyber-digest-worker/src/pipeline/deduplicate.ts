import type { CyberEvent } from '../types';

function calculateWordOverlap(title1: string, title2: string): number {
  const getWords = (t: string) => new Set(t.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3));
  const set1 = getWords(title1);
  const set2 = getWords(title2);
  
  if (set1.size === 0 || set2.size === 0) return 0;
  
  let intersection = 0;
  for (const word of set1) {
    if (set2.has(word)) intersection++;
  }
  
  const minSize = Math.min(set1.size, set2.size);
  return intersection / minSize;
}

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
        continue;
      }
      seenCves.add(event.cve_id);
    }

    // Stronger fuzzy title deduplication using word overlap
    let isFuzzyDuplicate = false;
    for (const existing of deduplicated) {
       // If 60% of significant words match, it's highly likely reporting the same event
       const overlap = calculateWordOverlap(event.title, existing.title);
       if (overlap > 0.6) {
           isFuzzyDuplicate = true;
           break;
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
