import type { CyberEvent } from '../types';

interface TopicSelection {
  newsTopic: CyberEvent[];
  blogTopic: CyberEvent[];
  articleTopic: CyberEvent[];
}

export function selectTopics(rankedEvents: CyberEvent[]): TopicSelection {
  const result: TopicSelection = {
    newsTopic: [],
    blogTopic: [],
    articleTopic: []
  };

  if (rankedEvents.length === 0) return result;

  // We want to group related events if they exist, but for MVP we'll just 
  // select the top discrete events and assign them to categories.

  // 1. Article Topic: Needs the most critical/complex issue (Highest Rank)
  const articleCandidate = rankedEvents[0];
  if (articleCandidate) {
     result.articleTopic.push(articleCandidate);
     // If there are other events with the same CVE, bundle them for more context
     if (articleCandidate.cve_id) {
        const related = rankedEvents.filter(e => e.id !== articleCandidate.id && e.cve_id === articleCandidate.cve_id);
        result.articleTopic.push(...related);
     }
  }

  // Filter out events already used for the Article
  let remaining = rankedEvents.filter(e => !result.articleTopic.find(a => a.id === e.id));

  // 2. News Topic: Needs something fresh and punchy
  if (remaining.length > 0) {
      result.newsTopic.push(remaining[0]);
      remaining = remaining.filter(e => e.id !== remaining[0].id);
  }

  // 3. Blog Topic: Needs something educational (maybe a widespread issue)
  if (remaining.length > 0) {
      result.blogTopic.push(remaining[0]);
  }

  return result;
}
