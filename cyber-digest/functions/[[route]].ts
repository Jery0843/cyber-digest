import { type Context, Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import {
  getAllTags,
  getArchiveDates,
  getLatestPosts,
  getPostBySlug,
  getPostCount,
  getPostCountByType,
  getPostsByDate,
  getPostsByTag,
  getPostsByType,
  getTodaysPosts,
} from '../src/lib/db';
import type { Env as AppEnv, Post, PostSource, PostType, PostWithTags } from '../src/lib/types';

type Bindings = AppEnv;
type HonoEnv = { Bindings: Bindings };

const app = new Hono<HonoEnv>();
const siteUrl = 'https://cyberdigest.pages.dev';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttr(value: unknown): string {
  return escapeHtml(value);
}

function formatDate(value?: string, long = false): string {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', long
    ? { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' });
}

function severityClass(score: number): string {
  if (score >= 9) return 'severity-badge--critical';
  if (score >= 7) return 'severity-badge--high';
  if (score >= 4) return 'severity-badge--medium';
  return 'severity-badge--low';
}

function severityLabel(score: number): string {
  if (score >= 9) return 'CRITICAL';
  if (score >= 7) return 'HIGH';
  if (score >= 4) return 'MEDIUM';
  return 'LOW';
}

function typeBadge(type: PostType): string {
  return `<span class="type-badge type-badge--${type}">${escapeHtml(type)}</span>`;
}

function tagBadge(name: string): string {
  return `<a class="tag-badge" href="/tags/${encodeURIComponent(name)}">#${escapeHtml(name)}</a>`;
}

function sidebar(currentPath: string): string {
  const isActive = (path: string) => currentPath === path ? 'sidebar__link--active' : '';
  return `<aside class="dashboard-sidebar">
    <div class="sidebar__brand"><span>[</span>CYBERDIGEST<span>]</span></div>
    <nav class="sidebar__nav">
      <a href="/" class="sidebar__link ${isActive('/')}"><span class="icon">⊞</span> Dashboard</a>
      <a href="/news" class="sidebar__link ${isActive('/news')}"><span class="icon">⚡</span> Intelligence</a>
      <a href="/blog" class="sidebar__link ${isActive('/blog')}"><span class="icon">📝</span> Reports</a>
      <a href="/articles" class="sidebar__link ${isActive('/articles')}"><span class="icon">📚</span> Global Threats</a>
      <a href="/archive" class="sidebar__link ${isActive('/archive')}"><span class="icon">🗄️</span> Resources</a>
    </nav>
    <div class="sidebar__footer">
      <a href="/rss.xml" class="sidebar__link"><span class="icon">📡</span> RSS Feed</a>
      <div class="sidebar__status">System Online <span class="status-pulse"></span></div>
    </div>
  </aside>`;
}

function layout(options: { title?: string; description?: string; path?: string; ogType?: string; head?: string; body: string }): string {
  const title = options.title ?? 'CyberDigest - Daily Cybersecurity Intelligence';
  const description = options.description ?? 'Automated daily cybersecurity news, educational blogs, and in-depth threat analysis. Powered by trusted sources and AI.';
  const canonical = `${siteUrl}${options.path ?? '/'}`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="description" content="${escapeAttr(description)}"><meta name="theme-color" content="#030509"><title>${escapeHtml(title)}</title><link rel="canonical" href="${escapeAttr(canonical)}"><meta property="og:title" content="${escapeAttr(title)}"><meta property="og:description" content="${escapeAttr(description)}"><meta property="og:type" content="${escapeAttr(options.ogType ?? 'website')}"><meta property="og:url" content="${escapeAttr(canonical)}"><meta property="og:site_name" content="CyberDigest"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeAttr(title)}"><meta name="twitter:description" content="${escapeAttr(description)}"><link rel="alternate" type="application/rss+xml" title="CyberDigest RSS" href="/rss.xml"><link rel="icon" type="image/png" href="/favicon.png"><link rel="manifest" href="/manifest.json"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet"><link rel="stylesheet" href="/styles/site.css">${options.head ?? ''}</head><body class="dashboard-body"><div class="dashboard-layout">${sidebar(options.path ?? '/')} <main class="dashboard-main">${options.body}</main></div><script>if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js'); }); }</script></body></html>`;
}

function feedCard(post: Post): string {
  const confidence = Number(post.confidence_score ?? 0);
  const severityClassStr = severityClass(confidence);
  const severityLbl = severityLabel(confidence);
  return `<a href="/post/${encodeURIComponent(post.slug)}" class="feed-card animate-in">
    <div class="feed-card__severity feed-card__severity--${severityLbl.toLowerCase()}">
      <span class="feed-severity-label">${severityLbl}</span>
      <span class="feed-time">${formatDate(post.published_at)}</span>
    </div>
    <div class="feed-card__content">
      <h4 class="feed-title">${escapeHtml(post.title)}</h4>
      <span class="feed-source">${post.source_count} source(s)</span>
    </div>
  </a>`;
}

function postCard(post: Post): string {
  const confidence = Number(post.confidence_score ?? 0);
  const severity = confidence > 0 ? `<span class="severity-badge ${severityClass(confidence)}">${severityLabel(confidence)} ${confidence.toFixed(1)}</span>` : '';
  return `<a href="/post/${encodeURIComponent(post.slug)}" class="post-card glass-card animate-in"><div class="post-card__header">${typeBadge(post.type)}${severity}</div><h3 class="post-card__title">${escapeHtml(post.title)}</h3><p class="post-card__summary">${escapeHtml(post.summary)}</p><div class="post-card__footer"><time class="post-card__date" datetime="${escapeAttr(post.published_at)}">${formatDate(post.published_at)}</time><span class="post-card__sources">${post.source_count} source${post.source_count === 1 ? '' : 's'}</span></div></a>`;
}

function postGrid(posts: Post[], emptyMessage: string): string {
  if (!posts.length) {
    return `<div class="empty-state"><div class="empty-state__icon">◇</div><h3 class="empty-state__title">No posts yet</h3><p class="empty-state__text">${escapeHtml(emptyMessage)}</p></div>`;
  }
  return `<div class="post-grid">${posts.map(postCard).join('')}</div>`;
}

async function safePosts<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(error);
    return fallback;
  }
}

