import { defineMiddleware } from 'astro:middleware';
import { setEnv } from './lib/env';

export const onRequest = defineMiddleware(async (context, next) => {
  // In Cloudflare Pages, the env is available via the cloudflare:workers module
  // But we need to set it on globalThis so our getDB() helper can access it
  try {
    const { env } = await import('cloudflare:workers');
    if (env) {
      setEnv(env);
    }
  } catch {
    // Not running in Cloudflare runtime — graceful degradation
  }

  return next();
});
