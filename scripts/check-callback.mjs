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
const diagnosticLogs = [];
const defaultTelegramEnv = { TELEGRAM_BOT_TOKEN: "offline-test-token", TELEGRAM_ADMIN_CHAT_ID: "offline-test-chat" };
let telegramEnv = { ...defaultTelegramEnv };
let credentialFixture;
let credentialReadAttempts = 0;
let deliveryFails = false;
let pricingRevision = 0;
function load(relativePath) {
  const filename = path.join(root, relativePath);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const code = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const resolve = (id) => {
    if (id === "@/lib/pricing-store") return { getPricingSnapshot: () => ({ config: load("lib/pricing-config.ts").DEFAULT_PRICING, revision: pricingRevision, updatedAt: null }) };
    if (id.startsWith("@/")) return load(`${id.slice(2)}.ts`);
    if (id.startsWith(".") && id.endsWith(".json")) return require(path.resolve(path.dirname(filename), id));
    if (id.startsWith(".")) return load(path.relative(root, path.resolve(path.dirname(filename), `${id}.ts`)));
    if (id === "next/server") return { NextResponse: { json: (body, init) => Response.json(body, init) } };
    if (id === "node:fs") return { readFileSync() {
      credentialReadAttempts += 1;
      if (credentialFixture !== undefined) return credentialFixture;
      throw new Error("Real credential files are inaccessible in tests.");
    } };
    return require(id);
  };
  const fakeFetch = async (_url, init) => {
    if (deliveryFails === "network") throw new Error("secret-token-url-and-private-phone");
    if (deliveryFails === "invalid-json") return new Response("not json", { status: 200 });
    if (deliveryFails === "rejected") return Response.json({ ok: false, description: "private Telegram response" });
    if (deliveryFails) return Response.json({ description: "Test failure" }, { status: 503 });
    deliveries.push(JSON.parse(init.body));
    return Response.json({ ok: true });
  };
  new Function("require", "module", "exports", "process", "fetch", "console", code)(
    resolve, module, module.exports,
    { get env() { return telegramEnv; }, cwd: () => root },
    fakeFetch, { error(...values) { diagnosticLogs.push(values.join(" ")); } },
  );
  return module.exports;
}

const { getCalculationSummary } = load("lib/calculation-request.ts");
const { ONSITE_CITY_MAX_LENGTH } = load("lib/onsite-support.ts");
const { MAX_ONLINE_WORKPLACES } = load("lib/workplace-count.ts");
const { getProjectCalculation } = load("lib/project-calculation.ts");
const { getCallbackSlots, getMoscowDateTime, getNextCallbackSlot, validateCallbackSchedule } = load("lib/callback-schedule.ts");
const { POST } = load("app/api/callback/route.ts");
const { getTelegramLeadConfig } = load("lib/telegram-leads.ts");
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
  assert.deepEqual(result.modules.map((item) => item.monthlyPrice), [7_000, 5_000]);
  assert.deepEqual(result.selection, selection);
  assert.equal(getCalculationSummary({ product: "it_administration", workplaceCount: 3, selectedModules: ["system-administration"] }).monthlyTotal, 6_000);
});

test("invalid counts, duplicate/unknown modules and unavailable onsite support are rejected", () => {
  for (const count of [0, -1, 1.5, "3", MAX_ONLINE_WORKPLACES + 1, 10_001, NaN, Infinity]) assert.equal(getCalculationSummary({ ...selection, workplaceCount: count }), null);
  for (const location of [undefined, "other", "unlisted-city", null]) assert.equal(getCalculationSummary({ ...selection, location }), null);
  for (const selectedAdditionalModules of [["unknown"], ["onsite-hardware-support", "onsite-hardware-support"], null, "onsite-hardware-support"]) assert.equal(getCalculationSummary({ ...selection, selectedAdditionalModules }), null);
  assert.equal(getCalculationSummary({ product: "it_administration", workplaceCount: 1, selectedModules: [] }), null);
  assert.equal(getCalculationSummary({ ...selection, selectedAdditionalModules: [], location: "other" }).monthlyTotal, 7_000);
});

