// Isolated security regression checks. No real account, environment file or network is used.
// Usage: node scripts/check-admin-security.mjs (Node.js 24+).
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import * as OTPAuth from "otpauth";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const directory = mkdtempSync(path.join(tmpdir(), "posadmin-auth-test-"));
const require = createRequire(import.meta.url);
const env = {
  NODE_ENV: "development", POSADMIN_DATA_DIR: directory,
  ADMIN_EMAIL: "owner@example.test", ADMIN_ORIGIN: "http://localhost:3000",
  ADMIN_ENCRYPTION_KEY: randomBytes(32).toString("base64"), ADMIN_BOOTSTRAP_TOKEN: randomBytes(32).toString("hex"),
};
const isolatedGlobal = {};
const cache = new Map();
let clock = Date.UTC(2026, 8, 25, 12, 0, 1);
class TestDate extends Date {
  constructor(...args) { super(...(args.length ? args : [clock])); }
  static now() { return clock; }
}

function load(relativePath) {
  const filename = path.resolve(root, relativePath);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const code = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const resolve = (id) => {
    if (id === "server-only") return {};
    if (id.startsWith("@/")) return load(`${id.slice(2)}.ts`);
    if (id.startsWith(".")) return load(path.relative(root, path.resolve(path.dirname(filename), `${id}.ts`)));
    if (id === "next/cache") return { revalidatePath() {} };
    return require(id);
  };
  new Function("require", "module", "exports", "process", "globalThis", "Date", "fetch", code)(
    resolve, module, module.exports, { env, cwd: () => root, platform: process.platform }, isolatedGlobal, TestDate,
    async () => { throw new Error("Network disabled in security tests."); },
  );
  return module.exports;
}

const auth = load("lib/admin-auth.ts");
const db = load("lib/admin-db.ts");
const prices = load("lib/pricing-store.ts");
const http = load("lib/admin-http.ts");
const { DEFAULT_PRICING } = load("lib/pricing-config.ts");
const sessionRoute = load("app/api/admin/session/route.ts");
const pricingRoute = load("app/api/admin/pricing/route.ts");
const historyRoute = load("app/api/admin/history/route.ts");
const logoutRoute = load("app/api/admin/logout/route.ts");
const password = "  A very long private passphrase!  ";
const request = (body = {}, token, headers = {}, method = "POST") => new Request("http://localhost:3000/api/admin/test", {
  method,
  headers: { origin: env.ADMIN_ORIGIN, "content-type": "application/json", ...(token ? { cookie: `posadmin_session=${token}` } : {}), ...headers },
  ...(method !== "GET" ? { body: JSON.stringify(body) } : {}),
});
const status = (expected) => (error) => error instanceof auth.AdminError && error.status === expected;
let setup;
let recoveryCodes;
let session;
let authenticator;

