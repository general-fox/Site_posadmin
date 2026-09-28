/** A deliberately small arithmetic language. Formula text is never executed as JavaScript. */
export const MAX_PRICING_FORMULA_LENGTH = 2_048;
export const MAX_PRICING_FORMULA_PRICE = 10_000_000_000;
const MAX_TOKENS = 512;
const MAX_DEPTH = 40;
const MAX_EVALUATION_STEPS = 1_024;
const CACHE_SIZE = 32;
const VALIDATION_CACHE_SIZE = 256;

export class PricingFormulaError extends Error {}

type BinaryOperator = "+" | "-" | "*" | "/" | "=" | "<>" | "!=" | "<" | "<=" | ">" | ">=";
type AstNode = { depth: number } & (
  | { kind: "number"; value: number }
  | { kind: "count" }
  | { kind: "unary"; operator: "+" | "-"; operand: AstNode }
  | { kind: "binary"; operator: BinaryOperator; left: AstNode; right: AstNode }
  | { kind: "if"; condition: AstNode; yes: AstNode; no: AstNode }
);
type Token = { kind: "number" | "identifier" | "symbol" | "end"; text: string; position: number };

/** Opaque handle: the parsed tree remains private and cannot be supplied through JSON. */
export type CompiledPricingFormula = Readonly<{ source: string }>;
type CompiledEntry = { handle: CompiledPricingFormula; root: AstNode; issue?: string | null; prices?: Float64Array };
const cache = new Map<string, CompiledEntry>();
const compiledEntries = new WeakMap<CompiledPricingFormula, CompiledEntry>();
// History can contain 50 versions of four formulas. Keep small validation results
// separately so reading it does not repeatedly run the 10,000-count check.
const validationCache = new Map<string, string | null>();

function rememberValidation(source: string, issue: string | null): void {
  validationCache.delete(source);
  validationCache.set(source, issue);
  if (validationCache.size > VALIDATION_CACHE_SIZE) validationCache.delete(validationCache.keys().next().value!);
}

function fail(message: string): never { throw new PricingFormulaError(message); }

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let position = 0;
  while (position < source.length) {
    if (/\s/.test(source[position])) { position++; continue; }
    if (tokens.length >= MAX_TOKENS) fail("Формула слишком сложная: сократите количество операций.");
    const rest = source.slice(position);
    const number = /^(?:\d+(?:\.\d*)?|\.\d+)/.exec(rest)?.[0];
    const identifier = /^\$?[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_$]*/.exec(rest)?.[0];
    const symbol = /^(?:<=|>=|<>|!=|[+\-*/()=,;<>])/.exec(rest)?.[0];
    const text = number ?? identifier ?? symbol;
    if (!text) fail(`Недопустимый символ в позиции ${position + 1}. Используйте числа, N и функцию IF / ЕСЛИ.`);
    tokens.push({ kind: number ? "number" : identifier ? "identifier" : "symbol", text, position });
    position += text.length;
  }
  tokens.push({ kind: "end", text: "", position });
  return tokens;
}

function isWorkplaceReference(text: string): boolean {
  const match = /^\$?([A-Z]{1,3})\$?4$/.exec(text);
  if (!match) return false;
  // Excel columns A:XFD are accepted only on the workbook's count row (row 4).
  const column = [...match[1]].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0);
  return column <= 16_384;
}

class FormulaParser {
  private index = 0;
  private nesting = 0;
  constructor(private readonly tokens: Token[]) {}

