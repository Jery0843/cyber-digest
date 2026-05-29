// =============================================================================
// CyberDigest — Shared TypeScript Types
// =============================================================================

export type PostType = 'news' | 'blog' | 'article';

export interface Post {
  id: number;
  title: string;
  slug: string;
  type: PostType;
  summary: string;
  content: string;
  published_at: string;
  event_date: string;
  confidence_score: number;
  model: string;
  source_count: number;
}

export interface PostSource {
  id: number;
  post_id: number;
  source_name: string;
  source_url: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface PostTag {
  post_id: number;
  tag_id: number;
}

export interface CyberEvent {
  id: number;
  title: string;
  description: string;
  event_date: string;
  cve_id: string | null;
  severity: number | null;
  vendor: string | null;
  source_url: string;
  source_name: string;
  raw_json: string;
  created_at: string;
}

export interface GenerationLog {
  id: number;
  run_date: string;
  status: 'success' | 'partial' | 'failure' | 'skipped';
  posts_created: number;
  error_message: string | null;
  created_at: string;
}

export interface PostWithTags extends Post {
  tags: string[];
  sources: PostSource[];
}

export interface ArchiveGroup {
  date: string;
  count: number;
}

// Cloudflare env bindings
export interface Env {
  DB: D1Database;
}
