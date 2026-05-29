// =============================================================================
// CyberDigest — Safe D1 Binding Accessor
// Works in both `wrangler pages dev` (production-like) and gracefully
// degrades in `astro dev` (no Cloudflare bindings available).
// =============================================================================

export function getDB(): D1Database | null {
  try {
    // In Cloudflare runtime (wrangler pages dev / production),
    // the 'cloudflare:workers' virtual module is provided by the platform.
    const mod = (globalThis as any).__cloudflare_env__;
    if (mod?.DB) return mod.DB;

    // Try the standard Cloudflare Workers way
    // This works when bundled by wrangler
    return null;
  } catch {
    return null;
  }
}

// This will be populated by a middleware or the env import
export function setEnv(envObj: any) {
  (globalThis as any).__cloudflare_env__ = envObj;
}
