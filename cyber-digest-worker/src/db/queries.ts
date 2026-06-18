import type { Env } from '../types';

export async function savePost(env: Env, post: any, sourceEvents: any[]) {
  const { title, type, summary, content, confidence_score, tags } = post;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + crypto.randomUUID().substring(0, 6);
  
  // Get primary event date from first source if available
  const eventDate = sourceEvents.length > 0 ? sourceEvents[0].event_date : null;
  const model = '@cf/meta/llama-4-scout-17b-16e-instruct';

  try {
    // 1. Insert post
    const insertPostSql = `
      INSERT INTO posts (title, slug, type, summary, content, event_date, confidence_score, model, source_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `;
    const stmt = env.DB.prepare(insertPostSql);
    const postResult = await stmt.bind(
      title, slug, type, summary, content, eventDate, confidence_score, model, sourceEvents.length
    ).first<{ id: number }>();
    
    const postId = postResult?.id;
    if (!postId) throw new Error('Failed to insert post');

    // 2. Insert tags and link to post
    for (const tagName of tags) {
      // Insert tag if not exists
      await env.DB.prepare(`INSERT OR IGNORE INTO tags (name) VALUES (?)`).bind(tagName).run();
      
      // Get tag id
      const tagResult = await env.DB.prepare(`SELECT id FROM tags WHERE name = ?`).bind(tagName).first<{ id: number }>();
      if (tagResult?.id) {
         await env.DB.prepare(`INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)`).bind(postId, tagResult.id).run();
      }
    }

    // 3. Insert sources
    for (const source of sourceEvents) {
      if (!source.source_name || !source.source_url) continue;
      await env.DB.prepare(`
        INSERT INTO post_sources (post_id, source_name, source_url) VALUES (?, ?, ?)
      `).bind(postId, source.source_name, source.source_url).run();
    }

    return true;
  } catch (err) {
    console.error('Error saving post to D1:', err);
    return false;
  }
}

export async function logGeneration(env: Env, status: string, postsCreated: number, errorMsg: string | null = null) {
  const runDate = new Date().toISOString().split('T')[0];
  try {
    await env.DB.prepare(`
      INSERT INTO generation_logs (run_date, status, posts_created, error_message)
      VALUES (?, ?, ?, ?)
    `).bind(runDate, status, postsCreated, errorMsg).run();
  } catch (err) {
    console.error('Failed to write generation log:', err);
  }
}

export async function getRecentSourceUrls(env: Env): Promise<Set<string>> {
  try {
    // Only look back 1 day to avoid starving the evening cron run.
    // The morning run's sources get filtered, but newly published articles
    // between 02:00-14:00 UTC will be available for the evening run.
    const results = await env.DB.prepare(`
      SELECT ps.source_url FROM post_sources ps
      JOIN posts p ON ps.post_id = p.id
      WHERE p.published_at > datetime('now', '-1 day')
    `).all<{ source_url: string }>();
    
    return new Set(results.results.map(r => r.source_url));
  } catch (err) {
    console.error('Failed to get recent source URLs:', err);
    return new Set();
  }
}
