import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';

// Build a disposable, secret-free copy. Never remove routes from the real app.
const root = process.cwd();
const stage = mkdtempSync(join(tmpdir(), 'posadmin-review-'));
const basePath = process.env.REVIEW_BASE_PATH || '/Site_posadmin';
if (!/^\/[A-Za-z0-9_-]+$/.test(basePath)) throw new Error('Invalid review base path');
const output = resolve(root, process.env.REVIEW_OUTPUT || 'output/github-pages');
if (!output.startsWith(resolve(root, 'output') + (process.platform === 'win32' ? '\\' : '/'))) throw new Error('Output must be under output/');
if (existsSync(output)) throw new Error(`Output already exists. Choose a new REVIEW_OUTPUT: ${output}`);
const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const assetRoots = readdirSync(join(root, 'public')).filter(name => !name.startsWith('.'));
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const assets = new RegExp(`(["'\x60(])\\/(${assetRoots.map(escape).join('|')})(?=[/"'\x60)?])`, 'g');
const rootFiles = ['package.json', 'package-lock.json', 'tsconfig.json', 'postcss.config.mjs', 'eslint.config.mjs'];
for (const file of new Set(files)) {
  if (!/^(app|components|lib|public)\//.test(file) && !rootFiles.includes(file) && file !== 'assets/fonts/pdf/Inter-Regular.ttf') continue;
  if (/^(app\/(api|admin)(\/|$)|components\/admin-|lib\/admin-)/.test(file)) continue;
  if (['app/robots.ts', 'app/sitemap.ts', 'lib/pricing-store.ts'].includes(file)) continue;
  if (file.split('/').some(part => part.startsWith('.env') || part === 'private-data')) throw new Error('Private file selected');
  const destination = join(stage, file);
  mkdirSync(dirname(destination), { recursive: true });
  if (/\.(tsx?|css)$/.test(file)) {
    let source = readFileSync(join(root, file), 'utf8');
    source = source.replace(assets, `$1${basePath}/$2`);
    source = source.replace('export const dynamic = "force-dynamic";', 'export const dynamic = "force-static";');
    if (file === 'app/services/[slug]/page.tsx') source += '\nexport const dynamicParams = false;\n';
    if (file === 'app/opengraph-image.tsx') source += '\nexport const dynamic = "force-static";\n';
    if (file === 'components/closing-layout.tsx') source = source.replace('url.pathname !== "/"', `url.pathname !== "${basePath}/"`);
    writeFileSync(destination, source);
  } else cpSync(join(root, file), destination);
}
writeFileSync(join(stage, 'lib/pricing-store.ts'), `import { DEFAULT_PRICING } from './pricing-config';\nexport function getPricingSnapshot() { return { config: structuredClone(DEFAULT_PRICING), revision: 0, updatedAt: null }; }\n`);
writeFileSync(join(stage, 'next.config.ts'), `import type { NextConfig } from 'next';\nconst config: NextConfig = { output: 'export', basePath: ${JSON.stringify(basePath)}, trailingSlash: true, images: { unoptimized: true } };\nexport default config;\n`);
writeFileSync(join(stage, 'public/robots.txt'), 'User-agent: *\nDisallow: /\n');
writeFileSync(join(stage, 'public/.nojekyll'), '');
symlinkSync(join(root, 'node_modules'), join(stage, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
const env = { ...process.env, NEXT_PUBLIC_REVIEW_DEMO: 'true', NEXT_TELEMETRY_DISABLED: '1' };
// No server credentials or local admin data are needed for a review build.
for (const key of Object.keys(env)) if (/^(ADMIN_|TELEGRAM_|BOT_TOKEN$|POSADMIN_DATA_DIR$|GOOGLE_SITE_VERIFICATION$|YANDEX_SITE_VERIFICATION$)/.test(key)) delete env[key];
console.log(`Building isolated review copy: ${stage}`);
const build = spawnSync(process.execPath, [join(root, 'node_modules/next/dist/bin/next'), 'build'], { cwd: stage, env, stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status || 1);
const exported = join(stage, 'out');
if (existsSync(join(exported, 'admin')) || existsSync(join(exported, 'api'))) throw new Error('Server routes in review export');
const html = readFileSync(join(exported, 'index.html'), 'utf8');
if (!html.includes('noindex') || !html.includes(`${basePath}/_next/`)) throw new Error('Missing noindex or asset prefix');
mkdirSync(dirname(output), { recursive: true });
cpSync(exported, output, { recursive: true });
console.log(`Review build ready: ${output}`);
