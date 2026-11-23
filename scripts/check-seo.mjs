// Read-only smoke check against a running development or production server.
// Usage: node scripts/check-seo.mjs http://127.0.0.1:3100
import assert from "node:assert/strict";
import http from "node:http";
import https from "node:https";

const origin = new URL(process.argv[2] ?? "http://127.0.0.1:3100");
const canonicalOrigin = "https://posadmin.ru";
const get = (path, options = {}) => fetch(new URL(path, origin), { signal: AbortSignal.timeout(60000), ...options });
// A metadata-limited crawler gets the complete metadata in the document head.
const getPage = (path) => get(path, { headers: { "user-agent": "Twitterbot" } });
const decode = (text) => text.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'");
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, decode(value)]));
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map(([tag]) => attrs(tag));
const meta = (html, key) => tags(html, "meta").find((tag) => tag.name === key || tag.property === key)?.content;

function sectionMarkup(html, id) {
  let start;
  let depth = 0;
  for (const match of html.matchAll(/<\/?section\b[^>]*>/gi)) {
    const opening = !match[0].startsWith("</");
    if (start === undefined) {
      if (!opening || attrs(match[0]).id !== id) continue;
      start = match.index;
    }
    depth += opening ? 1 : -1;
    if (depth === 0) return html.slice(start, match.index + match[0].length);
  }
  assert.fail(`homepage: missing complete #${id} section`);
}

const sitemapResponse = await get("/sitemap.xml");
assert.equal(sitemapResponse.status, 200, "sitemap status");
const xml = await sitemapResponse.text();
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => decode(url));
assert.deepEqual(urls.map((url) => new URL(url).pathname).sort(), ["/", "/contacts"], "public canonical pages");
assert.ok(urls.every((url) => !new URL(url).pathname.startsWith("/services")), "retired service catalogue excluded from sitemap");
assert.equal(new Set(urls).size, urls.length, "no duplicate sitemap URLs");
urls.forEach((url) => assert.equal(new URL(url).origin, canonicalOrigin));

