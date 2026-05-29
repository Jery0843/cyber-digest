-- =============================================================================
-- CyberDigest — Seed Data (3 sample posts for UI development)
-- =============================================================================

-- Tags
INSERT OR IGNORE INTO tags (name) VALUES ('CVE');
INSERT OR IGNORE INTO tags (name) VALUES ('Microsoft');
INSERT OR IGNORE INTO tags (name) VALUES ('Zero-Day');
INSERT OR IGNORE INTO tags (name) VALUES ('Ransomware');
INSERT OR IGNORE INTO tags (name) VALUES ('Linux');
INSERT OR IGNORE INTO tags (name) VALUES ('Cisco');
INSERT OR IGNORE INTO tags (name) VALUES ('Remote Code Execution');
INSERT OR IGNORE INTO tags (name) VALUES ('CISA');
INSERT OR IGNORE INTO tags (name) VALUES ('Supply Chain');
INSERT OR IGNORE INTO tags (name) VALUES ('Fortinet');

-- News post
INSERT INTO posts (title, slug, type, summary, content, published_at, event_date, confidence_score, model, source_count)
VALUES (
  'Critical Fortinet FortiOS RCE Vulnerability Under Active Exploitation',
  'fortinet-fortios-rce-cve-2025-32756',
  'news',
  'CISA has added CVE-2025-32756 to its Known Exploited Vulnerabilities catalog after confirming active exploitation of a critical stack-based buffer overflow in FortiOS.',
  '<h2>What Happened</h2>
<p>A critical stack-based buffer overflow vulnerability (CVE-2025-32756) has been identified in Fortinet FortiOS, FortiProxy, FortiVoice, FortiMail, and FortiNDR products. The vulnerability has a CVSS score of 9.8 and allows remote unauthenticated attackers to execute arbitrary code via crafted HTTP requests.</p>

<h2>Who Is Affected</h2>
<p>Organizations using FortiOS versions 7.0.0 through 7.0.16, FortiProxy 7.0.x and 7.2.x, and FortiVoice 6.x and 7.0.x are vulnerable. This affects a wide range of enterprise network infrastructure.</p>

<h2>Severity &amp; Impact</h2>
<p><strong>CVSS: 9.8 (Critical)</strong> — This vulnerability is actively exploited in the wild. CISA has added it to the KEV catalog, requiring federal agencies to patch by June 2025. Successful exploitation gives attackers full control of affected devices.</p>

<h2>Mitigation</h2>
<ul>
<li>Update FortiOS to version 7.0.17 or later immediately</li>
<li>If patching is not possible, disable the HTTP/HTTPS administrative interface</li>
<li>Monitor for indicators of compromise in firewall logs</li>
<li>Review CISA BOD 22-01 for compliance requirements</li>
</ul>',
  datetime('now'),
  datetime('now'),
  9.8,
  'llama-4-scout',
  3
);

