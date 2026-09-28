// Offline formula language checks: the text under test never reaches JavaScript evaluation.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modules = new Map();
function load(relativePath) {
  const filename = path.join(root, relativePath);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const code = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const resolve = (id) => {
    if (id.startsWith("@/lib/")) return load(`${id.slice(2)}.ts`);
    throw new Error(`Unexpected dependency in pure formula code: ${id}`);
  };
  // This evaluates our checked-in TypeScript module, never a user-supplied formula.
  new Function("require", "module", "exports", code)(resolve, module, module.exports);
  return module.exports;
}

const { compilePricingFormula: compile, evaluatePricingFormula: evaluate, getFormulaIssue: issue, PricingFormulaError, MAX_PRICING_FORMULA_PRICE } = load("lib/pricing-formula.ts");
const { DEFAULT_PRICING, getSchedulePrice, scheduleToFormula, validatePricingConfig } = load("lib/pricing-config.ts");
const { calculateRkeeperPricing } = load("lib/rkeeper-pricing.ts");
const rkeeperSource = "=IF(D$4=1,4000,IF(D$4=2,5000,IF(D$4=3,6000,IF(D$4=4,7000,IF(D$4=5,8000,IF(D$4=6,9000,IF(D$4>=7,9500+(D$4-6)*500,0)))))))";
const itSource = "=IF(D$4=1,5000,IF(D$4=2,7000,IF(D$4=3,9000,IF(D$4=4,10000,IF(D$4=5,11000,IF(D$4=6,12000,IF(D$4>=7,12000+(D$4-6)*500,0)))))))";
// Independent cached values from the supplied workbook, columns D:S / rows 5:8.
const rkeeperGolden = [4000, 5000, 6000, 7000, 8000, 9000, 10000, 10500, 11000, 11500, 12000, 12500, 13000, 13500, 14000, 14500];
const itGolden = [5000, 7000, 9000, 10000, 11000, 12000, 12500, 13000, 13500, 14000, 14500, 15000, 15500, 16000, 16500, 17000];

test("original workbook formulas reproduce all 64 cached prices and full supported count range", () => {
  assert.equal(issue(rkeeperSource), null);
  assert.equal(issue(itSource), null);
  for (const [formula, golden] of [[rkeeperSource, rkeeperGolden], [rkeeperSource, rkeeperGolden], [rkeeperSource, rkeeperGolden], [itSource, itGolden]]) {
    assert.deepEqual(golden.map((_, index) => evaluate(formula, index + 1)), golden);
  }
  for (let count = 1; count <= 10_000; count++) {
    assert.equal(evaluate(rkeeperSource, count), count <= 6 ? 3000 + count * 1000 : 9500 + (count - 6) * 500);
    assert.equal(evaluate(itSource, count), count <= 3 ? 3000 + count * 2000 : count <= 6 ? 6000 + count * 1000 : 12000 + (count - 6) * 500);
  }
});

test("legacy conversion preserves every supported price and uses the workbook's branch structure", () => {
  for (const schedule of [DEFAULT_PRICING.rkeeper.base, DEFAULT_PRICING.itAdministration]) {
    const formula = scheduleToFormula(schedule);
    assert.ok(formula.includes("\n"));
    assert.equal(issue(formula), null);
    for (let count = 1; count <= 10_000; count++) assert.equal(evaluate(formula, count), getSchedulePrice(count, schedule));
  }
  assert.match(scheduleToFormula(DEFAULT_PRICING.rkeeper.base), /IF\(N>=7,9500\+\(N-6\)\*500,0\)/);
  assert.match(scheduleToFormula(DEFAULT_PRICING.itAdministration), /IF\(N>=7,12000\+\(N-6\)\*500,0\)/);
  const spaced = "  =ЕСЛИ(N=1;4000;\n5000)  ";
  assert.equal(scheduleToFormula({ formula: spaced }), spaced);
  const arbitrary = { firstSix: [1, 2, 3, 4, 5, 6], fromSeven: 7, extraWorkplace: 10 };
  const arbitraryFormula = scheduleToFormula(arbitrary);
  assert.equal(issue(arbitraryFormula), null);
  assert.equal(evaluate(arbitraryFormula, 8), 17);
});

test("Excel row 4 aliases, Russian IF, separators, decimals and precedence work", () => {
  for (const ref of ["N", "n", "D4", "D$4", "$D4", "$D$4", "s$4", "$A$4", "XFD4"]) {
    assert.equal(evaluate(`=ЕСЛИ(${ref}<=6;4000+(${ref}-1)*1000;9500+(${ref}-6)*500)`, 7), 10_000);
  }
  for (const [formula, count, expected] of [
    ["4000 + N * 1000 / 2", 3, 5500],
    ["(4000 + N * 1000) / 2", 3, 3500],
    ["4000 + -(-N) * +1000", 3, 7000],
    ["2.5 * 2 + .5 * 2", 1, 6],
    ["10 - 4 - 1", 1, 5],
    ["100 / 5 / 2", 1, 10],
    ["IF(N=1,4000,5000)", 1, 4000],
    ["IF(N<>1,5000,4000)", 2, 5000],
    ["IF(N!=1,5000,4000)", 1, 4000],
    ["IF(N<2,4000,5000)", 1, 4000],
    ["IF(N>1,5000,4000)", 2, 5000],
    ["IF(N>=2,5000,4000)", 2, 5000],
  ]) assert.equal(evaluate(formula, count), expected);
});