const pages = await Promise.all(urls.map(async (url) => {
  const path = new URL(url).pathname;
  const response = await getPage(path);
  assert.equal(response.status, 200, `${path}: HTTP 200`);
  const html = await response.text();
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? "";
  const canonical = tags(head, "link").filter((tag) => tag.rel === "canonical");
  assert.equal(canonical.length, 1, `${path}: one canonical`);
  assert.equal(new URL(canonical[0].href).href, url, `${path}: correct canonical`);
  assert.match(html, /<html[^>]*lang="ru"/, `${path}: Russian language`);
  assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, `${path}: one SSR H1`);
  const title = head.match(/<title>(.*?)<\/title>/s)?.[1];
  assert.ok(title && title.includes("Posadmin"), `${path}: descriptive branded title`);
  const description = meta(head, "description");
  assert.ok(description && description.length >= 60, `${path}: description`);
  assert.ok(!tags(head, "meta").some((tag) => ["robots", "googlebot"].includes(tag.name) && /noindex/.test(tag.content)), `${path}: indexable`);
  assert.ok(!/noindex/.test(response.headers.get("x-robots-tag") ?? ""), `${path}: indexable headers`);
  assert.equal(new URL(meta(head, "og:url")).href, url, `${path}: OG canonical`);
  assert.equal(meta(head, "og:title"), decode(title), `${path}: OG title`);
  assert.equal(meta(head, "twitter:card"), "summary_large_image");
  assert.ok(meta(head, "og:image")?.startsWith(`${canonicalOrigin}/opengraph-image`));
  const structured = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(([, value]) => JSON.parse(value));
  const entities = structured.flatMap((value) => value["@graph"] ?? [value]);
  assert.equal(entities.filter((value) => value["@type"] === "Organization").length, 1, `${path}: one organization`);
  assert.equal(entities.filter((value) => value["@type"] === "WebSite").length, 1, `${path}: one website`);
  if (path === "/") {
    const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
    const launch = sectionMarkup(markup, "launch");
    const renderedText = (section) => decode(section.replace(/<[^>]*>/g, " "));
    const ruble = /₽|&#(?:8381|x20bd);/i;
    const progress = tags(launch, "div").find((tag) => tag.role === "progressbar");
    assert.ok(progress, "homepage: automation questionnaire has a progress indicator");
    assert.equal(progress["aria-label"], "Заполнение анкеты", "homepage: accessible automation progress label");
    assert.equal(progress["aria-valuemax"], "3", "homepage: automation questionnaire has three steps");
    assert.equal(progress["aria-valuenow"], "1", "homepage: automation questionnaire starts at step one");
    assert.equal(progress["aria-valuetext"], "Шаг 1 из 3. Заведение", "homepage: current automation step is announced");
    assert.doesNotMatch(renderedText(launch), /Соберите основу проекта|Ваш расч[её]т/, "homepage: no legacy automation estimate");
    assert.doesNotMatch(renderedText(launch), ruble, "homepage: no published automation prices");
    assert.match(renderedText(sectionMarkup(markup, "pricing")), ruble, "homepage: support calculator still shows prices");
  }
  if (path !== "/") assert.ok(entities.some((value) => value["@type"] === "BreadcrumbList"), `${path}: breadcrumbs`);
  if (path === "/contacts") {
    const offices = entities.filter((value) => value["@type"] === "LocalBusiness");
    assert.equal(offices.length, 2, "two real offices");
    for (const office of offices) {
      assert.ok(html.includes(office.address.streetAddress), "structured office address visible on page");
      assert.ok(html.includes(`id="${new URL(office.url).hash.slice(1)}"`), "office anchor exists");
    }
  }
  return { path, html, title, description };
}));
assert.equal(new Set(pages.map(({ title }) => title)).size, pages.length, "unique titles");
assert.equal(new Set(pages.map(({ description }) => description)).size, pages.length, "unique descriptions");

const pageAssets = new Map();
for (const { html } of pages) {
  const scripts = tags(html, "script").map(({ src }) => src);
  const stylesheets = tags(html, "link").filter(({ rel }) => rel === "stylesheet").map(({ href }) => href);
  for (const reference of [...scripts, ...stylesheets]) {
    if (!reference) continue;
    const asset = new URL(reference, origin);
    if (asset.origin !== origin.origin || !asset.pathname.startsWith("/_next/static/")) continue;
    pageAssets.set(asset.href, asset.pathname.endsWith(".css") ? /text\/css/i : /(?:java|ecma)script/i);
  }
}
for (const extension of [".js", ".css"]) {
  assert.ok([...pageAssets.keys()].some((url) => new URL(url).pathname.endsWith(extension)), `public pages reference generated ${extension} files`);
}
await Promise.all([...pageAssets].map(async ([url, contentType]) => {
  const response = await get(url, { method: "HEAD" });
  assert.equal(response.status, 200, `public asset is available: ${new URL(url).pathname}`);
  assert.match(response.headers.get("content-type") ?? "", contentType, `public asset content type: ${new URL(url).pathname}`);
}));

const byPath = new Map(pages.map((page) => [page.path, page]));
const incoming = new Set();
const downloads = new Set();
for (const page of pages) {
  for (const link of tags(page.html, "a")) {
    const { href } = link;
    if (!href || /^(tel:|mailto:)/.test(href)) continue;
    const target = new URL(href, new URL(page.path, canonicalOrigin));
    if (target.origin !== canonicalOrigin) continue;
    if (Object.hasOwn(link, "download")) {
      downloads.add(target.pathname + target.search);
      continue;
    }
    assert.ok(!target.pathname.startsWith("/services"), `${page.path}: no retired service links ${href}`);
    const destination = byPath.get(target.pathname);
    assert.ok(destination, `${page.path}: internal link exists ${href}`);
    incoming.add(target.pathname);
    if (target.hash) assert.ok(destination.html.includes(`id="${decodeURIComponent(target.hash.slice(1))}"`), `${page.path}: anchor exists ${href}`);
  }
}
assert.equal(incoming.size, pages.length, "all pages have crawlable incoming links");
await Promise.all([...downloads].map(async (path) => {
  const response = await get(path, { method: "HEAD" });
  assert.equal(response.status, 200, `download is available: ${path}`);
  if (new URL(path, origin).pathname.endsWith(".pdf")) {
    assert.match(response.headers.get("content-type") ?? "", /application\/pdf/i, `PDF response type: ${path}`);
  }
}));

