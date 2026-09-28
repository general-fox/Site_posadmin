// Pure offline checks: no environment credentials, network or application writes.
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
    throw new Error(`Unexpected dependency in pure pricing code: ${id}`);
  };
  new Function("require", "module", "exports", code)(resolve, module, module.exports);
  return module.exports;
}

const { DEFAULT_PRICING, validatePricingConfig, getSchedulePrice } = load("lib/pricing-config.ts");
const { getRkeeperModulePrice, calculateRkeeperPricing } = load("lib/rkeeper-pricing.ts");
const { getItAdministrationModulePrice, calculateItAdministrationPricing } = load("lib/it-administration-pricing.ts");
const clone = () => structuredClone(DEFAULT_PRICING);
const additionalModules = ["menu-and-dictionaries", "onsite-hardware-support"];
const allModuleIds = ["remote-technical-support", ...additionalModules];

test("default prices preserve both original formulas for all 1–10000 workplaces", () => {
  for (let count = 1; count <= 10_000; count++) {
    const previousRkeeper = count <= 6 ? 3_000 + count * 1_000 : 9_500 + (count - 6) * 500;
    const previousIt = count <= 3 ? 3_000 + count * 2_000 : count <= 6 ? 6_000 + count * 1_000 : 12_000 + (count - 6) * 500;
    for (const id of allModuleIds) assert.equal(getRkeeperModulePrice(count, DEFAULT_PRICING, id), previousRkeeper);
    assert.equal(getRkeeperModulePrice(count), previousRkeeper);
    assert.equal(getItAdministrationModulePrice(count), previousIt);
    assert.equal(calculateRkeeperPricing(count, additionalModules, "moscow").monthlyTotal, previousRkeeper * 3);
    assert.equal(calculateItAdministrationPricing(count, ["system-administration"]).monthlyTotal, previousIt);
  }
  assert.deepEqual([6, 7, 8].map((count) => getRkeeperModulePrice(count)), [9_000, 10_000, 10_500]);
  assert.deepEqual([3, 4, 6, 7].map((count) => getItAdministrationModulePrice(count)), [9_000, 10_000, 12_000, 12_500]);
});

test("all four modules use independent schedules and totals sum the selected module prices", () => {
  const pricing = clone();
  const schedules = [pricing.rkeeper.base, pricing.rkeeper.menu, pricing.rkeeper.onsite, pricing.itAdministration];
  schedules.forEach((schedule, index) => {
    schedule.firstSix = schedule.firstSix.map((amount) => amount + index * 2_000);
    schedule.fromSeven += index * 2_000;
    schedule.extraWorkplace += index * 100;
  });
  assert.equal(validatePricingConfig(pricing).ok, true);
  for (const count of [1, 3, 6, 7, 8, 10_000]) {
    const expected = schedules.map((schedule) => count <= 6 ? schedule.firstSix[count - 1] : schedule.fromSeven + (count - 7) * schedule.extraWorkplace);
    const calculation = calculateRkeeperPricing(count, additionalModules, "moscow", pricing);
    assert.deepEqual([calculation.baseModule, ...calculation.additionalModules].map((module) => module.monthlyPrice), expected.slice(0, 3));
    assert.equal(calculation.monthlyTotal, expected[0] + expected[1] + expected[2]);
    assert.equal(calculateRkeeperPricing(count, ["menu-and-dictionaries"], undefined, pricing).monthlyTotal, expected[0] + expected[1]);
    assert.equal(getItAdministrationModulePrice(count, pricing), expected[3]);
    assert.equal(calculateItAdministrationPricing(count, ["system-administration"], pricing).monthlyTotal, expected[3]);
    assert.equal(calculateItAdministrationPricing(count, [], pricing).monthlyTotal, 0);
  }
});

test("custom prices preserve selection, onsite availability and duplicate filtering", () => {
  const pricing = clone();
  pricing.rkeeper.onsite.firstSix = [20_000, 21_000, 22_000, 23_000, 24_000, 25_000];
  pricing.rkeeper.onsite.fromSeven = 26_000;
  for (const location of [undefined, "other"]) {
    const result = calculateRkeeperPricing(1, additionalModules, location, pricing);
    assert.deepEqual(result.additionalModules.map((module) => module.id), ["menu-and-dictionaries"]);
    assert.equal(result.monthlyTotal, 8_000);
  }
  const result = calculateRkeeperPricing(1, ["onsite-hardware-support", "onsite-hardware-support"], "moscow", pricing);
  assert.equal(result.additionalModules.length, 1);
  assert.equal(result.monthlyTotal, 24_000);
});