  private current(): Token { return this.tokens[this.index]; }
  private take(): Token { return this.tokens[this.index++]; }
  private symbol(text: string): boolean { return this.current().kind === "symbol" && this.current().text === text; }
  private expect(text: string): void {
    if (!this.symbol(text)) fail(`Ожидается «${text}» в позиции ${this.current().position + 1}.`);
    this.take();
  }
  private separator(): void {
    if (!this.symbol(",") && !this.symbol(";")) fail("Функция IF / ЕСЛИ принимает три аргумента через запятую или точку с запятой.");
    this.take();
  }
  private nested<T>(operation: () => T): T {
    if (++this.nesting > MAX_DEPTH) fail("Формула слишком вложенная: допускается не более 40 уровней.");
    try { return operation(); } finally { this.nesting--; }
  }
  private node(value: AstNode): AstNode {
    if (value.depth > MAX_DEPTH) fail("Формула слишком вложенная: допускается не более 40 уровней.");
    return Object.freeze(value);
  }
  private binary(operator: BinaryOperator, left: AstNode, right: AstNode): AstNode {
    return this.node({ kind: "binary", operator, left, right, depth: Math.max(left.depth, right.depth) + 1 });
  }

  parse(): AstNode {
    const root = this.comparison();
    if (this.current().kind !== "end") fail(`Лишний фрагмент «${this.current().text}» в позиции ${this.current().position + 1}.`);
    return root;
  }

  private comparison(): AstNode {
    let result = this.addition();
    const comparisons = ["=", "<>", "!=", "<", "<=", ">", ">="];
    if (comparisons.includes(this.current().text)) {
      result = this.binary(this.take().text as BinaryOperator, result, this.addition());
    }
    if (comparisons.includes(this.current().text)) fail("Используйте одно сравнение в каждом условии IF / ЕСЛИ.");
    return result;
  }

  private addition(): AstNode {
    let result = this.multiplication();
    while (this.symbol("+") || this.symbol("-")) result = this.binary(this.take().text as BinaryOperator, result, this.multiplication());
    return result;
  }

  private multiplication(): AstNode {
    let result = this.unary();
    while (this.symbol("*") || this.symbol("/")) result = this.binary(this.take().text as BinaryOperator, result, this.unary());
    return result;
  }

  private unary(): AstNode {
    if (this.symbol("+") || this.symbol("-")) {
      const operator = this.take().text as "+" | "-";
      const operand = this.nested(() => this.unary());
      return this.node({ kind: "unary", operator, operand, depth: operand.depth + 1 });
    }
    return this.primary();
  }

  private primary(): AstNode {
    const token = this.take();
    if (token.kind === "number") {
      const value = Number(token.text);
      if (!Number.isFinite(value)) fail("Число в формуле слишком большое.");
      return this.node({ kind: "number", value, depth: 1 });
    }
    if (token.kind === "identifier") {
      const identifier = token.text.toUpperCase();
      if (identifier === "N" || isWorkplaceReference(identifier)) return this.node({ kind: "count", depth: 1 });
      if (identifier === "IF" || identifier === "ЕСЛИ") {
        return this.nested(() => {
          this.expect("(");
          const condition = this.comparison();
          this.separator();
          const yes = this.comparison();
          this.separator();
          const no = this.comparison();
          this.expect(")");
          return this.node({ kind: "if", condition, yes, no, depth: Math.max(condition.depth, yes.depth, no.depth) + 1 });
        });
      }
      fail(`Неизвестное имя «${token.text}». Разрешены N, ссылки на строку 4 и функция IF / ЕСЛИ.`);
    }
    if (token.kind === "symbol" && token.text === "(") {
      return this.nested(() => {
        const expression = this.comparison();
        this.expect(")");
        return expression;
      });
    }
    fail(`Ожидается число, N или IF / ЕСЛИ в позиции ${token.position + 1}.`);
  }
}

export function compilePricingFormula(formula: string): CompiledPricingFormula {
  if (typeof formula !== "string" || !formula.trim()) fail("Введите формулу расчёта цены.");
  if (formula.length > MAX_PRICING_FORMULA_LENGTH) fail("Формула должна содержать не больше 2048 символов.");
  const source = formula.trim();
  const saved = cache.get(source);
  if (saved) {
    cache.delete(source);
    cache.set(source, saved);
    return saved.handle;
  }
  const expression = source.startsWith("=") ? source.slice(1) : source;
  const root = new FormulaParser(tokenize(expression)).parse();
  const handle = Object.freeze({ source });
  const issue = validationCache.get(source);
  if (issue !== undefined) rememberValidation(source, issue);
  const entry: CompiledEntry = { handle, root, issue };
  compiledEntries.set(handle, entry);
  cache.set(source, entry);
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value!);
  return handle;
}

