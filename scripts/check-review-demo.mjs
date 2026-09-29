import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
const root = resolve(process.argv[2] || 'output/github-pages');
const base = process.env.REVIEW_BASE_PATH || '/Site_posadmin';
const errors = [];
let pages = 0;
function inspect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.name.startsWith('.env') || ['private-data', 'posadmin.sqlite', 'admin', 'api'].includes(entry.name)) errors.push(`Unexpected private/server file: ${path}`);
    if (entry.isDirectory()) { inspect(path); continue; }
    if (!entry.name.endsWith('.html')) continue;
    pages++;
    const html = readFileSync(path, 'utf8');
    if (!/<meta name="robots" content="[^"]*noindex/.test(html)) errors.push(`Missing noindex: ${path}`);
    for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const url = match[1].split(/[?#]/)[0];
      if (!url.startsWith('/') || url.startsWith('//')) continue;
      if (!url.startsWith(`${base}/`)) { errors.push(`Unprefixed URL: ${url}`); continue; }
      const target = join(root, decodeURIComponent(url.slice(base.length + 1)));
      if (!existsSync(target) && !existsSync(join(target, 'index.html'))) errors.push(`Missing asset/page: ${url}`);
    }
  }
}
inspect(root);
if (!existsSync(join(root, '.nojekyll'))) errors.push('Missing .nojekyll');
if (!readFileSync(join(root, 'robots.txt'), 'utf8').includes('Disallow: /')) errors.push('Missing robots restriction');
if (pages < 11) errors.push('Missing public pages');
console.log(JSON.stringify({ pages, errors: [...new Set(errors)] }, null, 2));
if (errors.length) process.exitCode = 1;