test("admin security, persistence and atomic pricing", async (t) => {
  try {
    await t.test("missing or unsafe production settings fail closed", () => {
      const originalKey = env.ADMIN_ENCRYPTION_KEY;
      env.ADMIN_ENCRYPTION_KEY = "not-a-key";
      assert.deepEqual(auth.getAdminConfiguration(), { configured: false, initialized: false });
      env.ADMIN_ENCRYPTION_KEY = originalKey;
      env.NODE_ENV = "production";
      assert.throws(auth.getAdminSettings, status(503));
      env.ADMIN_ORIGIN = "https://posadmin.example.test";
      assert.equal(auth.getAdminSettings().secure, true);
      env.POSADMIN_DATA_DIR = "private-data";
      assert.throws(auth.getAdminSettings, status(503));
      env.POSADMIN_DATA_DIR = path.join(root, "public", "data");
      assert.throws(auth.getAdminSettings, status(503));
      env.POSADMIN_DATA_DIR = directory;
      env.ADMIN_ORIGIN = "http://localhost:3000";
      env.NODE_ENV = "development";
    });

    await t.test("database and sidecars reject directories before SQLite opens", () => {
      try {
        for (const filename of ["posadmin.sqlite", "posadmin.sqlite-wal", "posadmin.sqlite-shm"]) {
          const caseDirectory = path.join(directory, `directory-${filename}`);
          mkdirSync(path.join(caseDirectory, filename), { recursive: true });
          env.POSADMIN_DATA_DIR = caseDirectory;
          assert.throws(db.getAdminDatabase, /must be regular files/);
        }
      } finally { env.POSADMIN_DATA_DIR = directory; }
    });

    await t.test("database and sidecars reject dangling symlinks, including Windows junctions", (subtest) => {
      try {
        for (const filename of ["posadmin.sqlite", "posadmin.sqlite-wal", "posadmin.sqlite-shm"]) {
          const caseDirectory = path.join(directory, `dangling-${filename}`);
          mkdirSync(caseDirectory);
          const entry = path.join(caseDirectory, filename);
          try {
            symlinkSync(path.join(caseDirectory, "missing-target"), entry, process.platform === "win32" ? "junction" : "file");
          } catch (error) {
            if (error.code === "EPERM" || error.code === "ENOTSUP") {
              subtest.skip("The operating system does not permit test symlinks.");
              return;
            }
            throw error;
          }
          assert.equal(lstatSync(entry).isSymbolicLink(), true);
          assert.equal(existsSync(entry), false);
          env.POSADMIN_DATA_DIR = caseDirectory;
          assert.throws(db.getAdminDatabase, /must be regular files/);
        }
      } finally { env.POSADMIN_DATA_DIR = directory; }
    });

    await t.test("anonymous users cannot read private history or change prices", async () => {
      assert.deepEqual(prices.getPricingSnapshot(), { config: DEFAULT_PRICING, revision: 0, updatedAt: null });
      const response = await sessionRoute.GET(request({}, undefined, {}, "GET"));
      const body = await response.json();
      assert.deepEqual(body, { authenticated: false, configured: true, initialized: false });
      assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
      assert.equal((await historyRoute.GET(request({}, undefined, {}, "GET"))).status, 401);
      assert.equal((await pricingRoute.PUT(request({ config: DEFAULT_PRICING, revision: 0 }, undefined, {}, "PUT"))).status, 401);
      assert.equal((await pricingRoute.PUT(request({}, undefined, { origin: "https://evil.example" }, "PUT"))).status, 403);
    });

    await t.test("origin, request format and body limits apply before auth", async () => {
      await assert.rejects(() => http.readAdminJson(request({}, undefined, { "sec-fetch-site": "cross-site" })), status(403));
      await assert.rejects(() => http.readAdminJson(request({}, undefined, { "content-type": "text/plain" })), status(415));
      await assert.rejects(() => http.readAdminJson(request({ oversized: "x".repeat(17_000) })), status(413));
      await assert.rejects(() => http.readAdminJson(request([], undefined)), status(400));
    });

    await t.test("setup requires bootstrap, strong password and confirmed TOTP", async () => {
      await assert.rejects(() => auth.beginAdminSetup({ token: "wrong", password }), status(401));
      await assert.rejects(() => auth.beginAdminSetup({ token: env.ADMIN_BOOTSTRAP_TOKEN, password: "short" }), status(400));
      setup = await auth.beginAdminSetup({ token: env.ADMIN_BOOTSTRAP_TOKEN, password });
      assert.match(setup.qrDataUrl, /^data:image\/png;base64,/);
      assert.equal(auth.isAdminInitialized(), false);
      const pending = db.getAdminDatabase().prepare("SELECT password_hash, totp_secret FROM admin_setup").get();
      assert.ok(!pending.password_hash.includes(password));
      assert.ok(!pending.totp_secret.includes(setup.secret));
      authenticator = new OTPAuth.TOTP({ issuer: "Posadmin", label: env.ADMIN_EMAIL, digits: 6, period: 30, secret: setup.secret });
      const code = authenticator.generate({ timestamp: clock });
      const invalidCode = String((Number(code) + 1) % 1_000_000).padStart(6, "0");
      assert.throws(() => auth.finishAdminSetup({ token: env.ADMIN_BOOTSTRAP_TOKEN, setupId: setup.setupId, code: invalidCode }), status(401));
      const result = auth.finishAdminSetup({ token: env.ADMIN_BOOTSTRAP_TOKEN, setupId: setup.setupId, code });
      recoveryCodes = result.recoveryCodes;
      session = result.session;
      assert.equal(recoveryCodes.length, 10);
      assert.equal(new Set(recoveryCodes).size, 10);
      assert.equal(auth.isAdminInitialized(), true);
      assert.equal(db.getAdminDatabase().prepare("SELECT COUNT(*) AS count FROM admin_setup").get().count, 0);
      assert.throws(() => auth.finishAdminSetup({ token: env.ADMIN_BOOTSTRAP_TOKEN, setupId: setup.setupId, code }), status(409));
      const savedToken = env.ADMIN_BOOTSTRAP_TOKEN;
      delete env.ADMIN_BOOTSTRAP_TOKEN;
      assert.deepEqual(auth.getAdminConfiguration(), { configured: true, initialized: true });
      env.ADMIN_BOOTSTRAP_TOKEN = savedToken;
    });

    await t.test("password is never trimmed; wrong owner/password and TOTP replay fail", async () => {
      const code = authenticator.generate({ timestamp: clock });
      await assert.rejects(() => auth.loginAdmin({ email: env.ADMIN_EMAIL, password, code }), status(401));
      clock += 30_000;
      const freshCode = authenticator.generate({ timestamp: clock });
      await assert.rejects(() => auth.loginAdmin({ email: env.ADMIN_EMAIL, password: password.trim(), code: freshCode }), status(401));
      await assert.rejects(() => auth.loginAdmin({ email: "other@example.test", password, code: freshCode }), status(401));
      const concurrent = await Promise.allSettled([
        auth.loginAdmin({ email: env.ADMIN_EMAIL, password, code: freshCode }),
        auth.loginAdmin({ email: env.ADMIN_EMAIL, password, code: freshCode }),
      ]);
      assert.equal(concurrent.filter((result) => result.status === "fulfilled").length, 1);
      assert.equal(concurrent.filter((result) => result.status === "rejected" && result.reason.status === 401).length, 1);
    });

    await t.test("recovery codes are stored hashed, require password and work once", async () => {
      const stored = db.getAdminDatabase().prepare("SELECT code_hash FROM admin_recovery").all();
      assert.ok(stored.every((row) => !recoveryCodes.includes(row.code_hash)));
      await assert.rejects(() => auth.loginAdmin({ email: env.ADMIN_EMAIL, password: "incorrect", code: recoveryCodes[0], recovery: true }), status(401));
      const recovered = await auth.loginAdmin({ email: env.ADMIN_EMAIL, password, code: recoveryCodes[0], recovery: true });
      assert.equal(typeof recovered.token, "string");
      await assert.rejects(() => auth.loginAdmin({ email: env.ADMIN_EMAIL, password, code: recoveryCodes[0], recovery: true }), status(401));
    });

    await t.test("session cookies are opaque, HTTP-only, strict and secure in HTTPS", () => {
      const response = http.adminJson({ ok: true });
      http.setAdminSessionCookie(response, session);
      const cookie = response.headers.get("set-cookie");
      assert.match(cookie, /HttpOnly/i);
      assert.match(cookie, /SameSite=strict/i);
      const row = db.getAdminDatabase().prepare("SELECT token_hash FROM admin_sessions WHERE token_hash = ?").get(session.token);
      assert.equal(row, undefined);
      assert.equal(auth.getAdminSession(request({}, session.token)).email, env.ADMIN_EMAIL);
      assert.equal(auth.getAdminSession(request({}, `${session.token.slice(0, -1)}!`)), null);
      env.ADMIN_ORIGIN = "https://posadmin.example.test";
      const secureResponse = http.adminJson({ ok: true });
      http.setAdminSessionCookie(secureResponse, session);
      assert.match(secureResponse.headers.get("set-cookie"), /__Host-posadmin_session=/);
      assert.match(secureResponse.headers.get("set-cookie"), /; Secure/i);
      env.ADMIN_ORIGIN = "http://localhost:3000";
    });

    await t.test("pricing saves validated data and audit history with atomic stale-edit rejection", async () => {
      const changed = structuredClone(DEFAULT_PRICING);
      changed.rkeeper.base.firstSix[0] += 100;
      const response = await pricingRoute.PUT(request({ config: changed, revision: 0 }, session.token, {}, "PUT"));
      assert.equal(response.status, 200);
      const snapshot = await response.json();
      assert.equal(snapshot.revision, 1);
      assert.deepEqual(prices.getPricingSnapshot().config, changed);
      const stale = await pricingRoute.PUT(request({ config: DEFAULT_PRICING, revision: 0 }, session.token, {}, "PUT"));
      assert.equal(stale.status, 409);
      assert.equal(prices.getPricingHistory().length, 2);
      assert.equal(prices.getPricingHistory()[0].actor, env.ADMIN_EMAIL);
      const audit = db.getAdminDatabase().prepare("SELECT before_json FROM pricing_history").get();
      assert.deepEqual(JSON.parse(audit.before_json), DEFAULT_PRICING);
      changed.rkeeper.base.firstSix[0] = -1;
      assert.equal((await pricingRoute.PUT(request({ config: changed, revision: 1 }, session.token, {}, "PUT"))).status, 400);
      assert.equal(prices.getPricingSnapshot().revision, 1);
      const privateState = await (await sessionRoute.GET(request({}, session.token, {}, "GET"))).json();
      assert.equal(privateState.authenticated, true);
      assert.equal(privateState.snapshot.revision, 1);
      assert.ok(!JSON.stringify(privateState).includes(setup.secret));
    });

    await t.test("original prices can be restored after the first edit and remain beyond the latest 50 saves", async () => {
      const baseline = prices.getPricingHistory().find((entry) => entry.revision === 0);
      assert.equal(baseline.id, 0);
      assert.equal(baseline.actor, "Исходный прайс");
      assert.deepEqual(baseline.config, DEFAULT_PRICING);
      const restored = await pricingRoute.PUT(request({ config: baseline.config, revision: 1 }, session.token, {}, "PUT"));
      assert.equal(restored.status, 200);
      assert.equal((await restored.json()).revision, 2);
      assert.deepEqual(prices.getPricingSnapshot().config, DEFAULT_PRICING);
      for (let index = 0; index < 50; index++) {
        const changed = structuredClone(DEFAULT_PRICING);
        changed.itAdministration.extraWorkplace += index + 1;
        prices.savePricing(changed, index + 2, env.ADMIN_EMAIL);
      }
      const history = prices.getPricingHistory();
      assert.equal(history.length, 51);
      assert.equal(history[0].revision, 52);
      assert.equal(history[49].revision, 3);
      assert.deepEqual(history[50], baseline);
    });

    await t.test("logout revokes on server; idle and absolute lifetimes expire", async () => {
      const logout = await logoutRoute.POST(request({}, session.token));
      assert.equal(logout.status, 200);
      assert.equal(auth.getAdminSession(request({}, session.token)), null);
      const idle = await auth.loginAdmin({ email: env.ADMIN_EMAIL, password, code: recoveryCodes[1], recovery: true });
      clock += 30 * 60 * 1000;
      assert.equal(auth.getAdminSession(request({}, idle.token)), null);
      const absolute = await auth.loginAdmin({ email: env.ADMIN_EMAIL, password, code: recoveryCodes[2], recovery: true });
      clock += 8 * 60 * 60 * 1000;
      assert.equal(auth.getAdminSession(request({}, absolute.token)), null);
    });

    await t.test("malformed inputs and wrong passwords do not lock the owner's second factor", async () => {
      db.getAdminDatabase().prepare("DELETE FROM admin_rate_limits").run();
      for (let index = 0; index < 10; index++) {
        await assert.rejects(() => auth.loginAdmin({ email: null, password: null, code: null }), status(401));
      }
      for (let index = 0; index < 10; index++) {
        await assert.rejects(() => auth.loginAdmin({ email: env.ADMIN_EMAIL, password: "incorrect", code: "123456" }), status(401));
      }
      assert.equal(db.getAdminDatabase().prepare("SELECT attempts FROM admin_rate_limits WHERE bucket = 'login-factor'").get(), undefined);
      const accepted = await auth.loginAdmin({ email: env.ADMIN_EMAIL, password, code: authenticator.generate({ timestamp: clock }) });
      assert.equal(typeof accepted.token, "string");
    });

    await t.test("password work is bounded to four jobs without an unbounded queue", async () => {
      db.getAdminDatabase().prepare("DELETE FROM admin_rate_limits").run();
      const jobs = Array.from({ length: 4 }, () => auth.hashAdminPassword("an unrelated strong temporary test password"));
      try {
        await assert.rejects(() => auth.loginAdmin({ email: env.ADMIN_EMAIL, password, code: recoveryCodes[3], recovery: true }), (error) => status(429)(error) && error.retryAfter === 2);
        assert.equal(db.getAdminDatabase().prepare("SELECT attempts FROM admin_rate_limits WHERE bucket = 'login-factor'").get(), undefined);
      } finally {
        await Promise.all(jobs);
      }
      // Resources are released after each derivation, so a later legitimate login succeeds.
      assert.equal(typeof (await auth.loginAdmin({ email: env.ADMIN_EMAIL, password, code: recoveryCodes[3], recovery: true })).token, "string");
    });

    await t.test("second-factor limit applies only after the right password and persists across restart", async () => {
      db.getAdminDatabase().prepare("DELETE FROM admin_rate_limits").run();
      for (let index = 0; index < 10; index++) {
        await assert.rejects(() => auth.loginAdmin({ email: env.ADMIN_EMAIL, password, code: "invalid" }), status(401));
      }
      // Close and reopen the database to model a server process restart.
      isolatedGlobal.posadminDatabase.connection.close();
      delete isolatedGlobal.posadminDatabase;
      await assert.rejects(() => auth.loginAdmin({ email: env.ADMIN_EMAIL, password, code: recoveryCodes[4], recovery: true }), status(429));
      assert.equal(db.getAdminDatabase().prepare("SELECT attempts FROM admin_rate_limits WHERE bucket = 'login-factor'").get().attempts, 10);
      clock += 15 * 60 * 1000;
      const allowed = await auth.loginAdmin({ email: env.ADMIN_EMAIL, password, code: recoveryCodes[4], recovery: true });
      assert.equal(typeof allowed.token, "string");
    });

    await t.test("short global burst limit persists and expires after one minute", async () => {
      db.getAdminDatabase().prepare("DELETE FROM admin_rate_limits").run();
      for (let index = 0; index < 60; index++) {
        await assert.rejects(() => auth.loginAdmin({ email: null, password: null, code: null }), status(401));
      }
      isolatedGlobal.posadminDatabase.connection.close();
      delete isolatedGlobal.posadminDatabase;
      await assert.rejects(() => auth.loginAdmin({ email: env.ADMIN_EMAIL, password, code: recoveryCodes[5], recovery: true }), (error) => status(429)(error) && error.retryAfter <= 60);
      assert.equal(db.getAdminDatabase().prepare("SELECT attempts FROM admin_rate_limits WHERE bucket = 'login-burst'").get().attempts, 60);
      assert.equal(db.getAdminDatabase().prepare("SELECT attempts FROM admin_rate_limits WHERE bucket = 'login-factor'").get(), undefined);
      clock += 60_000;
      assert.equal(typeof (await auth.loginAdmin({ email: env.ADMIN_EMAIL, password, code: recoveryCodes[5], recovery: true })).token, "string");
    });

    await t.test("a corrupt stored price list never silently falls back to defaults", () => {
      db.getAdminDatabase().prepare("UPDATE pricing_current SET config_json = ? WHERE id = 1").run("{bad json}");
      assert.throws(prices.getPricingSnapshot);
    });
  } finally {
    isolatedGlobal.posadminDatabase?.connection.close();
    const cleanupTarget = path.resolve(directory);
    const tempRoot = path.resolve(tmpdir());
    if (!cleanupTarget.startsWith(`${tempRoot}${path.sep}`) || !path.basename(cleanupTarget).startsWith("posadmin-auth-test-")) {
      throw new Error("Refusing to remove an unexpected test directory.");
    }
    rmSync(cleanupTarget, { recursive: true, force: true });
  }
});