app.get('/', async (c) => {
  const db = c.env.DB;
  const [todayPosts, recentPosts, totalCount] = await Promise.all([
    safePosts(() => getTodaysPosts(db), [] as Post[]),
    safePosts(() => getLatestPosts(db, 9), [] as Post[]),
    safePosts(() => getPostCount(db), 0),
  ]);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const todaySection = todayPosts.length ? `<section class="page-content"><div class="container"><div class="section-header"><p class="section-header__label">Today's Intelligence</p><h2 class="section-header__title">Latest <span>Posts</span></h2></div>${postGrid(todayPosts, '')}</div></section>` : '';
  
  // Deduplicate: filter out today's posts from the recent posts section
  const todayIds = new Set(todayPosts.map((p) => p.id));
  const olderRecentPosts = recentPosts.filter((p) => !todayIds.has(p.id));
  
  const recentSection = olderRecentPosts.length ? `<section class="page-content"><div class="container"><div class="section-header"><p class="section-header__label">Recent Intelligence</p><h2 class="section-header__title">All <span>Recent Posts</span></h2></div>${postGrid(olderRecentPosts, 'No older posts yet.')}</div></section>` : '';

  const allPosts = [...todayPosts, ...olderRecentPosts];

  return c.html(layout({
    path: '/',
    body: `
      <div class="dashboard-center">
        <div class="holographic-map">
          <div class="map-globe">
            <svg viewBox="0 0 100 100" class="globe-svg">
              <ellipse cx="50" cy="50" rx="45" ry="15" fill="none" stroke="rgba(0,240,255,0.4)" stroke-width="0.5"/>
              <ellipse cx="50" cy="50" rx="45" ry="30" fill="none" stroke="rgba(0,240,255,0.4)" stroke-width="0.5"/>
              <ellipse cx="50" cy="50" rx="15" ry="45" fill="none" stroke="rgba(0,240,255,0.4)" stroke-width="0.5"/>
              <ellipse cx="50" cy="50" rx="30" ry="45" fill="none" stroke="rgba(0,240,255,0.4)" stroke-width="0.5"/>
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,240,255,0.8)" stroke-width="1" stroke-dasharray="4 4" animation="spin 10s linear infinite"/>
              
              <!-- Data streams / arcs -->
              <path d="M10 50 A40 40 0 0 1 50 10" fill="none" stroke="rgba(176,0,255,0.8)" stroke-width="1" stroke-dasharray="2,5" class="pulse-node" style="animation-duration: 3s"/>
              <path d="M90 50 A40 40 0 0 0 50 90" fill="none" stroke="rgba(176,0,255,0.8)" stroke-width="1" stroke-dasharray="2,5" class="pulse-node" style="animation-duration: 4s; animation-delay: 1s;"/>
              
              <!-- Inner neural nodes -->
              <line x1="20" y1="50" x2="80" y2="50" stroke="rgba(0,240,255,0.3)" stroke-width="0.5"/>
              <line x1="50" y1="20" x2="50" y2="80" stroke="rgba(0,240,255,0.3)" stroke-width="0.5"/>
              <line x1="28.7" y1="28.7" x2="71.3" y2="71.3" stroke="rgba(0,240,255,0.3)" stroke-width="0.5"/>
              <line x1="71.3" y1="28.7" x2="28.7" y2="71.3" stroke="rgba(0,240,255,0.3)" stroke-width="0.5"/>
              
              <circle cx="20" cy="50" r="2" fill="var(--accent-red)" class="pulse-node"/>
              <circle cx="80" cy="50" r="2" fill="var(--accent-green)" class="pulse-node" style="animation-delay: 0.5s"/>
              <circle cx="50" cy="20" r="2" fill="var(--accent-purple)" class="pulse-node" style="animation-delay: 1s"/>
              <circle cx="50" cy="80" r="2" fill="var(--accent-green)" class="pulse-node" style="animation-delay: 1.5s"/>
              <circle cx="28.7" cy="28.7" r="1.5" fill="var(--accent-green)" class="pulse-node" style="animation-delay: 0.2s"/>
              <circle cx="71.3" cy="71.3" r="1.5" fill="var(--accent-purple)" class="pulse-node" style="animation-delay: 0.7s"/>
              <circle cx="71.3" cy="28.7" r="1.5" fill="var(--accent-red)" class="pulse-node" style="animation-delay: 1.2s"/>
              <circle cx="28.7" cy="71.3" r="1.5" fill="var(--accent-green)" class="pulse-node" style="animation-delay: 1.7s"/>
              <circle cx="50" cy="50" r="3" fill="#fff" filter="drop-shadow(0 0 10px #fff)" class="pulse-node"/>
            </svg>
          </div>
          <div class="map-overlay">
             <div class="hero__status"><span class="hero__pulse"></span><span class="hero__status-text">SYSTEM ACTIVE</span></div>
             <h1>GLOBAL THREAT LANDSCAPE</h1>
             <p class="map-subtitle">Tracking ${totalCount} confirmed anomalies</p>
          </div>
          <div class="map-metrics">
            <div class="map-metric">
              <span class="metric-val">${todayPosts.length}</span>
              <span class="metric-lbl">24H ALERTS</span>
            </div>
            <div class="map-metric">
              <span class="metric-val">128</span>
              <span class="metric-lbl">DATA STREAMS</span>
            </div>
          </div>
        </div>
      </div>
      <aside class="dashboard-feed">
        <div class="feed-header">LIVE INTELLIGENCE</div>
        <div class="feed-content">
           ${allPosts.map(feedCard).join('')}
        </div>
      </aside>
    `,
  }));
});

