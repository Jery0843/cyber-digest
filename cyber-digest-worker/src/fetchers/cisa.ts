import type { CyberEvent } from '../types';

export async function fetchCISA(): Promise<CyberEvent[]> {
  const events: CyberEvent[] = [];
  try {
    const response = await fetch('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json', {
      headers: { 'User-Agent': 'CyberDigest/1.0' }
    });
    
    if (!response.ok) {
      console.error(`CISA API error: ${response.status} ${response.statusText}`);
      return events;
    }

    const data: any = await response.json();
    
    // We only want recently added CISA KEV entries (last 48 hours)
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
    const recentThreshold = twoDaysAgo.toISOString().split('T')[0];

    if (data.vulnerabilities && Array.isArray(data.vulnerabilities)) {
      const recentVulns = data.vulnerabilities.filter((v: any) => v.dateAdded >= recentThreshold);
      
      for (const vuln of recentVulns) {
        events.push({
          id: crypto.randomUUID(),
          title: `CISA KEV: ${vuln.vulnerabilityName}`,
          description: vuln.shortDescription || `Active exploitation detected for ${vuln.cveID} affecting ${vuln.vendorProject} ${vuln.product}.`,
          cve_id: vuln.cveID,
          severity: 9.0, // CISA KEVs are inherently high severity due to active exploitation
          vendor: vuln.vendorProject || null,
          source_url: `https://nvd.nist.gov/vuln/detail/${vuln.cveID}`, // CISA doesn't provide unique permalinks per vuln in the JSON
          source_name: 'CISA Known Exploited Vulnerabilities Catalog',
          event_date: `${vuln.dateAdded}T00:00:00.000Z`,
          is_exploited: true,
          raw_json: JSON.stringify(vuln)
        });
      }
    }
  } catch (error) {
    console.error('Error fetching CISA data:', error);
  }
  
  return events;
}