test("IF evaluates only its selected branch, while all counts are checked before saving", () => {
  assert.equal(issue("IF(N>=1,4000+N,1/0)"), null);
  assert.equal(evaluate("IF(N=1,4000,1/0)", 1), 4000);
  assert.match(issue("IF(N=1,4000,1/0)"), /N = 2: Деление на ноль/);
  assert.match(issue("IF(N<10000,4000,1/0)"), /N = 10000: Деление на ноль/);
  assert.match(issue("IF(N<9999,N+4000,1)"), /N = 9999: Цена не должна уменьшаться/);
});

test("formula schedules and legacy schedules coexist and remain independent after validation", () => {
  const config = structuredClone(DEFAULT_PRICING);
  config.rkeeper.menu = { formula: "=1000+N*100" };
  config.rkeeper.onsite = { formula: "=2000+N*200" };
  config.itAdministration = { formula: itSource };
  const result = validatePricingConfig(config);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, config);
  const calculation = calculateRkeeperPricing(3, ["menu-and-dictionaries", "onsite-hardware-support"], "moscow", result.value);
  assert.deepEqual([calculation.baseModule, ...calculation.additionalModules].map((module) => module.monthlyPrice), [6000, 1300, 2600]);
  assert.equal(calculation.monthlyTotal, 9900);
  assert.equal(getSchedulePrice(7, result.value.itAdministration), 12500);
  config.rkeeper.menu.formula = "=1";
  assert.equal(result.value.rkeeper.menu.formula, "=1000+N*100");
  for (const invalid of [{ formula: "=4000", extra: true }, { ...DEFAULT_PRICING.rkeeper.base, formula: "=4000" }, { formula: null }, { formula: "=N/2" }, { formula: "=N>1" }]) {
    assert.equal(validatePricingConfig({ ...DEFAULT_PRICING, rkeeper: { ...DEFAULT_PRICING.rkeeper, base: invalid } }).ok, false);
  }
});

test("money must be finite, positive, whole, bounded and nondecreasing", () => {
  for (const formula of ["0", "-1", "N/2", "10000000001", "1/0", "0/0", "IF(N=6,3999,4000)", "1" + "0".repeat(400)]) assert.equal(typeof issue(formula), "string");
  assert.equal(issue("1"), null);
  assert.equal(issue(String(MAX_PRICING_FORMULA_PRICE)), null);
  assert.equal(evaluate(String(MAX_PRICING_FORMULA_PRICE), 10_000), MAX_PRICING_FORMULA_PRICE);
  assert.equal(issue("4000+N*0"), null);
  const hugeFiniteNumber = "1" + "0".repeat(200);
  assert.match(issue(`${hugeFiniteNumber}*${hugeFiniteNumber}`), /слишком большой/);
});

test("arbitrary code, unsupported spreadsheet functions and non-count references are rejected", () => {
  const rejected = [
    "process.exit()", "globalThis", "N.constructor", "N['constructor']", "({}).constructor", "Function(1)", "eval(1)",
    "fetch(1)", "WEBSERVICE(1)", "HYPERLINK(1)", "SUM(N,1)", "IMPORTXML(1)", "Math.max(1,N)",
    "IF(N=1,4000,fetch(1))", '"4000"', "'4000'", "`4000`", "N=>4000", "N?4000:5000", "4000;5000",
    "4000/*hello*/", "4000//hello", "N**2", "N%2", "N&&4000", "N||4000", "N==1", "N===1", "[4000]",
    "D5", "$D$5", "D0", "D04", "XFE4", "AAAA4", "Sheet1!D4", "D4:S4", "1e3", "Infinity", "NaN", "true", "FALSE", "1<N<5",
  ];
  for (const formula of rejected) assert.throws(() => compile(formula), PricingFormulaError, formula);
  assert.throws(() => evaluate({ source: "=1", root: { kind: "number", value: 1 } }, 1), PricingFormulaError);
});

test("malformed input, expression depth, token count and formula size are bounded", () => {
  for (const formula of ["", " ", "=", "()", "N+", "IF()", "IF(N,1)", "IF(N,1,2,3)", "IF(N,,2)", "IF(N;1;2", "((N)", "2N", "1.2.3"]) {
    assert.throws(() => compile(formula), PricingFormulaError, formula);
    assert.equal(typeof issue(formula), "string");
  }
  assert.match(issue("1".repeat(2049)), /2048/);
  assert.match(issue("(".repeat(41) + "1" + ")".repeat(41)), /40 уровней/);
  assert.match(issue("-".repeat(41) + "1"), /40 уровней/);
  assert.match(issue(Array.from({ length: 257 }, () => "1").join("+")), /количество операций/);
  for (const value of [null, undefined, 4000, {}, []]) assert.equal(typeof issue(value), "string");
  for (const count of [0, 1.5, -1, 10_001, Infinity, NaN, "1", null]) assert.throws(() => evaluate("4000", count), PricingFormulaError);
});

test("cached handles are immutable and independently valid after bounded-cache eviction", () => {
  const original = compile("4000+N");
  assert.equal(issue("4000+N"), null);
  assert.equal(compile("4000+N"), original);
  assert.equal(Object.isFrozen(original), true);
  for (let offset = 0; offset < 40; offset++) assert.equal(issue(`${5000 + offset}+N`), null);
  assert.equal(evaluate(original, 1234), 5234);
  assert.equal(evaluate("4000+N", 1234), 5234);
});
