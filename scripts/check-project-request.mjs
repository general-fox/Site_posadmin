// Offline regression checks. No server, credentials, network, or real submissions.
// Usage: node scripts/check-project-request.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const cache = new Map();
const deliveries = [];
let deliveryFails = false;
let configurationAvailable = true;

function load(relativePath) {
  const filename = path.join(root, relativePath);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const code = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const resolve = (id) => {
    if (id === "@/lib/project-request") return load("lib/project-request.ts");
    if (id === "@/lib/telegram-leads") return {
      getTelegramLeadConfig: () => configurationAvailable
        ? { token: "offline-test-token", chatId: "offline-test-chat" }
        : { token: "", chatId: "" },
      deliverTelegramLead: async (_config, message) => {
        if (deliveryFails) throw new Error("Offline delivery failure");
        deliveries.push(message);
      },
    };
    if (id === "next/server") return { NextResponse: { json: (body, init) => Response.json(body, init) } };
    if (id === "node:crypto") return require(id);
    throw new Error(`Unexpected import is blocked in offline tests: ${id}`);
  };
  new Function("require", "module", "exports", "process", "fetch", "console", code)(
    resolve, module, module.exports, { env: {} },
    async () => { throw new Error("Network is disabled in offline tests."); },
    { error() {} },
  );
  return module.exports;
}

const {
  PROJECT_TASK_MAX_LENGTH, PROJECT_CONTACT_MAX_LENGTH,
  validateProjectRequest, normalizeProjectPhone, normalizeTelegramContact, buildProjectRequestMessage,
} = load("lib/project-request.ts");
const { POST } = load("app/api/project-request/route.ts");
const validRequest = { projectStage: "new", contactMethod: "phone", contact: "+7 (999) 123-45-67", personalDataConsent: true };
let requestNumber = 0;
const post = (body) => POST(new Request("http://localhost/api/project-request", {
  method: "POST", headers: { "content-type": "application/json", "x-real-ip": `project-test-${++requestNumber}` }, body: JSON.stringify(body),
}));
const dataFrom = (body) => {
  const result = validateProjectRequest(body);
  assert.equal(result.ok, true);
  assert.equal(result.honeypot, false);
  return result.data;
};
const rejectsField = (body, field) => {
  const result = validateProjectRequest(body);
  assert.equal(result.ok, false);
  assert.equal(result.field, field);
};

test("missing and blank tasks are optional; messages distinguish unspecified tasks", () => {
  for (const body of [validRequest, { ...validRequest, task: "" }, { ...validRequest, task: " \n\t " }]) {
    const data = dataFrom(body);
    assert.equal(data.task, "");
    assert.equal(data.contact, "+79991234567");
    assert.match(buildProjectRequestMessage(data, "TEST"), /Не указана — уточнить при связи\./);
  }
  assert.equal(dataFrom({ ...validRequest, task: "  Нужна касса  " }).task, "Нужна касса");
  assert.equal(dataFrom({ ...validRequest, projectStage: "existing" }).projectStage, "existing");
});

test("task limits accept the boundary and reject oversized or non-text input", () => {
  assert.equal(dataFrom({ ...validRequest, task: "я".repeat(PROJECT_TASK_MAX_LENGTH) }).task.length, PROJECT_TASK_MAX_LENGTH);
  for (const task of [null, {}, [], 42, false, "я".repeat(PROJECT_TASK_MAX_LENGTH + 1)]) {
    rejectsField({ ...validRequest, task }, "task");
  }
});

test("phone normalization accepts supported Russian formats and rejects malformed contacts", () => {
  for (const phone of ["+7 (999) 123-45-67", "89991234567", "9991234567", " 7 999 123 45 67 "]) {
    assert.equal(normalizeProjectPhone(phone), "+79991234567");
    assert.equal(dataFrom({ ...validRequest, contact: phone }).contact, "+79991234567");
  }
  assert.equal(normalizeProjectPhone("8 (495) 123-45-67"), "+74951234567");
  for (const phone of ["", "123", "+15551234567", "899912345678", "89991234567<script>", "9".repeat(PROJECT_CONTACT_MAX_LENGTH + 1)]) {
    assert.equal(normalizeProjectPhone(phone), null);
    rejectsField({ ...validRequest, contact: phone }, "contact");
  }
  for (const contact of [null, 89991234567, {}]) rejectsField({ ...validRequest, contact }, "contact");
});

