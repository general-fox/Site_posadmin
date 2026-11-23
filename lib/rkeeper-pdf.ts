import { readFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import pdfMake from "pdfmake";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import type { RkeeperCalculation } from "@/lib/rkeeper-pricing";
import type { ItAdministrationCalculation } from "@/lib/it-administration-pricing";
import { CALCULATION_PDF_CONFIG } from "@/lib/calculation-pdf-config";

// Opaque equivalents of the website colors for screen and print.
const COLORS = {
  accent: "#2563EB",
  paper: "#FFFFFF",
  neutral: "#F4F4F3",
  selected: "#ECEEF1",
  ink: "#1D1D1F",
  muted: "#595D63",
};

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const PAGE_LEFT = 36;
const CONTENT_WIDTH = 523;
const SERVICE_TOP = 153;
const CONTINUATION_TOP = 88;
const SERVICE_BOTTOM = 763;
const BLOCK_GAP = 16;
const CONSULTATION_HEIGHT = 152;
const LEGAL_HEIGHT = 119;

export type RkeeperPdfData = {
  calculation: RkeeperCalculation;
  calculationNumber: string;
  generatedAt: Date;
};

export type ItAdministrationPdfData = {
  calculation: ItAdministrationCalculation;
  calculationNumber: string;
  generatedAt: Date;
};

type ServiceCard = {
  label: string;
  module: { name: string; features: string[]; monthlyPrice: number };
};

type ServicePage = { cards: ServiceCard[]; includeSupport: boolean };

type OverviewPageData = {
  generatedAt: Date;
  title: string;
  monthlyTotal: number;
  workplaceCount: number;
  workplaceSubtitle: string;
};

type CalculationDocumentData = {
  calculationNumber: string;
  overview: OverviewPageData;
  serviceCards: ServiceCard[];
  metadataTitle: string;
  metadataSubject: string;
};

let pdfMakeConfigured = false;

function configurePdfMake() {
  if (pdfMakeConfigured) return;
  const projectRoot = resolve(process.cwd());
  const fontRoot = join(projectRoot, "assets", "fonts", "pdf");
  const regular = join(fontRoot, "Inter-Regular.ttf");
  const medium = join(fontRoot, "Inter-Medium.ttf");
  pdfMake.setFonts({
    Inter: { normal: regular, bold: medium, italics: regular, bolditalics: medium },
    InterMedium: { normal: medium, bold: medium, italics: medium, bolditalics: medium },
  });
  pdfMake.setUrlAccessPolicy(() => false);
  pdfMake.setLocalAccessPolicy((filePath) => {
    const resolvedPath = resolve(filePath);
    return resolvedPath === projectRoot || resolvedPath.startsWith(`${projectRoot}${sep}`);
  });
  pdfMakeConfigured = true;
}

function currency(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function date(value: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Moscow",
  }).format(value);
}

function workplaceLabel(value: number) {
  const lastTwo = value % 100;
  const last = value % 10;
  const noun = lastTwo >= 11 && lastTwo <= 14 ? "рабочих мест"
    : last === 1 ? "рабочее место" : last >= 2 && last <= 4 ? "рабочих места" : "рабочих мест";
  return `${value} ${noun}`;
}

function positioned(x: number, y: number, content: Content): Content {
  return Object.assign({}, content as object, { absolutePosition: { x, y } }) as Content;
}

function textAt(x: number, y: number, text: string, options: Record<string, unknown> = {}): Content {
  const { width = CONTENT_WIDTH, ...textOptions } = options;
  return positioned(x, y, {
    columns: [{ width, text, fontSize: 10.5, lineHeight: 1.25, ...textOptions }],
    columnGap: 0,
  } as Content);
}

function rectAt(x: number, y: number, width: number, height: number, color: string): Content {
  return positioned(x, y, { canvas: [{
    type: "rect", x: 0, y: 0, w: width, h: height, r: 14, color,
  }] });
}

function dotAt(x: number, y: number, radius = 2): Content {
  return positioned(x - radius, y - radius, {
    canvas: [{ type: "ellipse", x: radius, y: radius, r1: radius, r2: radius, color: COLORS.accent }],
  });
}