test("a custom onsite city survives normalization and reaches the manager without an online charge", async () => {
  const calculation = { ...selection, location: "other", selectedAdditionalModules: [], otherCity: "  Казань,  Республика Татарстан  " };
  const result = getCalculationSummary(calculation);
  assert.equal(result.locationLabel, "Казань, Республика Татарстан");
  assert.equal(result.selection.otherCity, result.locationLabel);
  assert.equal(result.onsiteByRequest, true);
  assert.equal(result.monthlyTotal, 7_000);
  assert.equal(result.modules.length, 1);

  const response = await post({ ...validRequest, calculation });
  assert.equal(response.status, 200);
  const message = deliveries.at(-1).text;
  assert.match(message, /Специалист:<\/b> менеджер/);
  assert.match(message, /Город \/ регион:<\/b> Казань, Республика Татарстан/);
  assert.match(message, /Итого:<\/b> 7\s000 ₽\/мес\./);
  assert.match(message, /Выездное сопровождение:<\/b> по запросу\. Стоимость уточняется отдельно и не включена в расчёт\./);
  assert.doesNotMatch(message, /• Выездное аппаратно-техническое сопровождение/);
});

test("invalid or inconsistent custom city fields cannot reach the manager", async () => {
  const calculation = { ...selection, location: "other", selectedAdditionalModules: [] };
  const before = deliveries.length;
  for (const invalid of [
    ...["", "   ", null, "Новый\nУренгой", "Владимир\u202E", "а".repeat(ONSITE_CITY_MAX_LENGTH + 1)].map((otherCity) => ({ ...calculation, otherCity })),
    { ...selection, otherCity: "Казань" },
    { ...calculation, location: undefined, otherCity: "Казань" },
    { ...calculation, selectedAdditionalModules: ["onsite-hardware-support"], otherCity: "Казань" },
    { product: "it_administration", workplaceCount: 1, selectedModules: ["system-administration"], otherCity: "Казань" },
  ]) {
    assert.equal(getCalculationSummary(invalid), null);
    assert.equal((await post({ ...validRequest, calculation: invalid })).status, 400);
  }
  assert.equal(deliveries.length, before);
  assert.equal((await post({ ...validRequest, calculation })).status, 200);
  assert.match(deliveries.at(-1).text, /Город \/ регион:<\/b> Другой город/);
});

test("free-text onsite locations reach the manager as escaped text", async () => {
  const calculation = { ...selection, location: "other", selectedAdditionalModules: [] };
  for (const [otherCity, escaped] of [["Несуществующий пункт", "Несуществующий пункт"], ["12", "12"], ["Казань <центр> & район", "Казань &lt;центр&gt; &amp; район"]]) {
    const response = await post({ ...validRequest, calculation: { ...calculation, otherCity } });
    assert.equal(response.status, 200);
    assert.ok(deliveries.at(-1).text.includes(`<b>Город / регион:</b> ${escaped}\n`));
  }
});

test("project selections preserve context, include required works and ignore forged prices", () => {
  const input = { conceptId: "restaurant", registers: 3, selectedWorkIds: ["kitchen"], total: 1, concept: { label: "<b>forged</b>" }, items: [{ title: "forged", total: 1 }] };
  const result = getProjectCalculation(input);
  assert.equal(result.estimate.total, 38_000);
  assert.equal(result.estimate.concept.label, "Ресторан");
  assert.deepEqual(result.estimate.items.map(({ id, quantity, total }) => ({ id, quantity, total })), [
    { id: "design", quantity: 1, total: 12_000 },
    { id: "pos", quantity: 3, total: 18_000 },
    { id: "kitchen", quantity: 1, total: 8_000 },
  ]);
  assert.deepEqual(result.selection, { conceptId: "restaurant", registers: 3, selectedWorkIds: ["design", "pos", "kitchen"], selectedCapabilityIds: [] });
  assert.deepEqual(result.estimate.capabilities, []);
  assert.deepEqual(input.selectedWorkIds, ["kitchen"]);
  assert.equal(getProjectCalculation({ ...input, registers: MAX_ONLINE_WORKPLACES }).estimate.registers, MAX_ONLINE_WORKPLACES);
  for (const registers of [undefined, null, 0, -1, MAX_ONLINE_WORKPLACES + 1, 1.5, "3", NaN, Infinity]) assert.equal(getProjectCalculation({ ...input, registers }), null);
  for (const selectedWorkIds of [undefined, null, "kitchen", {}, ["unknown"], ["kitchen", "kitchen"], Array(100).fill("pos")]) assert.equal(getProjectCalculation({ ...input, selectedWorkIds }), null);
  for (const conceptId of [undefined, null, "__proto__", "<b>forged</b>", {}, 1]) assert.equal(getProjectCalculation({ ...input, conceptId }), null);
});

