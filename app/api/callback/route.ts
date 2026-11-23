import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { getCalculationSummary } from "@/lib/calculation-request";
import { getProjectCalculation } from "@/lib/project-calculation";
import { validateCallbackSchedule } from "@/lib/callback-schedule";
import { parseCallbackSpecialist } from "@/lib/callback-specialist";
import { getPricingSnapshot } from "@/lib/pricing-store";
import { findRussianLocationLabel } from "@/lib/russian-locations";
import { deliverTelegramLead, getTelegramCallbackConfig } from "@/lib/telegram-leads";

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
  calculation?: unknown;
  projectEstimate?: unknown;
  pricingRevision?: unknown;
  specialist?: unknown;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
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
    const value: unknown = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid body");
    body = value as CallbackRequest;
  } catch {
    return NextResponse.json({ error: "Некорректные данные." }, { status: 400 });
  }

  if (typeof body.website === "string" && body.website) {
    return NextResponse.json({ ok: true });
  }

  const specialist = parseCallbackSpecialist(body.specialist);
  if (!specialist) {
    return NextResponse.json(
      { error: "Выберите менеджера или технического специалиста." },
      { status: 400 },
    );
  }

  const phone =
    typeof body.phone === "string"
      ? normalizeRussianPhone(body.phone)
      : null;
  const contactSoon = body.contactSoon === true;
  const consent = body.personalDataConsent === true;
  const date = typeof body.date === "string" ? body.date : "";
  const time = typeof body.time === "string" ? body.time : "";
  if (body.calculation !== undefined && body.projectEstimate !== undefined) {
    return NextResponse.json({ error: "Передайте один расчёт в заявке." }, { status: 400 });
  }
  const projectSummary = body.projectEstimate !== undefined ? getProjectCalculation(body.projectEstimate) : null;
  let calculation = null;
  if (body.calculation !== undefined) {
    try {
      const snapshot = getPricingSnapshot();
      if ((body.pricingRevision ?? 0) !== snapshot.revision) {
        return NextResponse.json({ error: "Цены обновились. Проверьте новый расчёт и отправьте заявку ещё раз.", snapshot }, { status: 409 });
      }
      calculation = getCalculationSummary(body.calculation, snapshot.config);
    } catch {
      return NextResponse.json({ error: "Не удалось проверить актуальные цены. Попробуйте позже." }, { status: 503 });
    }
  }

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

  if ((body.calculation !== undefined && !calculation) || (body.projectEstimate !== undefined && !projectSummary)) {
    return NextResponse.json(
      { error: "Не удалось проверить расчёт. Закройте форму и выберите услуги заново." },
      { status: 400 },
    );
  }

  const onsiteCity = calculation?.selection.product === "r_keeper" ? calculation.selection.otherCity : undefined;
  if (onsiteCity && !findRussianLocationLabel(onsiteCity)) {
    return NextResponse.json(
      { error: "Выберите город или регион из списка и отправьте заявку ещё раз." },
      { status: 400 },
    );
  }

  if (!contactSoon) {
    const scheduleError = validateCallbackSchedule(date, time);
    if (scheduleError) {
      return NextResponse.json(
        { error: scheduleError },
        { status: 400 },
      );
    }
  }

  const telegramConfig = getTelegramCallbackConfig(specialist);
  if (!telegramConfig?.token || !telegramConfig.chatId) {
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
    ? specialist === "technical"
      ? "Перезвонить по готовности специалиста"
      : "В ближайшее рабочее время: будни, 10:00–19:00 МСК"
    : `${date}, ${time} МСК`;
  const calculationText = calculation
    ? `\n\n<b>Расчёт: ${escapeHtml(calculation.productName)}</b>\n` +
      `<b>Рабочих мест:</b> ${calculation.workplaceCount}\n` +
      (calculation.locationLabel ? `<b>Город / регион:</b> ${escapeHtml(calculation.locationLabel)}\n` : "") +
      calculation.modules.map((module) => `• ${escapeHtml(module.name)} — ${module.monthlyPrice.toLocaleString("ru-RU")} ₽/мес.`).join("\n") +
      `\n<b>Итого:</b> ${calculation.monthlyTotal.toLocaleString("ru-RU")} ₽/мес.` +
      (calculation.onsiteByRequest ? "\n\n<b>Выездное сопровождение:</b> по запросу. Стоимость уточняется отдельно и не включена в расчёт." : "")
    : projectSummary
    ? `\n\n<b>Расчёт: запуск предприятия</b>\n` +
      `<b>Формат:</b> ${escapeHtml(projectSummary.estimate.concept.label)}\n` +
      `<b>Кассовых мест:</b> ${projectSummary.estimate.registers}\n` +
      projectSummary.estimate.items.map((item) => `• ${escapeHtml(item.title)} — ${item.quantity} × ${item.price.toLocaleString("ru-RU")} ₽ = ${item.total.toLocaleString("ru-RU")} ₽`).join("\n") +
      `\n<b>Итого:</b> ${projectSummary.estimate.total.toLocaleString("ru-RU")} ₽ (разово)` +
      (projectSummary.estimate.capabilities.length
        ? "\n\n<b>Дополнительные возможности — индивидуальный расчёт:</b>\n" +
          projectSummary.estimate.capabilities.map(({ title }) => `• ${escapeHtml(title)}`).join("\n") +
          "\nСтоимость не включена в сумму расчёта."
        : "")
    : "";
  const message =
    `🌐 <b>Новая заявка с сайта #${requestId}</b>\n\n` +
    `<b>Специалист:</b> ${specialist === "technical" ? "технический специалист (r_keeper)" : "менеджер"}\n` +
    `<b>Телефон:</b> ${escapeHtml(phone)}\n` +
    `<b>Когда связаться:</b> ${escapeHtml(preferredTime)}\n` +
    "<b>Источник:</b> форма обратного звонка на posadmin.ru" + calculationText;

  try {
    await deliverTelegramLead({ ...telegramConfig, token: telegramConfig.token, chatId: telegramConfig.chatId }, message);
  } catch {
    // Do not log exception details: fetch errors may contain the bot token URL.
    console.error("Callback request delivery failed.");
    return NextResponse.json(
      { error: "Не удалось отправить заявку. Попробуйте ещё раз." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, requestId });
}