// Conservative word wrapping reserves space for long module names and makes
// the layout independent of how many optional modules the visitor selected.
function linesFor(text: string, width: number, fontSize: number) {
  let lines = 0;
  for (const paragraph of text.split("\n")) {
    let used = 0;
    lines += 1;
    for (const word of paragraph.split(/\s+/)) {
      const wordWidth = [...word].reduce((sum, letter) => sum +
        (/[ilI1.,:;!|]/.test(letter) ? 0.3 : /[ЖШЩМW@]/.test(letter) ? 0.92 : 0.61), 0) * fontSize;
      const next = used ? used + fontSize * 0.3 + wordWidth : wordWidth;
      if (used && next > width) { lines += 1; used = wordWidth; }
      else used = next;
    }
  }
  return lines;
}

function header(logo: string, calculationNumber: string): Content[] {
  return [
    positioned(PAGE_LEFT, 34, { svg: logo, width: 101, height: 15.73 }),
    textAt(326, 34, `Расчёт № ${calculationNumber}`, { width: 233, alignment: "right", fontSize: 9, color: COLORS.muted }),
  ];
}

function footer(page: number, total: number): Content[] {
  return [
    textAt(PAGE_LEFT, 804, CALCULATION_PDF_CONFIG.siteLabel, {
      width: 96, fontSize: 9, color: COLORS.ink, link: CALCULATION_PDF_CONFIG.siteUrl,
    }),
    textAt(150, 805, "Предварительный расчёт · не является публичной офертой", {
      width: 348, fontSize: 8, color: COLORS.muted,
    }),
    textAt(511, 804, `${page} / ${total}`, { width: 48, fontSize: 9, color: COLORS.muted, alignment: "right" }),
  ];
}

function pageOneContent(data: OverviewPageData): Content[] {
  const content: Content[] = [
    dotAt(PAGE_LEFT + 2, 89),
    textAt(PAGE_LEFT + 13, 84, "ВАШЕ СОПРОВОЖДЕНИЕ", { fontSize: 8, characterSpacing: 1.1, color: COLORS.muted }),
    textAt(PAGE_LEFT, 104, data.title, { fontSize: 32, lineHeight: 1.1 }),
    textAt(PAGE_LEFT, 156, `Сформирован ${date(data.generatedAt)}`, { width: 245, fontSize: 9, color: COLORS.muted }),
    textAt(315, 156, `Актуален ${CALCULATION_PDF_CONFIG.validityDays} календарных дней`, { width: 244, alignment: "right", fontSize: 9, color: COLORS.muted }),
    rectAt(PAGE_LEFT, 184, CONTENT_WIDTH, 124, COLORS.selected),
    textAt(56, 204, "Предварительная стоимость", { width: 293, fontSize: 10, color: COLORS.muted }),
    textAt(56, 227, `${currency(data.monthlyTotal)} ₽`, { width: 310, fontSize: 33 }),
    textAt(57, 276, "в месяц", { width: 200, fontSize: 10, color: COLORS.muted }),
    rectAt(374, 203, 165, 86, COLORS.paper),
    dotAt(391, 235),
    textAt(399, 228, workplaceLabel(data.workplaceCount), { width: 126, font: "InterMedium", fontSize: 12 }),
    textAt(399, 251, data.workplaceSubtitle, { width: 126, fontSize: 9, color: COLORS.muted }),
  ];

  let cursor = 341;
  content.push(textAt(PAGE_LEFT, cursor, "Условия расчёта", { font: "InterMedium", fontSize: 15 }));
  cursor += 29;
  for (const condition of CALCULATION_PDF_CONFIG.conditions) {
    content.push(dotAt(PAGE_LEFT + 2, cursor + 6), textAt(PAGE_LEFT + 13, cursor, condition, { width: 510, fontSize: 9.5 }));
    cursor += linesFor(condition, 510, 9.5) * 12.9 + 6;
  }
  cursor += 12;
  content.push(
    rectAt(PAGE_LEFT, cursor, CONTENT_WIDTH, 70, COLORS.neutral),
    textAt(PAGE_LEFT + 15, cursor + 12, "Важно", { width: 493, font: "InterMedium", fontSize: 10 }),
    textAt(PAGE_LEFT + 15, cursor + 30, CALCULATION_PDF_CONFIG.importantNote, { width: 493, fontSize: 9.5 }),
  );
  return content;
}

function serviceCardHeight(card: ServiceCard) {
  const headerHeight = Math.max(40, linesFor(card.label, 317, 14) * 18 + 12);
  const featureHeight = card.module.features.reduce((height, feature) => height + linesFor(feature, 479, 10.5) * 14.2 + 4, 0);
  return 18 + headerHeight + 13 + featureHeight + 13;
}