test("callback delivers the server-recalculated project through the same manager form", async () => {
  const projectEstimate = { conceptId: "restaurant", registers: 3, selectedWorkIds: ["kitchen"], total: 1, items: [{ title: "forged", total: 1 }] };
  const response = await post({ ...validRequest, projectEstimate });
  assert.equal(response.status, 200);
  const message = deliveries.at(-1).text;
  assert.match(message, /Расчёт: запуск предприятия/);
  assert.match(message, /Формат:<\/b> Ресторан/);
  assert.match(message, /Кассовых мест:<\/b> 3/);
  assert.match(message, /Настройка кассовых мест — 3 × 6\s000 ₽ = 18\s000 ₽/);
  assert.match(message, /Итого:<\/b> 38\s000 ₽ \(разово\)/);
  assert.match(message, /Специалист:<\/b> менеджер/);
  assert.doesNotMatch(message, /forged|\/мес\./);
  assert.doesNotMatch(message, /Дополнительные возможности/);
});

test("additional capabilities survive normalization and manager delivery without changing the priced estimate", async () => {
  const projectEstimate = {
    conceptId: "restaurant", registers: 3, selectedWorkIds: ["kitchen"],
    selectedCapabilityIds: ["custom-integration", "egais", "telephony"],
    capabilities: [{ title: "<b>forged</b>", price: 1 }], total: 1,
  };
  const summary = getProjectCalculation(projectEstimate);
  assert.deepEqual(summary.selection.selectedCapabilityIds, ["egais", "telephony", "custom-integration"]);
  assert.deepEqual(summary.estimate.capabilities.map(({ title }) => title), ["ЕГАИС", "IP-телефония", "Индивидуальная интеграция"]);
  assert.deepEqual(projectEstimate.selectedCapabilityIds, ["custom-integration", "egais", "telephony"]);
  assert.equal(summary.estimate.total, 38_000);
  const before = deliveries.length;
  assert.equal((await post({ ...validRequest, projectEstimate })).status, 200);
  assert.equal(deliveries.length, before + 1);
  const message = deliveries.at(-1).text;
  assert.match(message, /Итого:<\/b> 38\s000 ₽ \(разово\)/);
  assert.match(message, /Дополнительные возможности — индивидуальный расчёт:<\/b>\n• ЕГАИС\n• IP-телефония\n• Индивидуальная интеграция/);
  assert.match(message, /Стоимость не включена в сумму расчёта\./);
  assert.doesNotMatch(message, /forged|Маркировка|Меркурий|Видеонаблюдение/);
});

test("invalid additional capabilities fail validation and cannot reach the manager", async () => {
  const projectEstimate = { conceptId: "cafe", registers: 2, selectedWorkIds: [] };
  const before = deliveries.length;
  for (const selectedCapabilityIds of [null, "egais", {}, ["unknown"], ["egais", "egais"], [1], [{ id: "egais" }], Array(100).fill("egais")]) {
    const invalid = { ...projectEstimate, selectedCapabilityIds };
    assert.equal(getProjectCalculation(invalid), null);
    assert.equal((await post({ ...validRequest, projectEstimate: invalid })).status, 400);
  }
  assert.equal(deliveries.length, before);
});