test("Telegram usernames and profile links normalize; invite links and foreign hosts fail", () => {
  for (const contact of ["test_user", "@test_user", "https://t.me/test_user", "t.me/test_user/"]) {
    assert.equal(normalizeTelegramContact(contact), "@test_user");
    assert.equal(dataFrom({ ...validRequest, contactMethod: "telegram", contact }).contact, "@test_user");
  }
  for (const contact of ["@abcd", "@1test_user", "https://example.com/test_user", "https://t.me/+invite", "https://t.me/test_user/12", "https://t.me/test_user?start=abc", "@" + "a".repeat(33)]) {
    assert.equal(normalizeTelegramContact(contact), null);
    rejectsField({ ...validRequest, contactMethod: "telegram", contact }, "contact");
  }
});

test("malformed payloads, missing stage or method, and non-explicit consent fail", () => {
  for (const body of [null, [], "request", 42]) assert.equal(validateProjectRequest(body).ok, false);
  for (const projectStage of [undefined, "", "other", 1]) rejectsField({ ...validRequest, projectStage }, "projectStage");
  for (const contactMethod of [undefined, "", "email"]) rejectsField({ ...validRequest, contactMethod }, "contactMethod");
  for (const personalDataConsent of [undefined, false, "true", 1]) rejectsField({ ...validRequest, personalDataConsent }, "personalDataConsent");
  rejectsField({ ...validRequest, website: {} }, "website");
});

test("messages escape user text and identifiers without losing the selected stage or contact", () => {
  const data = dataFrom({ ...validRequest, projectStage: "existing", contactMethod: "telegram", contact: "@test_user", task: '</b><a href="x">Касса & склад</a>' });
  const message = buildProjectRequestMessage(data, "TEST<&>");
  assert.match(message, /&lt;\/b&gt;&lt;a href="x"&gt;Касса &amp; склад&lt;\/a&gt;/);
  assert.match(message, /TEST&lt;&amp;&gt;/);
  assert.match(message, /Действующее предприятие/);
  assert.match(message, /Telegram — @test_user/);
  assert.doesNotMatch(message, /<a href=/);
});

test("the route accepts optional-task requests and confirms only stubbed successful delivery", async () => {
  const count = deliveries.length;
  const response = await post(validRequest);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.ok, true);
  assert.match(result.requestId, /^PRJ-/);
  assert.equal(deliveries.length, count + 1);
  assert.match(deliveries.at(-1), /Не указана — уточнить при связи/);
  assert.match(deliveries.at(-1), /\+79991234567/);
  assert.match(deliveries.at(-1), /Новый проект \/ открытие/);
});

test("invalid requests and honeypot requests never reach delivery", async () => {
  const count = deliveries.length;
  for (const body of [null, { ...validRequest, task: {} }, { ...validRequest, task: "x".repeat(PROJECT_TASK_MAX_LENGTH + 1) }, { ...validRequest, contact: "123" }, { ...validRequest, personalDataConsent: false }]) {
    assert.equal((await post(body)).status, 400);
  }
  const honeypot = await post({ website: "bot" });
  assert.equal(honeypot.status, 200);
  assert.equal((await honeypot.json()).ok, true);
  assert.equal(deliveries.length, count);
});

test("missing configuration and delivery failure cannot produce a false success", async () => {
  const count = deliveries.length;
  configurationAvailable = false;
  try {
    const response = await post(validRequest);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).ok, undefined);
  } finally { configurationAvailable = true; }
  deliveryFails = true;
  try {
    const response = await post(validRequest);
    assert.equal(response.status, 502);
    assert.match((await response.json()).error, /Не удалось отправить/);
  } finally { deliveryFails = false; }
  assert.equal(deliveries.length, count);
});
