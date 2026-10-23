// Offline, pure calculator checks. No server, credentials or network access.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cache = new Map();
function load(relativePath) {
  const filename = path.join(root, relativePath);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const code = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const resolve = (id) => {
    if (id.startsWith("@/lib/")) return load(`${id.slice(2)}.ts`);
    throw new Error(`Unexpected import blocked: ${id}`);
  };
  new Function("require", "module", "exports", "process", "fetch", code)(resolve, module, module.exports, { env: {} }, () => { throw new Error("Network disabled"); });
  return module.exports;
}

const { LAUNCH_CONCEPTS } = load("lib/launch-concepts.ts");
const { PROJECT_TASK_MAX_LENGTH, validateProjectRequest } = load("lib/project-request.ts");
const {
  PROJECT_WORKS, PROJECT_REGISTER_MIN, PROJECT_REGISTER_MAX, PROJECT_ESTIMATE_NOTICE, PROJECT_ESTIMATE_EXCLUSIONS,
  getDefaultProjectSelection, calculateProjectEstimate, buildProjectEstimateBrief, formatProjectMoney, formatCashRegisters,
} = load("lib/project-estimate.ts");

test("all six concepts have distinct, valid recommended work sets and repeatable totals", () => {
  const expected = { restaurant: 67_000, cafe: 49_000, bar: 59_000, "quick-service": 67_000, delivery: 69_000, hotel: 79_000 };
  for (const concept of LAUNCH_CONCEPTS) {
    const selection = getDefaultProjectSelection(concept.id);
    const estimate = calculateProjectEstimate(selection);
    assert.equal(estimate.concept, concept);
    assert.equal(estimate.registers, 1);
    assert.equal(estimate.total, expected[concept.id]);
    assert.equal(new Set(selection.selectedWorkIds).size, selection.selectedWorkIds.length);
    assert.equal(estimate.items.reduce((sum, item) => sum + item.total, 0), estimate.total);
  }
  const mutated = getDefaultProjectSelection();
  mutated.selectedWorkIds.length = 0;
  assert.ok(getDefaultProjectSelection().selectedWorkIds.length > 0);
});

test("optional toggles change only selected work, while base items cannot disappear", () => {
  const base = { ...getDefaultProjectSelection(), selectedWorkIds: [] };
  assert.deepEqual(calculateProjectEstimate(base).items.map(({ id }) => id), ["design", "pos"]);
  assert.equal(calculateProjectEstimate(base).total, 18_000);
  for (const work of PROJECT_WORKS.filter(({ required }) => !required)) {
    const selected = { ...base, selectedWorkIds: [work.id] };
    assert.equal(calculateProjectEstimate(selected).total, 18_000 + work.price);
    assert.equal(calculateProjectEstimate({ ...selected, selectedWorkIds: [work.id, work.id] }).total, 18_000 + work.price);
    assert.equal(calculateProjectEstimate(base).items.some(({ id }) => id === work.id), false);
  }
});

test("cash-register quantities affect per-place work only, including both boundaries", () => {
  for (let registers = PROJECT_REGISTER_MIN; registers <= PROJECT_REGISTER_MAX; registers += 1) {
    const estimate = calculateProjectEstimate({ conceptId: "restaurant", registers, selectedWorkIds: PROJECT_WORKS.map(({ id }) => id) });
    for (const item of estimate.items) {
      assert.equal(item.quantity, item.unit === "register" ? registers : 1);
      assert.equal(item.total, item.quantity * item.price);
    }
    assert.equal(estimate.total, 68_000 + registers * 11_000);
  }
});

test("invalid counts, unknown concepts and unknown work cannot return misleading totals", () => {
  const valid = getDefaultProjectSelection();
  for (const registers of [0, -1, 11, 1.5, "2", NaN, Infinity, undefined]) assert.throws(() => calculateProjectEstimate({ ...valid, registers }));
  for (const selectedWorkIds of [["unknown"], null, {}, "fiscal"]) assert.throws(() => calculateProjectEstimate({ ...valid, selectedWorkIds }));
  assert.throws(() => calculateProjectEstimate({ ...valid, conceptId: "unknown" }));
  assert.throws(() => getDefaultProjectSelection("unknown"));
});

test("Russian formatters show rubles, grouped amounts, and correct register units", () => {
  assert.match(formatProjectMoney(12_000), /^12\s000\s₽$/);
  assert.match(formatProjectMoney(178_000), /^178\s000\s₽$/);
  assert.match(formatProjectMoney(0), /^0\s₽$/);
  for (const amount of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => formatProjectMoney(amount));
  assert.equal(formatCashRegisters(1), "1 кассовое место");
  assert.equal(formatCashRegisters(2), "2 кассовых места");
  assert.equal(formatCashRegisters(4), "4 кассовых места");
  assert.equal(formatCashRegisters(5), "5 кассовых мест");
  assert.equal(formatCashRegisters(10), "10 кассовых мест");
});

test("every optional combination fits the request contract with room for client notes", () => {
  const optional = PROJECT_WORKS.filter(({ required }) => !required);
  for (const concept of LAUNCH_CONCEPTS) {
    for (const registers of [1, 10]) {
      for (let mask = 0; mask < 2 ** optional.length; mask += 1) {
        const selectedWorkIds = optional.filter((_, index) => mask & (1 << index)).map(({ id }) => id);
        const estimate = calculateProjectEstimate({ conceptId: concept.id, registers, selectedWorkIds });
        const brief = buildProjectEstimateBrief(estimate);
        assert.ok(brief.includes(concept.label));
        assert.ok(brief.includes(formatCashRegisters(registers)));
        assert.ok(brief.includes(formatProjectMoney(estimate.total)));
        assert.ok(brief.includes(PROJECT_ESTIMATE_NOTICE));
        assert.ok(brief.includes(PROJECT_ESTIMATE_EXCLUSIONS));
        for (const item of estimate.items) assert.ok(brief.includes(`${item.title}: ${item.quantity} × ${formatProjectMoney(item.price)} = ${formatProjectMoney(item.total)}`));
        assert.ok(brief.length <= PROJECT_TASK_MAX_LENGTH - 500, `brief has ${brief.length} chars`);
        const result = validateProjectRequest({ projectStage: "new", task: `${brief}\n\n${"я".repeat(498)}`, contactMethod: "phone", contact: "+7 (999) 123-45-67", personalDataConsent: true });
        assert.equal(result.ok, true);
        assert.equal(result.honeypot, false);
      }
    }
  }
});