test("invalid or ambiguous project callbacks do not deliver a lead", async () => {
  const before = deliveries.length;
  const projectEstimate = { conceptId: "cafe", registers: 2, selectedWorkIds: [] };
  for (const invalid of [null, {}, [], { ...projectEstimate, registers: 0 }, { ...projectEstimate, conceptId: "unknown" }, { ...projectEstimate, selectedWorkIds: ["pos", "pos"] }]) {
    assert.equal((await post({ ...validRequest, projectEstimate: invalid })).status, 400);
  }
  assert.equal((await post({ ...validRequest, projectEstimate, calculation: selection })).status, 400);
  assert.equal(deliveries.length, before);
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
  assert.match(message, /Специалист:<\/b> менеджер/);
  assert.equal((await post(validRequest)).status, 200);
  assert.doesNotMatch(deliveries.at(-1).text, /<b>Расчёт:/);
  const slot = getNextCallbackSlot();
  assert.equal((await post({ ...validRequest, contactSoon: false, ...slot })).status, 200);
  assert.match(deliveries.at(-1).text, new RegExp(`${slot.time} МСК`));
});

test("legacy routing clearly labels both specialists without adding a topic", async () => {
  const readsBefore = credentialReadAttempts;
  for (const specialist of [undefined, "manager", "technical"]) {
    assert.equal((await post({ ...validRequest, specialist, date: "", time: "" })).status, 200);
    const delivery = deliveries.at(-1);
    assert.equal(delivery.chat_id, "offline-test-chat");
    assert.equal(Object.hasOwn(delivery, "message_thread_id"), false);
    assert.equal(delivery.parse_mode, "HTML");
    if (specialist === "technical") {
      assert.match(delivery.text, /Специалист:<\/b> технический специалист \(r_keeper\)/);
      assert.match(delivery.text, /Перезвонить по готовности специалиста/);
      assert.doesNotMatch(delivery.text, /10:00|19:00|в течение|минут/);
    } else {
      assert.match(delivery.text, /Специалист:<\/b> менеджер/);
      assert.match(delivery.text, /10:00–19:00 МСК/);
    }
  }
  assert.equal(credentialReadAttempts, readsBefore);
});

test("service-chat callbacks select only their own topic and leave project config unchanged", async () => {
  telegramEnv = { ...defaultTelegramEnv, TELEGRAM_SERVICE_CHAT_ID: "-100000000001", TELEGRAM_MANAGER_TOPIC_ID: "101", TELEGRAM_RKEEPER_TOPIC_ID: "202" };
  const readsBefore = credentialReadAttempts;
  try {
    for (const [specialist, expectedThread] of [[undefined, 101], ["manager", 101], ["technical", 202]]) {
      assert.equal((await post({ ...validRequest, specialist })).status, 200);
      assert.equal(deliveries.at(-1).chat_id, "-100000000001");
      assert.equal(deliveries.at(-1).message_thread_id, expectedThread);
    }
    assert.deepEqual(getTelegramLeadConfig(), { token: "offline-test-token", chatId: "offline-test-chat" });
    assert.equal(credentialReadAttempts, readsBefore);
    delete telegramEnv.TELEGRAM_RKEEPER_TOPIC_ID;
    assert.equal((await post({ ...validRequest, specialist: "manager" })).status, 200);
    telegramEnv.TELEGRAM_RKEEPER_TOPIC_ID = "202";
    delete telegramEnv.TELEGRAM_MANAGER_TOPIC_ID;
    assert.equal((await post({ ...validRequest, specialist: "technical" })).status, 200);
  } finally { telegramEnv = { ...defaultTelegramEnv }; }
});

test("invalid specialist values fail without sending or falling back to manager", async () => {
  const before = deliveries.length;
  for (const specialist of [null, "", "Manager", "operator", 1, true, [], {}]) {
    assert.equal((await post({ ...validRequest, specialist })).status, 400);
  }
  assert.equal(deliveries.length, before);
});

