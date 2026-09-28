// Isolated API checks: temporary test database, no credentials or external messages.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, test } from "node:test";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const testDirectory = mkdtempSync(path.join(tmpdir(), "posadmin-pricing-test-"));
const isolatedGlobal = {};
const modules = new Map();
const pdfs = [];
const messages = [];
let snapshot;
function load(relativePath) {
  const filename = path.join(root, relativePath);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const code = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const resolve = (id) => {
    if (id === "server-only") return {};
    if (id === "@/lib/pricing-store") return { getPricingSnapshot: () => structuredClone(snapshot) };
    if (id === "@/lib/rkeeper-pdf") return {
      createRkeeperPdf: async ({ calculation }) => { pdfs.push(calculation); return Buffer.from("%PDF-test"); },
      createItAdministrationPdf: async ({ calculation }) => { pdfs.push(calculation); return Buffer.from("%PDF-test"); },
    };
    if (id === "next/server") return { NextResponse: { json: (body, init) => Response.json(body, init) } };
    if (id === "node:fs") return { ...require(id), readFileSync() { throw new Error("Credential files are inaccessible in integration tests."); } };
    if (id.startsWith("@/")) return load(`${id.slice(2)}.ts`);
    if (id.startsWith(".")) return load(path.relative(root, path.resolve(path.dirname(filename), `${id}.ts`)));
    return require(id);
  };
  new Function("require", "module", "exports", "process", "globalThis", "fetch", code)(
    resolve, module, module.exports,
    { env: { NODE_ENV: "development", POSADMIN_DATA_DIR: testDirectory, TELEGRAM_BOT_TOKEN: "offline-test-token", TELEGRAM_ADMIN_CHAT_ID: "offline-test-chat" }, cwd: () => root, platform: process.platform },
    isolatedGlobal,
    async (url, init) => {
      assert.equal(url, "https://api.telegram.org/botoffline-test-token/sendMessage");
      messages.push(JSON.parse(init.body));
      return Response.json({ ok: true });
    },
  );
  return module.exports;
}
after(() => {
  isolatedGlobal.posadminDatabase?.connection.close();
  const cleanupTarget = path.resolve(testDirectory);
  const tempRoot = path.resolve(tmpdir());
  if (!cleanupTarget.startsWith(`${tempRoot}${path.sep}`) || !path.basename(cleanupTarget).startsWith("posadmin-pricing-test-")) {
    throw new Error("Refusing to remove an unexpected test directory.");
  }
  rmSync(cleanupTarget, { recursive: true, force: true });
});
const { DEFAULT_PRICING, validatePricingConfig } = load("lib/pricing-config.ts");
snapshot = { config: structuredClone(DEFAULT_PRICING), revision: 3, updatedAt: "2026-09-25T12:00:00.000Z" };
snapshot.config.rkeeper.base.firstSix[0] = 4500;
snapshot.config.rkeeper.menu.firstSix[0] = 4200;
snapshot.config.rkeeper.onsite.firstSix[0] = 4300;
snapshot.config.itAdministration.firstSix[0] = 6000;
const rk = load("app/api/calculators/rkeeper/pdf/route.ts");
const it = load("app/api/calculators/it-administration/pdf/route.ts");
const publicPricing = load("app/api/pricing/route.ts");
const { getCalculationSummary } = load("lib/calculation-request.ts");
const { getServiceBySlug } = load("lib/services.ts");
const { calculateRkeeperPricing } = load("lib/rkeeper-pricing.ts");
const { calculateItAdministrationPricing } = load("lib/it-administration-pricing.ts");
const callback = load("app/api/callback/route.ts");
let serial = 0;
const request = (body) => new Request("http://localhost/api/test", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `isolated-${++serial}` }, body: JSON.stringify(body) });
const selection = { product: "r_keeper", workplaceCount: 1, selectedAdditionalModules: ["menu-and-dictionaries", "onsite-hardware-support"], location: "moscow", pricingRevision: 3 };

