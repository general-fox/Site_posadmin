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
  getProjectScope, PROJECT_SCOPE_WORKS, PROJECT_EQUIPMENT, getProjectEquipment,
  getDefaultProjectSelection: getDefaultQuestionnaireSelection,
} = load("lib/project-scope.ts");
const {
  PROJECT_WORKS, PROJECT_REGISTER_MIN, PROJECT_REGISTER_MAX, PROJECT_ESTIMATE_NOTICE, PROJECT_ESTIMATE_EXCLUSIONS,
  PROJECT_CAPABILITIES, PROJECT_CAPABILITIES_NOTICE,
  getDefaultProjectSelection, calculateProjectEstimate, buildProjectEstimateBrief, formatProjectMoney, formatCashRegisters,
} = load("lib/project-estimate.ts");

test("legacy estimates retain their original base work and repeatable totals for every concept", () => {
  const baseIds = ["design", "pos"];
  for (const concept of LAUNCH_CONCEPTS) {
    const selection = getDefaultProjectSelection(concept.id);
    const estimate = calculateProjectEstimate(selection);
    assert.equal(estimate.concept, concept);
    assert.equal(estimate.registers, 1);
    assert.deepEqual(estimate.equipment.map(({ quantity }) => quantity), [1, 0, 0, 1, 0]);
    assert.deepEqual(selection.selectedWorkIds, baseIds);
    assert.deepEqual(selection.selectedCapabilityIds, []);
    assert.deepEqual(estimate.capabilities, []);
    assert.deepEqual(estimate.items.map(({ id }) => id), baseIds);
    assert.ok(estimate.items.every(({ required }) => required));
    assert.equal(estimate.total, 18_000);
    assert.deepEqual(calculateProjectEstimate(getDefaultProjectSelection(concept.id)), estimate);
    assert.equal(estimate.items.reduce((sum, item) => sum + item.total, 0), estimate.total);
    selection.selectedWorkIds.push("kitchen");
    assert.deepEqual(getDefaultProjectSelection(concept.id).selectedWorkIds, baseIds);
  }
  const mutated = getDefaultProjectSelection();
  mutated.selectedWorkIds.length = 0;
  assert.deepEqual(getDefaultProjectSelection().selectedWorkIds, baseIds);
});

test("the questionnaire defaults to no work and keeps each of the six services independently optional", () => {
  assert.deepEqual(PROJECT_SCOPE_WORKS.map(({ id }) => id), ["rkeeper", "equipment", "dictionaries", "training", "network", "fiscal"]);
  assert.deepEqual(PROJECT_SCOPE_WORKS.map(({ title }) => title), [
    "r_keeper", "Оборудование", "Первоначальное заполнение словарей", "Обучение сотрудников", "Локальная сеть", "ККТ",
  ]);
  assert.ok(PROJECT_SCOPE_WORKS.every(({ required }) => required === false));
  assert.equal(new Set(PROJECT_SCOPE_WORKS.map(({ title }) => title)).size, 6);
  for (const { id } of LAUNCH_CONCEPTS) {
    const selection = getDefaultQuestionnaireSelection(id);
    assert.deepEqual(selection.selectedWorkIds, []);
    assert.deepEqual(getProjectScope(selection).works, []);
    selection.selectedWorkIds.push("rkeeper");
    assert.deepEqual(getDefaultQuestionnaireSelection(id).selectedWorkIds, []);
  }
  for (let mask = 0; mask < 2 ** PROJECT_SCOPE_WORKS.length; mask += 1) {
    const expected = PROJECT_SCOPE_WORKS.filter((_, index) => mask & (1 << index));
    const selectedWorkIds = expected.map(({ id }) => id).reverse();
    const selection = { ...getDefaultQuestionnaireSelection(), selectedWorkIds };
    const scope = getProjectScope(selection);
    assert.deepEqual(scope.works, expected, `subset ${mask}`);
    assert.deepEqual(scope.selection.selectedWorkIds, expected.map(({ id }) => id));
    assert.deepEqual(selection.selectedWorkIds, selectedWorkIds, "normalization cannot mutate the caller");
    assert.doesNotMatch(JSON.stringify(scope), /"(?:price|total)":/);
  }
});

