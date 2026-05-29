export interface CyberEvent {
  id: string; // internal UUID for tracking
  title: string;
  description: string;
  cve_id: string | null;
  severity: number | null; // CVSS 0-10
  vendor: string | null;
  source_url: string;
  source_name: string;
  event_date: string; // ISO format
  is_exploited: boolean;
  raw_json: string;
}

export interface Env {
  DB: D1Database;
  AI: any; // Ai binding
}