test("public pricing exposes only the current price snapshot", async () => {
  const response = await publicPricing.GET();
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), snapshot);
});
test("r_keeper PDF and callback summary use all three independent current prices", async () => {
  const response = await rk.POST(request({ ...selection, monthlyTotal: 1 }));
  assert.equal(response.status, 200);
  const pdf = pdfs.at(-1);
  assert.equal(pdf.monthlyTotal, 13_000);
  assert.equal(pdf.baseModule.monthlyPrice, 4500);
  assert.deepEqual(pdf.additionalModules.map((item) => item.monthlyPrice), [4200, 4300]);
  assert.equal(getCalculationSummary(selection, snapshot.config).monthlyTotal, pdf.monthlyTotal);
});
test("IT PDF uses the same current configuration", async () => {
  assert.equal((await it.POST(request({ product: "it_administration", workplaceCount: 1, selectedModules: ["system-administration"], pricingRevision: 3 }))).status, 200);
  assert.equal(pdfs.at(-1).monthlyTotal, 6000);
});
test("stale and missing revisions cannot silently download a different price", async () => {
  for (const revision of [0, 2, undefined, "3"]) {
    const before = pdfs.length;
    const response = await rk.POST(request({ ...selection, pricingRevision: revision }));
    assert.equal(response.status, 409);
    assert.equal((await response.json()).snapshot.revision, 3);
    assert.equal(pdfs.length, before);
  }
});
test("service page starting prices follow base, onsite and IT separately", () => {
  assert.match(getServiceBySlug("soprovozhdenie-r-keeper", snapshot.config).pricing.text, /4\s500/);
  assert.match(getServiceBySlug("vyezdnoe-soprovozhdenie", snapshot.config).pricing.text, /4\s300/);
  assert.match(getServiceBySlug("it-administrirovanie", snapshot.config).pricing.text, /6\s000/);
});

const formulaConfig = {
  rkeeper: {
    base: { formula: "=5000 + N*1250" },
    menu: { formula: "=1500 + N*250" },
    onsite: { formula: "=2000 + N*400" },
  },
  itAdministration: { formula: "=6000 + N*750" },
};

test("custom formulas stay consistent across both calculators, summaries, PDF endpoints and service prices", async () => {
  const original = snapshot;
  const validated = validatePricingConfig(formulaConfig);
  assert.equal(validated.ok, true, validated.error);
  snapshot = { config: validated.value, revision: 4, updatedAt: "2026-09-25T13:00:00.000Z" };
  try {
    assert.deepEqual(await (await publicPricing.GET()).json(), snapshot);
    for (const count of [1, 2, 6, 7, 8, 100, 10_000]) {
      const expected = [5000 + count * 1250, 1500 + count * 250, 2000 + count * 400];
      const rkSelection = { ...selection, workplaceCount: count, pricingRevision: 4, monthlyTotal: 1 };
      const calculated = calculateRkeeperPricing(count, selection.selectedAdditionalModules, "moscow", snapshot.config);
      assert.deepEqual([calculated.baseModule, ...calculated.additionalModules].map((item) => item.monthlyPrice), expected);
      assert.equal(calculated.monthlyTotal, expected.reduce((sum, value) => sum + value, 0));
      const summary = getCalculationSummary(rkSelection, snapshot.config);
      assert.equal(summary.monthlyTotal, calculated.monthlyTotal);
      assert.equal((await rk.POST(request(rkSelection))).status, 200);
      assert.equal(pdfs.at(-1).monthlyTotal, calculated.monthlyTotal);
      assert.deepEqual([pdfs.at(-1).baseModule, ...pdfs.at(-1).additionalModules].map((item) => item.monthlyPrice), expected);

      const itSelection = { product: "it_administration", workplaceCount: count, selectedModules: ["system-administration"], pricingRevision: 4, monthlyTotal: 1 };
      const itCalculation = calculateItAdministrationPricing(count, ["system-administration"], snapshot.config);
      assert.equal(itCalculation.monthlyTotal, 6000 + count * 750);
      assert.equal(getCalculationSummary(itSelection, snapshot.config).monthlyTotal, itCalculation.monthlyTotal);
      assert.equal((await it.POST(request(itSelection))).status, 200);
      assert.equal(pdfs.at(-1).monthlyTotal, itCalculation.monthlyTotal);
    }
    assert.match(getServiceBySlug("soprovozhdenie-r-keeper", snapshot.config).pricing.text, /6\s250/);
    assert.match(getServiceBySlug("vyezdnoe-soprovozhdenie", snapshot.config).pricing.text, /2\s400/);
    assert.match(getServiceBySlug("it-administrirovanie", snapshot.config).pricing.text, /6\s750/);
  } finally { snapshot = original; }
});