test("missing or invalid selected topics fail closed even with another topic and legacy chat", async () => {
  const before = deliveries.length;
  try {
    for (const specialist of ["manager", "technical"]) {
      for (const invalidTopic of [undefined, "", " ", "0", "-1", "1.5", "abc", "1e3", "Infinity", "9007199254740992"]) {
        telegramEnv = { ...defaultTelegramEnv, TELEGRAM_SERVICE_CHAT_ID: "-100000000001", TELEGRAM_MANAGER_TOPIC_ID: "101", TELEGRAM_RKEEPER_TOPIC_ID: "202" };
        telegramEnv[specialist === "manager" ? "TELEGRAM_MANAGER_TOPIC_ID" : "TELEGRAM_RKEEPER_TOPIC_ID"] = invalidTopic;
        assert.equal((await post({ ...validRequest, specialist })).status, 503);
      }
    }
    telegramEnv = { ...defaultTelegramEnv, TELEGRAM_SERVICE_CHAT_ID: "   ", TELEGRAM_MANAGER_TOPIC_ID: "101" };
    assert.equal((await post(validRequest)).status, 503);
    assert.equal(deliveries.length, before);
  } finally { telegramEnv = { ...defaultTelegramEnv }; }
});

test("legacy env aliases and an in-memory bot-env fixture preserve compatibility", async () => {
  try {
    telegramEnv = { BOT_TOKEN: "alias-token", ADMIN_CHAT_ID: "alias-chat", TELEGRAM_SERVICE_CHAT_ID: "" };
    assert.equal((await post({ ...validRequest, specialist: "technical" })).status, 200);
    assert.equal(deliveries.at(-1).chat_id, "alias-chat");
    telegramEnv = {};
    credentialFixture = "# Offline fixture only\nBOT_TOKEN='fixture-token'\nADMIN_CHAT_ID=fixture-chat\n";
    assert.equal((await post(validRequest)).status, 200);
    assert.equal(deliveries.at(-1).chat_id, "fixture-chat");
    telegramEnv = { TELEGRAM_SERVICE_CHAT_ID: "-100000000001", TELEGRAM_RKEEPER_TOPIC_ID: "202" };
    assert.equal((await post({ ...validRequest, specialist: "technical" })).status, 200);
    assert.equal(deliveries.at(-1).chat_id, "-100000000001");
    assert.equal(deliveries.at(-1).message_thread_id, 202);
  } finally { telegramEnv = { ...defaultTelegramEnv }; credentialFixture = undefined; }
});

test("missing credentials never produce a delivery", async () => {
  const before = deliveries.length;
  try {
    for (const missingConfig of [{}, { TELEGRAM_BOT_TOKEN: "offline-test-token" }, { TELEGRAM_ADMIN_CHAT_ID: "offline-test-chat" }, { TELEGRAM_SERVICE_CHAT_ID: "-100000000001", TELEGRAM_MANAGER_TOPIC_ID: "101" }]) {
      telegramEnv = missingConfig;
      assert.equal((await post(validRequest)).status, 503);
    }
    assert.equal(deliveries.length, before);
  } finally { telegramEnv = { ...defaultTelegramEnv }; }
});

test("malformed input and tampered selections never reach delivery", async () => {
  const count = deliveries.length;
  for (const body of [null, [], { ...validRequest, phone: "9".repeat(15_000) }, { ...validRequest, personalDataConsent: false }, { ...validRequest, calculation: null }, { ...validRequest, calculation: { ...selection, location: "other" } }, { ...validRequest, contactSoon: false, date: "2099-01-01", time: "23:00" }]) assert.equal((await post(body)).status, 400);
  assert.equal(deliveries.length, count);
});

test("delivery failure returns a retryable error rather than a false success", async () => {
  try {
    for (const failure of [true, "network", "invalid-json", "rejected"]) {
      deliveryFails = failure;
      const response = await post({ ...validRequest, specialist: "technical" });
      assert.equal(response.status, 502);
      assert.match((await response.json()).error, /Не удалось отправить/);
    }
    assert.doesNotMatch(diagnosticLogs.join("\n"), /secret-token|private|offline-test-token|79991234567/);
  } finally { deliveryFails = false; }
});