async function listingPage(c: Context<HonoEnv>, type: PostType, title: string, label: string, description: string) {
  const [posts, total] = await Promise.all([
    safePosts(() => getPostsByType(c.env.DB, type, 30), [] as Post[]),
    safePosts(() => getPostCountByType(c.env.DB, type), 0),
  ]);
  return c.html(layout({
    title: `${title} - CyberDigest`,
    description,
    path: `/${type === 'article' ? 'articles' : type}`,
    body: `
      <div class="dashboard-content-area">
        <div class="container">
          <div class="dashboard-header animate-in">
            <p class="dashboard-header__label">${escapeHtml(label)}</p>
            <h1 class="dashboard-header__title">${title}</h1>
            <p class="dashboard-header__desc">${escapeHtml(description)} ${total} records found.</p>
          </div>
          ${postGrid(posts, `No ${type} records located in database.`)}
        </div>
      </div>
    `,
  }));
}

app.get('/news', (c) => listingPage(c, 'news', 'Cyber <span>News</span>', 'Daily Updates', 'Short, concise cybersecurity updates.'));
app.get('/blog', (c) => listingPage(c, 'blog', 'Cyber <span>Blog</span>', 'Educational Posts', 'Practical cybersecurity explainers and context.'));
app.get('/articles', (c) => listingPage(c, 'article', 'Threat <span>Articles</span>', 'Deep Analysis', 'Long-form security analysis and prioritization guidance.'));

