// =============================================================================
// CyberDigest — D1 Database Query Helpers
// Uses prepare/bind/first/all pattern for Cloudflare D1 compatibility
// =============================================================================

import type { Post, PostSource, PostWithTags, ArchiveGroup, PostType } from './types';

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export async function getLatestPosts(db: D1Database, limit = 9): Promise<Post[]> {
  const stmt = db.prepare(
    'SELECT * FROM posts ORDER BY published_at DESC LIMIT ?'
  );
  const result = await stmt.bind(limit).all<Post>();
  return result.results ?? [];
}

export async function getTodaysPosts(db: D1Database): Promise<Post[]> {
  const stmt = db.prepare(
    `SELECT * FROM posts WHERE date(published_at) = date('now') ORDER BY published_at DESC`
  );
  const result = await stmt.all<Post>();
  return result.results ?? [];
}

export async function getPostsByType(db: D1Database, type: PostType, limit = 20, offset = 0): Promise<Post[]> {
  const stmt = db.prepare(
    'SELECT * FROM posts WHERE type = ? ORDER BY published_at DESC LIMIT ? OFFSET ?'
  );
  const result = await stmt.bind(type, limit, offset).all<Post>();
  return result.results ?? [];
}

export async function getPostBySlug(db: D1Database, slug: string): Promise<PostWithTags | null> {
  const post = await db.prepare('SELECT * FROM posts WHERE slug = ?').bind(slug).first<Post>();
  if (!post) return null;

  const sourcesResult = await db.prepare(
    'SELECT * FROM post_sources WHERE post_id = ?'
  ).bind(post.id).all<PostSource>();

  const tagsResult = await db.prepare(
    `SELECT t.name FROM tags t JOIN post_tags pt ON t.id = pt.tag_id WHERE pt.post_id = ?`
  ).bind(post.id).all<{ name: string }>();

  return {
    ...post,
    sources: sourcesResult.results ?? [],
    tags: (tagsResult.results ?? []).map(t => t.name),
  };
}

export async function getPostsByTag(db: D1Database, tagName: string, limit = 20): Promise<Post[]> {
  const stmt = db.prepare(
    `SELECT p.* FROM posts p 
     JOIN post_tags pt ON p.id = pt.post_id 
     JOIN tags t ON t.id = pt.tag_id 
     WHERE t.name = ? 
     ORDER BY p.published_at DESC 
     LIMIT ?`
  );
  const result = await stmt.bind(tagName, limit).all<Post>();
  return result.results ?? [];
}

export async function getPostCount(db: D1Database): Promise<number> {
  const result = await db.prepare('SELECT COUNT(*) as count FROM posts').first<{ count: number }>();
  return result?.count ?? 0;
}

export async function getPostCountByType(db: D1Database, type: PostType): Promise<number> {
  const result = await db.prepare('SELECT COUNT(*) as count FROM posts WHERE type = ?').bind(type).first<{ count: number }>();
  return result?.count ?? 0;
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export async function getAllTags(db: D1Database): Promise<{ name: string; count: number }[]> {
  const stmt = db.prepare(
    `SELECT t.name, COUNT(pt.post_id) as count 
     FROM tags t 
     JOIN post_tags pt ON t.id = pt.tag_id 
     GROUP BY t.name 
     ORDER BY count DESC`
  );
  const result = await stmt.all<{ name: string; count: number }>();
  return result.results ?? [];
}

// ---------------------------------------------------------------------------
// Archive
// ---------------------------------------------------------------------------

export async function getArchiveDates(db: D1Database): Promise<ArchiveGroup[]> {
  const stmt = db.prepare(
    `SELECT date(published_at) as date, COUNT(*) as count 
     FROM posts 
     GROUP BY date(published_at) 
     ORDER BY date DESC 
     LIMIT 90`
  );
  const result = await stmt.all<ArchiveGroup>();
  return result.results ?? [];
}

export async function getPostsByDate(db: D1Database, date: string): Promise<Post[]> {
  const stmt = db.prepare(
    `SELECT * FROM posts WHERE date(published_at) = ? ORDER BY published_at DESC`
  );
  const result = await stmt.bind(date).all<Post>();
  return result.results ?? [];
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function searchPosts(db: D1Database, query: string, limit = 20): Promise<Post[]> {
  const pattern = `%${query}%`;
  const stmt = db.prepare(
    `SELECT * FROM posts WHERE title LIKE ? OR summary LIKE ? ORDER BY published_at DESC LIMIT ?`
  );
  const result = await stmt.bind(pattern, pattern, limit).all<Post>();
  return result.results ?? [];
}