test("the questionnaire returns only the chosen services in catalogue order without estimate values", () => {
  const input = {
    conceptId: "cafe",
    registers: 4,
    selectedWorkIds: ["training", "equipment"],
    selectedCapabilityIds: [],
    total: 1,
  };
  const scope = getProjectScope(input);
  assert.deepEqual(scope.selection, {
    conceptId: "cafe",
    registers: 4,
    waiterStations: 0,
    receiptPrinters: 0,
    labelPrinters: 0,
    kitchenScreens: 0,
    selectedWorkIds: ["equipment", "training"],
    selectedCapabilityIds: [],
  });
  assert.deepEqual(scope.works.map(({ id }) => id), scope.selection.selectedWorkIds);
  assert.deepEqual(scope.capabilities.map(({ id }) => id), scope.selection.selectedCapabilityIds);
  assert.doesNotMatch(JSON.stringify(scope), /"(?:price|total)":/);
  for (const selectedWorkIds of [undefined, null, "rkeeper", {}, ["rkeeper", "rkeeper"], ["unknown"], [1], ["__proto__"], Array(20).fill("equipment")]) {
    assert.equal(getProjectScope({ ...input, selectedWorkIds }), null);
  }
  for (const obsoleteId of ["design", "pos", "kitchen", "stock", "integration", "handover"]) {
    assert.equal(getProjectScope({ ...input, selectedWorkIds: [obsoleteId] }), null, `${obsoleteId} is not reinterpreted`);
  }
  for (const selectedCapabilityIds of [null, {}, "egais", ["unknown"], ["egais", "egais"], [1], [{ id: "egais" }], Array(100).fill("egais")]) {
    assert.equal(getProjectScope({ ...input, selectedCapabilityIds }), null, "only distinct known capabilities are accepted");
  }
  assert.deepEqual(getProjectScope({ ...input, selectedCapabilityIds: undefined }).selection.selectedCapabilityIds, []);
});

test("all additional capability subsets coexist with the six questionnaire services without resetting equipment", () => {
  const base = {
    ...getDefaultQuestionnaireSelection(),
    registers: 4, waiterStations: 3, receiptPrinters: 2, labelPrinters: 1, kitchenScreens: 0,
    selectedWorkIds: PROJECT_SCOPE_WORKS.map(({ id }) => id),
  };
  const original = getProjectScope(base);
  assert.deepEqual(original.capabilities, []);
  assert.deepEqual(getProjectScope({ ...base, selectedCapabilityIds: undefined }), original);
  for (let mask = 0; mask < 2 ** PROJECT_CAPABILITIES.length; mask += 1) {
    const expected = PROJECT_CAPABILITIES.filter((_, index) => mask & (1 << index));
    const selectedCapabilityIds = expected.map(({ id }) => id).reverse();
    const selection = { ...base, selectedCapabilityIds };
    const scope = getProjectScope(selection);
    assert.deepEqual(scope.capabilities, expected, `capability subset ${mask}`);
    assert.deepEqual(scope.selection.selectedCapabilityIds, expected.map(({ id }) => id));
    assert.deepEqual(scope.works, original.works);
    assert.deepEqual(scope.selection.selectedWorkIds, original.selection.selectedWorkIds);
    assert.deepEqual(scope.equipment, original.equipment);
    assert.deepEqual(selection.selectedCapabilityIds, selectedCapabilityIds, "normalization cannot mutate the caller");
    assert.doesNotMatch(JSON.stringify(scope), /"(?:price|total)":/);
    assert.deepEqual(getProjectScope({ ...scope.selection, selectedCapabilityIds: [] }), original, "removing extras preserves services and equipment");
  }
});

test("equipment quantities preserve all five independent fields, including zero and each maximum", () => {
  assert.deepEqual(PROJECT_EQUIPMENT.map(({ id, min, max }) => [id, min, max]), [
    ["registers", 0, 20], ["waiterStations", 0, 20], ["receiptPrinters", 0, 20],
    ["labelPrinters", 0, 10], ["kitchenScreens", 0, 20],
  ]);
  const base = getDefaultQuestionnaireSelection();
  for (const item of PROJECT_EQUIPMENT) {
    for (const quantity of [item.min, item.max]) {
      const selection = { ...base, [item.id]: quantity };
      const scope = getProjectScope(selection);
      assert.equal(scope.selection[item.id], quantity);
      assert.equal(scope.equipment.find(({ id }) => id === item.id).quantity, quantity);
      assert.equal(calculateProjectEstimate({ ...getDefaultProjectSelection(), [item.id]: quantity }).equipment.find(({ id }) => id === item.id).quantity, quantity);
    }
  }
  const zero = { ...base, ...Object.fromEntries(PROJECT_EQUIPMENT.map(({ id }) => [id, 0])) };
  assert.deepEqual(getProjectScope(zero).equipment.map(({ quantity }) => quantity), [0, 0, 0, 0, 0]);
  const maxima = { ...base, ...Object.fromEntries(PROJECT_EQUIPMENT.map(({ id, max }) => [id, max])) };
  assert.deepEqual(getProjectScope(maxima).equipment.map(({ quantity }) => quantity), [20, 20, 20, 10, 20]);
  assert.equal(calculateProjectEstimate({ ...maxima, selectedWorkIds: ["design", "pos"] }).total, 12_000 + 20 * 6_000, "new equipment must not invent legacy prices");
  assert.equal(getProjectEquipment(null), null);
  assert.equal(getProjectEquipment([]), null);
});

