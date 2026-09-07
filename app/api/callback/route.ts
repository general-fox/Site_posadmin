import { randomInt } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const requestsByIp = new Map<string, number[]>();

type CallbackRequest = {
  contactSoon?: unknown;
  date?: unknown;
  personalDataConsent?: unknown;
  phone?: unknown;
  time?: unknown;
  website?: unknown;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function parseEnvFile(path: string) {
  try {
    return Object.fromEntries(
      readFileSync(path, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => {
          const separator = line.indexOf("=");
          if (separator < 1) return ["", ""];
          const key = line.slice(0, separator).trim();
          const value = line
            .slice(separator + 1)
            .trim()
            .replace(/^['"]|['"]$/g, "");
          return [key, value];
        })
        .filter(([key]) => key),
    );
  } catch {
    return {};
  }
}

function getTelegramConfig() {
  let token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
  let chatId =
    process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.ADMIN_CHAT_ID;

  if (!token || !chatId) {
    const localBotEnv = parseEnvFile(join(process.cwd(), "bot", ".env"));
    token ||= localBotEnv.BOT_TOKEN;
    chatId ||= localBotEnv.ADMIN_CHAT_ID;
  }

  return { chatId, token };
}

function normalizeRussianPhone(value: string) {
  const input = value.trim();
  if (!/^[+\d\s().-]+$/.test(input)) return null;

  const digits = input.replace(/\D/g, "");
  let nationalNumber: string;

  if (digits.length === 10) {
    nationalNumber = digits;
  } else if (
    digits.length === 11 &&
    (digits.startsWith("7") || digits.startsWith("8"))
  ) {
    nationalNumber = digits.slice(1);
  } else {
    return null;
  }

  if (!/^[3489]\d{9}$/.test(nationalNumber)) return null;
  return `+7${nationalNumber}`;
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const recent = (requestsByIp.get(ip) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );
  recent.push(now);
  requestsByIp.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX_REQUESTS;
}

function isValidDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function getCurrentMoscowDateTime() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
      minute: "2-digit",
      month: "2-digit",
      timeZone: "Europe/Moscow",
      year: "numeric",
    })
      .formatToParts(new Date())
      .map(({ type, value }) => [type, value]),
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте немного позже." },
      { status: 429 },
    );
  }

  let body: CallbackRequest;
  try {
    body = (await request.json()) as CallbackRequest;
  } catch {
    return NextResponse.json({ error: "Некорректные данные." }, { status: 400 });
  }

  if (typeof body.website === "string" && body.website) {
    return NextResponse.json({ ok: true });
  }

  const phone =
    typeof body.phone === "string"
      ? normalizeRussianPhone(body.phone)
      : null;
  const contactSoon = body.contactSoon === true;
  const consent = body.personalDataConsent === true;
  const date = typeof body.date === "string" ? body.date : "";
  const time = typeof body.time === "string" ? body.time : "";

  if (!phone) {
    return NextResponse.json(
      { error: "Проверьте правильность номера телефона." },
      { status: 400 },
    );
  }

  if (!consent) {
    return NextResponse.json(
      { error: "Необходимо согласие на обработку персональных данных." },
      { status: 400 },
    );
  }

  if (!contactSoon && (!isValidDate(date) || !isValidTime(time))) {
    return NextResponse.json(
      { error: "Выберите удобные дату и время." },
      { status: 400 },
    );
  }

  if (!contactSoon) {
    const current = getCurrentMoscowDateTime();
    if (
      date < current.date ||
      (date === current.date && time < current.time)
    ) {
      return NextResponse.json(
        { error: "Выберите дату и время не раньше текущих." },
        { status: 400 },
      );
    }
  }

  const { chatId, token } = getTelegramConfig();
  if (!token || !chatId) {
    console.error("Telegram callback configuration is missing.");
    return NextResponse.json(
      { error: "Сервис временно недоступен. Попробуйте позже." },
      { status: 503 },
    );
  }

  const requestId = `WEB-${Date.now().toString(36).toUpperCase()}-${randomInt(
    10,
    100,
  )}`;
  const preferredTime = contactSoon
    ? "В ближайшее рабочее время"
    : `${date}, ${time}`;
  const message =
    `🌐 <b>Новая заявка с сайта #${requestId}</b>\n\n` +
    `<b>Телефон:</b> ${escapeHtml(phone)}\n` +
    `<b>Когда связаться:</b> ${escapeHtml(preferredTime)}\n` +
    "<b>Источник:</b> форма обратного звонка на posadmin.ru";

  try {
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        body: JSON.stringify({
          chat_id: chatId,
          disable_web_page_preview: true,
          parse_mode: "HTML",
          text: message,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!telegramResponse.ok) {
      const result = (await telegramResponse.json().catch(() => null)) as
        | { description?: string }
        | null;
      console.error(
        "Telegram callback delivery failed:",
        result?.description || telegramResponse.status,
      );
      throw new Error("Telegram delivery failed");
    }
  } catch (error) {
    console.error("Callback request delivery failed:", error);
    return NextResponse.json(
      { error: "Не удалось отправить заявку. Попробуйте ещё раз." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, requestId });
}
