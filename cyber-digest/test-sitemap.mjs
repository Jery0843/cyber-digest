import { Hono } from 'hono';

const origin = 'https://digest.jerome.co.in';
const now = new Date().toISOString();

const staticPages = [
  { loc: '/', changefreq: 'hourly', priority: '1.0' },
  { loc: '/news', changefreq: 'hourly', priority: '0.9' },
  { loc: '/blog', changefreq: 'daily', priority: '0.8' },
  { loc: '/articles', changefreq: 'daily', priority: '0.8' },
  { loc: '/archive', changefreq: 'daily', priority: '0.7' },
];

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n`;

for (const page of staticPages) {
  xml += `  <url>\n    <loc>${origin + page.loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
}

xml += `</urlset>`;
console.log(xml);
