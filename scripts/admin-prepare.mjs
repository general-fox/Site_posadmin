// Creates setup credentials locally. Never prints keys or creates an account.
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync, lstatSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
nextEnv.loadEnvConfig(root, process.env.NODE_ENV !== "production");
const envFile = path.join(root, ".env.local");
if (lstatSync(envFile, { throwIfNoEntry: false }) && !lstatSync(envFile).isFile()) throw new Error("Файл окружения должен быть обычным файлом.");
const existing = existsSync(envFile) ? readFileSync(envFile, "utf8") : "";
const origin = process.env.ADMIN_ORIGIN || "http://localhost:3000";
const url = new URL(origin);
if (url.origin !== origin || (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname))) throw new Error("ADMIN_ORIGIN должен быть HTTPS-адресом сайта или localhost без пути.");
if (process.env.NODE_ENV === "production" && (!process.env.POSADMIN_DATA_DIR || !path.isAbsolute(process.env.POSADMIN_DATA_DIR) || url.protocol !== "https:")) throw new Error("Для сервера задайте HTTPS ADMIN_ORIGIN и абсолютный POSADMIN_DATA_DIR на постоянном диске.");
const dataDir = path.resolve(process.env.POSADMIN_DATA_DIR || path.join(root, "private-data"));
if (dataDir.split(/[\\/]+/).some((part) => /^(?:public|\.next(?:[-.].*)?|\.git|node_modules)$/i.test(part)) || dataDir === root || dataDir === path.resolve(dataDir, "..")) throw new Error("Папка базы должна находиться вне public и папок сборки.");
mkdirSync(dataDir, { recursive: true, mode: 0o700 });
if (path.relative(dataDir, realpathSync(dataDir)).split(path.sep).filter(Boolean).length || lstatSync(dataDir).isSymbolicLink()) throw new Error("Папка базы не должна использовать символические ссылки или junction.");
if (process.platform !== "win32") chmodSync(dataDir, 0o700);
const setupFile = path.join(dataDir, "admin-setup-link.txt");
if (lstatSync(setupFile, { throwIfNoEntry: false }) && !lstatSync(setupFile).isFile()) throw new Error("Файл первоначальной настройки должен быть обычным файлом.");
const values = {
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "a230495k@gmail.com",
  ADMIN_ORIGIN: origin,
  POSADMIN_DATA_DIR: dataDir.replaceAll("\\", "/"),
  ADMIN_ENCRYPTION_KEY: process.env.ADMIN_ENCRYPTION_KEY || randomBytes(32).toString("base64"),
  ADMIN_BOOTSTRAP_TOKEN: process.env.ADMIN_BOOTSTRAP_TOKEN || randomBytes(32).toString("hex"),
};
let content = existing;
for (const [key, value] of Object.entries(values)) {
  if (process.env[key]) continue;
  const expression = new RegExp(`^${key}=.*$`, "m");
  const entry = `${key}=${value}`;
  content = expression.test(content) ? content.replace(expression, entry) : content + (content.endsWith("\n") || !content ? "" : "\n") + entry + "\n";
}
if (content !== existing) writeFileSync(envFile, content, { mode: 0o600 });
if (process.platform !== "win32" && existsSync(envFile)) chmodSync(envFile, 0o600);
writeFileSync(setupFile, `Первичная настройка Posadmin\n\n${origin}/admin#setup=${values.ADMIN_BOOTSTRAP_TOKEN}\n\nОткройте ссылку самостоятельно. Задайте пароль, добавьте QR-код в Google Authenticator и сохраните резервные коды. Не передавайте эту ссылку другим. После настройки удалите этот файл и ADMIN_BOOTSTRAP_TOKEN из окружения.\n`, { mode: 0o600 });
console.log(`Настройка подготовлена. Перезапустите сайт и откройте ссылку из файла: ${setupFile}`);
console.log("Пароль и Authenticator настраиваются вами в браузере. Секреты в консоль не выводятся.");
