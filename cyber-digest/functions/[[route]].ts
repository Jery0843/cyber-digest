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
const siteUrl = 'https://digest.jerome.co.in';

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
      <a href="/education" class="sidebar__link ${isActive('/education')}"><span class="icon">💻</span> Hack Lab</a>
      <a href="/archive" class="sidebar__link ${isActive('/archive')}"><span class="icon">🗄️</span> Resources</a>
      <a href="https://0xjerry.jerome.co.in" class="sidebar__link" target="_blank" rel="noopener noreferrer"><span class="icon">⌬</span> 0xJerry's Lab</a>
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
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="description" content="${escapeAttr(description)}"><meta name="theme-color" content="#030509"><title>${escapeHtml(title)}</title><link rel="canonical" href="${escapeAttr(canonical)}"><meta property="og:title" content="${escapeAttr(title)}"><meta property="og:description" content="${escapeAttr(description)}"><meta property="og:type" content="${escapeAttr(options.ogType ?? 'website')}"><meta property="og:url" content="${escapeAttr(canonical)}"><meta property="og:site_name" content="CyberDigest"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeAttr(title)}"><meta name="twitter:description" content="${escapeAttr(description)}"><link rel="alternate" type="application/rss+xml" title="CyberDigest RSS" href="/rss.xml"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="manifest" href="/manifest.json"><link rel="dns-prefetch" href="https://fonts.googleapis.com"><link rel="dns-prefetch" href="https://fonts.gstatic.com"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap"></noscript><link rel="stylesheet" href="/styles/site.css">${options.head ?? ''}</head><body class="dashboard-body"><div class="dashboard-layout">${sidebar(options.path ?? '/')} <main class="dashboard-main">${options.body}</main></div><button id="rocket-scroll" class="rocket-scroll" aria-label="Scroll to top"><div class="double-arrow"><span></span><span></span></div><span class="rocket-fire"></span></button><script>if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js'); }); } const rocket = document.getElementById('rocket-scroll'); const scrollable = document.querySelector('.dashboard-content-area') || window; const toggleRocket = () => { const scrollY = scrollable.scrollTop || window.scrollY; if (scrollY > 300) { rocket.classList.add('visible'); } else { rocket.classList.remove('visible'); } }; scrollable.addEventListener('scroll', toggleRocket, { passive: true }); window.addEventListener('scroll', toggleRocket, { passive: true }); rocket.addEventListener('click', () => { rocket.classList.add('launching'); scrollable.scrollTo({ top: 0, behavior: 'smooth' }); if (scrollable !== window) window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => { rocket.classList.remove('launching'); rocket.classList.remove('visible'); }, 1000); });</script></body></html>`;
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

app.get('/education', (c) => {
  return c.html(layout({
    title: 'Hack Lab - Ethical Hacking Education',
    description: 'Practical ethical hacking tutorials, offensive security resources, and lab writeups.',
    path: '/education',
    body: `
      <div class="dashboard-content-area">
        <div class="container">
          <div class="dashboard-header animate-in">
            <p class="dashboard-header__label">Education & Training</p>
            <h1 class="dashboard-header__title">Hack <span>Lab</span></h1>
            <p class="dashboard-header__desc">Advanced offensive security resources, structured learning modules, and ethical hacking methodology.</p>
          </div>
          
          <section class="page-content" style="margin-top: 1rem;">
            <div class="section-header">
              <p class="section-header__label">Curriculum</p>
              <h2 class="section-header__title">Table of <span>Contents</span></h2>
            </div>
            
            <div class="list-grid" style="display: flex; flex-direction: column; gap: 1rem;">
              <a href="/education/module-1" class="glass-card archive-row animate-in" style="display: flex; align-items: center; justify-content: space-between; text-decoration: none;">
                <div>
                  <strong style="color: var(--accent-blue);">Module 01</strong>
                  <h3 style="margin: 0.5rem 0 0 0; color: #fff;">Introduction to Ethical Hacking</h3>
                </div>
                <span style="color: var(--accent-purple);">View Module &rarr;</span>
              </a>
              <a href="/education/module-2" class="glass-card archive-row animate-in" style="display: flex; align-items: center; justify-content: space-between; text-decoration: none; animation-delay: 0.1s">
                <div>
                  <strong style="color: var(--accent-blue);">Module 02</strong>
                  <h3 style="margin: 0.5rem 0 0 0; color: #fff;">Footprinting and Reconnaissance</h3>
                </div>
                <span style="color: var(--accent-purple);">View Module &rarr;</span>
              </a>
              <div class="glass-card archive-row animate-in" style="opacity: 0.5; display: flex; align-items: center; justify-content: space-between; cursor: not-allowed; animation-delay: 0.2s">
                <div>
                  <strong>Module 03</strong>
                  <h3 style="margin: 0.5rem 0 0 0; color: #999;">Scanning Networks</h3>
                </div>
                <span style="color: #666;">Coming Soon</span>
              </div>
              <div class="glass-card archive-row animate-in" style="opacity: 0.5; display: flex; align-items: center; justify-content: space-between; cursor: not-allowed; animation-delay: 0.3s">
                <div>
                  <strong>Module 04</strong>
                  <h3 style="margin: 0.5rem 0 0 0; color: #999;">Enumeration</h3>
                </div>
                <span style="color: #666;">Coming Soon</span>
              </div>
            </div>
          </section>

          <section class="page-content" style="margin-top: 3rem;">
            <div class="section-header">
              <p class="section-header__label">Methodology</p>
              <h2 class="section-header__title">Attack <span>Lifecycle</span></h2>
            </div>
            
            <div class="glass-card animate-in" style="padding: 2rem;">
              <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1.5rem;">
                <li style="display: flex; gap: 1rem; align-items: flex-start;">
                  <div style="background: rgba(0,240,255,0.1); color: var(--accent-blue); padding: 0.5rem; border-radius: 4px; font-family: var(--font-mono);">01</div>
                  <div>
                    <h4 style="margin: 0 0 0.5rem 0; color: #fff;">Reconnaissance</h4>
                    <p style="margin: 0; color: #999; font-size: 0.9rem;">Information gathering using OSINT, DNS enumeration, and target surface mapping.</p>
                  </div>
                </li>
                <li style="display: flex; gap: 1rem; align-items: flex-start;">
                  <div style="background: rgba(176,0,255,0.1); color: var(--accent-purple); padding: 0.5rem; border-radius: 4px; font-family: var(--font-mono);">02</div>
                  <div>
                    <h4 style="margin: 0 0 0.5rem 0; color: #fff;">Weaponization & Delivery</h4>
                    <p style="margin: 0; color: #999; font-size: 0.9rem;">Crafting payloads and selecting delivery vectors based on discovered vulnerabilities.</p>
                  </div>
                </li>
                <li style="display: flex; gap: 1rem; align-items: flex-start;">
                  <div style="background: rgba(255,0,85,0.1); color: var(--accent-red); padding: 0.5rem; border-radius: 4px; font-family: var(--font-mono);">03</div>
                  <div>
                    <h4 style="margin: 0 0 0.5rem 0; color: #fff;">Exploitation & Privilege Escalation</h4>
                    <p style="margin: 0; color: #999; font-size: 0.9rem;">Executing attacks to gain initial access, followed by vertical/horizontal privilege climbing.</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

        </div>
      </div>
    `
  }));
});

