import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { getAdminDatabase, getDataDirectory, withAdminTransaction } from "./admin-db";

const SESSION_LIFETIME = 8 * 60 * 60 * 1000;
const SESSION_IDLE = 30 * 60 * 1000;
const SETUP_LIFETIME = 10 * 60 * 1000;
const RATE_LIMITS = {
  "login-burst": { window: 60_000, attempts: 60 },
  "login-factor": { window: 15 * 60 * 1000, attempts: 10 },
  setup: { window: 15 * 60 * 1000, attempts: 10 },
} as const;
const SCRYPT_OPTIONS = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const DUMMY_HASH = `scrypt:32768:8:3:${Buffer.alloc(16, 17).toString("base64")}:${Buffer.alloc(64, 31).toString("base64")}`;
const MAX_PASSWORD_DERIVATIONS = 4;
let activePasswordDerivations = 0;

export class AdminError extends Error {
  constructor(public readonly status: number, message: string, public readonly retryAfter?: number) { super(message); }
}

export type AdminSettings = { email: string; origin: string; encryptionKey: Buffer; bootstrapToken?: string; secure: boolean };
export type AdminSession = { email: string; expiresAt: number; tokenHash: string };
export type NewAdminSession = { token: string; expiresAt: number };
type OwnerRow = { email: string; password_hash: string; totp_secret: string; last_totp_step: number };
type SetupRow = { id: string; email: string; password_hash: string; totp_secret: string; expires_at: number };

export function getAdminSettings(): AdminSettings {
  try {
    getDataDirectory();
    const email = (process.env.ADMIN_EMAIL || "a230495k@gmail.com").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("email");
    const configuredOrigin = process.env.ADMIN_ORIGIN || (process.env.NODE_ENV !== "production" ? "http://localhost:3000" : "");
    const url = new URL(configuredOrigin);
    if (url.origin !== configuredOrigin || url.username || url.password || !["http:", "https:"].includes(url.protocol)) throw new Error("origin");
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") throw new Error("https");
    const keyText = process.env.ADMIN_ENCRYPTION_KEY || "";
    const encryptionKey = Buffer.from(keyText, "base64");
    if (encryptionKey.length !== 32 || encryptionKey.toString("base64") !== keyText) throw new Error("key");
    const bootstrapToken = process.env.ADMIN_BOOTSTRAP_TOKEN || undefined;
    if (bootstrapToken && !/^[a-fA-F0-9]{64}$/.test(bootstrapToken)) throw new Error("token");
    return { email, origin: url.origin, encryptionKey, bootstrapToken, secure: url.protocol === "https:" };
  } catch {
    throw new AdminError(503, "Админка ещё не настроена на сервере.");
  }
}

export function isAdminInitialized(): boolean {
  return Boolean(getAdminDatabase().prepare("SELECT id FROM admin_owner WHERE id = 1").get());
}

export function getAdminConfiguration(): { configured: boolean; initialized: boolean } {
  try {
    const settings = getAdminSettings();
    const initialized = isAdminInitialized();
    return { configured: initialized || Boolean(settings.bootstrapToken), initialized };
  } catch (error) {
    if (error instanceof AdminError && error.status === 503) return { configured: false, initialized: false };
    throw error;
  }
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function safeEqual(left: string, right: string): boolean {
  return timingSafeEqual(createHash("sha256").update(left).digest(), createHash("sha256").update(right).digest());
}

async function derivePassword(password: string, salt: Buffer): Promise<Buffer> {
  // Refuse excess work immediately rather than queuing unbounded memory-heavy jobs.
  if (activePasswordDerivations >= MAX_PASSWORD_DERIVATIONS) {
    throw new AdminError(429, "Сервис занят. Повторите вход через несколько секунд.", 2);
  }
  activePasswordDerivations++;
  try {
    return await new Promise<Buffer>((resolve, reject) => {
      scrypt(password, salt, 64, SCRYPT_OPTIONS, (error, derived) => error ? reject(error) : resolve(derived));
    });
  } finally {
    activePasswordDerivations--;
  }
}

export async function hashAdminPassword(password: string): Promise<string> {
  if (password.length < 12 || password.length > 128) throw new AdminError(400, "Пароль должен содержать от 12 до 128 символов.");
  const salt = randomBytes(16);
  const hash = await derivePassword(password, salt);
  return `scrypt:32768:8:3:${salt.toString("base64")}:${hash.toString("base64")}`;
}

export async function verifyAdminPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 6 || parts.slice(0, 4).join(":") !== "scrypt:32768:8:3") throw new Error("Invalid stored password hash.");
  const salt = Buffer.from(parts[4], "base64");
  const expected = Buffer.from(parts[5], "base64");
  if (salt.length !== 16 || expected.length !== 64) throw new Error("Invalid stored password hash.");
  const supplied = await derivePassword(password, salt);
  return timingSafeEqual(expected, supplied);
}

