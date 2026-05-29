import type { CyberEvent } from '../types';

interface ScoredEvent extends CyberEvent {
  rankScore: number;
}

export function rankEvents(events: CyberEvent[]): ScoredEvent[] {
  return events.map(event => {
    let score = 0;

    // 1. Base score from CVSS (0-10, heavily weighted)
    if (event.severity) {
      score += event.severity * 5; // Max 50 points
    }

    // 2. Active exploitation (critical priority)
    if (event.is_exploited) {
      score += 40; 
    }

    // 3. Source credibility
    if (event.source_name === 'CISA Known Exploited Vulnerabilities Catalog') {
      score += 20;
    } else if (event.source_name === 'National Vulnerability Database (NVD)') {
      score += 10;
    } else if (event.source_name === 'GitHub Security Advisories') {
      score += 15;
    }

    // 4. Freshness
    const eventDate = new Date(event.event_date);
    const now = new Date();
    const hoursOld = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursOld < 12) {
      score += 15;
    } else if (hoursOld < 24) {
      score += 10;
    } else if (hoursOld < 48) {
      score += 5;
    }

    return {
      ...event,
      rankScore: score
    };
  }).sort((a, b) => b.rankScore - a.rankScore);
}
