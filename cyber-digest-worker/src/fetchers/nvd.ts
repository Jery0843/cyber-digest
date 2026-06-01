import type { CyberEvent } from '../types';

export async function fetchNVD(apiKey?: string): Promise<CyberEvent[]> {
  const events: CyberEvent[] = [];
  try {
    // Fetch last 24 hours for same-day freshness
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    // NVD requires specific date format: YYYY-MM-DDTHH:MM:SS.000
    const formatNvdDate = (d: Date) => d.toISOString().replace(/\.\d+Z$/, '.000');
    
    const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?pubStartDate=${formatNvdDate(oneDayAgo)}&pubEndDate=${formatNvdDate(now)}&resultsPerPage=50`;
    
    const headers: Record<string, string> = {
      'User-Agent': 'CyberDigest/1.0',
    };
    if (apiKey) {
      headers['apiKey'] = apiKey;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      console.error(`NVD API error: ${response.status} ${response.statusText}`);
      return events;
    }

    const data: any = await response.json();
    
    if (data.vulnerabilities && Array.isArray(data.vulnerabilities)) {
      for (const item of data.vulnerabilities) {
        const cve = item.cve;
        if (!cve) continue;

        const cveId = cve.id;
        const descriptions = cve.descriptions || [];
        const englishDesc = descriptions.find((d: any) => d.lang === 'en')?.value || 'No description available.';
        
        let cvssScore = null;
        let isExploited = false;
        
        // Extract highest CVSS score (prioritize v3.1)
        if (cve.metrics) {
          const cvss31 = cve.metrics.cvssMetricV31?.[0]?.cvssData?.baseScore;
          const cvss30 = cve.metrics.cvssMetricV30?.[0]?.cvssData?.baseScore;
          const cvss2 = cve.metrics.cvssMetricV2?.[0]?.cvssData?.baseScore;
          cvssScore = cvss31 || cvss30 || cvss2 || null;
        }

        // Check CISA KEV flag in NVD data
        if (cve.cisaExploitAdd) {
           isExploited = true;
        }

        events.push({
          id: crypto.randomUUID(),
          title: `Vulnerability: ${cveId}`,
          description: englishDesc,
          cve_id: cveId,
          severity: cvssScore,
          vendor: null, // Hard to extract reliably from raw NVD API without CPE parsing
          source_url: `https://nvd.nist.gov/vuln/detail/${cveId}`,
          source_name: 'National Vulnerability Database (NVD)',
          event_date: cve.published || new Date().toISOString(),
          is_exploited: isExploited,
          raw_json: JSON.stringify(cve)
        });
      }
    }
  } catch (error) {
    console.error('Error fetching NVD data:', error);
  }
  
  return events;
}
