import type { APIRoute } from 'astro';
import { getLatestPosts } from '../lib/db';
import { getDB } from '../lib/env';

export const GET: APIRoute = async () => {
  const db = getDB();
  const posts = db ? await getLatestPosts(db, 50) : [];
  const siteUrl = 'https://digest.jerome.co.in';

  const items = posts.map(p => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${siteUrl}/post/${p.slug}</link>
      <guid isPermaLink="true">${siteUrl}/post/${p.slug}</guid>
      <description><![CDATA[${p.summary}]]></description>
      <pubDate>${new Date(p.published_at).toUTCString()}</pubDate>
      <category>${p.type}</category>
    </item>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CyberDigest — Daily Cybersecurity Intelligence</title>
    <description>Automated daily cybersecurity news, blogs, and analysis from trusted sources.</description>
    <link>${siteUrl}</link>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
};
