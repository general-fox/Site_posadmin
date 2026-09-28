import "server-only";
import { getAdminDatabase, withAdminTransaction } from "./admin-db";
import { DEFAULT_PRICING, validatePricingConfig, type PricingConfig } from "./pricing-config";

export type PricingSnapshot = { config: PricingConfig; revision: number; updatedAt: string | null };
export type PricingHistoryEntry = { id: number; createdAt: string; actor: string; revision: number; config: PricingConfig };
type PricingRow = { config_json: string; revision: number; updated_at: string };

export class PricingConflictError extends Error {
  constructor() { super("Прайс уже изменён. Обновите данные перед сохранением."); }
}

function parseStoredConfig(serialized: string): PricingConfig {
  const validated = validatePricingConfig(JSON.parse(serialized));
  if (!validated.ok) throw new Error("The stored price list is invalid.");
  return validated.value;
}

function defaultSnapshot(): PricingSnapshot {
  return { config: structuredClone(DEFAULT_PRICING), revision: 0, updatedAt: null };
}

export function getPricingSnapshot(): PricingSnapshot {
  // A public site can be previewed/built before admin hosting is configured.
  // Once a directory is configured, storage errors must never silently reset prices.
  if (process.env.NODE_ENV === "production" && !process.env.POSADMIN_DATA_DIR) return defaultSnapshot();
  const row = getAdminDatabase().prepare("SELECT config_json, revision, updated_at FROM pricing_current WHERE id = 1").get() as PricingRow | undefined;
  return row ? { config: parseStoredConfig(row.config_json), revision: row.revision, updatedAt: row.updated_at } : defaultSnapshot();
}

export function savePricing(config: PricingConfig, expectedRevision: number, actor: string): PricingSnapshot {
  const validated = validatePricingConfig(config);
  if (!validated.ok) throw new TypeError(validated.error);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || !actor) throw new TypeError("Некорректная версия прайса.");
  return withAdminTransaction((db) => {
    const current = db.prepare("SELECT config_json, revision, updated_at FROM pricing_current WHERE id = 1").get() as PricingRow | undefined;
    if ((current?.revision ?? 0) !== expectedRevision) throw new PricingConflictError();
    const revision = expectedRevision + 1;
    const updatedAt = new Date().toISOString();
    const configJson = JSON.stringify(validated.value);
    db.prepare(`INSERT INTO pricing_current (id, config_json, revision, updated_at) VALUES (1, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET config_json = excluded.config_json, revision = excluded.revision, updated_at = excluded.updated_at`)
      .run(configJson, revision, updatedAt);
    db.prepare("INSERT INTO pricing_history (created_at, actor, revision, before_json, config_json) VALUES (?, ?, ?, ?, ?)")
      .run(updatedAt, actor, revision, current?.config_json ?? JSON.stringify(DEFAULT_PRICING), configJson);
    return { config: validated.value, revision, updatedAt };
  });
}

export function getPricingHistory(): PricingHistoryEntry[] {
  const db = getAdminDatabase();
  const rows = db.prepare("SELECT id, created_at, actor, revision, config_json FROM pricing_history ORDER BY id DESC LIMIT 50").all() as Array<{
    id: number; created_at: string; actor: string; revision: number; config_json: string;
  }>;
  const history = rows.map((row) => ({ id: row.id, createdAt: row.created_at, actor: row.actor, revision: row.revision, config: parseStoredConfig(row.config_json) }));
  // Keep the original prices restorable even after revision 1 leaves the last 50 saves.
  // The baseline reflects the real first audit record, not potentially changed code defaults.
  const firstSave = db.prepare("SELECT created_at, before_json FROM pricing_history WHERE revision = 1").get() as {
    created_at: string; before_json: string;
  } | undefined;
  if (firstSave) {
    history.push({ id: 0, createdAt: firstSave.created_at, actor: "Исходный прайс", revision: 0, config: parseStoredConfig(firstSave.before_json) });
  }
  return history;
}
