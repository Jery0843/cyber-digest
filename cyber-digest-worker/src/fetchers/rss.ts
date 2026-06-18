import type { CyberEvent } from '../types';

interface FeedConfig {
  url: string;
  name: string;
}

const FEEDS: FeedConfig[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // TOP CYBERSECURITY NEWS (9)
  // ═══════════════════════════════════════════════════════════════════════════
  { url: 'https://krebsonsecurity.com/feed/', name: 'Krebs on Security' },
  { url: 'https://www.bleepingcomputer.com/feed/', name: 'BleepingComputer' },
  { url: 'https://thehackernews.com/feeds/posts/default', name: 'The Hacker News' },
  { url: 'https://www.darkreading.com/rss.xml', name: 'Dark Reading' },
  { url: 'https://www.securityweek.com/feed/', name: 'SecurityWeek' },
  { url: 'https://cyware.com/rss-feed/', name: 'Cyware Hacker News' },
  { url: 'https://www.schneier.com/blog/atom.xml', name: 'Schneier on Security' },
  { url: 'https://news.ycombinator.com/rss', name: 'Hacker News (YCombinator)' },
  { url: 'https://www.threatintel.academy/feed/', name: 'Threat Intel Academy' },

  // ═══════════════════════════════════════════════════════════════════════════
  // THREAT INTEL & VULNERABILITY DATA (12)
  // ═══════════════════════════════════════════════════════════════════════════
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
  { url: 'https://feeds.feedburner.com/TheHackersNews', name: 'The Hackers News Feedburner' },

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERAL CYBERSECURITY BLOGS & MAGAZINES (22)
  // ═══════════════════════════════════════════════════════════════════════════
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
  { url: 'https://thecyberexpress.com/feed/', name: 'The Cyber Express' },
  { url: 'https://cybernews.com/feed/', name: 'CyberNews' },
  { url: 'https://www.cyberscoop.com/feed/', name: 'CyberScoop' },
  { url: 'https://www.securitymagazine.com/rss', name: 'Security Magazine' },
  { url: 'https://www.itsecurityguru.org/feed/', name: 'IT Security Guru' },
  { url: 'https://www.esecurityplanet.com/feed/', name: 'eSecurity Planet' },
  { url: 'https://www.bankinfosecurity.com/rss-feeds', name: 'Bank Info Security' },

  // ═══════════════════════════════════════════════════════════════════════════
  // VENDOR SECURITY LABS & RESEARCH (35)
  // ═══════════════════════════════════════════════════════════════════════════
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
  { url: 'https://www.mandiant.com/resources/blog/rss.xml', name: 'Mandiant Blog' },
  { url: 'https://www.recordedfuture.com/feed/', name: 'Recorded Future' },
  { url: 'https://unit42.paloaltonetworks.com/feed/', name: 'Unit 42' },
  { url: 'https://www.zscaler.com/blogs/security-research/rss.xml', name: 'Zscaler Security Research' },
  { url: 'https://thedfirreport.com/feed/', name: 'The DFIR Report' },
  { url: 'https://blog.talosintelligence.com/feeds/posts/default', name: 'Cisco Talos' },
  { url: 'https://www.sentinelone.com/blog/feed/', name: 'SentinelOne Blog' },
  { url: 'https://www.cybereason.com/blog/rss.xml', name: 'Cybereason Blog' },
  { url: 'https://blog.trendmicro.com/feed/', name: 'Trend Micro Blog' },
  { url: 'https://www.sophos.com/en-us/security-news-trends/security-trends/feed', name: 'Sophos Security Trends' },
  { url: 'https://blog.avast.com/feed', name: 'Avast Blog' },
  { url: 'https://www.bitdefender.com/blog/api/rss/labs/', name: 'Bitdefender Labs' },
  { url: 'https://www.eset.com/int/about/newsroom/press-releases/feed/', name: 'ESET Newsroom' },
  { url: 'https://blog.emsisoft.com/en/feed/', name: 'Emsisoft Blog' },
  { url: 'https://www.intezer.com/blog/feed/', name: 'Intezer Blog' },
  { url: 'https://www.crowdstrike.com/blog/category/threat-intel-research/feed/', name: 'CrowdStrike Threat Intel' },
  { url: 'https://security.googleblog.com/feeds/posts/default', name: 'Google Security Blog' },
  { url: 'https://aws.amazon.com/blogs/security/feed/', name: 'AWS Security Blog' },
  { url: 'https://www.ibm.com/blogs/security/feed/', name: 'IBM Security Intelligence' },
  { url: 'https://www.digitalshadows.com/blog-and-research/feed/', name: 'Digital Shadows' },
  { url: 'https://www.flashpoint-intel.com/blog/feed/', name: 'Flashpoint Intel Blog' },
  { url: 'https://www.intel471.com/blog/rss.xml', name: 'Intel 471 Blog' },
  { url: 'https://www.recordedfuture.com/category/cyber-threat-intelligence/feed/', name: 'Recorded Future CTI' },
  { url: 'https://www.bleepingcomputer.com/feed/virus-removal/', name: 'BleepingComputer Virus Removal' },
  { url: 'https://nakedsecurity.sophos.com/feed/', name: 'Sophos Naked Security' },

  // ═══════════════════════════════════════════════════════════════════════════
  // OFFENSIVE SECURITY & BUG BOUNTY (10)
  // ═══════════════════════════════════════════════════════════════════════════
  { url: 'https://www.hackerone.com/blog.rss', name: 'HackerOne Blog' },
  { url: 'https://bugcrowd.com/blog/feed/', name: 'Bugcrowd Blog' },
  { url: 'https://www.blackhillsinfosec.com/feed/', name: 'Black Hills Information Security' },
  { url: 'https://www.trustedsec.com/feed/', name: 'TrustedSec' },
  { url: 'https://posts.specterops.io/feed', name: 'SpecterOps' },
  { url: 'https://www.pentestpartners.com/security-blog/feed/', name: 'Pen Test Partners' },
  { url: 'https://blog.sucuri.net/feed', name: 'Sucuri Blog' },
  { url: 'https://www.wordfence.com/blog/feed/', name: 'Wordfence Blog' },
  { url: 'https://blog.detectify.com/feed/', name: 'Detectify Blog' },
  { url: 'https://redcanary.com/blog/feed/', name: 'Red Canary Blog' },

  // ═══════════════════════════════════════════════════════════════════════════
  // MANAGED SECURITY & DETECTION (8)
  // ═══════════════════════════════════════════════════════════════════════════
  { url: 'https://www.huntress.com/blog/rss.xml', name: 'Huntress Blog' },
  { url: 'https://expel.com/blog/feed/', name: 'Expel Blog' },
  { url: 'https://arcticwolf.com/resources/blog/feed/', name: 'Arctic Wolf Blog' },
  { url: 'https://www.secureworks.com/rss?feed=blog', name: 'Secureworks Blog' },
  { url: 'https://www.tripwire.com/state-of-security/feed', name: 'Tripwire State of Security' },
  { url: 'https://blog.knowbe4.com/rss.xml', name: 'KnowBe4 Blog' },
  { url: 'https://www.dragos.com/blog/feed/', name: 'Dragos Blog' },
  { url: 'https://www.varonis.com/blog/rss.xml', name: 'Varonis Security Blog' },

  // ═══════════════════════════════════════════════════════════════════════════
  // ICS / OT / IOT SECURITY (5)
  // ═══════════════════════════════════════════════════════════════════════════
  { url: 'https://claroty.com/blog/rss.xml', name: 'Claroty Blog' },
  { url: 'https://www.nozominetworks.com/blog/feed/', name: 'Nozomi Networks Blog' },
  { url: 'https://www.armis.com/blog/feed/', name: 'Armis Blog' },
  { url: 'https://www.darktrace.com/en/blog/rss.xml', name: 'Darktrace Blog' },
  { url: 'https://www.greynoise.io/blog/rss.xml', name: 'GreyNoise Blog' },

  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTITY & ACCESS MANAGEMENT (6)
  // ═══════════════════════════════════════════════════════════════════════════
  { url: 'https://www.cyberark.com/resources/blog/feed', name: 'CyberArk Blog' },
  { url: 'https://www.sailpoint.com/identity-library/blog/feed/', name: 'SailPoint Blog' },
  { url: 'https://www.okta.com/blog/rss.xml', name: 'Okta Security Blog' },
  { url: 'https://www.pingidentity.com/en/company/blog.rss.xml', name: 'Ping Identity Blog' },
  { url: 'https://www.beyondtrust.com/blog/feed', name: 'BeyondTrust Blog' },
  { url: 'https://blog.netwrix.com/feed/', name: 'Netwrix Blog' },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL INTEL & MISC (10)
  // ═══════════════════════════════════════════════════════════════════════════
  { url: 'https://cybersecurity.att.com/site/blog-all-rss', name: 'AT&T Cybersecurity' },
  { url: 'https://www.upguard.com/blog/rss.xml', name: 'UpGuard Blog' },
  { url: 'https://www.imperva.com/blog/feed/', name: 'Imperva Blog' },
  { url: 'https://www.sonatype.com/blog/rss.xml', name: 'Sonatype Blog' },
  { url: 'https://www.shodan.io/blog/rss', name: 'Shodan Blog' },
  { url: 'https://censys.io/blog/feed/', name: 'Censys Blog' },
  { url: 'https://www.cio.com/category/security/feed', name: 'CIO Security' },
  { url: 'https://www.cnet.com/rss/security/', name: 'CNET Security' },
  { url: 'https://www.zdnet.com/topic/security/rss.xml', name: 'ZDNet Security' },
  { url: 'https://www.cyberint.com/blog/feed/', name: 'Cyberint Blog' },
  { url: 'https://www.coresecurity.com/blog/feed', name: 'Core Security Blog' },
  { url: 'https://www.illusive.com/blog/rss.xml', name: 'Illusive Blog' },
  { url: 'https://www.extrahop.com/company/blog/rss.xml', name: 'ExtraHop Blog' },
  { url: 'https://www.vectra.ai/blog/rss.xml', name: 'Vectra AI Blog' },
];

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
const FEED_TIMEOUT_MS = 8000;   // 8 seconds per feed
const BATCH_SIZE = 15;          // Fetch 15 feeds concurrently per batch

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FETCHER — processes ALL feeds in controlled batches
// ═══════════════════════════════════════════════════════════════════════════
export async function fetchRSSFeeds(): Promise<CyberEvent[]> {
  const allEvents: CyberEvent[] = [];
  
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

  let feedsSucceeded = 0;
  let feedsFailed = 0;
  let feedsTimedOut = 0;
  let feedsNoItems = 0;
  const failedFeedNames: string[] = [];

  console.log(`[RSS] Starting fetch of ${FEEDS.length} feeds in batches of ${BATCH_SIZE}...`);

  // Process in batches to avoid overwhelming Workers subrequest limits
  for (let i = 0; i < FEEDS.length; i += BATCH_SIZE) {
    const batch = FEEDS.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(FEEDS.length / BATCH_SIZE);

    const results = await Promise.allSettled(batch.map(async (feed) => {
      return fetchSingleFeed(feed, oneDayAgo);
    }));

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const feed = batch[j];

      if (result.status === 'fulfilled') {
        const { events, itemCount, status } = result.value;
        if (status === 'timeout') {
          feedsTimedOut++;
          failedFeedNames.push(`${feed.name} (timeout)`);
        } else if (status === 'error') {
          feedsFailed++;
          failedFeedNames.push(feed.name);
        } else if (events.length === 0) {
          feedsNoItems++;
          feedsSucceeded++; // Feed worked, just no fresh items
        } else {
          feedsSucceeded++;
          allEvents.push(...events);
        }
      } else {
        // Promise itself rejected (shouldn't happen due to inner try/catch, but safety net)
        feedsFailed++;
        failedFeedNames.push(`${feed.name} (crash)`);
      }
    }

    console.log(`[RSS] Batch ${batchNum}/${totalBatches} done — ${allEvents.length} events so far`);
  }

  // ─── Summary log ───
  console.log(`[RSS] ══════════════ FETCH SUMMARY ══════════════`);
  console.log(`[RSS] Total feeds: ${FEEDS.length}`);
  console.log(`[RSS] Succeeded: ${feedsSucceeded} | Failed: ${feedsFailed} | Timed out: ${feedsTimedOut}`);
  console.log(`[RSS] Feeds with no fresh items (24h): ${feedsNoItems}`);
  console.log(`[RSS] Total events collected: ${allEvents.length}`);
  if (failedFeedNames.length > 0) {
    console.warn(`[RSS] Failed feeds: ${failedFeedNames.join(', ')}`);
  }
  console.log(`[RSS] ═════════════════════════════════════════════`);

  return allEvents;
}