function evaluateAt(root: AstNode, count: number): number {
  let steps = 0;
  function visit(node: AstNode): number {
    if (++steps > MAX_EVALUATION_STEPS) fail("Формула слишком сложная для расчёта.");
    let result: number;
    switch (node.kind) {
      case "number": return node.value;
      case "count": return count;
      case "unary": result = node.operator === "-" ? -visit(node.operand) : visit(node.operand); break;
      case "if": return visit(node.condition) !== 0 ? visit(node.yes) : visit(node.no);
      case "binary": {
        const left = visit(node.left);
        const right = visit(node.right);
        switch (node.operator) {
          case "+": result = left + right; break;
          case "-": result = left - right; break;
          case "*": result = left * right; break;
          case "/": if (right === 0) fail("Деление на ноль."); result = left / right; break;
          case "=": result = Number(left === right); break;
          case "<>": case "!=": result = Number(left !== right); break;
          case "<": result = Number(left < right); break;
          case "<=": result = Number(left <= right); break;
          case ">": result = Number(left > right); break;
          case ">=": result = Number(left >= right); break;
        }
        break;
      }
    }
    if (!Number.isFinite(result)) fail("Результат операции слишком большой или некорректный.");
    return result;
  }
  const amount = visit(root);
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > MAX_PRICING_FORMULA_PRICE) {
    fail("Цена должна быть целым числом от 1 до 10 000 000 000 ₽.");
  }
  return amount;
}

function entryFor(compiled: CompiledPricingFormula): CompiledEntry {
  const entry = compiledEntries.get(compiled);
  if (!entry) fail("Сначала проверьте формулу расчёта.");
  return entry;
}

export function evaluatePricingFormula(formula: string | CompiledPricingFormula, workplaceCount: number): number {
  if (!Number.isSafeInteger(workplaceCount) || workplaceCount < 1 || workplaceCount > 10_000) {
    fail("Количество рабочих мест должно быть целым числом от 1 до 10 000.");
  }
  const entry = entryFor(typeof formula === "string" ? compilePricingFormula(formula) : formula);
  if (entry.issue) fail(entry.issue);
  return entry.prices ? entry.prices[workplaceCount - 1] : evaluateAt(entry.root, workplaceCount);
}

/** Exhaustively check every supported workplace count once, then cache the prices. */
export function getFormulaIssue(formula: unknown): string | null {
  try {
    if (typeof formula !== "string") fail("Формула должна быть текстом.");
    const entry = entryFor(compilePricingFormula(formula));
    if (entry.issue !== undefined) {
      rememberValidation(entry.handle.source, entry.issue);
      return entry.issue;
    }
    const prices = new Float64Array(10_000);
    for (let count = 1; count <= 10_000; count++) {
      try {
        const amount = evaluateAt(entry.root, count);
        if (count > 1 && amount < prices[count - 2]) fail("Цена не должна уменьшаться при увеличении количества рабочих мест.");
        prices[count - 1] = amount;
      } catch (error) {
        entry.issue = `При N = ${count}: ${error instanceof PricingFormulaError ? error.message : "не удалось рассчитать цену."}`;
        rememberValidation(entry.handle.source, entry.issue);
        return entry.issue;
      }
    }
    entry.prices = prices;
    entry.issue = null;
    rememberValidation(entry.handle.source, null);
    return null;
  } catch (error) {
    return error instanceof PricingFormulaError ? error.message : "Не удалось прочитать формулу.";
  }
}