const robots = await (await get("/robots.txt")).text();
assert.match(robots, /Allow: \//);
assert.match(robots, /Disallow: \/api\//);
assert.match(robots, /Sitemap: https:\/\/posadmin\.ru\/sitemap\.xml/);
assert.ok(!robots.includes("Disallow: /_next"), "CSS/JS crawlable");

for (const path of ["/missing-seo-check", "/services/missing-seo-check"]) {
  const response = await get(path);
  assert.equal(response.status, 404, `${path}: real 404`);
  assert.ok(tags(await response.text(), "meta").some((tag) => tag.name === "robots" && /noindex/.test(tag.content)), `${path}: noindex`);
}
const legacyDestinations = {
  "/about": "/#about",
  "/services": "/#launch",
  "/services/avtomatizaciya-restoranov": "/#launch",
  "/services/soprovozhdenie-r-keeper": "/#pricing",
  "/services/it-administrirovanie": "/#it-pricing",
  "/services/obsluzhivanie-kkt": "/#launch",
  "/services/egais-markirovka": "/#launch",
  "/services/vyezdnoe-soprovozhdenie": "/#pricing",
  "/services/integracii": "/#launch",
};
for (const [path, destination] of Object.entries(legacyDestinations)) {
  const response = await get(path, { redirect: "manual" });
  assert.equal(response.status, 308, `${path}: permanent legacy redirect`);
  assert.equal(response.headers.get("location"), destination, `${path}: relevant replacement section`);
}
const queryHtml = await (await getPage("/contacts?utm_source=seo-check")).text();
assert.equal(tags(queryHtml, "link").find((tag) => tag.rel === "canonical")?.href, `${canonicalOrigin}/contacts`, "tracking query canonical");
const redirect = await new Promise((resolve, reject) => {
  const transport = origin.protocol === "https:" ? https : http;
  const request = transport.get(new URL("/services?utm_source=seo-check", origin), { headers: { host: "www.posadmin.ru" } }, (response) => {
    response.resume();
    resolve({ status: response.statusCode, location: response.headers.location });
  });
  request.setTimeout(60000, () => request.destroy(new Error("Redirect check timed out")));
  request.on("error", reject);
});
assert.equal(redirect.status, 308, "permanent www redirect");
assert.equal(redirect.location, `${canonicalOrigin}/services?utm_source=seo-check`, "redirect preserves path/query");
const trailing = await get("/services/", { redirect: "manual" });
assert.equal(trailing.status, 308, "trailing slash normalized");
const api = await get("/api/callback");
assert.match(api.headers.get("x-robots-tag") ?? "", /noindex/, "API noindex header (read-only GET)");
const image = await get("/opengraph-image");
assert.equal(image.status, 200, "OG image generated");
assert.match(image.headers.get("content-type") ?? "", /image\/png/);
const bytes = new DataView(await image.arrayBuffer());
assert.equal(bytes.getUint32(16), 1200, "OG width");
assert.equal(bytes.getUint32(20), 630, "OG height");
assert.equal((await get("/icon.svg")).status, 200, "site icon");
console.log(`SEO checks passed: ${pages.length} pages, metadata, SSR, structured data, internal links, robots, sitemap, redirects, 404, API headers, OG image.`);