-- Blog post
INSERT INTO posts (title, slug, type, summary, content, published_at, event_date, confidence_score, model, source_count)
VALUES (
  'Understanding Supply Chain Attacks: Lessons from Recent npm Package Compromises',
  'understanding-supply-chain-attacks-npm-2025',
  'blog',
  'A look at how supply chain attacks through package managers work, why they are increasing, and what developers can do to protect their projects.',
  '<h2>What Is a Supply Chain Attack?</h2>
<p>A supply chain attack targets the tools and dependencies that software projects rely on rather than the software itself. When attackers compromise a popular library or package, every project that depends on it becomes vulnerable — often without any change to the project''s own code.</p>

<h2>Recent npm Incidents</h2>
<p>In the past month, GitHub Security Advisories flagged multiple npm packages that were found to contain obfuscated malicious code. These packages had accumulated thousands of downloads before detection. The malicious code exfiltrated environment variables, SSH keys, and API tokens to external servers.</p>

<h2>How These Attacks Work</h2>
<p>Attackers typically use one of several strategies:</p>
<ul>
<li><strong>Typosquatting:</strong> Publishing packages with names similar to popular ones (e.g., <code>lodahs</code> instead of <code>lodash</code>)</li>
<li><strong>Account Takeover:</strong> Compromising maintainer accounts to push malicious updates</li>
<li><strong>Dependency Confusion:</strong> Exploiting how package managers resolve private vs. public packages</li>
<li><strong>Protestware:</strong> Maintainers intentionally adding destructive code to their own packages</li>
</ul>

<h2>What Developers Should Do</h2>
<ul>
<li>Use lockfiles (<code>package-lock.json</code>) and verify integrity hashes</li>
<li>Audit dependencies regularly with <code>npm audit</code> or tools like Socket.dev</li>
<li>Enable two-factor authentication on npm accounts</li>
<li>Pin dependencies to exact versions in production</li>
<li>Review changelogs before updating dependencies</li>
<li>Use GitHub''s Dependabot alerts to stay informed about vulnerabilities</li>
</ul>

<h2>Key Takeaway</h2>
<p>Supply chain attacks exploit the trust developers place in their dependencies. The most effective defense is a combination of automated scanning, careful dependency management, and maintaining awareness of the packages your project relies on.</p>',
  datetime('now', '-1 hour'),
  datetime('now'),
  8.2,
  'llama-4-scout',
  4
);

-- Article post
INSERT INTO posts (title, slug, type, summary, content, published_at, event_date, confidence_score, model, source_count)
VALUES (
  'Deep Dive: Microsoft Patch Tuesday May 2025 — 72 Vulnerabilities Including 5 Zero-Days',
  'microsoft-patch-tuesday-may-2025-analysis',
  'article',
  'A comprehensive analysis of Microsoft''s May 2025 Patch Tuesday release, covering the 5 actively exploited zero-day vulnerabilities, affected products, and enterprise prioritization guidance.',
  '<h2>Overview</h2>
<p>Microsoft''s May 2025 Patch Tuesday addressed 72 vulnerabilities across Windows, Office, Azure, and other products. Five of these are confirmed zero-day vulnerabilities that were actively exploited before patches were available. This is one of the larger Patch Tuesday releases this year.</p>

<h2>The Five Zero-Days</h2>

<h3>CVE-2025-30397 — Scripting Engine Memory Corruption</h3>
<p>A memory corruption vulnerability in the Windows Scripting Engine allows remote code execution when a user visits a malicious webpage in Microsoft Edge or Internet Explorer mode. CVSS: 7.5. Exploitation requires user interaction but has been observed in targeted attacks.</p>

<h3>CVE-2025-30400 — DWM Core Library Elevation of Privilege</h3>
<p>A use-after-free vulnerability in the Desktop Window Manager allows local attackers to escalate privileges to SYSTEM. CVSS: 7.8. This is the kind of vulnerability commonly chained with remote code execution bugs for full system compromise.</p>

<h3>CVE-2025-32701 — Windows CLFS Driver Elevation of Privilege</h3>
<p>Yet another vulnerability in the Common Log File System driver — a component that has been repeatedly targeted by ransomware operators. CVSS: 7.8. The CLFS driver has had over a dozen privilege escalation vulnerabilities in the past two years.</p>

<h3>CVE-2025-32706 — Windows CLFS Driver (Second Vulnerability)</h3>
<p>A second CLFS driver vulnerability patched this month, also allowing privilege escalation. CVSS: 7.8. The recurrence of CLFS vulnerabilities suggests a systemic issue in this component that may require an architectural review.</p>

<h3>CVE-2025-32709 — Windows Ancillary Function Driver for WinSock</h3>
<p>A use-after-free in the WinSock driver allowing elevation of privilege to SYSTEM. CVSS: 7.8. This driver handles low-level network operations and is a high-value target for attackers seeking kernel-level access.</p>

<h2>Enterprise Prioritization</h2>
<p>Security teams should prioritize patching in this order:</p>
<ol>
<li><strong>Immediate:</strong> All five zero-days — these are actively exploited</li>
<li><strong>High Priority:</strong> Remote code execution vulnerabilities in Windows RDP and SMB</li>
<li><strong>Standard:</strong> Office vulnerabilities requiring user interaction</li>
<li><strong>Low Priority:</strong> Information disclosure and denial-of-service issues</li>
</ol>

<h2>CISA Guidance</h2>
<p>CISA has added all five zero-days to the Known Exploited Vulnerabilities catalog. Federal agencies under BOD 22-01 must apply patches within the specified timeframes. Private organizations should treat these as critical regardless of their own patch management schedules.</p>

<h2>Broader Context</h2>
<p>The continued targeting of Windows kernel drivers, particularly CLFS, indicates that attackers are investing in developing exploits for core OS components. Ransomware groups like Storm-1811 and Black Basta have been observed using CLFS exploits as part of their attack chains. Organizations should consider implementing additional monitoring for privilege escalation attempts on Windows endpoints.</p>',
  datetime('now', '-2 hours'),
  datetime('now'),
  9.0,
  'llama-4-scout',
  5
);