function serviceCardContent(card: ServiceCard, y: number): Content[] {
  const headerHeight = Math.max(40, linesFor(card.label, 317, 14) * 18 + 12);
  const content: Content[] = [
    rectAt(PAGE_LEFT, y, CONTENT_WIDTH, serviceCardHeight(card), COLORS.neutral),
    textAt(PAGE_LEFT + 17, y + 17, card.label, { width: 317, font: "InterMedium", fontSize: 14 }),
    textAt(390, y + 16, `${currency(card.module.monthlyPrice)} ₽`, { width: 151, font: "InterMedium", fontSize: 18, alignment: "right" }),
    textAt(390, y + 41, "в месяц", { width: 151, fontSize: 9, color: COLORS.muted, alignment: "right" }),
  ];
  let cursor = y + 18 + headerHeight + 13;
  for (const feature of card.module.features) {
    content.push(dotAt(PAGE_LEFT + 19, cursor + 6), textAt(PAGE_LEFT + 30, cursor, feature, { width: 476, fontSize: 10.5, color: COLORS.muted }));
    cursor += linesFor(feature, 479, 10.5) * 14.2 + 4;
  }
  return content;
}

function consultationContent(y: number): Content[] {
  const qrX = 446;
  const qrY = y + 21;
  return [
    rectAt(PAGE_LEFT, y, CONTENT_WIDTH, CONSULTATION_HEIGHT, COLORS.neutral),
    textAt(54, y + 20, "Обсудим вашу конфигурацию", { width: 355, font: "InterMedium", fontSize: 17, color: COLORS.ink }),
    textAt(54, y + 48, "Специалист проверит расчёт и подготовит\nитоговое предложение для вашего проекта.", { width: 345, fontSize: 10.5, color: COLORS.muted }),
    textAt(54, y + 89, "Написать менеджеру в Telegram", { width: 355, link: CALCULATION_PDF_CONFIG.telegramUrl, font: "InterMedium", fontSize: 11, color: COLORS.accent }),
    textAt(54, y + 111, CALCULATION_PDF_CONFIG.phone, { width: 220, link: `tel:${CALCULATION_PDF_CONFIG.phone.replace(/\D/g, "")}`, fontSize: 10.5, color: COLORS.ink }),
    textAt(54, y + 130, "По будням с 10:00 до 19:00", { width: 355, fontSize: 8.5, color: COLORS.muted }),
    // A native vector QR with a four-module quiet zone remains crisp in print.
    positioned(qrX, qrY, { qr: CALCULATION_PDF_CONFIG.telegramUrl, fit: 70, padding: 4, eccLevel: "M", foreground: COLORS.ink, background: COLORS.paper }),
    // Native QR nodes have no link annotation; the transparent overlay makes
    // the complete code (including its quiet zone) clickable in PDF viewers.
    positioned(qrX, qrY, {
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90"><rect width="90" height="90" fill="#FFFFFF" fill-opacity="0"/></svg>',
      width: 90, height: 90, link: CALCULATION_PDF_CONFIG.telegramUrl,
    }),
    textAt(qrX - 4, y + 113, "Менеджер Posadmin", { width: 94, alignment: "center", fontSize: 8, color: COLORS.muted, link: CALCULATION_PDF_CONFIG.telegramUrl }),
  ];
}

function legalContent(y: number): Content[] {
  return [
    textAt(PAGE_LEFT, y + 3, "Юридическая информация", { font: "InterMedium", fontSize: 10.5 }),
    textAt(PAGE_LEFT, y + 25, CALCULATION_PDF_CONFIG.legalNotice, { width: CONTENT_WIDTH, fontSize: 9, lineHeight: 1.35, color: COLORS.muted }),
  ];
}

function planServicePages(cards: ServiceCard[]): ServicePage[] {
  const pages: ServicePage[] = [];
  const availableHeight = () => SERVICE_BOTTOM - (pages.length === 0 ? SERVICE_TOP : CONTINUATION_TOP);
  let page: ServicePage = { cards: [], includeSupport: false };
  let height = 0;
  for (const card of cards) {
    const required = (page.cards.length ? BLOCK_GAP : 0) + serviceCardHeight(card);
    if (height + required > availableHeight() && page.cards.length) {
      pages.push(page);
      page = { cards: [], includeSupport: false };
      height = 0;
    }
    height += (page.cards.length ? BLOCK_GAP : 0) + serviceCardHeight(card);
    page.cards.push(card);
  }
  const supportHeight = (page.cards.length ? BLOCK_GAP : 0) + CONSULTATION_HEIGHT + BLOCK_GAP + LEGAL_HEIGHT;
  if (height + supportHeight > availableHeight()) {
    if (page.cards.length) pages.push(page);
    page = { cards: [], includeSupport: true };
  } else page.includeSupport = true;
  pages.push(page);
  return pages;
}

