// Offline regression checks: the route receives fake configuration and a local
// Telegram stub. This script cannot read credentials or deliver a real request.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const deliveries = [];
const cache = new Map();
let deliveryFails = false;
let pricingRevision = 0;
function load(relativePath) {
  const filename = path.join(root, relativePath);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const code = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const resolve = (id) => {
    if (id === "@/lib/pricing-store") return { getPricingSnapshot: () => ({ config: load("lib/pricing-config.ts").DEFAULT_PRICING, revision: pricingRevision, updatedAt: null }) };
    if (id.startsWith("@/")) return load(`${id.slice(2)}.ts`);
    if (id === "next/server") return { NextResponse: { json: (body, init) => Response.json(body, init) } };
    if (id === "node:fs") return { readFileSync() { throw new Error("Credential files are inaccessible in tests."); } };
    return require(id);
  };
  const fakeFetch = async (_url, init) => {
    if (deliveryFails) return Response.json({ description: "Test failure" }, { status: 503 });
    deliveries.push(JSON.parse(init.body));
    return Response.json({ ok: true });
  };
  new Function("require", "module", "exports", "process", "fetch", "console", code)(
    resolve, module, module.exports,
    { env: { TELEGRAM_BOT_TOKEN: "offline-test-token", TELEGRAM_ADMIN_CHAT_ID: "offline-test-chat" }, cwd: () => root },
    fakeFetch, { error() {} },
  );
  return module.exports;
}

const { getCalculationSummary } = load("lib/calculation-request.ts");
const { getCallbackSlots, getMoscowDateTime, getNextCallbackSlot, validateCallbackSchedule } = load("lib/callback-schedule.ts");
const { POST } = load("app/api/callback/route.ts");
const selection = { product: "r_keeper", workplaceCount: 3, selectedAdditionalModules: ["onsite-hardware-support"], location: "moscow" };
const validRequest = { phone: "+7 (999) 123-45-67", contactSoon: true, personalDataConsent: true, website: "" };
let requestNumber = 0;
const post = (body) => POST(new Request("http://localhost/api/callback", {
  method: "POST", headers: { "content-type": "application/json", "x-real-ip": `test-${++requestNumber}` }, body: JSON.stringify(body),
}));

test("stale price revisions require review before any delivery", async () => {
  pricingRevision = 2;
  const before = deliveries.length;
  try {
    const response = await post({ ...validRequest, calculation: selection, pricingRevision: 1 });
    assert.equal(response.status, 409);
    assert.equal((await response.json()).snapshot.revision, 2);
    assert.equal(deliveries.length, before);
  } finally { pricingRevision = 0; }
});

test("calculator selections preserve selected services, city and recompute every price", () => {
  const result = getCalculationSummary({ ...selection, monthlyTotal: 1, modules: [{ name: "<b>forged</b>", monthlyPrice: 1 }] });
  assert.equal(result.monthlyTotal, 12_000);
  assert.equal(result.locationLabel, "Москва");
  assert.deepEqual(result.modules.map((item) => item.monthlyPrice), [6_000, 6_000]);
  assert.deepEqual(result.selection, selection);
  assert.equal(getCalculationSummary({ product: "it_administration", workplaceCount: 3, selectedModules: ["system-administration"] }).monthlyTotal, 9_000);
});

test("invalid counts, duplicate/unknown modules and unavailable onsite support are rejected", () => {
  for (const count of [0, -1, 1.5, "3", 10_001, NaN, Infinity]) assert.equal(getCalculationSummary({ ...selection, workplaceCount: count }), null);
  for (const location of [undefined, "other", "unlisted-city", null]) assert.equal(getCalculationSummary({ ...selection, location }), null);
  for (const selectedAdditionalModules of [["unknown"], ["onsite-hardware-support", "onsite-hardware-support"], null, "onsite-hardware-support"]) assert.equal(getCalculationSummary({ ...selection, selectedAdditionalModules }), null);
  assert.equal(getCalculationSummary({ product: "it_administration", workplaceCount: 1, selectedModules: [] }), null);
  assert.equal(getCalculationSummary({ ...selection, selectedAdditionalModules: [], location: "other" }).monthlyTotal, 6_000);
});

test("Moscow scheduling crosses UTC dates and skips weekends and elapsed slots", () => {
  const fridayEvening = new Date("2026-09-25T15:35:00Z");
  assert.deepEqual(getNextCallbackSlot(fridayEvening), { date: "2026-09-28", time: "10:00" });
  assert.deepEqual(getMoscowDateTime(new Date("2026-09-24T21:20:00Z")), { date: "2026-09-25", time: "00:20" });
  const fridayMorning = new Date("2026-09-25T07:00:00Z");
  assert.equal(getCallbackSlots("2026-09-25", fridayMorning)[0], "10:30");
  assert.equal(getCallbackSlots("2026-09-25", fridayMorning).at(-1), "18:30");
  assert.deepEqual(getCallbackSlots("2026-09-26", fridayMorning), []);
  assert.equal(validateCallbackSchedule("2026-09-28", "10:00", fridayMorning), null);
  for (const [date, time] of [["2026-09-26", "10:00"], ["2026-09-25", "09:30"], ["2026-09-25", "19:00"], ["2026-09-25", "10:15"], ["2026-02-30", "10:00"], ["2026-09-24", "10:00"]]) assert.equal(typeof validateCallbackSchedule(date, time, fridayMorning), "string");
});

test("callback route attaches recalculated context and accepts generic callbacks", async () => {
  const response = await post({ ...validRequest, calculation: { ...selection, monthlyTotal: 1 } });
  assert.equal(response.status, 200);
  const message = deliveries.at(-1).text;
  assert.match(message, /Москва/);
  assert.match(message, /Рабочих мест:<\/b> 3/);
  assert.match(message, /12\s000 ₽\/мес\./);
  assert.match(message, /МСК/);
  assert.match(message, /\+79991234567/);
  assert.equal((await post(validRequest)).status, 200);
  assert.doesNotMatch(deliveries.at(-1).text, /<b>Расчёт:/);
  const slot = getNextCallbackSlot();
  assert.equal((await post({ ...validRequest, contactSoon: false, ...slot })).status, 200);
  assert.match(deliveries.at(-1).text, new RegExp(`${slot.time} МСК`));
});

test("malformed input and tampered selections never reach delivery", async () => {
  const count = deliveries.length;
  for (const body of [null, [], { ...validRequest, phone: "9".repeat(15_000) }, { ...validRequest, personalDataConsent: false }, { ...validRequest, calculation: null }, { ...validRequest, calculation: { ...selection, location: "other" } }, { ...validRequest, contactSoon: false, date: "2099-01-01", time: "23:00" }]) assert.equal((await post(body)).status, 400);
  assert.equal(deliveries.length, count);
});

test("delivery failure returns a retryable error rather than a false success", async () => {
  deliveryFails = true;
  const response = await post(validRequest);
  deliveryFails = false;
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /Не удалось отправить/);
});