function encryptTotp(secret: string, settings: AdminSettings): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", settings.encryptionKey, iv);
  cipher.setAAD(Buffer.from("posadmin:totp:v1"));
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), ciphertext.toString("base64")].join(":");
}

function decryptTotp(encrypted: string, settings: AdminSettings): string {
  const [version, iv, tag, ciphertext, extra] = encrypted.split(":");
  if (version !== "v1" || !iv || !tag || !ciphertext || extra !== undefined) throw new Error("Invalid encrypted secret.");
  const decipher = createDecipheriv("aes-256-gcm", settings.encryptionKey, Buffer.from(iv, "base64"));
  decipher.setAAD(Buffer.from("posadmin:totp:v1"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64")), decipher.final()]).toString("utf8");
}

function totpFor(secret: string, email: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({ issuer: "Posadmin", label: email, algorithm: "SHA1", digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(secret) });
}

function validTotpStep(secret: string, email: string, code: unknown, now: number): number | null {
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) return null;
  const delta = totpFor(secret, email).validate({ token: code, timestamp: now, window: 1 });
  return delta === null ? null : Math.floor(now / 30_000) + delta;
}

/** A shared persistent bucket cannot be bypassed by changing/spoofing client IP. */
export function consumeAdminAttempt(bucket: keyof typeof RATE_LIMITS, now = Date.now()): void {
  const limit = RATE_LIMITS[bucket];
  const result = withAdminTransaction((db) => {
    const row = db.prepare("SELECT window_start, attempts FROM admin_rate_limits WHERE bucket = ?").get(bucket) as { window_start: number; attempts: number } | undefined;
    if (!row || now - row.window_start >= limit.window) {
      db.prepare("INSERT INTO admin_rate_limits (bucket, window_start, attempts) VALUES (?, ?, 1) ON CONFLICT(bucket) DO UPDATE SET window_start = excluded.window_start, attempts = 1").run(bucket, now);
      return 0;
    }
    if (row.attempts >= limit.attempts) return Math.max(1, Math.ceil((row.window_start + limit.window - now) / 1000));
    db.prepare("UPDATE admin_rate_limits SET attempts = attempts + 1 WHERE bucket = ?").run(bucket);
    return 0;
  });
  if (result) throw new AdminError(429, bucket === "login-burst"
    ? "Слишком много запросов. Попробуйте через минуту."
    : "Слишком много попыток подтверждения. Попробуйте через 15 минут.", result);
}

function verifyBootstrap(token: unknown, settings: AdminSettings): void {
  if (!settings.bootstrapToken) throw new AdminError(503, "Первоначальная настройка не разрешена на сервере.");
  if (typeof token !== "string" || !safeEqual(token, settings.bootstrapToken)) throw new AdminError(401, "Неверный ключ первоначальной настройки.");
  if (isAdminInitialized() || getAdminDatabase().prepare("SELECT value FROM admin_meta WHERE key = 'bootstrap_consumed'").get()) {
    throw new AdminError(409, "Первоначальная настройка уже завершена.");
  }
}

export async function beginAdminSetup(input: { token: unknown; password: unknown }): Promise<{ setupId: string; qrDataUrl: string; secret: string; email: string }> {
  const settings = getAdminSettings();
  consumeAdminAttempt("setup");
  verifyBootstrap(input.token, settings);
  if (typeof input.password !== "string") throw new AdminError(400, "Укажите пароль.");
  const passwordHash = await hashAdminPassword(input.password);
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  const setupId = randomBytes(24).toString("hex");
  const qrDataUrl = await QRCode.toDataURL(totpFor(secret, settings.email).toString(), { errorCorrectionLevel: "M", width: 280, margin: 2 });
  withAdminTransaction((db) => {
    // Check again after expensive async work: a competing setup may have finished.
    verifyBootstrap(input.token, settings);
    db.prepare("DELETE FROM admin_setup").run();
    db.prepare("INSERT INTO admin_setup (id, password_hash, totp_secret, email, expires_at) VALUES (?, ?, ?, ?, ?)")
      .run(setupId, passwordHash, encryptTotp(secret, settings), settings.email, Date.now() + SETUP_LIFETIME);
  });
  return { setupId, qrDataUrl, secret, email: settings.email };
}

function createSessionRow(db: ReturnType<typeof getAdminDatabase>, email: string, now: number): NewAdminSession {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = now + SESSION_LIFETIME;
  db.prepare("DELETE FROM admin_sessions WHERE expires_at <= ? OR last_seen_at <= ?").run(now, now - SESSION_IDLE);
  db.prepare("INSERT INTO admin_sessions (token_hash, email, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?)")
    .run(digest(token), email, now, expiresAt, now);
  return { token, expiresAt };
}

export function finishAdminSetup(input: { token: unknown; setupId: unknown; code: unknown }): { recoveryCodes: string[]; session: NewAdminSession } {
  const settings = getAdminSettings();
  consumeAdminAttempt("setup");
  verifyBootstrap(input.token, settings);
  if (typeof input.setupId !== "string" || !/^[a-f0-9]{48}$/.test(input.setupId)) throw new AdminError(400, "Начните настройку заново.");
  const setupId = input.setupId;
  return withAdminTransaction((db) => {
    verifyBootstrap(input.token, settings);
    const setup = db.prepare("SELECT id, email, password_hash, totp_secret, expires_at FROM admin_setup WHERE id = ?").get(setupId) as SetupRow | undefined;
    const now = Date.now();
    if (!setup || setup.expires_at <= now || setup.email !== settings.email) throw new AdminError(400, "Время настройки истекло. Начните заново.");
    const step = validTotpStep(decryptTotp(setup.totp_secret, settings), settings.email, input.code, now);
    if (step === null) throw new AdminError(401, "Неверный код из Google Authenticator.");
    db.prepare("INSERT INTO admin_owner (id, email, password_hash, totp_secret, last_totp_step, created_at) VALUES (1, ?, ?, ?, ?, ?)")
      .run(settings.email, setup.password_hash, setup.totp_secret, step, now);
    const recoveryCodes = Array.from({ length: 10 }, () => randomBytes(16).toString("hex").match(/.{8}/g)!.join("-"));
    const insertRecovery = db.prepare("INSERT INTO admin_recovery (code_hash, created_at) VALUES (?, ?)");
    for (const code of recoveryCodes) insertRecovery.run(digest(`recovery:${code.replaceAll("-", "")}`), now);
    db.prepare("INSERT INTO admin_meta (key, value) VALUES ('bootstrap_consumed', ?)").run(new Date(now).toISOString());
    db.prepare("DELETE FROM admin_setup").run();
    db.prepare("DELETE FROM admin_rate_limits").run();
    const session = createSessionRow(db, settings.email, now);
    return { recoveryCodes, session };
  });
}

export async function loginAdmin(input: { email: unknown; password: unknown; code: unknown; recovery?: unknown }): Promise<NewAdminSession> {
  const settings = getAdminSettings();
  consumeAdminAttempt("login-burst");
  const unauthorized = () => new AdminError(401, "Неверная почта, пароль или код подтверждения.");
  if (typeof input.email !== "string" || typeof input.password !== "string" || input.password.length > 128 || typeof input.code !== "string") throw unauthorized();
  const owner = getAdminDatabase().prepare("SELECT email, password_hash, totp_secret, last_totp_step FROM admin_owner WHERE id = 1").get() as OwnerRow | undefined;
  const passwordValid = await verifyAdminPassword(input.password, owner?.password_hash ?? DUMMY_HASH);
  if (!passwordValid || !owner || input.email.trim().toLowerCase() !== settings.email || owner.email !== settings.email) throw unauthorized();
  // Anonymous malformed requests and bad passwords must not lock the owner's 2FA.
  consumeAdminAttempt("login-factor");
  return withAdminTransaction((db) => {
    const now = Date.now();
    // TOTP state and recovery use are consumed atomically with session creation.
    const freshOwner = db.prepare("SELECT email, password_hash, totp_secret, last_totp_step FROM admin_owner WHERE id = 1").get() as OwnerRow | undefined;
    if (!freshOwner || freshOwner.password_hash !== owner.password_hash || freshOwner.email !== owner.email) throw unauthorized();
    if (input.recovery === true) {
      const normalized = (input.code as string).toLowerCase().replace(/[-\s]/g, "");
      if (!/^[a-f0-9]{32}$/.test(normalized)) throw unauthorized();
      const consumed = db.prepare("UPDATE admin_recovery SET used_at = ? WHERE code_hash = ? AND used_at IS NULL").run(now, digest(`recovery:${normalized}`));
      if (Number(consumed.changes) !== 1) throw unauthorized();
    } else {
      const step = validTotpStep(decryptTotp(freshOwner.totp_secret, settings), settings.email, input.code, now);
      if (step === null || step <= freshOwner.last_totp_step) throw unauthorized();
      db.prepare("UPDATE admin_owner SET last_totp_step = ? WHERE id = 1").run(step);
    }
    const session = createSessionRow(db, settings.email, now);
    db.prepare("DELETE FROM admin_rate_limits WHERE bucket = 'login-factor'").run();
    return session;
  });
}

export function adminCookieName(settings = getAdminSettings()): string {
  return settings.secure ? "__Host-posadmin_session" : "posadmin_session";
}

export function getAdminSession(request: Request): AdminSession | null {
  const settings = getAdminSettings();
  const name = adminCookieName(settings);
  const token = (request.headers.get("cookie") || "").split(";").map((entry) => entry.trim()).find((entry) => entry.startsWith(`${name}=`))?.slice(name.length + 1);
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const now = Date.now();
  return withAdminTransaction((db) => {
    const row = db.prepare(`SELECT s.email, s.expires_at, s.last_seen_at FROM admin_sessions s
      JOIN admin_owner a ON a.id = 1 AND a.email = s.email WHERE s.token_hash = ?`).get(digest(token)) as { email: string; expires_at: number; last_seen_at: number } | undefined;
    if (!row) return null;
    if (row.email !== settings.email || row.expires_at <= now || row.last_seen_at + SESSION_IDLE <= now) {
      db.prepare("DELETE FROM admin_sessions WHERE token_hash = ?").run(digest(token));
      return null;
    }
    db.prepare("UPDATE admin_sessions SET last_seen_at = ? WHERE token_hash = ?").run(now, digest(token));
    return { email: row.email, expiresAt: row.expires_at, tokenHash: digest(token) };
  });
}

export function requireAdminSession(request: Request): AdminSession {
  const session = getAdminSession(request);
  if (!session) throw new AdminError(401, "Войдите в админку заново.");
  return session;
}

export function revokeAdminSession(session: AdminSession): void {
  getAdminDatabase().prepare("DELETE FROM admin_sessions WHERE token_hash = ?").run(session.tokenHash);
}