test("callback endpoint recomputes formula prices and rejects stale formula revisions before sending", async () => {
  const original = snapshot;
  const validated = validatePricingConfig(formulaConfig);
  assert.equal(validated.ok, true, validated.error);
  snapshot = { config: validated.value, revision: 4, updatedAt: "2026-09-25T13:00:00.000Z" };
  try {
    for (const calculation of [
      { ...selection, workplaceCount: 8, monthlyTotal: 1, formula: "=1" },
      { product: "it_administration", workplaceCount: 8, selectedModules: ["system-administration"], monthlyTotal: 1 },
    ]) {
      const before = messages.length;
      const body = { phone: "+7 (999) 123-45-67", personalDataConsent: true, contactSoon: true, calculation, pricingRevision: 4 };
      const response = await callback.POST(request(body));
      assert.equal(response.status, 200);
      assert.equal(messages.length, before + 1);
      const text = messages.at(-1).text;
      assert.match(text, /Рабочих мест:<\/b> 8/);
      assert.match(text, calculation.product === "r_keeper" ? /Итого:<\/b> 23\s700 ₽/ : /Итого:<\/b> 12\s000 ₽/);
      const stale = await callback.POST(request({ ...body, pricingRevision: 3 }));
      assert.equal(stale.status, 409);
      assert.equal(messages.length, before + 1);
    }
  } finally { snapshot = original; }
});

test("actual config validator rejects unsafe formulas and invalid output anywhere in supported counts", () => {
  for (const formula of [
    "=globalThis.process.exit()", "=N;1", "=1/0", "=N/3", "=0", "=-N", "=100000-N", "=1e100*N", "=IF(N=9999;0;N)",
  ]) {
    const candidate = structuredClone(formulaConfig);
    candidate.rkeeper.base.formula = formula;
    assert.equal(validatePricingConfig(candidate).ok, false, `Unexpectedly accepted: ${formula}`);
  }
  const mixedShape = structuredClone(formulaConfig);
  mixedShape.rkeeper.base = { ...DEFAULT_PRICING.rkeeper.base, formula: "=N*1000" };
  assert.equal(validatePricingConfig(mixedShape).ok, false);
});

test("legacy database prices and history remain readable across formula saves and restoration", () => {
  const store = load("lib/pricing-store.ts");
  const legacy = structuredClone(DEFAULT_PRICING);
  legacy.rkeeper.base.firstSix[0] = 4500;
  const first = store.savePricing(legacy, 0, "offline-test-owner");
  assert.equal(first.revision, 1);
  assert.deepEqual(store.getPricingSnapshot().config, legacy);
  const formula = store.savePricing(formulaConfig, 1, "offline-test-owner");
  assert.equal(formula.revision, 2);
  assert.deepEqual(store.getPricingSnapshot().config, validatePricingConfig(formulaConfig).value);
  const history = store.getPricingHistory();
  assert.deepEqual(history.find((entry) => entry.revision === 1).config, legacy);
  assert.deepEqual(history.find((entry) => entry.revision === 0).config, DEFAULT_PRICING);
  assert.deepEqual(history.find((entry) => entry.revision === 2).config, validatePricingConfig(formulaConfig).value);
  store.savePricing(history.find((entry) => entry.revision === 1).config, 2, "offline-test-owner");
  assert.equal(store.getPricingSnapshot().revision, 3);
  assert.deepEqual(store.getPricingSnapshot().config, legacy);
});
