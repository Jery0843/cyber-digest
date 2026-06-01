import type { CyberEvent } from '../types';

export async function fetchGitHubAdvisories(token?: string): Promise<CyberEvent[]> {
  const events: CyberEvent[] = [];
  try {
    const headers: Record<string, string> = {
      'User-Agent': 'CyberDigest/1.0',
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    // GitHub API ISO format
    const publishedSince = oneDayAgo.toISOString();
    
    const response = await fetch(`https://api.github.com/advisories?type=reviewed&published:>${publishedSince}&per_page=30`, { headers });
    
    if (!response.ok) {
      console.error(`GitHub API error: ${response.status} ${response.statusText}`);
      return events;
    }

    const data: any[] = await response.json();
    
    for (const advisory of data) {
      // Prioritize high/critical advisories
      if (advisory.severity !== 'critical' && advisory.severity !== 'high') {
         continue;
      }

      let cvssScore = null;
      if (advisory.cvss_severities) { // 2025 deprecation update handled
         // Prefer CVSS v4 if available, otherwise v3
         const cvssData = advisory.cvss_severities.cvss_v4 || advisory.cvss_severities.cvss_v3;
         cvssScore = cvssData ? cvssData.score : null;
      }
      
      const cveId = advisory.cve_id || null;

      events.push({
        id: crypto.randomUUID(),
        title: advisory.summary || `GitHub Advisory: ${advisory.ghsa_id}`,
        description: advisory.description || 'No description provided.',
        cve_id: cveId,
        severity: cvssScore,
        vendor: null, // Could extract from affected packages, but skipping for simplicity
        source_url: advisory.html_url,
        source_name: 'GitHub Security Advisories',
        event_date: advisory.published_at,
        is_exploited: false, // GitHub REST API doesn't have a reliable 'exploited in wild' flag for global advisories
        raw_json: JSON.stringify(advisory)
      });
    }
  } catch (error) {
    console.error('Error fetching GitHub Advisories:', error);
  }
  
  return events;
}
