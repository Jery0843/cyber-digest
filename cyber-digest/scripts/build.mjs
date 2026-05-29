import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

await rm('dist', { recursive: true, force: true });
await rm('.wrangler/deploy', { recursive: true, force: true });
await mkdir('dist/styles', { recursive: true });

if (existsSync('public')) {
  await cp('public', 'dist', { recursive: true });
}

const globalCss = await readFile('src/styles/global.css', 'utf8');
const siteCss = await readFile('src/site/site.css', 'utf8');
await writeFile('dist/styles/site.css', `${globalCss}\n\n${siteCss}`);
await writeFile('dist/.assetsignore', '_worker.js\n_routes.json\n');
await writeFile('dist/_routes.json', JSON.stringify({ version: 1, include: ['/*'], exclude: ['/styles/*', '/favicon.ico', '/favicon.svg', '/favicon.png', '/icon-192.png', '/icon-512.png', '/manifest.json', '/sw.js'] }, null, 2));
