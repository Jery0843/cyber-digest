import type { CyberEvent } from '../types';

interface FeedConfig {
  url: string;
  name: string;
}

const FEEDS: FeedConfig[] = [
  { url: 'https://krebsonsecurity.com/feed/', name: 'Krebs on Security' },
  { url: 'https://www.bleepingcomputer.com/feed/', name: 'BleepingComputer' },
  { url: 'https://thehackernews.com/feeds/posts/default', name: 'The Hacker News' },
  { url: 'https://isc.sans.edu/rssfeed.xml', name: 'SANS Internet Storm Center' }
];

export async function fetchRSSFeeds(): Promise<CyberEvent[]> {
  const allEvents: CyberEvent[] = [];
  
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));

  await Promise.allSettled(FEEDS.map(async (feed) => {
    try {
      const response = await fetch(feed.url, {
        headers: { 'User-Agent': 'CyberDigest/1.0' }
      });

      if (!response.ok) {
        console.error(`RSS fetch failed for ${feed.name}: ${response.status}`);
        return;
      }

      const xmlText = await response.text();
      const items = parseXMLItems(xmlText);

      for (const item of items) {
        const pubDate = new Date(item.pubDate);
        if (isNaN(pubDate.getTime()) || pubDate < twoDaysAgo) {
          continue; // Skip old or malformed entries
        }

        allEvents.push({
          id: crypto.randomUUID(),
          title: item.title,
          description: cleanHTML(item.description),
          cve_id: extractCVE(item.title) || extractCVE(item.description),
          severity: null, // RSS feeds usually don't have structured CVSS scores
          vendor: null,
          source_url: item.link,
          source_name: feed.name,
          event_date: pubDate.toISOString(),
          is_exploited: detectExploitation(item.title + ' ' + item.description),
          raw_json: JSON.stringify(item)
        });
      }
    } catch (err) {
      console.error(`Error processing RSS feed ${feed.name}:`, err);
    }
  }));

  return allEvents;
}

// Very basic regex-based XML parser for RSS/Atom items since Workers don't have DOMParser
function parseXMLItems(xml: string) {
  const items: any[] = [];
  
  // Try RSS <item>
  let itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    items.push(extractFields(match[1]));
  }

  // Try Atom <entry> if no RSS items found
  if (items.length === 0) {
    itemRegex = /<entry>([\s\S]*?)<\/entry>/gi;
    while ((match = itemRegex.exec(xml)) !== null) {
      items.push(extractFields(match[1], true));
    }
  }

  return items;
}

function extractFields(itemXml: string, isAtom = false) {
  const extract = (tag: string) => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = itemXml.match(regex);
    if (!match) return '';
    // Handle CDATA
    return match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
  };

  const getLink = () => {
    if (!isAtom) return extract('link');
    // Atom links are often attributes: <link href="..." />
    const linkMatch = itemXml.match(/<link[^>]+href="([^"]+)"/i);
    return linkMatch ? linkMatch[1] : '';
  };
  
  const getPubDate = () => {
    return isAtom ? (extract('published') || extract('updated')) : extract('pubDate');
  };

  return {
    title: extract('title'),
    link: getLink(),
    description: extract('description') || extract('content') || extract('summary'),
    pubDate: getPubDate()
  };
}

function cleanHTML(str: string) {
  return str.replace(/<[^>]*>?/gm, '').substring(0, 500); // Strip HTML and truncate
}

function extractCVE(text: string): string | null {
  const match = text.match(/CVE-\d{4}-\d{4,7}/i);
  return match ? match[0].toUpperCase() : null;
}

function detectExploitation(text: string): boolean {
  const indicators = ['actively exploited', 'exploited in the wild', 'zero-day', '0-day', 'cisa kev'];
  const lower = text.toLowerCase();
  return indicators.some(indicator => lower.includes(indicator));
}