-- Post sources
INSERT INTO post_sources (post_id, source_name, source_url) VALUES (1, 'CISA KEV Catalog', 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog');
INSERT INTO post_sources (post_id, source_name, source_url) VALUES (1, 'NVD - CVE-2025-32756', 'https://nvd.nist.gov/vuln/detail/CVE-2025-32756');
INSERT INTO post_sources (post_id, source_name, source_url) VALUES (1, 'Fortinet PSIRT Advisory', 'https://fortiguard.fortinet.com/psirt');
INSERT INTO post_sources (post_id, source_name, source_url) VALUES (2, 'GitHub Security Advisories', 'https://github.com/advisories');
INSERT INTO post_sources (post_id, source_name, source_url) VALUES (2, 'Socket.dev Blog', 'https://socket.dev/blog');
INSERT INTO post_sources (post_id, source_name, source_url) VALUES (2, 'npm Security', 'https://docs.npmjs.com/threats-and-mitigations');
INSERT INTO post_sources (post_id, source_name, source_url) VALUES (2, 'NIST SP 800-161', 'https://csrc.nist.gov/publications/detail/sp/800-161/rev-1/final');
INSERT INTO post_sources (post_id, source_name, source_url) VALUES (3, 'Microsoft Security Response Center', 'https://msrc.microsoft.com/update-guide/');
INSERT INTO post_sources (post_id, source_name, source_url) VALUES (3, 'CISA KEV Catalog', 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog');
INSERT INTO post_sources (post_id, source_name, source_url) VALUES (3, 'NVD - CVE-2025-30397', 'https://nvd.nist.gov/vuln/detail/CVE-2025-30397');
INSERT INTO post_sources (post_id, source_name, source_url) VALUES (3, 'BleepingComputer', 'https://www.bleepingcomputer.com');
INSERT INTO post_sources (post_id, source_name, source_url) VALUES (3, 'The Hacker News', 'https://thehackernews.com');

-- Post tags
INSERT INTO post_tags (post_id, tag_id) VALUES (1, 1); -- CVE
INSERT INTO post_tags (post_id, tag_id) VALUES (1, 10); -- Fortinet
INSERT INTO post_tags (post_id, tag_id) VALUES (1, 7); -- Remote Code Execution
INSERT INTO post_tags (post_id, tag_id) VALUES (1, 8); -- CISA
INSERT INTO post_tags (post_id, tag_id) VALUES (2, 9); -- Supply Chain
INSERT INTO post_tags (post_id, tag_id) VALUES (3, 1); -- CVE
INSERT INTO post_tags (post_id, tag_id) VALUES (3, 2); -- Microsoft
INSERT INTO post_tags (post_id, tag_id) VALUES (3, 3); -- Zero-Day
INSERT INTO post_tags (post_id, tag_id) VALUES (3, 4); -- Ransomware
INSERT INTO post_tags (post_id, tag_id) VALUES (3, 8); -- CISA

-- Generation log entry
INSERT INTO generation_logs (run_date, status, posts_created) VALUES (date('now'), 'success', 3);
