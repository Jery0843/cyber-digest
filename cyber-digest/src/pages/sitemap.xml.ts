import type { APIRoute } from 'astro';
import { getLatestPosts, getAllTags } from '../lib/db';
import { getDB } from '../lib/env';

export const GET: APIRoute = async () => {
  const db = getDB();
  const siteUrl = 'https://cyberdigest.pages.dev';
  const now = new Date().toISOString().split('T')[0];

  let postUrls = '';
  let tagUrls = '';

  if (db) {
    const posts = await getLatestPosts(db, 200);
    postUrls = posts.map(p => `
  <url>
    <loc>${siteUrl}/post/${p.slug}</loc>
    <lastmod>${p.published_at.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('');

    const tags = await getAllTags(db);
    tagUrls = tags.map(t => `
  <url>
    <loc>${siteUrl}/tags/${encodeURIComponent(t.name)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.4</priority>
  </url>`).join('');
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${siteUrl}/</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${siteUrl}/news</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${siteUrl}/blog</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${siteUrl}/articles</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${siteUrl}/archive</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.5</priority></url>
  ${postUrls}
  ${tagUrls}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
};