app.get('/education/module-1', (c) => {
  return c.html(layout({
    title: 'Module 1: Introduction to Ethical Hacking - Hack Lab',
    description: 'A comprehensive guide to information security, threat modeling, and ethical hacking.',
    path: '/education',
    body: `
      <div class="dashboard-content-area">
        <div class="container" style="max-width: 1100px; margin: 0 auto;">
          <article class="post-page animate-in">
            <header class="post-page__header" style="text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 3rem; margin-bottom: 3rem;">
              <div class="post-page__meta" style="justify-content: center;"><span class="type-badge type-badge--article">Module 01</span></div>
              <h1 class="post-page__title" style="font-size: 3.5rem; margin-bottom: 1rem; background: linear-gradient(90deg, #fff, #888); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Introduction to Ethical Hacking</h1>
              <p class="post-page__summary" style="font-size: 1.3rem; color: #aaa; max-width: 800px; margin: 0 auto;">A comprehensive exploration of the fundamental concepts of information security, hacking methodologies, security controls, and the legal frameworks governing ethical hacking operations.</p>
            </header>

            <div class="post-content animate-in" style="font-size: 1.15rem; line-height: 1.8; color: #ccc;">
              
              <!-- Section 1 -->
              <div class="glass-card" style="padding: 3rem; margin-bottom: 4rem; border-left: 4px solid var(--accent-blue);">
                <h2 style="margin-top: 0; color: #fff; font-size: 2rem;">1. Information Security Overview</h2>
                <p>Information security is the practice of protecting information by mitigating information risks. It is the state of well-being of information and infrastructure in which the possibility of theft, tampering, and disruption of information and services is kept low or tolerable.</p>
                
                <h3 style="color: #fff; margin-top: 2rem;">The Core Elements (CIA Triad + 2)</h3>
                <p>Modern information security relies on five foundational pillars:</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem;">
                  <div style="background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 8px;">
                    <strong style="color: var(--accent-blue); font-size: 1.2rem; display: block; margin-bottom: 0.5rem;">Confidentiality</strong>
                    Assurance that information is accessible only to authorized entities. Breaches occur due to improper data handling or unauthorized access. Controls include encryption, access controls, and data classification.
                  </div>
                  <div style="background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 8px;">
                    <strong style="color: var(--accent-purple); font-size: 1.2rem; display: block; margin-bottom: 0.5rem;">Integrity</strong>
                    The trustworthiness of data or resources. It guarantees that information has not been improperly altered. Controls include hashing algorithms (SHA-256), digital signatures, and strict access controls.
                  </div>
                  <div style="background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 8px;">
                    <strong style="color: var(--accent-green); font-size: 1.2rem; display: block; margin-bottom: 0.5rem;">Availability</strong>
                    Assurance that systems delivering and storing information are accessible when required. Controls include redundancy (RAID), failover clusters, and DDoS mitigation strategies.
                  </div>
                  <div style="background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 8px;">
                    <strong style="color: var(--accent-red); font-size: 1.2rem; display: block; margin-bottom: 0.5rem;">Authenticity</strong>
                    The characteristic of a communication or document that ensures the quality of being genuine. Controls include Biometrics, Smart Cards, and PKI Certificates.
                  </div>
                  <div style="background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 8px; grid-column: 1 / -1;">
                    <strong style="color: #fff; font-size: 1.2rem; display: block; margin-bottom: 0.5rem;">Non-Repudiation</strong>
                    A guarantee that the sender of a message cannot later deny having sent the message, and the recipient cannot deny having received it. Digital signatures and audit trails provide non-repudiation.
                  </div>
                </div>

                <h3 style="color: #fff; margin-top: 3rem;">Information Security Terminology</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem; font-size: 0.95rem;">
                  <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;">
                    <strong style="color: var(--accent-blue);">Hack Value:</strong> The notion among hackers that something is worth doing or is interesting. It is the perceived value of a target.
                  </div>
                  <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;">
                    <strong style="color: var(--accent-blue);">Vulnerability:</strong> The existence of a weakness, design, or implementation error that can lead to an unexpected event compromising the system.
                  </div>
                  <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;">
                    <strong style="color: var(--accent-blue);">Exploit:</strong> A breach of IT system security through vulnerabilities. It refers to the malicious code or technique used to take advantage of a flaw.
                  </div>
                  <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;">
                    <strong style="color: var(--accent-blue);">Payload:</strong> The part of malware or an exploit that performs the intended malicious action, such as deleting data or stealing passwords.
                  </div>
                  <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;">
                    <strong style="color: var(--accent-blue);">Zero-Day Attack:</strong> An attack that exploits a previously unknown computer vulnerability. "Zero-day" implies the developers had zero days of notice to fix the flaw before it was exploited.
                  </div>
                  <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;">
                    <strong style="color: var(--accent-blue);">Daisy Chaining:</strong> Gaining access to one network or computer and using it to gain access to multiple other networks.
                  </div>
                  <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;">
                    <strong style="color: var(--accent-blue);">Doxing:</strong> Publishing personally identifiable information about an individual or organization, usually gathered from public databases, social media, or hacking.
                  </div>
                  <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;">
                    <strong style="color: var(--accent-blue);">Target of Evaluation (TOE):</strong> An IT product or system and its associated administrator and user guidance documentation that is the subject of an evaluation.
                  </div>
                </div>
              </div>

              <!-- Section 2 -->
              <h2 style="color: var(--accent-red); font-size: 2rem; margin-top: 4rem;">2. Motives, Goals, and Attack Vectors</h2>
              <p>Understanding the "why" and "how" of an attack is critical to anticipating it. Every cyberattack can be mathematically conceptualized as:</p>
              
              <div style="background: rgba(255,0,85,0.1); border: 1px solid rgba(255,0,85,0.3); padding: 2rem; text-align: center; font-size: 1.5rem; border-radius: 8px; font-family: var(--font-mono); margin: 2rem 0; color: #fff;">
                Attack = Motive (Goal) + Method (TTP) + Vulnerability
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem;">
                <div>
                  <h3 style="color: #fff; margin-top: 0;">Common Motives</h3>
                  <ul style="font-size: 0.95rem;">
                    <li>Disrupting business continuity</li>
                    <li>Information theft and corporate espionage</li>
                    <li>Financial loss to the target (Ransomware)</li>
                    <li>State-sponsored military objectives</li>
                    <li>Propagating religious or political beliefs</li>
                    <li>Damaging target reputation or exacting revenge</li>
                  </ul>
                </div>
                <div>
                  <h3 style="color: #fff; margin-top: 0;">Threat Categories</h3>
                  <ul style="font-size: 0.95rem;">
                    <li><strong>Network Threats:</strong> Information gathering, sniffing, spoofing, session hijacking, MITM attacks.</li>
                    <li><strong>Host Threats:</strong> Malware, footprinting, password guessing, privilege escalation, DoS attacks.</li>
                    <li><strong>Application Threats:</strong> Injection attacks (SQLi), XSS, parameter tampering, directory traversal.</li>
                  </ul>
                </div>
              </div>

              <h3 style="color: #fff; margin-top: 3rem;">Tactics, Techniques, and Procedures (TTPs)</h3>
              <p>Threat actors do not attack randomly; they follow established TTPs:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 1.5rem 0; background: rgba(0,0,0,0.2);">
                <tr style="background: rgba(255,255,255,0.05); text-align: left;">
                  <th style="padding: 1rem; border: 1px solid rgba(255,255,255,0.1);">Component</th>
                  <th style="padding: 1rem; border: 1px solid rgba(255,255,255,0.1);">Definition</th>
                  <th style="padding: 1rem; border: 1px solid rgba(255,255,255,0.1);">Example</th>
                </tr>
                <tr>
                  <td style="padding: 1rem; border: 1px solid rgba(255,255,255,0.1);"><strong>Tactics</strong></td>
                  <td style="padding: 1rem; border: 1px solid rgba(255,255,255,0.1);">The overarching strategy adopted by an attacker.</td>
                  <td style="padding: 1rem; border: 1px solid rgba(255,255,255,0.1);">Initial Access</td>
                </tr>
                <tr>
                  <td style="padding: 1rem; border: 1px solid rgba(255,255,255,0.1);"><strong>Techniques</strong></td>
                  <td style="padding: 1rem; border: 1px solid rgba(255,255,255,0.1);">Technical methods used to achieve the tactic.</td>
                  <td style="padding: 1rem; border: 1px solid rgba(255,255,255,0.1);">Phishing / Spearphishing</td>
                </tr>
                <tr>
                  <td style="padding: 1rem; border: 1px solid rgba(255,255,255,0.1);"><strong>Procedures</strong></td>
                  <td style="padding: 1rem; border: 1px solid rgba(255,255,255,0.1);">The step-by-step approach to launch the attack.</td>
                  <td style="padding: 1rem; border: 1px solid rgba(255,255,255,0.1);">Sending a macro-enabled Excel document via email.</td>
                </tr>
              </table>

              <h3 style="color: #fff; margin-top: 3rem;">Top Information Security Attack Vectors</h3>
              <p>An attack vector is a path or means by which a hacker gains access to a computer or network server. The most prevalent vectors today include:</p>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem; font-size: 0.95rem;">
                <div style="background: rgba(255,0,85,0.05); padding: 1.25rem; border-radius: 8px; border-left: 3px solid var(--accent-red);">
                  <strong style="color: #fff; display: block; margin-bottom: 0.5rem;">Cloud Computing Threats</strong>
                  Flaws in cloud deployment, misconfigured buckets, insecure APIs, and lack of visibility.
                </div>
                <div style="background: rgba(255,0,85,0.05); padding: 1.25rem; border-radius: 8px; border-left: 3px solid var(--accent-red);">
                  <strong style="color: #fff; display: block; margin-bottom: 0.5rem;">Advanced Persistent Threats (APT)</strong>
                  Stealthy and continuous computer network attack processes orchestrated by highly skilled state-sponsored actors targeting specific entities.
                </div>
                <div style="background: rgba(255,0,85,0.05); padding: 1.25rem; border-radius: 8px; border-left: 3px solid var(--accent-red);">
                  <strong style="color: #fff; display: block; margin-bottom: 0.5rem;">Mobile Device Threats</strong>
                  Malicious apps, smishing, weak encryption, and insecure OS implementations on BYOD devices.
                </div>
                <div style="background: rgba(255,0,85,0.05); padding: 1.25rem; border-radius: 8px; border-left: 3px solid var(--accent-red);">
                  <strong style="color: #fff; display: block; margin-bottom: 0.5rem;">Insider Threats</strong>
                  Disgruntled employees or contractors misusing authorized access to steal or destroy data.
                </div>
                <div style="background: rgba(255,0,85,0.05); padding: 1.25rem; border-radius: 8px; border-left: 3px solid var(--accent-red);">
                  <strong style="color: #fff; display: block; margin-bottom: 0.5rem;">IoT Threats</strong>
                  Default passwords, lack of firmware updates, and botnet recruiting (e.g., Mirai) across interconnected smart devices.
                </div>
                <div style="background: rgba(255,0,85,0.05); padding: 1.25rem; border-radius: 8px; border-left: 3px solid var(--accent-red);">
                  <strong style="color: #fff; display: block; margin-bottom: 0.5rem;">Web Application Threats</strong>
                  Exploiting software flaws like Cross-Site Scripting (XSS), SQL injection, and insecure direct object references (IDOR).
                </div>
              </div>

              <!-- Section 3 -->
              <h2 style="color: #fff; font-size: 2rem; margin-top: 4rem;">3. Classification of Attacks &amp; Information Warfare</h2>
              
              <h3 style="color: #fff;">Classification of Attacks</h3>
              <p>Attacks are broadly categorized based on their execution methodology and the location of the attacker relative to the target.</p>
              
              <div style="display: flex; flex-direction: column; gap: 1.5rem; margin: 2rem 0;">
                <div style="padding-left: 1.5rem; border-left: 2px solid var(--accent-blue);">
                  <strong style="color: #fff; display: block; font-size: 1.2rem;">Passive Attacks</strong>
                  <p style="margin: 0.5rem 0 0 0;">The attacker intercepts data without altering it. Because there is no active interaction, these attacks are exceedingly difficult to detect. <em>Examples: Network sniffing, traffic analysis, eavesdropping.</em></p>
                </div>
                <div style="padding-left: 1.5rem; border-left: 2px solid var(--accent-red);">
                  <strong style="color: #fff; display: block; font-size: 1.2rem;">Active Attacks</strong>
                  <p style="margin: 0.5rem 0 0 0;">The attacker actively tampers with data or disrupts communications. These attacks generate detectable noise on the network. <em>Examples: DoS, DDoS, SQL Injection, Man-in-the-Middle (MITM).</em></p>
                </div>
                <div style="padding-left: 1.5rem; border-left: 2px solid #888;">
                  <strong style="color: #fff; display: block; font-size: 1.2rem;">Close-In Attacks</strong>
                  <p style="margin: 0.5rem 0 0 0;">The attacker must be in physical proximity to the target network or personnel. <em>Examples: Shoulder surfing, dumpster diving, unauthorized facility entry.</em></p>
                </div>
                <div style="padding-left: 1.5rem; border-left: 2px solid var(--accent-purple);">
                  <strong style="color: #fff; display: block; font-size: 1.2rem;">Insider Attacks</strong>
                  <p style="margin: 0.5rem 0 0 0;">Executed by a trusted entity (employee, contractor) who misuses privileged access. <em>Examples: Data exfiltration, planting logic bombs, intentional misconfiguration.</em></p>
                </div>
                <div style="padding-left: 1.5rem; border-left: 2px solid var(--accent-green);">
                  <strong style="color: #fff; display: block; font-size: 1.2rem;">Distribution Attacks</strong>
                  <p style="margin: 0.5rem 0 0 0;">Also known as Supply Chain attacks. The attacker tampers with hardware or software at its source or during transit prior to installation. <em>Examples: Malicious firmware injection, compromised software updates.</em></p>
                </div>
              </div>

              <h3 style="color: #fff; margin-top: 3rem;">Information Warfare (InfoWar)</h3>
              <p>Information warfare is the use of ICT to gain competitive advantages over an opponent. According to Martin Libicki, information warfare is divided into several categories:</p>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem; font-size: 0.95rem;">
                <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;">
                  <strong style="color: var(--accent-blue);">Command and Control (C2) Warfare:</strong> Disrupting the enemy's C2 systems while protecting one's own.
                </div>
                <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;">
                  <strong style="color: var(--accent-blue);">Intelligence-based Warfare:</strong> Designing, protecting, and denying systems that seek sufficient knowledge to dominate the battlespace.
                </div>
                <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;">
                  <strong style="color: var(--accent-blue);">Electronic Warfare:</strong> Using radio, electronic, or cryptographic techniques to degrade communication capabilities.
                </div>
                <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;">
                  <strong style="color: var(--accent-blue);">Psychological Warfare:</strong> Using information to change the minds of friends, neutrals, and foes (e.g., demagoguery).
                </div>
                <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;">
                  <strong style="color: var(--accent-blue);">Hacker Warfare:</strong> Attacking civilian and military computer systems using software flaws, logic bombs, and viruses.
                </div>
                <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;">
                  <strong style="color: var(--accent-blue);">Economic Warfare:</strong> Monopolizing information or altering economic data to disrupt an adversary's economy.
                </div>
                <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;">
                  <strong style="color: var(--accent-blue);">Cyber Warfare:</strong> The use of information systems against virtual personas to achieve military or strategic objectives.
                </div>
              </div>

              <!-- Section 4 -->
              <div class="glass-card" style="padding: 3rem; margin: 4rem 0; border-top: 4px solid var(--accent-purple);">
                <h2 style="margin-top: 0; color: #fff; font-size: 2rem;">4. Hacking Concepts and Threat Actors</h2>
                <p>Hacking in computer security refers to exploiting vulnerabilities and compromising security controls to gain unauthorized or inappropriate access to system resources. The individuals conducting these activities are classified into various groups based on their intent, authorization, and affiliation.</p>
                
                <h3 style="color: #fff; margin-top: 2rem;">Hacker Classes</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
                  <div style="background: rgba(0,0,0,0.4); padding: 1.5rem; border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                      <div style="width: 16px; height: 16px; border-radius: 50%; background: var(--accent-green);"></div>
                      <strong style="color: #fff; font-size: 1.2rem;">White Hat Hackers</strong>
                    </div>
                    <p style="margin: 0; font-size: 0.95rem;">Authorized professionals hired to conduct penetration tests, identify vulnerabilities, and improve organizational security posture. They operate with strict consent.</p>
                  </div>

                  <div style="background: rgba(0,0,0,0.4); padding: 1.5rem; border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                      <div style="width: 16px; height: 16px; border-radius: 50%; background: var(--accent-red);"></div>
                      <strong style="color: #fff; font-size: 1.2rem;">Black Hat Hackers</strong>
                    </div>
                    <p style="margin: 0; font-size: 0.95rem;">Malicious actors who breach systems without authorization for financial gain, data theft, or destruction. Also known as crackers.</p>
                  </div>

                  <div style="background: rgba(0,0,0,0.4); padding: 1.5rem; border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                      <div style="width: 16px; height: 16px; border-radius: 50%; background: #888;"></div>
                      <strong style="color: #fff; font-size: 1.2rem;">Gray Hat Hackers</strong>
                    </div>
                    <p style="margin: 0; font-size: 0.95rem;">Individuals who operate in a moral gray area. They may hack systems without permission to find bugs, but usually report them to the owner rather than exploiting them maliciously.</p>
                  </div>

                  <div style="background: rgba(0,0,0,0.4); padding: 1.5rem; border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                      <div style="width: 16px; height: 16px; border-radius: 50%; background: #d4af37;"></div>
                      <strong style="color: #fff; font-size: 1.2rem;">Script Kiddies</strong>
                    </div>
                    <p style="margin: 0; font-size: 0.95rem;">Inexperienced individuals who use pre-written hacking tools, scripts, and software without understanding the underlying mechanics of the attacks.</p>
                  </div>

                  <div style="background: rgba(0,0,0,0.4); padding: 1.5rem; border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                      <div style="width: 16px; height: 16px; border-radius: 50%; background: var(--accent-blue);"></div>
                      <strong style="color: #fff; font-size: 1.2rem;">State-Sponsored Hackers</strong>
                    </div>
                    <p style="margin: 0; font-size: 0.95rem;">Highly skilled operators funded by national governments (APTs) targeting critical infrastructure, defense secrets, and intellectual property of rival nations.</p>
                  </div>

                  <div style="background: rgba(0,0,0,0.4); padding: 1.5rem; border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                      <div style="width: 16px; height: 16px; border-radius: 50%; background: var(--accent-purple);"></div>
                      <strong style="color: #fff; font-size: 1.2rem;">Hacktivists</strong>
                    </div>
                    <p style="margin: 0; font-size: 0.95rem;">Individuals or groups who launch cyberattacks (typically DDoS or website defacements) to promote a political, social, or religious agenda.</p>
                  </div>

                  <div style="background: rgba(0,0,0,0.4); padding: 1.5rem; border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                      <div style="width: 16px; height: 16px; border-radius: 50%; background: rgba(255,255,255,0.5);"></div>
                      <strong style="color: #fff; font-size: 1.2rem;">Suicide Hackers</strong>
                    </div>
                    <p style="margin: 0; font-size: 0.95rem;">Individuals who aim to bring down critical infrastructure for a cause, without worrying about facing jail terms or other punishments.</p>
                  </div>

                  <div style="background: rgba(0,0,0,0.4); padding: 1.5rem; border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                      <div style="width: 16px; height: 16px; border-radius: 50%; background: #000; border: 1px solid rgba(255,0,85,0.5);"></div>
                      <strong style="color: #fff; font-size: 1.2rem;">Cyber Terrorists</strong>
                    </div>
                    <p style="margin: 0; font-size: 0.95rem;">Individuals with a wide range of skills who are motivated by religious or political beliefs to create severe fear by disrupting large-scale computer networks.</p>
                  </div>
                </div>
              </div>

              <!-- Section 5 -->
              <h2 style="color: #fff; font-size: 2rem; margin-top: 4rem;">5. Ethical Hacking Concepts & Necessity</h2>
              <p>Ethical hacking is necessary because it allows organizations to preemptively identify vulnerabilities and anticipate attack vectors. "To beat a hacker, you need to think like one."</p>
              
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.1); padding: 2rem; border-radius: 8px; margin: 2rem 0;">
                <h3 style="margin-top: 0; color: var(--accent-blue);">Why Organizations Hire Ethical Hackers</h3>
                <ul style="margin-bottom: 0;">
                  <li>To uncover vulnerabilities in systems and explore their potential as a security risk.</li>
                  <li>To analyze and strengthen the organization's overall security posture.</li>
                  <li>To safeguard customer data and prevent catastrophic financial or reputational loss.</li>
                  <li>To test the responsiveness of the internal incident response team (Blue Team).</li>
                </ul>
              </div>

              <p><strong>Scope and Limitations:</strong> Ethical hackers operate strictly within the defined scope outlined by the organization. The most critical distinction between an ethical hacker and a malicious actor is <strong>consent</strong>. Ethical hacking requires formal, written permission (Rules of Engagement).</p>

              <!-- Section 6 -->
              <h2 style="color: var(--accent-blue); font-size: 2rem; margin-top: 4rem;">6. Hacking Methodologies and Frameworks</h2>
              <p>Professional offensive operations follow strict, repeatable methodologies.</p>
              
              <h3 style="color: #fff;">The 5 Phases of Hacking</h3>
              <div style="display: flex; flex-direction: column; gap: 1rem; margin: 2rem 0;">
                <div style="display: flex; gap: 1.5rem; background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px; align-items: center;">
                  <div style="font-size: 2.5rem; font-weight: bold; color: rgba(255,255,255,0.1); width: 50px; text-align: center;">01</div>
                  <div>
                    <h4 style="margin: 0 0 0.5rem 0; color: #fff; font-size: 1.2rem;">Reconnaissance (Footprinting)</h4>
                    <p style="margin: 0; font-size: 0.95rem;">Gathering information about the target prior to the attack. Can be Passive (OSINT, WHOIS) or Active (interacting with the target server).</p>
                  </div>
                </div>
                <div style="display: flex; gap: 1.5rem; background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px; align-items: center;">
                  <div style="font-size: 2.5rem; font-weight: bold; color: rgba(255,255,255,0.1); width: 50px; text-align: center;">02</div>
                  <div>
                    <h4 style="margin: 0 0 0.5rem 0; color: #fff; font-size: 1.2rem;">Scanning & Enumeration</h4>
                    <p style="margin: 0; font-size: 0.95rem;">Using the recon data to identify specific vulnerabilities, open ports, OS versions, and network topology using tools like Nmap.</p>
                  </div>
                </div>
                <div style="display: flex; gap: 1.5rem; background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px; align-items: center;">
                  <div style="font-size: 2.5rem; font-weight: bold; color: var(--accent-red); width: 50px; text-align: center;">03</div>
                  <div>
                    <h4 style="margin: 0 0 0.5rem 0; color: #fff; font-size: 1.2rem;">Gaining Access</h4>
                    <p style="margin: 0; font-size: 0.95rem;">The exploitation phase. The attacker bypasses security controls, executes code, escalates privileges, and extracts data.</p>
                  </div>
                </div>
                <div style="display: flex; gap: 1.5rem; background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px; align-items: center;">
                  <div style="font-size: 2.5rem; font-weight: bold; color: rgba(255,255,255,0.1); width: 50px; text-align: center;">04</div>
                  <div>
                    <h4 style="margin: 0 0 0.5rem 0; color: #fff; font-size: 1.2rem;">Maintaining Access</h4>
                    <p style="margin: 0; font-size: 0.95rem;">Ensuring persistence in the compromised environment using backdoors, rootkits, or trojans to survive reboots.</p>
                  </div>
                </div>
                <div style="display: flex; gap: 1.5rem; background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px; align-items: center;">
                  <div style="font-size: 2.5rem; font-weight: bold; color: rgba(255,255,255,0.1); width: 50px; text-align: center;">05</div>
                  <div>
                    <h4 style="margin: 0 0 0.5rem 0; color: #fff; font-size: 1.2rem;">Clearing Tracks</h4>
                    <p style="margin: 0; font-size: 0.95rem;">Deleting logs, modifying registry entries, and hiding malicious artifacts to evade detection and maintain uninhibited access.</p>
                  </div>
                </div>
              </div>

              <h3 style="color: #fff; margin-top: 3rem;">Cyber Kill Chain Methodology</h3>
              <p>Developed by Lockheed Martin, the Cyber Kill Chain is a component of intelligence-driven defense for the identification and prevention of malicious intrusion activities. It provides a seven-phase protection mechanism and greater insight into adversary TTPs.</p>
              <div style="display: flex; flex-direction: column; gap: 1rem; margin: 2rem 0;">
                <div style="display: flex; gap: 1.5rem; background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px; align-items: center;">
                  <div style="font-size: 2rem; font-weight: bold; color: rgba(0,240,255,0.3); width: 30px; text-align: center;">1</div>
                  <div><h4 style="margin: 0 0 0.5rem 0; color: #fff;">Reconnaissance</h4><p style="margin: 0; font-size: 0.95rem;">Gathering information about the target—searching the internet, social engineering, performing WHOIS/DNS footprinting, and scanning for open ports and services.</p></div>
                </div>
                <div style="display: flex; gap: 1.5rem; background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px; align-items: center;">
                  <div style="font-size: 2rem; font-weight: bold; color: rgba(0,240,255,0.3); width: 30px; text-align: center;">2</div>
                  <div><h4 style="margin: 0 0 0.5rem 0; color: #fff;">Weaponization</h4><p style="margin: 0; font-size: 0.95rem;">Creating a tailored deliverable malicious payload using an exploit and a backdoor. The adversary may craft phishing campaigns or leverage exploit kits based on identified vulnerabilities.</p></div>
                </div>
                <div style="display: flex; gap: 1.5rem; background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px; align-items: center;">
                  <div style="font-size: 2rem; font-weight: bold; color: rgba(0,240,255,0.3); width: 30px; text-align: center;">3</div>
                  <div><h4 style="margin: 0 0 0.5rem 0; color: #fff;">Delivery</h4><p style="margin: 0; font-size: 0.95rem;">Transmitting the weaponized payload to the victim via email attachments, malicious links, compromised websites, or USB drives.</p></div>
                </div>
                <div style="display: flex; gap: 1.5rem; background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px; align-items: center;">
                  <div style="font-size: 2rem; font-weight: bold; color: var(--accent-red); width: 30px; text-align: center;">4</div>
                  <div><h4 style="margin: 0 0 0.5rem 0; color: #fff;">Exploitation</h4><p style="margin: 0; font-size: 0.95rem;">Triggering the malicious code to exploit a vulnerability in the OS, application, or server on the target system.</p></div>
                </div>
                <div style="display: flex; gap: 1.5rem; background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px; align-items: center;">
                  <div style="font-size: 2rem; font-weight: bold; color: rgba(0,240,255,0.3); width: 30px; text-align: center;">5</div>
                  <div><h4 style="margin: 0 0 0.5rem 0; color: #fff;">Installation</h4><p style="margin: 0; font-size: 0.95rem;">Installing backdoors and maintaining persistence using encryption and evasion techniques to hide from security controls.</p></div>
                </div>
                <div style="display: flex; gap: 1.5rem; background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px; align-items: center;">
                  <div style="font-size: 2rem; font-weight: bold; color: rgba(0,240,255,0.3); width: 30px; text-align: center;">6</div>
                  <div><h4 style="margin: 0 0 0.5rem 0; color: #fff;">Command and Control (C2)</h4><p style="margin: 0; font-size: 0.95rem;">Establishing a two-way encrypted communication channel between the victim's system and the adversary-controlled server for remote exploitation.</p></div>
                </div>
                <div style="display: flex; gap: 1.5rem; background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px; align-items: center;">
                  <div style="font-size: 2rem; font-weight: bold; color: rgba(0,240,255,0.3); width: 30px; text-align: center;">7</div>
                  <div><h4 style="margin: 0 0 0.5rem 0; color: #fff;">Actions on Objectives</h4><p style="margin: 0; font-size: 0.95rem;">The adversary accomplishes their intended goals—data exfiltration, service disruption, or using the compromised system as a launchpad for further attacks.</p></div>
                </div>
              </div>

              <!-- MITRE ATT&CK -->
              <div class="glass-card" style="padding: 3rem; margin: 3rem 0; border-left: 4px solid var(--accent-purple);">
                <h3 style="margin-top: 0; color: #fff; font-size: 1.5rem;">MITRE ATT&amp;CK Framework</h3>
                <p>MITRE ATT&amp;CK is a globally accessible knowledge base of adversary tactics and techniques based on real-world observations. It is used as a foundation for developing specific threat models and methodologies. The framework contains 14 tactic categories derived from the later stages of the Cyber Kill Chain.</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin: 1.5rem 0; font-size: 0.95rem;">
                  <div style="background: rgba(176,0,255,0.1); padding: 0.75rem 1rem; border-radius: 6px;">Reconnaissance</div>
                  <div style="background: rgba(176,0,255,0.1); padding: 0.75rem 1rem; border-radius: 6px;">Resource Development</div>
                  <div style="background: rgba(176,0,255,0.1); padding: 0.75rem 1rem; border-radius: 6px;">Initial Access</div>
                  <div style="background: rgba(176,0,255,0.1); padding: 0.75rem 1rem; border-radius: 6px;">Execution</div>
                  <div style="background: rgba(176,0,255,0.1); padding: 0.75rem 1rem; border-radius: 6px;">Persistence</div>
                  <div style="background: rgba(176,0,255,0.1); padding: 0.75rem 1rem; border-radius: 6px;">Privilege Escalation</div>
                  <div style="background: rgba(176,0,255,0.1); padding: 0.75rem 1rem; border-radius: 6px;">Defense Evasion</div>
                  <div style="background: rgba(176,0,255,0.1); padding: 0.75rem 1rem; border-radius: 6px;">Credential Access</div>
                  <div style="background: rgba(176,0,255,0.1); padding: 0.75rem 1rem; border-radius: 6px;">Discovery</div>
                  <div style="background: rgba(176,0,255,0.1); padding: 0.75rem 1rem; border-radius: 6px;">Lateral Movement</div>
                  <div style="background: rgba(176,0,255,0.1); padding: 0.75rem 1rem; border-radius: 6px;">Collection</div>
                  <div style="background: rgba(176,0,255,0.1); padding: 0.75rem 1rem; border-radius: 6px;">Command and Control</div>
                  <div style="background: rgba(176,0,255,0.1); padding: 0.75rem 1rem; border-radius: 6px;">Exfiltration</div>
                  <div style="background: rgba(176,0,255,0.1); padding: 0.75rem 1rem; border-radius: 6px;">Impact</div>
                </div>
                <p style="font-size: 0.95rem;"><strong>Use Cases:</strong> Prioritize defense capabilities, conduct alternatives analysis, determine security coverage, describe intrusion events using common references, identify adversary tradecraft commonalities, and connect mitigations with weaknesses.</p>
              </div>

              <!-- Diamond Model -->
              <div class="glass-card" style="padding: 3rem; margin: 3rem 0; border-left: 4px solid #d4af37;">
                <h3 style="margin-top: 0; color: #fff; font-size: 1.5rem;">Diamond Model of Intrusion Analysis</h3>
                <p>The Diamond Model offers a framework for identifying clusters of correlated events in any intrusion activity. It consists of four core features that, when arranged by their relationships, form a diamond-shaped structure.</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin: 1.5rem 0;">
                  <div style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: 8px;">
                    <strong style="color: var(--accent-red); display: block; margin-bottom: 0.5rem;">Adversary</strong>
                    <span style="font-size: 0.95rem;">The opponent "who" was behind the attack—an individual, insider, or competing organization.</span>
                  </div>
                  <div style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: 8px;">
                    <strong style="color: var(--accent-blue); display: block; margin-bottom: 0.5rem;">Victim</strong>
                    <span style="font-size: 0.95rem;">The target "where" the attack was performed—a person, organization, IP address, domain, or email.</span>
                  </div>
                  <div style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: 8px;">
                    <strong style="color: var(--accent-green); display: block; margin-bottom: 0.5rem;">Capability</strong>
                    <span style="font-size: 0.95rem;">"How" the attack was performed—strategies, tools, and techniques (e.g., brute forcing, ransomware).</span>
                  </div>
                  <div style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: 8px;">
                    <strong style="color: var(--accent-purple); display: block; margin-bottom: 0.5rem;">Infrastructure</strong>
                    <span style="font-size: 0.95rem;">"What" the adversary used to reach the victim—hardware, software, C2 servers, email servers.</span>
                  </div>
                </div>
                <p style="font-size: 0.95rem;"><strong>Extended Model:</strong> Adds <em>socio-political</em> meta-features (adversary-victim relationship, motivation) and <em>technology</em> meta-features (infrastructure-capability relationship). Additional event meta-features include timestamp, phase, result, direction, methodology, and resources.</p>
              </div>

              <!-- Indicators of Compromise -->
              <h3 style="color: #fff; margin-top: 3rem;">Indicators of Compromise (IoCs)</h3>
              <p>IoCs are clues, artifacts, and forensic data found on a network or OS that indicate a potential intrusion or malicious activity. They are divided into four categories:</p>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.5rem 0;">
                <div style="padding: 1rem; background: rgba(0,0,0,0.3); border-radius: 6px;"><strong style="color: var(--accent-blue);">Email Indicators</strong><br><span style="font-size: 0.9rem;">Sender address, subject lines, malicious attachments or links.</span></div>
                <div style="padding: 1rem; background: rgba(0,0,0,0.3); border-radius: 6px;"><strong style="color: var(--accent-purple);">Network Indicators</strong><br><span style="font-size: 0.9rem;">Malicious URLs, domain names, suspicious IP addresses.</span></div>
                <div style="padding: 1rem; background: rgba(0,0,0,0.3); border-radius: 6px;"><strong style="color: var(--accent-red);">Host-Based Indicators</strong><br><span style="font-size: 0.9rem;">Filenames, file hashes, registry keys, DLLs, mutex objects.</span></div>
                <div style="padding: 1rem; background: rgba(0,0,0,0.3); border-radius: 6px;"><strong style="color: var(--accent-green);">Behavioral Indicators</strong><br><span style="font-size: 0.9rem;">Code injection into memory, scripts running from applications, unusual PowerShell execution.</span></div>
              </div>
              <p style="font-size: 0.95rem;"><strong>Key IoCs to monitor:</strong> Unusual outbound traffic, privileged account anomalies, geographical anomalies, multiple login failures, increased database reads, mismatched port-application traffic, suspicious registry changes, unusual DNS requests, and signs of DDoS activity.</p>

              <!-- Adversary Behavioral Identification -->
              <h3 style="color: #fff; margin-top: 3rem;">Adversary Behavioral Identification</h3>
              <p>Identifying common adversary behaviors enhances detection capabilities. Key behaviors to monitor include:</p>
              <ul style="font-size: 0.95rem;">
                <li><strong>Internal Reconnaissance:</strong> Enumeration of systems, hosts, processes, and unusual Batch/PowerShell commands.</li>
                <li><strong>Use of PowerShell:</strong> Automating data exfiltration; detected by checking transcript logs and Windows Event logs.</li>
                <li><strong>Unspecified Proxy Activities:</strong> Multiple domains pointing to the same host for quick switching to avoid detection.</li>
                <li><strong>Command-Line Interface Abuse:</strong> Browsing files, modifying content, creating accounts, and downloading malware via CLI.</li>
                <li><strong>HTTP User Agent Modification:</strong> Altering user agent fields to communicate with compromised systems.</li>
                <li><strong>C2 Server Communication:</strong> Encrypted outbound connections to adversary-controlled infrastructure.</li>
                <li><strong>DNS Tunneling:</strong> Obfuscating malicious traffic within legitimate DNS requests for data exfiltration.</li>
                <li><strong>Web Shell Deployment:</strong> Creating shells within websites for remote server access and file manipulation.</li>
                <li><strong>Data Staging:</strong> Collecting and combining sensitive data before exfiltration or destruction.</li>
              </ul>

              <!-- Section 7 -->
              <div class="glass-card" style="padding: 3rem; margin: 4rem 0; border-top: 4px solid #fff;">
                <h2 style="margin-top: 0; color: #fff; font-size: 2rem;">7. Information Security Controls</h2>
                <p>Information security controls prevent unwanted events and reduce risk to an organization's information assets. The core concepts critical to information security are confidentiality, integrity, and availability; the concepts related to access are authentication, authorization, and non-repudiation.</p>
                
                <h3 style="color: #fff;">Information Assurance (IA)</h3>
                <p>IA refers to the assurance of integrity, availability, confidentiality, and authenticity of information during usage, processing, storage, and transmission. Key processes include:</p>
                <ul style="font-size: 0.95rem;">
                  <li>Developing local policy and guidance to maintain systems at optimal security levels</li>
                  <li>Designing network and user authentication strategies</li>
                  <li>Identifying network vulnerabilities and threats through regular assessments</li>
                  <li>Applying appropriate information assurance controls</li>
                  <li>Performing Certification and Accreditation (C&amp;A) of information systems</li>
                </ul>

                <h3 style="color: #fff; margin-top: 2rem;">Continual/Adaptive Security Strategy</h3>
                <p>Organizations should adopt an adaptive security strategy involving four continuous activities:</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.5rem 0;">
                  <div style="background: rgba(0,240,255,0.05); padding: 1.25rem; border-radius: 8px; border-left: 3px solid var(--accent-blue);">
                    <strong style="color: var(--accent-blue);">01 — Protection</strong>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">Defense-in-depth strategies, endpoint/network/data protection, security policies, firewalls, and IDS.</p>
                  </div>
                  <div style="background: rgba(0,240,255,0.05); padding: 1.25rem; border-radius: 8px; border-left: 3px solid var(--accent-green);">
                    <strong style="color: var(--accent-green);">02 — Detection</strong>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">Continuous threat monitoring, network traffic analysis, and packet sniffing to identify abnormalities.</p>
                  </div>
                  <div style="background: rgba(0,240,255,0.05); padding: 1.25rem; border-radius: 8px; border-left: 3px solid var(--accent-red);">
                    <strong style="color: var(--accent-red);">03 — Response</strong>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">Incident response, investigation, containment, impact mitigation, and eradication of root causes.</p>
                  </div>
                  <div style="background: rgba(0,240,255,0.05); padding: 1.25rem; border-radius: 8px; border-left: 3px solid var(--accent-purple);">
                    <strong style="color: var(--accent-purple);">04 — Prediction</strong>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">Risk and vulnerability assessment, attack surface analysis, and consuming threat intelligence data.</p>
                  </div>
                </div>

                <h3 style="color: #fff; margin-top: 2rem;">Defense-in-Depth</h3>
                <p>A security strategy using multiple protection layers throughout an information system. If one layer fails, another prevents the threat from reaching its target. Layers include:</p>
                <ul>
                  <li>Policies, Procedures, and Awareness</li>
                  <li>Physical Security</li>
                  <li>Perimeter Security (Firewalls, IPS/IDS)</li>
                  <li>Internal Network Security (VLANs, NAC)</li>
                  <li>Host Security (Antivirus, EDR, OS hardening)</li>
                  <li>Application Security (WAF, Code Review)</li>
                  <li>Data Security (Encryption, DLP)</li>
                </ul>

                <h3 style="color: #fff; margin-top: 2rem;">Risk Management</h3>
                <p>Risk management is the process of identifying, assessing, responding to, and implementing controls to manage potential effects of risk. <strong>RISK = Threat × Vulnerability × Asset Value</strong>.</p>
                <p>Risk levels range from <em>Extreme</em> (immediate action required) to <em>Low</em> (preventive steps). The four key phases are:</p>
                <ol style="font-size: 0.95rem;">
                  <li><strong>Risk Identification:</strong> Identify sources, causes, and consequences of internal/external risks before they cause harm.</li>
                  <li><strong>Risk Assessment:</strong> Assess the likelihood and impact of identified risks; assign priorities for mitigation.</li>
                  <li><strong>Risk Treatment:</strong> Select and implement appropriate controls based on severity, cost, and likelihood of success.</li>
                  <li><strong>Risk Tracking &amp; Review:</strong> Ensure appropriate controls are in place, monitor for new risks, and evaluate strategy performance.</li>
                </ol>
              </div>

              <!-- Cyber Threat Intelligence -->
              <div class="glass-card" style="padding: 3rem; margin: 3rem 0; border-left: 4px solid var(--accent-blue);">
                <h3 style="margin-top: 0; color: #fff; font-size: 1.5rem;">Cyber Threat Intelligence (CTI)</h3>
                <p>CTI is the collection and analysis of information about threats and adversaries, drawing patterns that provide the ability to make knowledgeable decisions for preparedness, prevention, and response against cyberattacks. It converts unknown threats into known threats.</p>
                <h4 style="color: var(--accent-blue);">Types of Threat Intelligence</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0;">
                  <div style="background: rgba(0,0,0,0.3); padding: 1.25rem; border-radius: 8px;">
                    <strong style="color: #fff;">Strategic</strong>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">High-level information on changing risks, attack trends, and financial impact. Consumed by executives and CISO.</p>
                  </div>
                  <div style="background: rgba(0,0,0,0.3); padding: 1.25rem; border-radius: 8px;">
                    <strong style="color: #fff;">Tactical</strong>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">Information on attacker TTPs—malware, campaigns, techniques. Consumed by IT/SOC managers and administrators.</p>
                  </div>
                  <div style="background: rgba(0,0,0,0.3); padding: 1.25rem; border-radius: 8px;">
                    <strong style="color: #fff;">Operational</strong>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">Information on specific incoming attacks, attacker methodologies, and past malicious activities. Consumed by security managers and network defenders.</p>
                  </div>
                  <div style="background: rgba(0,0,0,0.3); padding: 1.25rem; border-radius: 8px;">
                    <strong style="color: #fff;">Technical</strong>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">Specific indicators of compromise—malicious IPs, domains, file hashes. Consumed by SOC staff and IR teams.</p>
                  </div>
                </div>
                <h4 style="color: var(--accent-blue);">Threat Intelligence Lifecycle</h4>
                <ol style="font-size: 0.95rem;">
                  <li><strong>Planning &amp; Direction:</strong> Define intelligence requirements, form the team, and create a collection plan.</li>
                  <li><strong>Collection:</strong> Gather data from OSINT, HUMINT, IMINT, SIGINT, and other sources.</li>
                  <li><strong>Processing &amp; Exploitation:</strong> Convert raw data into usable format using structuring, decryption, parsing, and filtering.</li>
                  <li><strong>Analysis &amp; Production:</strong> Combine sources, apply reasoning techniques, and elevate analyzed information to actionable intelligence.</li>
                  <li><strong>Dissemination &amp; Integration:</strong> Deliver intelligence at strategic, tactical, operational, and technical levels. Collect feedback to improve the cycle.</li>
                </ol>
              </div>

              <!-- Threat Modeling -->
              <h3 style="color: #fff; margin-top: 3rem;">Threat Modeling</h3>
              <p>A risk assessment approach for analyzing application security by capturing, organizing, and analyzing all relevant information. The five-step process:</p>
              <ol style="font-size: 0.95rem;">
                <li><strong>Identify Security Objectives:</strong> Define goals for confidentiality, integrity, and availability. Determine compliance requirements.</li>
                <li><strong>Application Overview:</strong> Identify components, data flows, trust boundaries, roles, key usage scenarios, technologies, and security mechanisms.</li>
                <li><strong>Decompose the Application:</strong> Break down trust boundaries, data flows, entry points, and exit points to find detailed threats.</li>
                <li><strong>Identify Threats:</strong> Use question-driven approaches and frameworks like <strong>STRIDE</strong> to identify threats:
                  <ul style="margin-top: 0.5rem;">
                    <li><strong>S</strong>poofing Identity (Authenticity)</li>
                    <li><strong>T</strong>ampering with Data (Integrity)</li>
                    <li><strong>R</strong>epudiation (Non-Repudiation)</li>
                    <li><strong>I</strong>nformation Disclosure (Confidentiality)</li>
                    <li><strong>D</strong>enial of Service (Availability)</li>
                    <li><strong>E</strong>levation of Privilege (Authorization)</li>
                  </ul>
                </li>
                <li><strong>Identify Vulnerabilities:</strong> Find weaknesses related to the identified threats using vulnerability categories.</li>
              </ol>

              <!-- Incident Management -->
              <div class="glass-card" style="padding: 3rem; margin: 3rem 0; border-left: 4px solid var(--accent-red);">
                <h3 style="margin-top: 0; color: #fff; font-size: 1.5rem;">Incident Management &amp; Response</h3>
                <p>Incident management is a set of defined processes to identify, analyze, prioritize, and resolve security incidents to restore normal operations and prevent recurrence. Incident Handling and Response (IH&amp;R) involves organized, careful steps when reacting to a security incident.</p>
                <h4 style="color: var(--accent-red);">IH&amp;R Process Steps</h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem; margin: 1rem 0; font-size: 0.95rem;">
                  <div style="display: flex; gap: 1rem; align-items: center; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;"><strong style="color: var(--accent-red); min-width: 25px;">1.</strong> <span><strong>Preparation</strong> — Audit resources, define policies, build and train the incident response team.</span></div>
                  <div style="display: flex; gap: 1rem; align-items: center; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;"><strong style="color: var(--accent-red); min-width: 25px;">2.</strong> <span><strong>Incident Recording</strong> — Initial reporting, recording, and assigning the incident with proper communication plans.</span></div>
                  <div style="display: flex; gap: 1rem; align-items: center; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;"><strong style="color: var(--accent-red); min-width: 25px;">3.</strong> <span><strong>Incident Triage</strong> — Analyze, validate, categorize, and prioritize based on attack type, severity, and impact.</span></div>
                  <div style="display: flex; gap: 1rem; align-items: center; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;"><strong style="color: var(--accent-red); min-width: 25px;">4.</strong> <span><strong>Notification</strong> — Inform stakeholders including management, vendors, and clients.</span></div>
                  <div style="display: flex; gap: 1rem; align-items: center; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;"><strong style="color: var(--accent-red); min-width: 25px;">5.</strong> <span><strong>Containment</strong> — Prevent the spread of infection to other organizational assets.</span></div>
                  <div style="display: flex; gap: 1rem; align-items: center; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;"><strong style="color: var(--accent-red); min-width: 25px;">6.</strong> <span><strong>Evidence Gathering &amp; Forensics</strong> — Collect evidence and submit for investigation.</span></div>
                  <div style="display: flex; gap: 1rem; align-items: center; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;"><strong style="color: var(--accent-red); min-width: 25px;">7.</strong> <span><strong>Eradication</strong> — Remove root cause and close all attack vectors.</span></div>
                  <div style="display: flex; gap: 1rem; align-items: center; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;"><strong style="color: var(--accent-red); min-width: 25px;">8.</strong> <span><strong>Recovery</strong> — Restore affected systems, services, and data.</span></div>
                  <div style="display: flex; gap: 1rem; align-items: center; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 6px;"><strong style="color: var(--accent-red); min-width: 25px;">9.</strong> <span><strong>Post-Incident Activities</strong> — Documentation, impact assessment, policy revision, investigation closure, and disclosure.</span></div>
                </div>
              </div>

              <!-- AI/ML in Cybersecurity -->
              <h3 style="color: #fff; margin-top: 3rem;">Role of AI &amp; Machine Learning in Cybersecurity</h3>
              <p>ML is an unsupervised self-learning system that defines what a normal network looks like and reports deviations or anomalies in real-time. AI and ML help identify new exploits and weaknesses for faster mitigation.</p>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0; font-size: 0.95rem;">
                <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 6px;"><strong>Supervised Learning</strong> — Algorithms using labeled training data to learn differences between labels. Includes classification and regression.</div>
                <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 6px;"><strong>Unsupervised Learning</strong> — Algorithms using unlabeled data to deduce categories. Includes clustering and dimensionality reduction.</div>
              </div>
              <p><strong>How AI/ML Prevent Cyber Attacks:</strong></p>
              <ul style="font-size: 0.95rem;">
                <li><strong>Password Protection &amp; Authentication:</strong> AI improves biometric validations and face recognition.</li>
                <li><strong>Phishing Detection:</strong> AI/ML scan and identify phishing emails faster than humans and differentiate malicious from legitimate websites.</li>
                <li><strong>Threat Detection:</strong> ML constantly analyzes data to notify admins of imminent threats before systems are compromised.</li>
                <li><strong>Vulnerability Management:</strong> AI dynamically scans for vulnerabilities and predicts when exploitation might occur.</li>
                <li><strong>Behavioral Analytics:</strong> AI generates user patterns and alerts on suspicious deviations from normal usage.</li>
                <li><strong>Network Security:</strong> AI analyzes traffic and proposes efficient security policies by default.</li>
                <li><strong>AI-Based Antivirus:</strong> Uses anomaly detection instead of signature matching to detect suspicious program behavior.</li>
                <li><strong>Fraud &amp; Botnet Detection:</strong> ML algorithms identify fraudulent transactions and detect unauthorized intrusions that bypass traditional IDS.</li>
              </ul>

              <!-- Section 8 -->
              <h2 style="color: #fff; font-size: 2rem; margin-top: 4rem;">8. Information Security Laws and Standards</h2>
              <p>Laws are a system of rules enforced by a particular country or community to govern behavior. A Standard is a document established by consensus and approved by a recognized body that provides rules, guidelines, or characteristics for activities. Ethical hackers must operate strictly within legal boundaries.</p>

              <div style="display: flex; flex-direction: column; gap: 2rem; margin-top: 2rem;">
                <!-- PCI-DSS -->
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 2rem; border-radius: 8px;">
                  <h3 style="margin-top: 0; color: var(--accent-blue);">Payment Card Industry Data Security Standard (PCI DSS)</h3>
                  <p style="font-size: 0.95rem;">A proprietary information security standard for organizations handling cardholder information for major debit, credit, prepaid, ATM, and POS cards. It applies to all entities involved in payment card processing. Failure to meet requirements may result in fines or termination of processing privileges.</p>
                  <strong style="color: #fff; font-size: 0.9rem; text-transform: uppercase;">Key Requirements:</strong>
                  <ul style="font-size: 0.95rem; margin-bottom: 0;">
                    <li>Build and Maintain a Secure Network (Firewalls, no vendor defaults)</li>
                    <li>Protect Cardholder Data (Encryption at rest and in transit)</li>
                    <li>Maintain a Vulnerability Management Program (Antivirus, secure systems)</li>
                    <li>Implement Strong Access Control Measures (Unique IDs, physical restrictions)</li>
                    <li>Regularly Monitor and Test Networks</li>
                    <li>Maintain an Information Security Policy</li>
                  </ul>
                </div>

                <!-- ISO/IEC -->
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 2rem; border-radius: 8px;">
                  <h3 style="margin-top: 0; color: var(--accent-purple);">ISO/IEC Standards</h3>
                  <p style="font-size: 0.95rem;">International standards for security management and implementation.</p>
                  <ul style="font-size: 0.95rem; margin-bottom: 0;">
                    <li><strong style="color: #fff;">ISO/IEC 27001:2022</strong> — The framework for establishing, implementing, and continually improving an Information Security Management System (ISMS).</li>
                    <li><strong style="color: #fff;">ISO/IEC 27701:2019</strong> — Extends 27001 to include privacy management and protection of Personally Identifiable Information (PII).</li>
                    <li><strong style="color: #fff;">ISO/IEC 27002:2022</strong> — Outlines best practices and control objectives for cybersecurity (access control, cryptography).</li>
                    <li><strong style="color: #fff;">ISO/IEC 27018:2019</strong> — Code of practice for protecting PII in public cloud environments.</li>
                  </ul>
                </div>

                <!-- HIPAA -->
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 2rem; border-radius: 8px;">
                  <h3 style="margin-top: 0; color: var(--accent-green);">Health Insurance Portability and Accountability Act (HIPAA)</h3>
                  <p style="font-size: 0.95rem;">Provides federal protections for individually identifiable health information held by covered entities and business associates. Key rules include:</p>
                  <ul style="font-size: 0.95rem; margin-bottom: 0;">
                    <li><strong>Privacy Rule:</strong> National standards to protect medical records and personal health information.</li>
                    <li><strong>Security Rule:</strong> Requires administrative, physical, and technical safeguards for electronically protected health information (ePHI).</li>
                    <li><strong>National Provider Identifier (NPI):</strong> A unique 10-digit identification number for covered health care providers.</li>
                  </ul>
                </div>

                <!-- SOX -->
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 2rem; border-radius: 8px;">
                  <h3 style="margin-top: 0; color: #d4af37;">Sarbanes-Oxley Act (SOX)</h3>
                  <p style="font-size: 0.95rem; margin-bottom: 0;">Enacted in 2002 to protect investors and the public by increasing the accuracy and reliability of corporate disclosures. It mandates reforms to enhance corporate responsibility, enhance financial disclosures, and combat accounting fraud. Title III requires senior executives to take individual responsibility for the accuracy of financial reports, and Title IV mandates internal controls to ensure report accuracy.</p>
                </div>

                <!-- GDPR -->
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 2rem; border-radius: 8px;">
                  <h3 style="margin-top: 0; color: var(--accent-red);">General Data Protection Regulation (GDPR)</h3>
                  <p style="font-size: 0.95rem;">One of the most stringent privacy and security laws globally, implemented by the EU in 2018. It imposes obligations on organizations anywhere in the world if they collect data related to people in the EU, levying fines reaching tens of millions of euros for violations.</p>
                  <strong style="color: #fff; font-size: 0.9rem; text-transform: uppercase;">Data Protection Principles:</strong>
                  <ul style="font-size: 0.95rem; margin-bottom: 0;">
                    <li>Lawfulness, fairness, and transparency</li>
                    <li>Purpose limitation (legitimate purposes only)</li>
                    <li>Data minimization (only as much data as necessary)</li>
                    <li>Accuracy (keep data up to date)</li>
                    <li>Storage limitation (store only as long as necessary)</li>
                    <li>Integrity and confidentiality (encryption)</li>
                    <li>Accountability (demonstrating compliance)</li>
                  </ul>
                </div>

                <!-- DMCA & FISMA & DPA -->
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 2rem; border-radius: 8px;">
                  <h3 style="margin-top: 0; color: #888;">Additional Key Legislation</h3>
                  <ul style="font-size: 0.95rem; margin-bottom: 0; display: flex; flex-direction: column; gap: 1rem;">
                    <li><strong style="color: #fff;">DMCA (Digital Millennium Copyright Act):</strong> Defines legal prohibitions against circumvention of technological protection measures employed by copyright owners.</li>
                    <li><strong style="color: #fff;">FISMA (Federal Information Security Management Act):</strong> A comprehensive framework for ensuring the effectiveness of information security controls over federal operations and assets in the US.</li>
                    <li><strong style="color: #fff;">DPA 2018 (Data Protection Act):</strong> The UK framework for data protection law, updated to replace the 1998 act and reflecting the UK's status outside the EU post-GDPR.</li>
                  </ul>
                </div>
              </div>

            </div>
            
            <div style="margin-top: 5rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 2rem;">
               <a href="/education" class="btn" style="text-decoration: none; padding: 1rem 2rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff; display: flex; align-items: center; gap: 0.5rem; font-weight: bold; transition: all 0.2s;">
                 <span>&larr;</span> Back to Curriculum
               </a>
               <div style="text-align: right;">
                 <span style="color: #888; font-size: 0.95rem; display: block; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Next Module</span>
                 <a href="/education/module-2" style="color: var(--accent-blue); font-size: 1.1rem; font-weight: bold; text-decoration: none;">Footprinting &amp; Reconnaissance &rarr;</a>
               </div>
            </div>
          </article>
        </div>
      </div>
    `
  }));
});

