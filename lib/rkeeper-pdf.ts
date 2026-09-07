import { readFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import pdfMake from "pdfmake";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import type { RkeeperCalculation } from "@/lib/rkeeper-pricing";
import type { ItAdministrationCalculation } from "@/lib/it-administration-pricing";
import { CALCULATION_PDF_CONFIG } from "@/lib/calculation-pdf-config";

const COLORS = {
  accent: "#E66026",
  background: "#F5F5ED",
  border: "#D5D5C8",
  card: "#E6E6DE",
  dark: "#322F2F",
  muted: "#646565",
  note: "#F4E6D9",
  noteHeading: "#9A431F",
  light: "#F5F5ED",
};

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const PAGE_LEFT = 35;
const CONTENT_WIDTH = 525;
const SERVICE_TOP = 156.015;
const SERVICE_BOTTOM = 759.701;
const BLOCK_GAP = 24.299;
const CONSULTATION_HEIGHT = 148.087;
const LEGAL_HEIGHT = 143;
const FADE_LINE_HEIGHT = 0.5;

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

type PdfModule = {
  name: string;
  features: string[];
  monthlyPrice: number;
};

type ServiceCard = {
  label: string;
  module: PdfModule;
  appearance: "outlined" | "filled";
};

type ServicePage = {
  cards: ServiceCard[];
  includeSupport: boolean;
};

type OverviewPageData = {
  generatedAt: Date;
  title: string;
  monthlyTotal: number;
  workplaceCount: number;
  workplaceSubtitle: string;
  parameterRows: Array<[string, string]>;
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
  const interRegular = join(fontRoot, "Inter-Regular.ttf");
  const interMedium = join(fontRoot, "Inter-Medium.ttf");
  const interSemiBold = join(fontRoot, "Inter-SemiBold.ttf");
  const interDisplayBold = join(fontRoot, "InterDisplay-Bold.ttf");
  const montserratRegular = join(fontRoot, "Montserrat-Regular.ttf");
  const montserratBold = join(fontRoot, "Montserrat-Bold.ttf");

  pdfMake.setFonts({
    Inter: {
      normal: interRegular,
      bold: interSemiBold,
      italics: interRegular,
      bolditalics: interSemiBold,
    },
    InterMedium: {
      normal: interMedium,
      bold: interMedium,
      italics: interMedium,
      bolditalics: interMedium,
    },
    InterDisplay: {
      normal: interDisplayBold,
      bold: interDisplayBold,
      italics: interDisplayBold,
      bolditalics: interDisplayBold,
    },
    Montserrat: {
      normal: montserratRegular,
      bold: montserratBold,
      italics: montserratRegular,
      bolditalics: montserratBold,
    },
  });
  pdfMake.setUrlAccessPolicy(() => false);
  pdfMake.setLocalAccessPolicy((filePath) => {
    const resolvedPath = resolve(filePath);
    return (
      resolvedPath === projectRoot ||
      resolvedPath.startsWith(`${projectRoot}${sep}`)
    );
  });
  pdfMakeConfigured = true;
}

function getLogoSvg() {
  return readFileSync(
    join(process.cwd(), "assets", "pdf", "posadmin-logo.svg"),
    "utf8",
  );
}

function getTelegramQrPath() {
  return join(process.cwd(), "assets", "pdf", "telegram-qr.png");
}

function getFadeLineSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="525" height="1" viewBox="0 0 525 1" preserveAspectRatio="none">
    <defs>
      <linearGradient id="fade-line" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="525" y2="0">
        <stop offset="0%" stop-color="#474441" stop-opacity="0"/>
        <stop offset="12%" stop-color="#474441" stop-opacity="0.07"/>
        <stop offset="35%" stop-color="#474441" stop-opacity="0.18"/>
        <stop offset="50%" stop-color="#474441" stop-opacity="0.22"/>
        <stop offset="65%" stop-color="#474441" stop-opacity="0.18"/>
        <stop offset="88%" stop-color="#474441" stop-opacity="0.07"/>
        <stop offset="100%" stop-color="#474441" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="M0 0.5 H525" fill="none" stroke="url(#fade-line)" stroke-width="0.5"/>
  </svg>`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function formatDate(value: Date) {
  return `${new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Moscow",
  }).format(value)} г.`;
}

function getWorkplaceLabel(value: number) {
  const lastTwoDigits = value % 100;
  const lastDigit = value % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${value} рабочих мест`;
  }
  if (lastDigit === 1) return `${value} рабочее место`;
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${value} рабочих места`;
  }
  return `${value} рабочих мест`;
}

function positioned(x: number, y: number, content: Content): Content {
  return Object.assign({}, content as object, {
    absolutePosition: { x, y },
  }) as Content;
}

function textAt(
  x: number,
  y: number,
  text: string,
  options: Record<string, unknown> = {},
): Content {
  const { width, ...textOptions } = options;

  if (typeof width === "number" || typeof width === "string") {
    return positioned(x, y, {
      columns: [
        {
          width,
          text,
          ...textOptions,
        },
      ],
      columnGap: 0,
    } as Content);
  }

  return positioned(x, y, { text, ...textOptions } as Content);
}

function rectAt(
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    color?: string;
    lineColor?: string;
    lineWidth?: number;
    radius?: number;
  } = {},
): Content {
  return positioned(x, y, {
    canvas: [
      {
        type: "rect",
        x: 0,
        y: 0,
        w: width,
        h: height,
        r: options.radius ?? 0,
        ...(options.color ? { color: options.color } : {}),
        ...(options.lineColor
          ? {
              lineColor: options.lineColor,
              lineWidth: options.lineWidth ?? 1,
            }
          : {}),
      },
    ],
  });
}

function lineAt(
  x: number,
  y: number,
  width: number,
  lineColor = COLORS.border,
  lineWidth = 0.75,
): Content {
  return positioned(x, y, {
    canvas: [
      {
        type: "line",
        x1: 0,
        y1: 0,
        x2: width,
        y2: 0,
        lineColor,
        lineWidth,
      },
    ],
  });
}

function dotAt(x: number, y: number, color = COLORS.accent): Content {
  return positioned(x - 2, y - 2, {
    canvas: [
      {
        type: "ellipse",
        x: 2,
        y: 2,
        r1: 2,
        r2: 2,
        color,
      },
    ],
  });
}

function buildHeader(
  logoSvg: string,
  fadeLineSvg: string,
  calculationNumber: string,
  currentPage: number,
  pageCount: number,
): Content {
  return positioned(PAGE_LEFT, 40, {
    stack: [
      {
        table: {
          widths: [155, 215, 155],
          body: [
            [
              { svg: logoSvg, width: 98.978, height: 15.417 },
              { text: "" },
              {
                text: `Расчёт № ${calculationNumber} · ${currentPage}/${pageCount}`,
                alignment: "center",
                color: COLORS.muted,
                font: "Inter",
                fontSize: 9.5,
                characterSpacing: 0.2,
                lineHeight: 1.2,
                margin: [0, 1.708, 0, 0],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0,
        },
      },
      {
        margin: [0, 5, 0, 0],
        svg: fadeLineSvg,
        width: CONTENT_WIDTH,
        height: FADE_LINE_HEIGHT,
      },
    ],
  });
}

function buildFooter(fadeLineSvg: string): Content {
  return positioned(PAGE_LEFT, 784, {
    stack: [
      {
        svg: fadeLineSvg,
        width: CONTENT_WIDTH,
        height: FADE_LINE_HEIGHT,
      },
      {
        margin: [0, 4.25, 0, 0],
        table: {
          widths: [153, 67, 305],
          body: [
            [
              {
                text: CALCULATION_PDF_CONFIG.siteLabel,
                link: CALCULATION_PDF_CONFIG.siteUrl,
                color: COLORS.muted,
                font: "Inter",
                fontSize: 11,
                characterSpacing: 0.2,
                lineHeight: 1.18,
              },
              { text: "" },
              {
                text: "Предварительный расчёт · не является публичной офертой",
                alignment: "center",
                color: COLORS.muted,
                font: "Inter",
                fontSize: 10,
                characterSpacing: 0.2,
                lineHeight: 1.2,
                margin: [0, 0.5, 0, 0],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0,
        },
      },
    ],
  });
}

function pageOneContent(data: OverviewPageData): Content[] {
  const { parameterRows } = data;
  const parameterRowY = [370.05, 393.05, 416.05, 439.05];
  const conditionY = [530.367, 547.367, 564.367, 594.367];

  const content: Content[] = [
    textAt(
      PAGE_LEFT,
      80.417,
      data.title,
      {
        width: CONTENT_WIDTH,
        font: "InterDisplay",
        fontSize: 24,
        lineHeight: 1.25,
        characterSpacing: 1,
        color: COLORS.dark,
      },
    ),
    textAt(
      PAGE_LEFT,
      145.417,
      `Сформирован ${formatDate(data.generatedAt)}`,
      {
        width: 180,
        font: "Inter",
        fontSize: 10,
        lineHeight: 1.2,
        characterSpacing: 0.2,
        color: COLORS.muted,
      },
    ),
    textAt(
      352,
      145.417,
      `Актуален в течение ${CALCULATION_PDF_CONFIG.validityDays} календарных дней`,
      {
        width: 208,
        alignment: "right",
        font: "Inter",
        fontSize: 10,
        lineHeight: 1.2,
        characterSpacing: 0.2,
        color: COLORS.muted,
      },
    ),
    rectAt(PAGE_LEFT, 195.734, CONTENT_WIDTH, 103, {
      color: COLORS.card,
      radius: 15,
    }),
    rectAt(409, 210.734, 136, 73, {
      color: COLORS.accent,
      radius: 12,
    }),
    textAt(PAGE_LEFT + 15, 210.734, "ПРЕДВАРИТЕЛЬНАЯ СТОИМОСТЬ", {
      width: 344,
      font: "InterMedium",
      fontSize: 10,
      lineHeight: 1.2,
      characterSpacing: 0.2,
      color: COLORS.muted,
    }),
    positioned(PAGE_LEFT + 15, 232.734, {
      columns: [
        {
          width: "auto",
          text: `${formatCurrency(data.monthlyTotal)} ₽`,
          font: "Montserrat",
          bold: true,
          fontSize: 24,
          lineHeight: 1.208,
          color: COLORS.accent,
        },
        {
          width: "auto",
          text: "в месяц",
          font: "Montserrat",
          fontSize: 12,
          lineHeight: 1.25,
          color: COLORS.muted,
          margin: [5, 7, 0, 0],
        },
      ],
      columnGap: 0,
    }),
    textAt(
      PAGE_LEFT + 15,
      271.734,
      "Предварительный расчёт · не является публичной офертой",
      {
        width: 344,
        font: "Inter",
        fontSize: 10,
        lineHeight: 1.2,
        characterSpacing: 0.2,
        color: COLORS.muted,
      },
    ),
    textAt(409, 228.734, getWorkplaceLabel(data.workplaceCount), {
      width: 136,
      alignment: "center",
      font: "Inter",
      bold: true,
      fontSize: 12,
      lineHeight: 1.25,
      characterSpacing: 0.2,
      color: COLORS.light,
    }),
    textAt(409, 253.734, data.workplaceSubtitle, {
      width: 136,
      alignment: "center",
      font: "Inter",
      fontSize: 10,
      lineHeight: 1.2,
      characterSpacing: 0.2,
      color: COLORS.light,
    }),
    textAt(PAGE_LEFT, 337.05, "Параметры расчёта", {
      width: CONTENT_WIDTH,
      font: "InterDisplay",
      fontSize: 15,
      lineHeight: 1.2,
      characterSpacing: 0.2,
      color: COLORS.dark,
    }),
    lineAt(PAGE_LEFT, 388.05, CONTENT_WIDTH),
    lineAt(PAGE_LEFT, 411.05, CONTENT_WIDTH),
    lineAt(PAGE_LEFT, 434.05, CONTENT_WIDTH),
    textAt(PAGE_LEFT, 490.367, "Условия расчёта", {
      width: CONTENT_WIDTH,
      font: "InterDisplay",
      fontSize: 15,
      lineHeight: 1.2,
      characterSpacing: 0.2,
      color: COLORS.dark,
    }),
    rectAt(PAGE_LEFT, 662.683, CONTENT_WIDTH, 83, {
      color: COLORS.note,
      radius: 15,
    }),
    textAt(PAGE_LEFT + 15, 677.683, "Важно", {
      width: 495,
      font: "Inter",
      bold: true,
      fontSize: 11,
      lineHeight: 1.18,
      characterSpacing: 0.1,
      color: COLORS.noteHeading,
    }),
    textAt(PAGE_LEFT + 15, 700.683, CALCULATION_PDF_CONFIG.importantNote, {
      width: 495,
      font: "Inter",
      fontSize: 10,
      lineHeight: 1.5,
      characterSpacing: 0.1,
      color: COLORS.dark,
    }),
  ];

  parameterRows.forEach(([label, value], index) => {
    content.push(
      textAt(PAGE_LEFT, parameterRowY[index], label, {
        width: 257.5,
        font: "Inter",
        fontSize: 11,
        lineHeight: 1.18,
        characterSpacing: 0.2,
        color: COLORS.muted,
      }),
      textAt(302.5, parameterRowY[index], value, {
        width: 257.5,
        font: "Inter",
        fontSize: 11,
        lineHeight: 1.18,
        characterSpacing: 0.2,
        color: COLORS.muted,
      }),
    );
  });

  CALCULATION_PDF_CONFIG.conditions.forEach((condition, index) => {
    content.push(
      dotAt(PAGE_LEFT + 2, conditionY[index] + 6.5),
      textAt(PAGE_LEFT + 14, conditionY[index], condition, {
        width: 511,
        font: "Inter",
        fontSize: 11,
        lineHeight: 1.18,
        characterSpacing: 0.2,
        color: COLORS.dark,
      }),
    );
  });

  return content;
}

function serviceCardHeight(card: ServiceCard) {
  const headerLines = card.label.length > 40 ? 2 : 1;
  return 74 + card.module.features.length * 19 + (headerLines - 1) * 18;
}

function serviceCardContent(card: ServiceCard, y: number): Content[] {
  const height = serviceCardHeight(card);
  const headerLines = card.label.length > 40 ? 2 : 1;
  const headerExtra = (headerLines - 1) * 18;
  const price = `${formatCurrency(card.module.monthlyPrice)} ₽/мес.`;
  const content: Content[] = [
    rectAt(
      PAGE_LEFT,
      y,
      CONTENT_WIDTH,
      height,
      card.appearance === "outlined"
        ? {
            lineColor: COLORS.border,
            lineWidth: 1,
            radius: 15,
          }
        : {
            color: COLORS.card,
            radius: 15,
          },
    ),
    textAt(PAGE_LEFT + 16, y + 18, card.label, {
      width: 340,
      font: "InterDisplay",
      fontSize: 15,
      lineHeight: 1.2,
      characterSpacing: 0.2,
      color: COLORS.dark,
    }),
    textAt(399, y + 16, price, {
      width: 145,
      alignment: "right",
      font: "Montserrat",
      bold: true,
      fontSize: 18,
      lineHeight: 1.222,
      color: COLORS.accent,
    }),
    lineAt(PAGE_LEFT + 16, y + 48 + headerExtra, 493),
  ];

  card.module.features.forEach((feature, index) => {
    const rowTop = y + 58 + headerExtra + index * 19;
    content.push(
      dotAt(PAGE_LEFT + 18, rowTop + 9.5),
      textAt(PAGE_LEFT + 30, rowTop + 3, feature, {
        width: 479,
        font: "Inter",
        fontSize: 11,
        lineHeight: 1.18,
        characterSpacing: 0.2,
        color: COLORS.muted,
      }),
    );
  });

  return content;
}

function consultationContent(y: number, telegramQrPath: string): Content[] {
  return [
    rectAt(PAGE_LEFT, y, CONTENT_WIDTH, CONSULTATION_HEIGHT, {
      color: COLORS.dark,
      radius: 11,
    }),
    textAt(PAGE_LEFT + 15, y + 47.044, "Нужна консультация по расчёту?", {
      width: 250,
      font: "InterDisplay",
      fontSize: 15,
      lineHeight: 1.2,
      characterSpacing: 0.2,
      color: COLORS.light,
    }),
    textAt(
      PAGE_LEFT + 15,
      y + 75.044,
      "Специалист проверит конфигурацию и подготовит итоговое предложение.",
      {
        width: 250,
        font: "Inter",
        fontSize: 11,
        lineHeight: 1.18,
        characterSpacing: 0.5,
        color: COLORS.light,
      },
    ),
    textAt(451, y + 15, CALCULATION_PDF_CONFIG.phone, {
      width: 94,
      font: "Inter",
      fontSize: 10,
      lineHeight: 1.2,
      characterSpacing: 0.2,
      color: COLORS.light,
    }),
    textAt(451, y + 32, CALCULATION_PDF_CONFIG.siteLabel, {
      width: 94,
      link: CALCULATION_PDF_CONFIG.siteUrl,
      font: "Inter",
      fontSize: 10,
      lineHeight: 1.2,
      characterSpacing: 0.2,
      color: COLORS.light,
    }),
    positioned(451, y + 49, {
      image: telegramQrPath,
      width: 72,
      height: 72.087,
      link: CALCULATION_PDF_CONFIG.telegramUrl,
    }),
    textAt(451, y + 121.087, "telegram", {
      width: 72,
      alignment: "center",
      link: CALCULATION_PDF_CONFIG.telegramUrl,
      font: "Inter",
      fontSize: 10,
      lineHeight: 1.2,
      characterSpacing: 0.2,
      color: COLORS.light,
    }),
  ];
}

function legalContent(y: number): Content[] {
  return [
    rectAt(PAGE_LEFT, y, CONTENT_WIDTH, LEGAL_HEIGHT, {
      color: COLORS.note,
      radius: 15,
    }),
    textAt(PAGE_LEFT + 15, y + 15, "Юридическая информация", {
      width: 495,
      font: "Inter",
      bold: true,
      fontSize: 11,
      lineHeight: 1.18,
      characterSpacing: 0.1,
      color: COLORS.noteHeading,
    }),
    textAt(PAGE_LEFT + 15, y + 38, CALCULATION_PDF_CONFIG.legalNotice, {
      width: 495,
      font: "Inter",
      fontSize: 10,
      lineHeight: 1.24,
      characterSpacing: 0.1,
      color: COLORS.dark,
    }),
  ];
}

function planServicePages(cards: ServiceCard[]): ServicePage[] {
  const availableHeight = SERVICE_BOTTOM - SERVICE_TOP;
  const supportHeight =
    BLOCK_GAP + CONSULTATION_HEIGHT + BLOCK_GAP + LEGAL_HEIGHT;

  if (cards.length === 0) {
    return [{ cards: [], includeSupport: true }];
  }

  if (cards.length === 1) {
    return [{ cards, includeSupport: true }];
  }

  const pages: ServicePage[] = [];
  const preludeCards = cards.slice(0, -1);
  let currentCards: ServiceCard[] = [];
  let currentHeight = 0;

  preludeCards.forEach((card) => {
    const height = serviceCardHeight(card);
    const requiredHeight = currentCards.length ? BLOCK_GAP + height : height;

    if (currentCards.length && currentHeight + requiredHeight > availableHeight) {
      pages.push({ cards: currentCards, includeSupport: false });
      currentCards = [card];
      currentHeight = height;
      return;
    }

    currentCards.push(card);
    currentHeight += requiredHeight;
  });

  if (currentCards.length) {
    pages.push({ cards: currentCards, includeSupport: false });
  }

  const finalCard = cards[cards.length - 1];
  if (serviceCardHeight(finalCard) + supportHeight <= availableHeight) {
    pages.push({ cards: [finalCard], includeSupport: true });
  } else {
    pages.push({ cards: [finalCard], includeSupport: false });
    pages.push({ cards: [], includeSupport: true });
  }

  return pages;
}

function servicePageContent(
  page: ServicePage,
  servicePageIndex: number,
  telegramQrPath: string,
): Content[] {
  const content: Content[] = [
    textAt(PAGE_LEFT, 84.716, "Состав услуг", {
      width: CONTENT_WIDTH,
      font: "InterDisplay",
      fontSize: 24,
      lineHeight: 1.25,
      characterSpacing: 1,
      color: COLORS.dark,
    }),
    textAt(
      PAGE_LEFT,
      119.716,
      page.cards.length === 0
        ? "Модули не выбраны"
        : servicePageIndex === 0
          ? "Детализация выбранной конфигурации"
          : "Продолжение выбранной конфигурации",
      {
        width: 300,
        font: "Inter",
        fontSize: 10,
        lineHeight: 1.2,
        characterSpacing: 0.2,
        color: COLORS.muted,
      },
    ),
  ];

  let cursorY = SERVICE_TOP;
  page.cards.forEach((card, index) => {
    if (index > 0) cursorY += BLOCK_GAP;
    content.push(...serviceCardContent(card, cursorY));
    cursorY += serviceCardHeight(card);
  });

  if (page.includeSupport) {
    if (page.cards.length) cursorY += BLOCK_GAP;
    content.push(...consultationContent(cursorY, telegramQrPath));
    cursorY += CONSULTATION_HEIGHT + BLOCK_GAP;
    content.push(...legalContent(cursorY));
  }

  return content;
}

function buildDocumentDefinition(
  data: CalculationDocumentData,
): TDocumentDefinitions {
  const logoSvg = getLogoSvg();
  const telegramQrPath = getTelegramQrPath();
  const fadeLineSvg = getFadeLineSvg();
  const servicePages = planServicePages(data.serviceCards);
  const pageCount = servicePages.length + 1;
  const content: Content[] = [
    buildHeader(
      logoSvg,
      fadeLineSvg,
      data.calculationNumber,
      1,
      pageCount,
    ),
    buildFooter(fadeLineSvg),
    ...pageOneContent(data.overview),
  ];

  servicePages.forEach((page, index) => {
    content.push({ text: "", fontSize: 1, pageBreak: "before" });
    content.push(
      buildHeader(
        logoSvg,
        fadeLineSvg,
        data.calculationNumber,
        index + 2,
        pageCount,
      ),
      buildFooter(fadeLineSvg),
    );
    content.push(...servicePageContent(page, index, telegramQrPath));
  });

  return {
    pageSize: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
    pageMargins: [0, 0, 0, 0],
    compress: true,
    defaultStyle: {
      font: "Inter",
      color: COLORS.dark,
    },
    info: {
      title: `${data.metadataTitle} ${data.calculationNumber}`,
      author: "Posadmin",
      subject: data.metadataSubject,
      creator: "Калькулятор Posadmin",
    },
    background: {
      canvas: [
        {
          type: "rect",
          x: 0,
          y: 0,
          w: PAGE_WIDTH,
          h: PAGE_HEIGHT,
          color: COLORS.background,
        },
      ],
    },
    content,
  };
}

function getRkeeperDocumentData(
  data: RkeeperPdfData,
): CalculationDocumentData {
  const { calculation } = data;
  const additionalModules = calculation.additionalModules.length
    ? calculation.additionalModules.map((module) => module.name).join(", ")
    : "Не выбраны";

  return {
    calculationNumber: data.calculationNumber,
    overview: {
      generatedAt: data.generatedAt,
      title: "Предварительный расчёт стоимости сопровождения r_keeper",
      monthlyTotal: calculation.monthlyTotal,
      workplaceCount: calculation.workplaceCount,
      workplaceSubtitle: "кассира / официанта",
      parameterRows: [
        ["Программный продукт", calculation.product.name],
        [
          "Рабочие места кассира / официанта",
          String(calculation.workplaceCount),
        ],
        [
          "Базовый модуль",
          calculation.baseModule.name.replace(" r_keeper", ""),
        ],
        ["Дополнительные модули", additionalModules],
      ],
    },
    serviceCards: [
      {
        label: "Базовый модуль",
        module: calculation.baseModule,
        appearance: "outlined",
      },
      ...calculation.additionalModules.map((module) => ({
        label: module.name,
        module,
        appearance: "filled" as const,
      })),
    ],
    metadataTitle: "Предварительный расчёт r_keeper",
    metadataSubject:
      "Предварительный расчёт стоимости сопровождения r_keeper",
  };
}

function getItAdministrationDocumentData(
  data: ItAdministrationPdfData,
): CalculationDocumentData {
  const { calculation } = data;
  const selectedModules = calculation.selectedModules.length
    ? calculation.selectedModules.map((module) => module.name).join(", ")
    : "Не выбраны";

  return {
    calculationNumber: data.calculationNumber,
    overview: {
      generatedAt: data.generatedAt,
      title:
        "Предварительный расчёт стоимости Системного IT администрирования",
      monthlyTotal: calculation.monthlyTotal,
      workplaceCount: calculation.workplaceCount,
      workplaceSubtitle: "сотрудников",
      parameterRows: [
        ["Направление", calculation.product.name],
        ["Рабочие места сотрудников", String(calculation.workplaceCount)],
        ["Выбранные модули", selectedModules],
        [
          "Предварительная стоимость",
          `${formatCurrency(calculation.monthlyTotal)} ₽/мес.`,
        ],
      ],
    },
    serviceCards: calculation.selectedModules.map((module) => ({
      label: module.name,
      module,
      appearance: "filled" as const,
    })),
    metadataTitle: "Предварительный расчёт IT администрирования",
    metadataSubject:
      "Предварительный расчёт стоимости Системного IT администрирования",
  };
}

export async function createRkeeperPdf(data: RkeeperPdfData) {
  configurePdfMake();
  return pdfMake
    .createPdf(buildDocumentDefinition(getRkeeperDocumentData(data)))
    .getBuffer();
}

export async function createItAdministrationPdf(
  data: ItAdministrationPdfData,
) {
  configurePdfMake();
  return pdfMake
    .createPdf(buildDocumentDefinition(getItAdministrationDocumentData(data)))
    .getBuffer();
}