// ═══════════════════════════════════════════════════════════════════════════
// Single feed fetcher with timeout via AbortController
// ═══════════════════════════════════════════════════════════════════════════
interface FeedResult {
  events: CyberEvent[];
  itemCount: number;
  status: 'ok' | 'error' | 'timeout';
}

async function fetchSingleFeed(feed: FeedConfig, oneDayAgo: Date): Promise<FeedResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);

  try {
    const response = await fetch(feed.url, {
      headers: { 'User-Agent': 'CyberDigest/1.0' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[RSS] ✗ ${feed.name} — HTTP ${response.status}`);
      return { events: [], itemCount: 0, status: 'error' };
    }

    const xmlText = await response.text();
    const items = parseXMLItems(xmlText);
    const events: CyberEvent[] = [];

    for (const item of items) {
      const pubDate = new Date(item.pubDate);
      if (isNaN(pubDate.getTime()) || pubDate < oneDayAgo) {
        continue; // Skip old or malformed entries
      }

      // Skip items with no title or link
      if (!item.title || !item.link) continue;

      events.push({
        id: crypto.randomUUID(),
        title: item.title,
        description: cleanHTML(item.description),
        cve_id: extractCVE(item.title) || extractCVE(item.description),
        severity: null,
        vendor: null,
        source_url: item.link,
        source_name: feed.name,
        event_date: pubDate.toISOString(),
        is_exploited: detectExploitation(item.title + ' ' + item.description),
        raw_json: JSON.stringify(item)
      });
    }

    return { events, itemCount: items.length, status: 'ok' };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.error(`[RSS] ⏱ ${feed.name} — timed out after ${FEED_TIMEOUT_MS}ms`);
      return { events: [], itemCount: 0, status: 'timeout' };
    }
    console.error(`[RSS] ✗ ${feed.name} — ${err.message || err}`);
    return { events: [], itemCount: 0, status: 'error' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// XML Parser — regex-based for Workers (no DOMParser available)
// ═══════════════════════════════════════════════════════════════════════════
function parseXMLItems(xml: string) {
  const items: any[] = [];
  
  // Try RSS <item>
  let itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    items.push(extractFields(match[1], false));
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

function extractFields(itemXml: string, isAtom: boolean) {
  const extract = (tag: string) => {
    // Match opening tag (with possible attributes) through closing tag
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
    const match = itemXml.match(regex);
    if (!match) return '';
    // Handle CDATA
    return match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
  };

  const getLink = () => {
    // Method 1: Atom-style <link href="..." />
    const attrMatch = itemXml.match(/<link[^>]+href="([^"]+)"/i);
    if (attrMatch) return attrMatch[1];

    // Method 2: RSS-style <link>URL</link>
    const textLink = extract('link');
    if (textLink) return textLink;

    // Method 3: <guid> as fallback
    const guid = extract('guid');
    if (guid && guid.startsWith('http')) return guid;

    return '';
  };
  
  const getPubDate = () => {
    if (isAtom) {
      return extract('published') || extract('updated');
    }
    return extract('pubDate') || extract('dc:date') || extract('date');
  };

  return {
    title: extract('title'),
    link: getLink(),
    description: extract('description') || extract('content') || extract('summary') || extract('content:encoded'),
    pubDate: getPubDate()
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════════════
function cleanHTML(str: string) {
  return str.replace(/<[^>]*>?/gm, '').substring(0, 2000); // Strip HTML and truncate — preserve more context for AI analysis
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