app.get('/education/module-2', (c) => {
  return c.html(layout({
    title: 'Module 2: Footprinting and Reconnaissance - Hack Lab',
    description: 'A complete advanced guide to footprinting concepts, OSINT, search engines, DNS, WHOIS, network and email reconnaissance, automation, AI-assisted analysis, and countermeasures.',
    path: '/education',
    body: `
      <div class="dashboard-content-area">
        <div class="container" style="max-width: 1100px; margin: 0 auto;">
          <article class="post-page animate-in">
            <header class="post-page__header" style="text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 3rem; margin-bottom: 3rem;">
              <div class="post-page__meta" style="justify-content: center;"><span class="type-badge type-badge--article">Module 02</span></div>
              <h1 class="post-page__title" style="font-size: 3.5rem; margin-bottom: 1rem; background: linear-gradient(90deg, #fff, #888); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Footprinting and Reconnaissance</h1>
              <p class="post-page__summary" style="font-size: 1.3rem; color: #aaa; max-width: 850px; margin: 0 auto;">A complete, understandable guide to collecting, organizing, validating, and reducing publicly visible attack-surface information during authorized security assessments.</p>
            </header>

            <div class="post-content animate-in" style="font-size: 1.08rem; line-height: 1.8; color: #ccc;">

              <div class="glass-card" style="padding: 2rem; margin-bottom: 3rem; border-left: 4px solid var(--accent-red);">
                <h2 style="margin-top: 0; color: #fff; font-size: 1.7rem;">Ethical Scope</h2>
                <p>Footprinting is dual-use. The same techniques help defenders understand exposure and help attackers choose targets. In this lab, every technique must be used only on assets you own, assets in an approved training range, or targets covered by written authorization. The objective is to build a security profile, report risk clearly, and reduce exposure.</p>
              </div>

              <div class="glass-card" style="padding: 3rem; margin-bottom: 4rem; border-left: 4px solid var(--accent-blue);">
                <h2 style="margin-top: 0; color: #fff; font-size: 2rem;">Learning Objectives</h2>
                <ol style="font-size: 0.98rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.5rem 2rem; padding-left: 1.25rem;">
                  <li>Explain footprinting concepts.</li>
                  <li>Demonstrate footprinting through search engines.</li>
                  <li>Use internet research services for OSINT.</li>
                  <li>Understand social networking reconnaissance.</li>
                  <li>Use Whois footprinting techniques.</li>
                  <li>Use DNS footprinting techniques.</li>
                  <li>Understand network and email footprinting.</li>
                  <li>Recognize social engineering reconnaissance.</li>
                  <li>Automate footprinting with tools and AI-assisted analysis.</li>
                  <li>Apply practical countermeasures.</li>
                </ol>
              </div>

              <h2 style="color: #fff; font-size: 2rem;">1. Footprinting Concepts</h2>
              <p>Footprinting, also called reconnaissance, is the first structured phase of an ethical hacking engagement. The assessor gathers as much relevant information as possible about an organization, network, application, people, cloud footprint, and public infrastructure before deeper testing begins. When done methodically, footprinting produces a <strong>blueprint</strong>: a working map of the target's visible security profile.</p>
              <p>The blueprint does not prove that a system is vulnerable by itself. It shows where to look, which technologies are exposed, which business units exist, what domains and subdomains are active, where email flows, which providers are used, and which controls may be missing.</p>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin: 2rem 0;">
                <div style="background: rgba(0,240,255,0.06); border: 1px solid rgba(0,240,255,0.18); padding: 1.5rem; border-radius: 8px;">
                  <h3 style="margin-top: 0; color: var(--accent-blue);">Passive Footprinting</h3>
                  <p style="font-size: 0.95rem;">Passive footprinting gathers stored or indexed information without directly touching the target's systems. It relies on search engines, public records, archived pages, breach-notification services, job posts, social networks, code repositories, certificate transparency logs, and other open sources.</p>
                  <p style="font-size: 0.95rem; margin-bottom: 0;">It is quieter because the target usually does not see direct traffic from the assessor, but it may be incomplete or outdated.</p>
                </div>
                <div style="background: rgba(176,0,255,0.06); border: 1px solid rgba(176,0,255,0.18); padding: 1.5rem; border-radius: 8px;">
                  <h3 style="margin-top: 0; color: var(--accent-purple);">Active Footprinting</h3>
                  <p style="font-size: 0.95rem;">Active footprinting interacts with target-controlled systems. DNS queries, traceroute, controlled port discovery, banner collection, and service validation can provide fresher and more accurate data.</p>
                  <p style="font-size: 0.95rem; margin-bottom: 0;">Because active testing creates traffic and logs, it must be scheduled, scoped, and approved.</p>
                </div>
              </div>

              <h3 style="color: #fff;">Information Collected During Footprinting</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; font-size: 0.95rem;">
                <div style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: 8px;">
                  <strong style="color: var(--accent-blue); display: block; margin-bottom: 0.5rem;">Organization Information</strong>
                  Employee names, roles, emails, phone numbers, locations, departments, partners, public links, news, press releases, legal records, patents, trademarks, and web technologies.
                </div>
                <div style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: 8px;">
                  <strong style="color: var(--accent-purple); display: block; margin-bottom: 0.5rem;">Network Information</strong>
                  Domains, subdomains, netblocks, IP addresses, hosting providers, DNS records, public routers, reachable services, firewall clues, and Whois records.
                </div>
                <div style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: 8px;">
                  <strong style="color: var(--accent-green); display: block; margin-bottom: 0.5rem;">System Information</strong>
                  Web server platforms, operating systems when exposed, application frameworks, public email patterns, usernames in metadata, cloud services, and exposed login surfaces.
                </div>
              </div>

              <h3 style="color: #fff; margin-top: 2.5rem;">Footprinting Threats</h3>
              <ul style="font-size: 0.95rem;">
                <li><strong>Social engineering:</strong> Attackers use collected names, roles, vendors, and internal vocabulary to sound credible when contacting employees.</li>
                <li><strong>System and network attacks:</strong> Version numbers, exposed services, cloud buckets, and login portals help an attacker prioritize later exploitation attempts.</li>
                <li><strong>Information leakage:</strong> Documents, source code, backups, metadata, and public tickets can reveal sensitive internal details.</li>
                <li><strong>Corporate espionage:</strong> Competitors or hostile actors can use public information to infer strategy, pricing, partnerships, technologies, and product direction.</li>
              </ul>
              <p>A clean methodology keeps passive work, active validation, people OSINT, DNS, network mapping, reporting, and countermeasures separate so findings stay traceable.</p>

              <h2 style="color: #fff; font-size: 2rem; margin-top: 4rem;">2. Search Engine Footprinting</h2>
              <p>Search engines are often the richest passive reconnaissance source. Crawlers index web pages, PDFs, spreadsheets, images, cached content, exposed directories, old pages, login portals, and error messages. A defender uses the same visibility to discover what the public internet can learn about the organization.</p>
              <p>Useful search sources include Google, Bing, Yahoo, Ask, AOL, Baidu, Yandex, WolframAlpha, DuckDuckGo, Startpage, MetaGer, and eTools.ch. Results can reveal technology platforms, employee details, support portals, intranet naming patterns, file leaks, and contact information.</p>

              <h3 style="color: #fff;">Advanced Search Operators</h3>
              <table style="width: 100%; border-collapse: collapse; margin: 1.5rem 0; background: rgba(0,0,0,0.2); font-size: 0.92rem;">
                <tr style="background: rgba(255,255,255,0.05); text-align: left;"><th style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Operator</th><th style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Purpose</th><th style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Example</th></tr>
                <tr><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);"><code>site:</code></td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Restrict results to a domain.</td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);"><code>site:example.com security</code></td></tr>
                <tr><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);"><code>inurl:</code> / <code>allinurl:</code></td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Find words in URLs.</td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);"><code>inurl:login site:example.com</code></td></tr>
                <tr><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);"><code>intitle:</code> / <code>allintitle:</code></td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Find words in page titles.</td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);"><code>intitle:"index of" site:example.com</code></td></tr>
                <tr><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);"><code>intext:</code></td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Find exact body text.</td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);"><code>intext:"vpn configuration"</code></td></tr>
                <tr><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);"><code>filetype:</code></td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Find file extensions.</td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);"><code>site:example.com filetype:pdf</code></td></tr>
                <tr><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);"><code>cache:</code>, <code>related:</code>, <code>info:</code></td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Inspect cached pages, related sites, and search metadata.</td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);"><code>related:example.com</code></td></tr>
                <tr><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);"><code>before:</code> / <code>after:</code></td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Filter by publication date.</td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);"><code>site:example.com after:2025-01-01</code></td></tr>
              </table>

              <p>Google hacking means combining operators into precise queries. It can uncover error messages, backup files, password-containing files, sensitive directories, network logs, exposed source code, login portals, IoT panels, VPN portals, and vulnerable server fingerprints. For example, a defender might search for public intranet references using <code>intitle:intranet inurl:intranet intext:"human resources"</code> against approved domains.</p>

              <div class="glass-card" style="padding: 2rem; margin: 2rem 0; border-left: 4px solid var(--accent-purple);">
                <h3 style="margin-top: 0; color: #fff;">Google Hacking Database</h3>
                <p>The Google Hacking Database, hosted by Exploit-DB, catalogs search patterns by category: footholds, files containing usernames, sensitive directories, web server detection, vulnerable files, vulnerable servers, error messages, files containing juicy information, files containing passwords, shopping information, network or vulnerability data, login portals, online devices, advisories, and known vulnerabilities.</p>
                <p style="margin-bottom: 0;">SearchSploit provides command-line access to Exploit-DB content for local or air-gapped research, but findings still require authorization and verification before any active testing.</p>
              </div>

              <h3 style="color: #fff;">VPN, IoT, Image, Video, FTP, and Meta Search</h3>
              <p>Search engines can identify remote access surfaces such as SSL VPN portals, VPN configuration files, OpenVPN key patterns, and vendor-branded login pages. These are sensitive discoveries: in a defensive assessment, record the URL, exposure type, evidence, and business owner, then recommend access control and search deindexing where appropriate.</p>
              <p>Shodan, Censys, ZoomEye, BinaryEdge, and Fofa index internet-connected devices and services. They are useful for finding exposed VoIP systems, VPN endpoints, IoT devices, SCADA indicators, CCTV panels, open ports, banners, manufacturer names, and geographic hints. Reverse image search, Google Advanced Image Search, TinEye, Bing Images, Pinterest image search, YouTube metadata tools, YouTube DataViewer, MW Metadata, EzGif, and VideoReverser.com can help validate images, facilities, timeframes, thumbnails, and reused profile pictures.</p>
              <p>FTP search engines and queries such as <code>intitle:"index of" inurl:ftp</code> can reveal indexed file repositories. Meta search engines aggregate results from multiple providers and may reduce search bias or improve privacy.</p>

              <h2 style="color: #fff; font-size: 2rem; margin-top: 4rem;">3. Internet Research Services</h2>
              <p>Internet research services enrich raw search results with domain, infrastructure, historical, people, and breach context. The goal is to discover assets and relationships that normal website browsing misses.</p>
              <h3 style="color: #fff;">TLDs and Subdomains</h3>
              <p>Top-level domains and subdomains reveal business units, regions, environments, vendors, acquisitions, testing systems, and forgotten infrastructure. A subdomain like <code>dev</code>, <code>stage</code>, <code>vpn</code>, <code>mail</code>, <code>jira</code>, or <code>api</code> tells the assessor what kind of system may exist before touching it.</p>
              <ul style="font-size: 0.95rem;">
                <li>Search engines can identify indexed subdomains with queries such as <code>site:example.com -inurl:www</code>.</li>
                <li>Netcraft provides hosting and technology intelligence.</li>
                <li>DNSdumpster maps DNS relationships and related hosts.</li>
                <li>Pentest-Tools Find Subdomains discovers subdomains, IP addresses, HTTP services, operating-system hints, and technologies.</li>
                <li>Sublist3r queries sources such as Baidu, Yahoo, Google, Bing, Ask, Netcraft, DNSdumpster, VirusTotal, and ThreatCrowd.</li>
              </ul>

              <h3 style="color: #fff;">Archive.org and Historical Data</h3>
              <p>The Internet Archive's Wayback Machine stores old versions of web pages, media, documents, and software. Historical pages may contain deprecated endpoints, old naming conventions, former vendors, removed documents, or design details. Photon can crawl a site and include Wayback data to extract URLs and archived paths during an authorized assessment.</p>

              <h3 style="color: #fff;">People Search, Job Sites, and Breach Awareness</h3>
              <p>People search services and job sites can reveal location, email formats, roles, hiring patterns, technology stacks, and vendor names. LinkedIn, Indeed, Glassdoor, Dice, Spokeo, Intelius, Pipl, Whitepages, BeenVerified, Hunter.io, Clearbit, DeHashed, Have I Been Pwned, Intelligence X, Sherlock, Social Analyzer, and Osintgram are commonly discussed in OSINT workflows.</p>
              <p>Job descriptions are especially useful for defenders because they often disclose real technologies: firewall brands, SIEM platforms, cloud providers, programming languages, EDR products, identity providers, and internal team structure. In a report, convert these observations into exposure risk and hiring-posting guidance rather than treating them as vulnerabilities by themselves.</p>

              <h2 style="color: #fff; font-size: 2rem; margin-top: 4rem;">4. Social Networking Footprinting</h2>
              <p>Social networks can expose personal information, work details, locations, relationships, photos, metadata, job history, skills, public repositories, and technical conversations. Major OSINT sources include LinkedIn, Facebook, X/Twitter, Instagram, GitHub, and Reddit.</p>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; font-size: 0.95rem;">
                <div style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: 8px;"><strong style="color: var(--accent-blue);">LinkedIn:</strong> Roles, reporting lines, departments, tools, certifications, hiring needs, and colleagues.</div>
                <div style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: 8px;"><strong style="color: var(--accent-purple);">Facebook and Instagram:</strong> Events, check-ins, photos, location tags, badges, facilities, and personal context.</div>
                <div style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: 8px;"><strong style="color: var(--accent-green);">X/Twitter and Reddit:</strong> Real-time discussions, outages, complaints, conference activity, and technical hints.</div>
                <div style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: 8px;"><strong style="color: var(--accent-red);">GitHub:</strong> Public code, usernames, email addresses in commits, internal package names, configuration examples, and accidental credential exposure.</div>
              </div>
              <p>Tools such as Sherlock, Social Analyzer, Osintgram, Twint, theHarvester, and Maltego CE help map usernames, profiles, emails, subdomains, and relationships. Defenders should use this to understand what an attacker can infer, then recommend social-media guidance, repository secret scanning, and privacy hardening.</p>

              <h2 style="color: #fff; font-size: 2rem; margin-top: 4rem;">5. Whois Footprinting</h2>
              <p>Whois records identify domain registration data: owner or privacy service, registrar, creation and expiration dates, authoritative name servers, administrative contacts, and technical contacts. Even when privacy protection hides personal details, registrar choices, dates, nameservers, and historical records can connect assets.</p>
              <p>Common services include the <code>whois</code> command, Whoxy, ViewDNS.info, DomainTools, WHOISXML API, IPinfo.io, and SecurityTrails. Historical Whois is useful because old records may predate privacy protection or infrastructure migrations.</p>
              <p>IP geolocation tools such as IPinfo.io, MaxMind GeoIP, IPGeolocation.io, and IP-API.com estimate country, region, city, ISP, organization, and coordinates. Treat geolocation as approximate unless confirmed by stronger evidence.</p>

              <h2 style="color: #fff; font-size: 2rem; margin-top: 4rem;">6. DNS Footprinting</h2>
              <p>DNS footprinting extracts records that describe how a domain resolves and where services are hosted. DNS is partly public by design, so defenders should assume attackers can see exposed records.</p>
              <table style="width: 100%; border-collapse: collapse; margin: 1.5rem 0; background: rgba(0,0,0,0.2); font-size: 0.92rem;">
                <tr style="background: rgba(255,255,255,0.05); text-align: left;"><th style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Record</th><th style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Meaning</th><th style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Recon Value</th></tr>
                <tr><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">A / AAAA</td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">IPv4 / IPv6 addresses.</td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Find hosted systems and providers.</td></tr>
                <tr><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">MX</td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Mail exchangers.</td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Identify email providers and security gateways.</td></tr>
                <tr><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">NS</td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Authoritative name servers.</td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Show DNS hosting and delegation.</td></tr>
                <tr><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">TXT</td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Text records such as SPF, DKIM, DMARC, and verification tokens.</td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Expose SaaS providers and email controls.</td></tr>
                <tr><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">SOA</td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Start of Authority.</td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Shows zone metadata and responsible DNS server.</td></tr>
                <tr><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">PTR</td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Reverse DNS.</td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Maps IPs back to names.</td></tr>
                <tr><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">SRV / CNAME</td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Service records and aliases.</td><td style="padding: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">Reveal services, identity providers, and cloud-hosted aliases.</td></tr>
              </table>
              <p>Tools include <code>dig</code>, <code>nslookup</code>, <code>host</code>, dnsrecon, dnsenum, fierce, MassDNS, dnscan, and public resolvers such as Cloudflare DNS. Reverse DNS can be performed with <code>dig -x 192.0.2.10</code> or <code>nslookup 192.0.2.10</code>. Bulk reverse lookups can be done with ReverseDNS.io, MXToolbox, and ViewDNS.info.</p>

              <h2 style="color: #fff; font-size: 2rem; margin-top: 4rem;">7. Network and Email Footprinting</h2>
              <p>Network footprinting validates routes, public services, and provider boundaries. Traceroute shows the path packets take to reach a destination and can reveal routers, hops, carrier networks, possible firewall boundaries, and latency changes. Common tools include traceroute, tracert, mtr, pathping, tcptraceroute, and Paris Traceroute.</p>
              <p>Email footprinting focuses on mail flow and authentication. Header analysis can show sending servers, relays, security gateways, and originating infrastructure. DNS records reveal SPF, DKIM, and DMARC posture. Tools such as MXToolbox, MailTester.com, Hunter.io, VoilaNorbert, Clearbit Connect, and EmailRep.io help assess mail configuration, address patterns, verification, and reputation.</p>
              <p>For defenders, the important output is not just a list of hosts. It is a map: which services are public, which provider owns each route, whether email authentication is strict, and where monitoring should alert.</p>

              <h2 style="color: #fff; font-size: 2rem; margin-top: 4rem;">8. Social Engineering Footprinting</h2>
              <p>Social engineering reconnaissance studies people, process, habits, trust relationships, and physical routines. The purpose in an ethical program is awareness, control testing, and risk reduction, not manipulation of real people outside approval.</p>
              <ul style="font-size: 0.95rem;">
                <li><strong>Eavesdropping:</strong> Learning sensitive details from public conversations in places such as cafes, airports, public transport, or shared offices.</li>
                <li><strong>Shoulder surfing:</strong> Observing passwords, PINs, badges, documents, or screens.</li>
                <li><strong>Dumpster diving:</strong> Searching discarded material for documents, storage media, notes, org charts, invoices, or printed emails.</li>
                <li><strong>Impersonation:</strong> Pretending to be IT support, a vendor, a contractor, a new employee, or an authority figure.</li>
                <li><strong>Modern vectors:</strong> Vishing, smishing, pretexting, baiting with removable media, and tailgating into restricted areas.</li>
              </ul>
              <p>Countermeasure-focused reporting should identify what information made the pretext believable, which process allowed it, and which training, verification, badge, visitor, or disposal controls should change.</p>

              <h2 style="color: #fff; font-size: 2rem; margin-top: 4rem;">9. Automation, Advanced Tools, and AI</h2>
              <p>Modern reconnaissance produces too much data for manual tracking. Automation collects, normalizes, deduplicates, tags, screenshots, resolves, and prioritizes findings so the assessor can focus on verification and risk.</p>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; font-size: 0.95rem;">
                <div style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: 8px;"><strong style="color: var(--accent-blue);">Recon-ng:</strong> Modular Python framework for domains, contacts, credentials, and API integrations such as Shodan, Censys, and VirusTotal.</div>
                <div style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: 8px;"><strong style="color: var(--accent-purple);">theHarvester:</strong> Email harvesting, subdomain enumeration, and virtual host checking across search and intelligence sources.</div>
                <div style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: 8px;"><strong style="color: var(--accent-green);">SpiderFoot:</strong> Automated OSINT platform with more than 200 modules, relationship visualization, and leak/vulnerability discovery.</div>
                <div style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: 8px;"><strong style="color: var(--accent-red);">OWASP Amass:</strong> Deep attack-surface mapping using passive DNS, active resolution, archives, certificate transparency, and APIs.</div>
                <div style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: 8px;"><strong style="color: #fff;">Maltego:</strong> Visual link analysis for domains, DNS names, IPs, netblocks, people, emails, and social relationships.</div>
                <div style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: 8px;"><strong style="color: #fff;">Specialized tooling:</strong> Subfinder, Assetfinder, Findomain, Knockpy, Altdns, MassDNS, dnsx, PureDNS, httpx, httprobe, Waybackurls, Gau, Aquatone, EyeWitness, Gowitness, Naabu, Masscan, RustScan, Wappalyzer, Webanalyze, WhatWeb, GitHound, truffleHog, GitRob, ScoutSuite, Prowler, CloudMapper, CertSpotter, DarkSearch, Ahmia, OnionScan, DeHashed, HIBP, and Intelligence X.</div>
              </div>

              <h3 style="color: #fff; margin-top: 2.5rem;">AI-Assisted Reconnaissance</h3>
              <p>AI can help create authorized search queries, summarize outputs, cluster subdomains, parse MassDNS results, identify unusual naming patterns, generate defensive reports, and turn tool output into executive summaries. It should not be used to create phishing pretexts, impersonation scripts, or instructions for unauthorized compromise.</p>
              <p>Good defensive prompts ask for categorization, validation checklists, exposure explanations, and remediation language. Example: <code>Summarize these authorized subdomain enumeration results, group assets by business function, flag likely staging systems, and draft remediation notes.</code></p>

              <h2 style="color: #fff; font-size: 2rem; margin-top: 4rem;">10. Footprinting Countermeasures</h2>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
                <div style="background: rgba(0,240,255,0.05); border: 1px solid rgba(0,240,255,0.12); padding: 1.5rem; border-radius: 8px;">
                  <h3 style="margin-top: 0; color: var(--accent-blue);">Organizational Controls</h3>
                  <ul style="font-size: 0.95rem; margin-bottom: 0;">
                    <li>Minimize public information exposure on websites, documents, and press material.</li>
                    <li>Train employees to recognize social engineering, protect personal details, and dispose of sensitive documents properly.</li>
                    <li>Restrict staging, test, and deprecated subdomains with authentication, IP controls, or removal.</li>
                    <li>Define social media policies, privacy expectations, and geotagging restrictions.</li>
                    <li>Implement SPF, DKIM, DMARC, phishing training, and email filtering.</li>
                  </ul>
                </div>
                <div style="background: rgba(176,0,255,0.05); border: 1px solid rgba(176,0,255,0.12); padding: 1.5rem; border-radius: 8px;">
                  <h3 style="margin-top: 0; color: var(--accent-purple);">Technical Controls</h3>
                  <ul style="font-size: 0.95rem; margin-bottom: 0;">
                    <li>Use Whois privacy protection and privacy-enabled registrars.</li>
                    <li>Apply DNSSEC, split-horizon DNS, and regular DNS record audits.</li>
                    <li>Hide origin infrastructure with CDN/WAF where appropriate and block unnecessary traceroute responses.</li>
                    <li>Harden web servers by removing default pages, verbose errors, directory indexing, old backups, and development files.</li>
                    <li>Audit cloud storage, IAM policies, exposed API keys, and public buckets.</li>
                    <li>Secure IoT with changed defaults, reduced services, segmented networks, and firmware updates.</li>
                    <li>Use <code>noindex</code>, careful <code>robots.txt</code>, cache removal requests, and Google Alerts for leak monitoring.</li>
                  </ul>
                </div>
              </div>

              <div class="glass-card" style="padding: 3rem; margin: 4rem 0; border-left: 4px solid var(--accent-green);">
                <h2 style="margin-top: 0; color: #fff; font-size: 2rem;">Modern Footprinting Workflow</h2>
                <h3 style="color: var(--accent-green);">Phase 1: Passive Reconnaissance</h3>
                <ol style="font-size: 0.95rem;">
                  <li><strong>Target identification:</strong> Define the main domain, brands, subsidiaries, acquisitions, and approved scope.</li>
                  <li><strong>Domain enumeration:</strong> Use Amass, Subfinder, Assetfinder, certificate transparency, Waybackurls, and Gau.</li>
                  <li><strong>Technology fingerprinting:</strong> Use Wappalyzer, httpx, Shodan, Censys, and GitHub review to identify stacks and exposed services.</li>
                  <li><strong>People and social OSINT:</strong> Review LinkedIn, theHarvester, Sherlock, Hunter.io, breach exposure services, and public repositories.</li>
                  <li><strong>Leaked data awareness:</strong> Check paste, breach, and dark-web intelligence sources where the engagement scope and law allow it.</li>
                </ol>
                <h3 style="color: var(--accent-blue);">Phase 2: Active Reconnaissance</h3>
                <ol style="font-size: 0.95rem;">
                  <li><strong>DNS enumeration:</strong> Resolve records, attempt authorized zone-transfer checks, and validate discovered names.</li>
                  <li><strong>Network mapping:</strong> Use traceroute/MTR and approved port discovery to understand public exposure.</li>
                  <li><strong>Web application mapping:</strong> Crawl authorized sites, inspect JavaScript for endpoints, and document API surfaces.</li>
                  <li><strong>Validation:</strong> Screenshot, tag, deduplicate, and correlate findings with known risks.</li>
                </ol>
                <h3 style="color: var(--accent-purple);">Phase 3: AI-Enhanced Analysis</h3>
                <ol style="font-size: 0.95rem; margin-bottom: 0;">
                  <li>Summarize tool output into findings, evidence, affected assets, and recommended fixes.</li>
                  <li>Identify high-value assets and likely attack paths for defensive prioritization.</li>
                  <li>Create clear reports for technical teams and leadership without exposing unnecessary sensitive data.</li>
                </ol>
              </div>

              <h2 style="color: #fff; font-size: 2rem;">Key Takeaways</h2>
              <ol style="font-size: 0.98rem;">
                <li>Footprinting is the foundation of ethical hacking because later testing depends on the accuracy of early information.</li>
                <li>Passive footprinting is quieter but may be incomplete or stale.</li>
                <li>Active footprinting is more accurate but creates logs and must be authorized.</li>
                <li>Modern reconnaissance relies heavily on automation and correlation across many sources.</li>
                <li>AI is useful for query generation, dataset analysis, clustering, and report writing, but must remain within ethical scope.</li>
                <li>The attack surface now includes cloud, IoT, APIs, mobile apps, public code, SaaS, identity providers, and employee social profiles.</li>
                <li>Countermeasures must be proactive: audit public information, reduce exposed assets, train staff, monitor leaks, and harden DNS, email, cloud, web, and device controls.</li>
              </ol>

            </div>

            <div style="margin-top: 5rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 2rem;">
               <a href="/education/module-1" class="btn" style="text-decoration: none; padding: 1rem 2rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff; display: flex; align-items: center; gap: 0.5rem; font-weight: bold; transition: all 0.2s;">
                 <span>&larr;</span> Previous Module
               </a>
               <div style="text-align: right;">
                 <span style="color: #888; font-size: 0.95rem; display: block; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Next Module</span>
                 <span style="color: #fff; cursor: not-allowed; opacity: 0.5; font-size: 1.1rem; font-weight: bold;">Scanning Networks &rarr;</span>
               </div>
            </div>
          </article>
        </div>
      </div>
    `
  }));
});

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
    safePosts(() => getLatestPosts(c.env.DB, 1000), [] as Post[]),
    safePosts(() => getAllTags(c.env.DB), [] as { name: string; count: number }[]),
  ]);
  
  const origin = new URL(c.req.url).origin;
  const now = new Date().toISOString();

  const staticPages = [
    { loc: '/', changefreq: 'hourly', priority: '1.0' },
    { loc: '/news', changefreq: 'hourly', priority: '0.9' },
    { loc: '/blog', changefreq: 'daily', priority: '0.8' },
    { loc: '/articles', changefreq: 'daily', priority: '0.8' },
    { loc: '/education', changefreq: 'weekly', priority: '0.8' },
    { loc: '/education/module-2', changefreq: 'weekly', priority: '0.7' },
    { loc: '/archive', changefreq: 'daily', priority: '0.7' },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n`;

  for (const page of staticPages) {
    xml += `  <url>\n    <loc>${escapeHtml(origin + page.loc)}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
  }

  for (const post of posts) {
    const pubDate = new Date(post.published_at);
    const lastmod = Number.isNaN(pubDate.getTime()) ? now : pubDate.toISOString();
    xml += `  <url>\n    <loc>${escapeHtml(origin + '/post/' + encodeURIComponent(post.slug))}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>never</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
  }

  for (const tag of tags) {
    xml += `  <url>\n    <loc>${escapeHtml(origin + '/tags/' + encodeURIComponent(tag.name))}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
  }

  xml += `</urlset>`;

  return c.body(xml, 200, {
    'content-type': 'application/xml; charset=UTF-8',
    'cache-control': 'public, max-age=3600'
  });
});

app.get('/robots.txt', (c) => {
  const origin = new URL(c.req.url).origin;
  return c.text(`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
});

export const onRequest = handle(app);
