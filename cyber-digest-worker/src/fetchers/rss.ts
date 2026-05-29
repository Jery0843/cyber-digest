import type { CyberEvent } from '../types';

interface FeedConfig {
  url: string;
  name: string;
}

const FEEDS: FeedConfig[] = [
  // Top News
  { url: 'https://krebsonsecurity.com/feed/', name: 'Krebs on Security' },
  { url: 'https://www.bleepingcomputer.com/feed/', name: 'BleepingComputer' },
  { url: 'https://thehackernews.com/feeds/posts/default', name: 'The Hacker News' },
  { url: 'https://www.darkreading.com/rss.xml', name: 'Dark Reading' },
  { url: 'https://www.securityweek.com/feed/', name: 'SecurityWeek' },
  { url: 'https://cyware.com/rss-feed/', name: 'Cyware Hacker News' },
  { url: 'https://www.schneier.com/blog/atom.xml', name: 'Schneier on Security' },
  { url: 'https://news.ycombinator.com/rss', name: 'Hacker News (YCombinator)' },
  { url: 'https://www.threatintel.academy/feed/', name: 'Threat Intel Academy' },
  
  // Threat Intel & Vulnerability Data
  { url: 'https://isc.sans.edu/rssfeed.xml', name: 'SANS Internet Storm Center' },
  { url: 'https://www.cisa.gov/cybersecurity-advisories/all.xml', name: 'CISA Cybersecurity Advisories' },
  { url: 'https://securelist.com/feed/', name: 'Kaspersky Securelist' },
  { url: 'https://threatpost.com/feed/', name: 'Threatpost' },
  { url: 'https://www.trendmicro.com/vinfo/us/rss/security', name: 'Trend Micro Security News' },
  { url: 'https://www.symantec.com/connect/item-feeds/blog/2261/feed/all/en/all', name: 'Symantec Security' },
  { url: 'https://www.crowdstrike.com/blog/feed/', name: 'CrowdStrike Blog' },
  { url: 'https://www.fireeye.com/blog/threat-research/_jcr_content.feed', name: 'FireEye Threat Research' },
  { url: 'https://paloaltonetworks.com/blog/feed/', name: 'Palo Alto Networks' },
  { url: 'https://research.checkpoint.com/feed/', name: 'Check Point Research' },
  { url: 'https://www.mcafee.com/blogs/feed/', name: 'McAfee Labs' },
  
  // Niche / General Cybersecurity Blogs
  { url: 'https://www.nakedsecurity.sophos.com/feed/', name: 'Naked Security' },
  { url: 'https://www.grahamcluley.com/feed/', name: 'Graham Cluley' },
  { url: 'https://www.troyhunt.com/rss/', name: 'Troy Hunt' },
  { url: 'https://portswigger.net/daily-swig/rss', name: 'The Daily Swig' },
  { url: 'https://www.helpnetsecurity.com/feed/', name: 'Help Net Security' },
  { url: 'https://www.cybersecuritydive.com/feeds/news/', name: 'Cybersecurity Dive' },
  { url: 'https://www.csoonline.com/feed', name: 'CSO Online' },
  { url: 'https://www.infosecurity-magazine.com/rss/news/', name: 'Infosecurity Magazine' },
  { url: 'https://www.scmagazine.com/rss/', name: 'SC Magazine' },
  { url: 'https://www.ehackingnews.com/feeds/posts/default', name: 'E-Hacking News' },
  { url: 'https://gbhackers.com/feed/', name: 'GBHackers On Security' },
  { url: 'https://latesthackingnews.com/feed/', name: 'Latest Hacking News' },
  { url: 'https://securityaffairs.co/wordpress/feed', name: 'Security Affairs' },
  { url: 'https://www.welivesecurity.com/feed/', name: 'WeLiveSecurity' },
  { url: 'https://blogs.quickheal.com/feed/', name: 'Quick Heal Blog' },
  { url: 'https://blog.malwarebytes.com/feed/', name: 'Malwarebytes Labs' },
  { url: 'https://www.tenable.com/blog/feed', name: 'Tenable Blog' },
  { url: 'https://www.rapid7.com/blog/feed', name: 'Rapid7 Blog' },
  { url: 'https://blog.qualys.com/feed', name: 'Qualys Security Blog' },
  { url: 'https://www.proofpoint.com/us/threat-insight/feed', name: 'Proofpoint Threat Insight' },
  { url: 'https://www.fortinet.com/blog/threat-research/rss', name: 'Fortinet Threat Research' },
  { url: 'https://blogs.cisco.com/security/feed', name: 'Cisco Security Blog' },
  { url: 'https://www.f5.com/labs/rss.xml', name: 'F5 Labs' },
  { url: 'https://blog.cloudflare.com/tag/security/rss/', name: 'Cloudflare Security Blog' },
  { url: 'https://www.akamai.com/blog/feed/security', name: 'Akamai Security' },
  { url: 'https://www.digitalshadows.com/blog-and-research/feed/', name: 'Digital Shadows' },
  { url: 'https://www.mandiant.com/resources/blog/rss.xml', name: 'Mandiant Blog' },
  { url: 'https://www.recordedfuture.com/feed/', name: 'Recorded Future' },
  { url: 'https://unit42.paloaltonetworks.com/feed/', name: 'Unit 42' },
  { url: 'https://www.zscaler.com/blogs/security-research/rss.xml', name: 'Zscaler Security Research' },
  { url: 'https://thedfirreport.com/feed/', name: 'The DFIR Report' },
  { url: 'https://blog.talosintelligence.com/feeds/posts/default', name: 'Cisco Talos' },
  { url: 'https://www.dragos.com/blog/feed/', name: 'Dragos Blog' },
  { url: 'https://www.cyberark.com/resources/threat-research-blog/feed', name: 'CyberArk Threat Research' },
  { url: 'https://www.varonis.com/blog/rss.xml', name: 'Varonis Security Blog' }
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
