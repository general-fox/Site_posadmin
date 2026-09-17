import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { buildProjectRequestMessage, validateProjectRequest } from "@/lib/project-request";
import { deliverTelegramLead, getTelegramLeadConfig } from "@/lib/telegram-leads";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const MAX_RATE_LIMIT_CLIENTS = 10_000;
const requestsByIp = new Map<string, number[]>();

function isRateLimited(ip: string) {
  const now = Date.now();
  if (requestsByIp.size >= MAX_RATE_LIMIT_CLIENTS && !requestsByIp.has(ip)) {
    for (const [key, timestamps] of requestsByIp) {
      if (now - timestamps[timestamps.length - 1] >= RATE_LIMIT_WINDOW_MS) {
        requestsByIp.delete(key);
      }
    }
    // Keep memory bounded even when many unique addresses hit one instance.
    if (requestsByIp.size >= MAX_RATE_LIMIT_CLIENTS) return true;
  }

  const recent = (requestsByIp.get(ip) || []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestsByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  requestsByIp.set(ip, recent);
  return false;
}

class PayloadTooLargeError extends Error {}

async function readBody(request: Request): Promise<unknown> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && Number(declaredLength) > MAX_BODY_BYTES) {
    throw new PayloadTooLargeError();
  }
  if (!request.body) throw new Error("Missing request body");

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let text = "";
  let length = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new PayloadTooLargeError();
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text) as unknown;
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  const ip = (request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip") || "local").slice(0, 128);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте немного позже." },
      { status: 429, headers: { "Retry-After": String(RATE_LIMIT_WINDOW_MS / 1000) } },
    );
  }

  let body: unknown;
  try {
    body = await readBody(request);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof PayloadTooLargeError ? "Заявка слишком большая. Сократите описание." : "Некорректные данные заявки." },
      { status: error instanceof PayloadTooLargeError ? 413 : 400 },
    );
  }

  const validation = validateProjectRequest(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error, field: validation.field }, { status: 400 });
  }

  const requestId = `PRJ-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
  if (validation.honeypot) return NextResponse.json({ ok: true, requestId });

  const { token, chatId } = getTelegramLeadConfig();
  if (!token || !chatId) {
    console.error("Telegram project request configuration is missing.");
    return NextResponse.json({ error: "Сервис временно недоступен. Попробуйте позже." }, { status: 503 });
  }

  try {
    await deliverTelegramLead({ token, chatId }, buildProjectRequestMessage(validation.data, requestId));
  } catch {
    // Fetch exceptions can include the token-bearing URL: log only a fixed label.
    console.error("Telegram project request delivery failed.");
    return NextResponse.json({ error: "Не удалось отправить заявку. Попробуйте ещё раз." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, requestId });
}