test("validator accepts exact complete config and returns a detached copy", () => {
  const input = clone();
  const result = validatePricingConfig(input);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, DEFAULT_PRICING);
  input.rkeeper.base.firstSix[0] = 1;
  result.value.rkeeper.menu.firstSix[0] = 2;
  assert.equal(result.value.rkeeper.base.firstSix[0], 4_000);
  assert.equal(DEFAULT_PRICING.rkeeper.menu.firstSix[0], 4_000);
  assert.notEqual(DEFAULT_PRICING.rkeeper.base, DEFAULT_PRICING.rkeeper.menu);
});

test("validator rejects missing or unexpected fields at every object level and malformed arrays", () => {
  for (const input of [undefined, null, [], {}, false, 5, "prices", new Date()]) assert.equal(validatePricingConfig(input).ok, false);
  const mutations = [
    (value) => { value.extra = true; },
    (value) => { delete value.itAdministration; },
    (value) => { value.rkeeper.extra = {}; },
    (value) => { delete value.rkeeper.menu; },
    (value) => { value.rkeeper.base.extra = 1; },
    (value) => { delete value.rkeeper.base.extraWorkplace; },
    (value) => { value.rkeeper.onsite = []; },
    (value) => { value.rkeeper.base.firstSix = [1, 2, 3, 4, 5]; },
    (value) => { value.rkeeper.base.firstSix.push(10_000); },
    (value) => { delete value.rkeeper.base.firstSix[0]; },
    (value) => { value.rkeeper.base.firstSix.extra = 1; },
    (value) => { value.rkeeper.base.firstSix[Symbol("extra")] = 1; },
    (value) => { value[Symbol("extra")] = 1; },
    (value) => { Object.setPrototypeOf(value.rkeeper.base, { unknown: true }); },
  ];
  for (const mutate of mutations) {
    const input = clone();
    mutate(input);
    const result = validatePricingConfig(input);
    assert.equal(result.ok, false);
    assert.equal(typeof result.error, "string");
  }
});

test("validator enforces integer money limits and nondecreasing workplace prices on every schedule", () => {
  for (const select of [(value) => value.rkeeper.base, (value) => value.rkeeper.menu, (value) => value.rkeeper.onsite, (value) => value.itAdministration]) {
    for (const invalid of [0, -1, 1.5, 1_000_001, "5000", NaN, Infinity, null]) {
      for (const field of ["firstSix", "fromSeven"]) {
        const input = clone();
        if (field === "firstSix") select(input).firstSix[0] = invalid;
        else select(input).fromSeven = invalid;
        assert.equal(validatePricingConfig(input).ok, false);
      }
    }
    for (const invalid of [-1, 1.5, 1_000_001, "500", NaN, Infinity, null]) {
      const input = clone();
      select(input).extraWorkplace = invalid;
      assert.equal(validatePricingConfig(input).ok, false);
    }
    for (let index = 1; index <= 6; index++) {
      const input = clone();
      const schedule = select(input);
      if (index < 6) schedule.firstSix[index] = schedule.firstSix[index - 1] - 1;
      else schedule.fromSeven = schedule.firstSix[5] - 1;
      assert.equal(validatePricingConfig(input).ok, false);
    }
    for (const amount of [1, 1_000_000]) {
      const input = clone();
      const schedule = select(input);
      schedule.firstSix.fill(amount);
      schedule.fromSeven = amount;
      for (const extra of [0, 1_000_000]) {
        schedule.extraWorkplace = extra;
        assert.equal(validatePricingConfig(input).ok, true);
        assert.equal(Number.isSafeInteger(getSchedulePrice(10_000, schedule)), true);
      }
    }
  }
});

test("calculation rejects invalid workplace counts before accessing a schedule", () => {
  for (const count of [0, -1, 1.5, 10_001, NaN, Infinity, "3", null, undefined]) {
    assert.throws(() => getRkeeperModulePrice(count), RangeError);
    assert.throws(() => getItAdministrationModulePrice(count), RangeError);
  }
});
