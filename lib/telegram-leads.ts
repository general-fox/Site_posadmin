import { readFileSync } from "node:fs";
import { join } from "node:path";

function parseLocalBotEnv(path: string): Record<string, string> {
  try {
    return Object.fromEntries(
      readFileSync(path, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => {
          const separator = line.indexOf("=");
          if (separator < 1) return ["", ""];
          return [
            line.slice(0, separator).trim(),
            line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, ""),
          ];
        })
        .filter(([key]) => key),
    );
  } catch {
    return {};
  }
}

/** Same environment names and local bot fallback as the callback endpoint. */
export function getTelegramLeadConfig() {
  let token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
  let chatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.ADMIN_CHAT_ID;

  if (!token || !chatId) {
    const localBotEnv = parseLocalBotEnv(join(process.cwd(), "bot", ".env"));
    token ||= localBotEnv.BOT_TOKEN;
    chatId ||= localBotEnv.ADMIN_CHAT_ID;
  }

  return { token, chatId };
}

export async function deliverTelegramLead(
  config: { token: string; chatId: string },
  message: string,
) {
  const response = await fetch(`https://api.telegram.org/bot${config.token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: config.chatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const result: unknown = await response.json().catch(() => null);

  if (!response.ok || typeof result !== "object" || result === null || !("ok" in result) || result.ok !== true) {
    // Never propagate the bot URL, Telegram response or user details into logs.
    throw new Error("Telegram delivery failed");
  }
}
