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
  { url: 'https://www.varonis.com/blog/rss.xml', name: 'Varonis Security Blog' },

  // Expanded Massive 100+ Sources Additions
  { url: 'https://feeds.feedburner.com/TheHackersNews', name: 'The Hackers News Feedburner' },
  { url: 'https://cybersecurity.att.com/site/blog-all-rss', name: 'AT&T Cybersecurity' },
  { url: 'https://www.hackerone.com/blog.rss', name: 'HackerOne Blog' },
  { url: 'https://bugcrowd.com/blog/feed/', name: 'Bugcrowd Blog' },
  { url: 'https://www.secureworks.com/rss?feed=blog', name: 'Secureworks Blog' },
  { url: 'https://www.tripwire.com/state-of-security/feed', name: 'Tripwire State of Security' },
  { url: 'https://www.upguard.com/blog/rss.xml', name: 'UpGuard Blog' },
  { url: 'https://blog.knowbe4.com/rss.xml', name: 'KnowBe4 Blog' },
  { url: 'https://www.imperva.com/blog/feed/', name: 'Imperva Blog' },
  { url: 'https://www.sonatype.com/blog/rss.xml', name: 'Sonatype Blog' },
  { url: 'https://www.ibm.com/blogs/security/feed/', name: 'IBM Security Intelligence' },
  { url: 'https://security.googleblog.com/feeds/posts/default', name: 'Google Security Blog' },
  { url: 'https://aws.amazon.com/blogs/security/feed/', name: 'AWS Security Blog' },
  { url: 'https://www.esecurityplanet.com/feed/', name: 'eSecurity Planet' },
  { url: 'https://www.cio.com/category/security/feed', name: 'CIO Security' },
  { url: 'https://www.cnet.com/rss/security/', name: 'CNET Security' },
  { url: 'https://www.zdnet.com/topic/security/rss.xml', name: 'ZDNet Security' },
  { url: 'https://thecyberexpress.com/feed/', name: 'The Cyber Express' },
  { url: 'https://cybernews.com/feed/', name: 'CyberNews' },
  { url: 'https://www.cyberscoop.com/feed/', name: 'CyberScoop' },
  { url: 'https://www.bankinfosecurity.com/rss-feeds', name: 'Bank Info Security' },
  { url: 'https://www.blackhillsinfosec.com/feed/', name: 'Black Hills Information Security' },
  { url: 'https://www.trustedsec.com/feed/', name: 'TrustedSec' },
  { url: 'https://posts.specterops.io/feed', name: 'SpecterOps' },
  { url: 'https://blog.netwrix.com/feed/', name: 'Netwrix Blog' },
  { url: 'https://www.beyondtrust.com/blog/feed', name: 'BeyondTrust Blog' },
  { url: 'https://www.cyberint.com/blog/feed/', name: 'Cyberint Blog' },
  { url: 'https://www.coresecurity.com/blog/feed', name: 'Core Security Blog' },
  { url: 'https://www.pentestpartners.com/security-blog/feed/', name: 'Pen Test Partners' },
  { url: 'https://blog.sucuri.net/feed', name: 'Sucuri Blog' },
  { url: 'https://www.wordfence.com/blog/feed/', name: 'Wordfence Blog' },
  { url: 'https://blog.detectify.com/feed/', name: 'Detectify Blog' },
  { url: 'https://www.shodan.io/blog/rss', name: 'Shodan Blog' },
  { url: 'https://censys.io/blog/feed/', name: 'Censys Blog' },
  { url: 'https://www.greynoise.io/blog/rss.xml', name: 'GreyNoise Blog' },
  { url: 'https://www.sentinelone.com/blog/feed/', name: 'SentinelOne Blog' },
  { url: 'https://www.cybereason.com/blog/rss.xml', name: 'Cybereason Blog' },
  { url: 'https://blog.trendmicro.com/feed/', name: 'Trend Micro Blog' },
  { url: 'https://www.sophos.com/en-us/security-news-trends/security-trends/feed', name: 'Sophos Security Trends' },
  { url: 'https://blog.avast.com/feed', name: 'Avast Blog' },
  { url: 'https://www.bitdefender.com/blog/api/rss/labs/', name: 'Bitdefender Labs' },
  { url: 'https://www.eset.com/int/about/newsroom/press-releases/feed/', name: 'ESET Newsroom' },
  { url: 'https://www.securitymagazine.com/rss', name: 'Security Magazine' },
  { url: 'https://www.itsecurityguru.org/feed/', name: 'IT Security Guru' },
  { url: 'https://www.bleepingcomputer.com/feed/virus-removal/', name: 'BleepingComputer Virus Removal' },
  { url: 'https://nakedsecurity.sophos.com/feed/', name: 'Sophos Naked Security' },
  { url: 'https://blog.emsisoft.com/en/feed/', name: 'Emsisoft Blog' },
  { url: 'https://www.intezer.com/blog/feed/', name: 'Intezer Blog' },
  { url: 'https://www.crowdstrike.com/blog/category/threat-intel-research/feed/', name: 'CrowdStrike Threat Intel' },
  { url: 'https://redcanary.com/blog/feed/', name: 'Red Canary Blog' },
  { url: 'https://www.huntress.com/blog/rss.xml', name: 'Huntress Blog' },
  { url: 'https://expel.com/blog/feed/', name: 'Expel Blog' },
  { url: 'https://arcticwolf.com/resources/blog/feed/', name: 'Arctic Wolf Blog' },
  { url: 'https://www.cybereason.com/blog/rss.xml', name: 'Cybereason Security Blog' },
  { url: 'https://www.illusive.com/blog/rss.xml', name: 'Illusive Blog' },
  { url: 'https://www.extrahop.com/company/blog/rss.xml', name: 'ExtraHop Blog' },
  { url: 'https://www.vectra.ai/blog/rss.xml', name: 'Vectra AI Blog' },
  { url: 'https://www.darktrace.com/en/blog/rss.xml', name: 'Darktrace Blog' },
  { url: 'https://www.recordedfuture.com/category/cyber-threat-intelligence/feed/', name: 'Recorded Future CTI' },
  { url: 'https://www.flashpoint-intel.com/blog/feed/', name: 'Flashpoint Intel Blog' },
  { url: 'https://www.digitalshadows.com/blog-and-research/feed/', name: 'Digital Shadows Research' },
  { url: 'https://www.intel471.com/blog/rss.xml', name: 'Intel 471 Blog' },
  { url: 'https://www.dragos.com/blog/feed/', name: 'Dragos ICS Security' },
  { url: 'https://claroty.com/blog/rss.xml', name: 'Claroty Blog' },
  { url: 'https://www.nozominetworks.com/blog/feed/', name: 'Nozomi Networks Blog' },
  { url: 'https://www.armis.com/blog/feed/', name: 'Armis Blog' },
  { url: 'https://www.cyberark.com/resources/blog/feed', name: 'CyberArk Blog' },
  { url: 'https://www.sailpoint.com/identity-library/blog/feed/', name: 'SailPoint Blog' },
  { url: 'https://www.okta.com/blog/rss.xml', name: 'Okta Security Blog' },
  { url: 'https://www.pingidentity.com/en/company/blog.rss.xml', name: 'Ping Identity Blog' }
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
