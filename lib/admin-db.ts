import "server-only";
import { chmodSync, existsSync, lstatSync, mkdirSync, realpathSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { DatabaseSync } from "node:sqlite";

/** This directory must live outside public assets and persist across deployments. */
export function getDataDirectory(): string {
  const configured = process.env.POSADMIN_DATA_DIR;
  if (process.env.NODE_ENV === "production" && (!configured || !isAbsolute(configured))) {
    throw new Error("An absolute POSADMIN_DATA_DIR is required in production.");
  }
  const directory = resolve(configured || join(process.cwd(), "private-data"));
  const unsafeSegment = directory.split(/[\\/]+/).some((part) =>
    /^(?:public|\.next(?:[-.].*)?|\.git|node_modules)$/i.test(part),
  );
  if (unsafeSegment || directory === resolve(process.cwd()) || directory === resolve(directory, "..")) {
    throw new Error("The admin database directory must be private.");
  }
  return directory;
}

type DatabaseCache = { path: string; connection: DatabaseSync };
const globals = globalThis as typeof globalThis & { posadminDatabase?: DatabaseCache };

export function getAdminDatabase(): DatabaseSync {
  const directory = getDataDirectory();
  const databasePath = join(directory, "posadmin.sqlite");
  if (globals.posadminDatabase?.path === databasePath) return globals.posadminDatabase.connection;
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const resolvedDirectory = realpathSync(directory);
  if (relative(directory, resolvedDirectory).split(sep).filter(Boolean).length !== 0) {
    throw new Error("The admin database directory cannot use a symbolic link.");
  }
  for (const file of [databasePath, `${databasePath}-wal`, `${databasePath}-shm`]) {
    // lstat also sees dangling links, which existsSync intentionally reports absent.
    const entry = lstatSync(file, { throwIfNoEntry: false });
    if (entry && !entry.isFile()) {
      throw new Error("The admin database and its sidecars must be regular files.");
    }
  }
  if (process.platform !== "win32") chmodSync(directory, 0o700);
  const db = new DatabaseSync(databasePath);
  try {
    db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
    db.exec(`
      CREATE TABLE IF NOT EXISTS admin_owner (
        id INTEGER PRIMARY KEY CHECK (id = 1), email TEXT NOT NULL,
        password_hash TEXT NOT NULL, totp_secret TEXT NOT NULL,
        last_totp_step INTEGER NOT NULL, created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS admin_setup (
        id TEXT PRIMARY KEY, password_hash TEXT NOT NULL, totp_secret TEXT NOT NULL,
        email TEXT NOT NULL, expires_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS admin_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS admin_recovery (
        code_hash TEXT PRIMARY KEY, created_at INTEGER NOT NULL, used_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS admin_sessions (
        token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS admin_rate_limits (
        bucket TEXT PRIMARY KEY, window_start INTEGER NOT NULL, attempts INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS pricing_current (
        id INTEGER PRIMARY KEY CHECK (id = 1), config_json TEXT NOT NULL,
        revision INTEGER NOT NULL CHECK (revision > 0), updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS pricing_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL, actor TEXT NOT NULL,
        revision INTEGER NOT NULL UNIQUE, before_json TEXT NOT NULL, config_json TEXT NOT NULL
      );
    `);
    if (process.platform !== "win32") {
      for (const file of [databasePath, `${databasePath}-wal`, `${databasePath}-shm`]) {
        if (existsSync(file)) chmodSync(file, 0o600);
      }
    }
  } catch (error) {
    db.close();
    throw error;
  }
  globals.posadminDatabase?.connection.close();
  globals.posadminDatabase = { path: databasePath, connection: db };
  return db;
}

/** Transactions contain synchronous SQLite work only; never await inside this callback. */
export function withAdminTransaction<T>(operation: (db: DatabaseSync) => T): T {
  const db = getAdminDatabase();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = operation(db);
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