test("invalid equipment quantities never normalize to a misleading valid request", () => {
  const base = getDefaultQuestionnaireSelection();
  for (const item of PROJECT_EQUIPMENT) {
    for (const quantity of [-1, item.max + 1, 1.5, "2", null, false, {}, [], NaN, Infinity]) {
      const selection = { ...base, [item.id]: quantity };
      assert.equal(getProjectScope(selection), null, `${item.id} rejects ${String(quantity)}`);
      assert.throws(() => calculateProjectEstimate({ ...getDefaultProjectSelection(), [item.id]: quantity }));
    }
  }
  assert.equal(getProjectScope({ ...base, registers: undefined }), null);
  const legacy = { conceptId: "restaurant", registers: 2, selectedWorkIds: [] };
  assert.deepEqual(getProjectScope(legacy).equipment.map(({ quantity }) => quantity), [2, 0, 0, 0, 0]);
  assert.deepEqual(getProjectScope({ ...legacy, labelPrinters: undefined }).equipment.map(({ quantity }) => quantity), [2, 0, 0, 0, 0]);
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
  for (const registers of [-1, 21, 1.5, "2", NaN, Infinity, undefined]) assert.throws(() => calculateProjectEstimate({ ...valid, registers }));
  for (const selectedWorkIds of [["unknown"], null, {}, "fiscal"]) assert.throws(() => calculateProjectEstimate({ ...valid, selectedWorkIds }));
  assert.throws(() => calculateProjectEstimate({ ...valid, conceptId: "unknown" }));
  assert.throws(() => getDefaultProjectSelection("unknown"));
});

test("additional capabilities are optional requests for a separate quote, never priced work", () => {
  const base = getDefaultProjectSelection();
  for (let mask = 0; mask < 2 ** PROJECT_CAPABILITIES.length; mask += 1) {
    const expected = PROJECT_CAPABILITIES.filter((_, index) => mask & (1 << index));
    // Selection order must not change the catalogue order shown to the manager.
    const selectedCapabilityIds = expected.map(({ id }) => id).reverse();
    const estimate = calculateProjectEstimate({ ...base, selectedCapabilityIds });
    assert.equal(estimate.total, 18_000);
    assert.deepEqual(estimate.items.map(({ id }) => id), ["design", "pos"]);
    assert.deepEqual(estimate.capabilities, expected);
    const brief = buildProjectEstimateBrief(estimate);
    if (expected.length) {
      assert.ok(brief.includes(PROJECT_CAPABILITIES_NOTICE));
      for (const { title } of expected) assert.ok(brief.includes(title));
    } else assert.ok(!brief.includes("Дополнительные возможности:"));
  }
  assert.deepEqual(calculateProjectEstimate({ conceptId: "cafe", registers: 1, selectedWorkIds: [] }).capabilities, []);
  base.selectedCapabilityIds.push("egais");
  assert.deepEqual(getDefaultProjectSelection().selectedCapabilityIds, []);
  const full = calculateProjectEstimate({ ...base, registers: 20, selectedWorkIds: PROJECT_WORKS.map(({ id }) => id), selectedCapabilityIds: PROJECT_CAPABILITIES.map(({ id }) => id) });
  assert.ok(buildProjectEstimateBrief(full).length <= PROJECT_TASK_MAX_LENGTH);
});

test("unknown, duplicate and malformed additional capability selections are rejected", () => {
  const base = getDefaultProjectSelection();
  for (const selectedCapabilityIds of [null, "egais", {}, ["unknown"], ["egais", "egais"], [1], [{ id: "egais" }], Array(100).fill("egais")]) {
    assert.throws(() => calculateProjectEstimate({ ...base, selectedCapabilityIds }));
  }
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
  assert.equal(formatCashRegisters(0), "0 кассовых мест");
  assert.equal(formatCashRegisters(20), "20 кассовых мест");
});

test("every optional combination fits the request contract with room for client notes", () => {
  const optional = PROJECT_WORKS.filter(({ required }) => !required);
  for (const concept of LAUNCH_CONCEPTS) {
    for (const registers of [0, 1, 20]) {
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