app.get('/post/:slug', async (c) => {
  const slug = c.req.param('slug');
  const post = await safePosts(() => getPostBySlug(c.env.DB, slug), null as PostWithTags | null);
  if (!post) return c.redirect('/');
  const relatedPosts = await safePosts(() => getPostsByType(c.env.DB, post.type, 3), [] as Post[]);
  const related = relatedPosts.filter((item) => item.slug !== post.slug).slice(0, 2);
  const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: post.title, description: post.summary, datePublished: post.published_at, author: { '@type': 'Organization', name: 'CyberDigest' }, publisher: { '@type': 'Organization', name: 'CyberDigest' }, url: `${siteUrl}/post/${post.slug}`, keywords: post.tags.join(', ') }).replaceAll('<', '\\u003c');
  const sources = post.sources.length ? `<div class="post-page__sources glass-card animate-in"><h3 class="post-page__sources-title">Sources</h3><ul class="post-page__sources-list">${post.sources.map((source: PostSource) => `<li><a href="${escapeAttr(source.source_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.source_name)}</a><span class="source-url">${escapeHtml(new URL(source.source_url).hostname)}</span></li>`).join('')}</ul></div>` : '';
  const relatedSection = related.length ? `<section class="post-page__related"><div class="container"><div class="section-header"><p class="section-header__label">Related</p><h2 class="section-header__title">More <span>${escapeHtml(post.type)} posts</span></h2></div>${postGrid(related, '')}</div></section>` : '';
  return c.html(layout({
    title: `${post.title} - CyberDigest`,
    description: post.summary,
    path: `/post/${post.slug}`,
    ogType: 'article',
    head: `<script type="application/ld+json">${jsonLd}</script>`,
    body: `
      <div class="dashboard-content-area">
        <div class="container">
          <article class="post-page animate-in">
            <header class="post-page__header">
              <div class="post-page__meta">${typeBadge(post.type)}<time datetime="${escapeAttr(post.published_at)}">${formatDate(post.published_at, true)}</time></div>
              <h1 class="post-page__title">${escapeHtml(post.title)}</h1>
              <p class="post-page__summary">${escapeHtml(post.summary)}</p>
              ${post.tags.length ? `<div class="post-page__tags">${post.tags.map(tagBadge).join('')}</div>` : ''}
            </header>

            <div class="post-content animate-in">${post.content}</div>
            ${sources}
          </article>
          ${relatedSection}
        </div>
      </div>
    `,
  }));
});

app.get('/tags/:tag', async (c) => {
  const tag = decodeURIComponent(c.req.param('tag'));
  const posts = await safePosts(() => getPostsByTag(c.env.DB, tag, 30), [] as Post[]);
  return c.html(layout({ title: `#${tag} — CyberDigest`, path: `/tags/${encodeURIComponent(tag)}`, body: `<div class="dashboard-content-area"><div class="container"><div class="dashboard-header animate-in"><p class="dashboard-header__label">Tag</p><h1 class="dashboard-header__title">#${escapeHtml(tag)}</h1></div>${postGrid(posts, 'No posts found for this tag.')}</div></div>` }));
});

app.get('/archive', async (c) => {
  const groups = await safePosts(() => getArchiveDates(c.env.DB), [] as { date: string; count: number }[]);
  const rows = await Promise.all(groups.map(async (group) => {
    const posts = await safePosts(() => getPostsByDate(c.env.DB, group.date), [] as Post[]);
    return `<div class="glass-card archive-row"><div><strong>${escapeHtml(formatDate(group.date, true))}</strong><p class="page-desc">${group.count} post${group.count === 1 ? '' : 's'}</p></div><div>${posts.map((post) => `<a href="/post/${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a>`).join('<br>')}</div></div>`;
  }));
  return c.html(layout({ title: 'Archive — CyberDigest', path: '/archive', body: `<div class="dashboard-content-area"><div class="container"><div class="dashboard-header animate-in"><p class="dashboard-header__label">Archive</p><h1 class="dashboard-header__title">Published History</h1></div><div class="list-grid">${rows.join('') || '<p class="empty-state__text">No archive entries yet.</p>'}</div></div></div>` }));
});

app.get('/rss.xml', async (c) => {
  const posts = await safePosts(() => getLatestPosts(c.env.DB, 50), [] as Post[]);
  const items = posts.map((post) => `<item><title>${escapeHtml(post.title)}</title><link>${siteUrl}/post/${encodeURIComponent(post.slug)}</link><guid>${siteUrl}/post/${encodeURIComponent(post.slug)}</guid><description>${escapeHtml(post.summary)}</description><pubDate>${new Date(post.published_at).toUTCString()}</pubDate><category>${escapeHtml(post.type)}</category></item>`).join('');
  return c.body(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>CyberDigest</title><link>${siteUrl}</link><description>Automated daily cybersecurity intelligence.</description>${items}</channel></rss>`, 200, { 'content-type': 'application/rss+xml; charset=UTF-8' });
});

app.get('/sitemap.xml', async (c) => {
  const [posts, tags] = await Promise.all([
    safePosts(() => getLatestPosts(c.env.DB, 200), [] as Post[]),
    safePosts(() => getAllTags(c.env.DB), [] as { name: string; count: number }[]),
  ]);
  const staticUrls = ['/', '/news', '/blog', '/articles', '/archive'];
  const urls = [...staticUrls.map((path) => `${siteUrl}${path}`), ...posts.map((post) => `${siteUrl}/post/${encodeURIComponent(post.slug)}`), ...tags.map((tag) => `${siteUrl}/tags/${encodeURIComponent(tag.name)}`)];
  return c.body(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${escapeHtml(url)}</loc></url>`).join('')}</urlset>`, 200, { 'content-type': 'application/xml; charset=UTF-8' });
});

app.get('/robots.txt', (c) => c.text(`User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`));

export const onRequest = handle(app);