function servicePageContent(page: ServicePage, index: number): Content[] {
  const hasCards = page.cards.length > 0;
  const showHeading = index === 0 || !hasCards;
  const content: Content[] = showHeading ? [
    textAt(PAGE_LEFT, 87, hasCards ? "Состав сопровождения" : "Следующий шаг", { font: "InterMedium", fontSize: 27 }),
    textAt(PAGE_LEFT, 126, hasCards
      ? "Что входит в выбранную конфигурацию"
      : "Уточним детали и подготовим итоговое предложение", { fontSize: 10, color: COLORS.muted }),
  ] : [];
  let cursor = showHeading ? SERVICE_TOP : CONTINUATION_TOP;
  page.cards.forEach((card, cardIndex) => {
    if (cardIndex) cursor += BLOCK_GAP;
    content.push(...serviceCardContent(card, cursor));
    cursor += serviceCardHeight(card);
  });
  if (page.includeSupport) {
    if (hasCards) cursor += BLOCK_GAP;
    content.push(...consultationContent(cursor));
    content.push(...legalContent(cursor + CONSULTATION_HEIGHT + 23));
  }
  return content;
}

function buildDocumentDefinition(data: CalculationDocumentData): TDocumentDefinitions {
  const logo = readFileSync(join(process.cwd(), "assets", "pdf", "posadmin-logo.svg"), "utf8")
    .replaceAll("#322F2F", COLORS.ink)
    .replaceAll("#E66026", COLORS.accent);
  const pages = planServicePages(data.serviceCards);
  const total = pages.length + 1;
  const content: Content[] = [...header(logo, data.calculationNumber), ...footer(1, total), ...pageOneContent(data.overview)];
  pages.forEach((page, index) => {
    content.push({ text: "", fontSize: 1, pageBreak: "before" });
    content.push(...header(logo, data.calculationNumber), ...footer(index + 2, total), ...servicePageContent(page, index));
  });
  return {
    pageSize: { width: PAGE_WIDTH, height: PAGE_HEIGHT }, pageMargins: [0, 0, 0, 0], compress: true,
    defaultStyle: { font: "Inter", color: COLORS.ink },
    info: { title: `${data.metadataTitle} ${data.calculationNumber}`, author: "Posadmin", subject: data.metadataSubject, creator: "Калькулятор Posadmin" },
    content,
  };
}

function getRkeeperDocumentData(data: RkeeperPdfData): CalculationDocumentData {
  const { calculation } = data;
  return {
    calculationNumber: data.calculationNumber,
    overview: {
      generatedAt: data.generatedAt, title: "Сопровождение r_keeper",
      monthlyTotal: calculation.monthlyTotal, workplaceCount: calculation.workplaceCount, workplaceSubtitle: "кассира / официанта",
    },
    serviceCards: [{ label: "Базовый модуль", module: calculation.baseModule }, ...calculation.additionalModules.map((module) => ({ label: module.name, module }))],
    metadataTitle: "Предварительный расчёт r_keeper",
    metadataSubject: "Предварительный расчёт стоимости сопровождения r_keeper",
  };
}

function getItAdministrationDocumentData(data: ItAdministrationPdfData): CalculationDocumentData {
  const { calculation } = data;
  return {
    calculationNumber: data.calculationNumber,
    overview: {
      generatedAt: data.generatedAt, title: "IT-сопровождение",
      monthlyTotal: calculation.monthlyTotal, workplaceCount: calculation.workplaceCount, workplaceSubtitle: "сотрудников",
    },
    serviceCards: calculation.selectedModules.map((module) => ({ label: module.name, module })),
    metadataTitle: "Предварительный расчёт IT-сопровождения",
    metadataSubject: "Предварительный расчёт стоимости IT-сопровождения",
  };
}

export async function createRkeeperPdf(data: RkeeperPdfData) {
  configurePdfMake();
  return pdfMake.createPdf(buildDocumentDefinition(getRkeeperDocumentData(data))).getBuffer();
}

export async function createItAdministrationPdf(data: ItAdministrationPdfData) {
  configurePdfMake();
  return pdfMake.createPdf(buildDocumentDefinition(getItAdministrationDocumentData(data))).getBuffer();
}
