"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { WaveWords } from "@/components/wave-words";
import { useParallaxAnimationCycle } from "@/components/full-page-parallax";
import { ItAdminVisual } from "@/components/it-admin-visual";
import { CallbackDialog } from "@/components/callback-dialog";
import { useHydratedReducedMotion } from "@/components/use-hydrated-reduced-motion";
import {
  calculateRkeeperPricing,
  RKEEPER_PRODUCT_ID,
  RKEEPER_TARIFF,
  type RkeeperAdditionalModuleId,
} from "@/lib/rkeeper-pricing";
import {
  calculateItAdministrationPricing,
  getItAdministrationModulePrice,
  IT_ADMINISTRATION_MODULE_ID,
  IT_ADMINISTRATION_PRODUCT_ID,
  IT_ADMINISTRATION_TARIFF,
  type ItAdministrationModuleId,
} from "@/lib/it-administration-pricing";

type TariffCardProps = {
  title: string;
  features: string[];
  price: string;
  action?: "Убрать" | "Добавить";
  base?: boolean;
  intro?: string;
  variant?: "module" | "it";
  onAction?: () => void;
  disabled?: boolean;
};

type PdfDownloadStatus = "idle" | "loading" | "success" | "error" | "empty";

const currencyFormatter = new Intl.NumberFormat("ru-RU");
const tariffWaveEase = [0.33, 1, 0.68, 1] as const;
const tariffOpenEase = [0.22, 1, 0.36, 1] as const;

const tariffShellEntrance = {
  hidden: { opacity: 0, x: -84 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      opacity: { duration: 0.28, delay: 0.08, ease: tariffWaveEase },
      x: {
        type: "spring" as const,
        stiffness: 185,
        damping: 16,
        mass: 0.85,
        delay: 0.08,
      },
    },
  },
};

const tariffShellOpen = {
  hidden: { clipPath: "inset(0 65.17% 0 0 round 20px)" },
  visible: {
    clipPath: "inset(0 0% 0 0 round 20px)",
    transition: { duration: 0.8, delay: 0.58, ease: tariffOpenEase },
  },
};

const baseBadgeReveal = {
  hidden: { opacity: 0, y: "115%" },
  visible: {
    opacity: 1,
    y: "0%",
    transition: { duration: 0.78, delay: 0.08, ease: tariffWaveEase },
  },
};

const firstModuleContentReveal = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, delay: 0.72, ease: tariffOpenEase },
  },
};

const secondModuleContentReveal = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, delay: 0.84, ease: tariffOpenEase },
  },
};

const dividerReveal = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, delay: 0.8, ease: tariffOpenEase },
  },
};

const additionalBadgeReveal = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: 0.72, ease: tariffOpenEase },
  },
};

function formatMonthlyPrice(price: number, additive = false) {
  return `${additive ? "+" : ""}${currencyFormatter.format(price)} ₽/мес.`;
}

function trackCalculatorEvent(
  event: "calculator_pdf_click" | "calculator_pdf_success" | "calculator_pdf_error",
  product: string,
  payload: {
    workplaceCount: number;
    additionalModulesCount: number;
    monthlyTotal: number;
  },
) {
  const analyticsWindow = window as Window & {
    dataLayer?: Array<Record<string, unknown>>;
  };

  analyticsWindow.dataLayer?.push({
    event,
    product,
    ...payload,
  });
}

async function downloadCalculationPdf(
  endpoint: string,
  body: Record<string, unknown>,
  fallbackFileName: string,
) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error("PDF generation failed");

  const pdfBlob = await response.blob();
  if (pdfBlob.type !== "application/pdf") {
    throw new Error("Unexpected PDF response");
  }

  const contentDisposition = response.headers.get("Content-Disposition") ?? "";
  const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  const fileName = fileNameMatch?.[1] ?? fallbackFileName;
  const downloadUrl = URL.createObjectURL(pdfBlob);
  const downloadLink = document.createElement("a");
  downloadLink.href = downloadUrl;
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1_000);
}

function WorkplacesPrompt({
  value,
  onChange,
  disabled = false,
  label = "Укажите количество рабочих мест кассира и официанта",
  inputLabel = "Количество рабочих мест кассира и официанта",
}: {
  value?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  label?: string;
  inputLabel?: string;
}) {
  const interactive = value !== undefined && onChange !== undefined;
  const [draftValue, setDraftValue] = useState(
    value === undefined ? "1" : String(value),
  );

  useEffect(() => {
    if (value !== undefined) setDraftValue(String(value));
  }, [value]);

  const commitValue = (nextValue: number) => {
    if (!onChange) return;
    const normalizedValue = Math.max(1, Math.floor(nextValue));
    setDraftValue(String(normalizedValue));
    onChange(normalizedValue);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 text-center">
      <span className="relative h-6 w-6 shrink-0 overflow-hidden" aria-hidden="true">
        <img
          alt=""
          className="h-6 w-6 object-contain"
          height="24"
          src="/pricing-lightning.svg"
          width="24"
        />
      </span>
      <span className="font-[family-name:var(--font-inter)] text-[14px] font-normal leading-[21px] tracking-[0.1px] text-[rgba(49,50,53,0.72)] [font-variation-settings:normal] sm:text-[16px] sm:leading-[24px] sm:tracking-[0.15px]">
        {label}
      </span>
      {interactive ? (
        <span className="pricing-remove-btn flex h-[34px] items-center overflow-hidden rounded-[50px] font-[family-name:var(--font-montserrat)] text-[16px] font-semibold leading-[normal] tracking-normal [font-variation-settings:normal]">
          <button
            aria-label="Уменьшить количество рабочих мест"
            className="flex h-full w-8 items-center justify-center text-[18px] transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
            disabled={disabled || value <= 1}
            onClick={() => commitValue(value - 1)}
            type="button"
          >
            −
          </button>
          <input
            aria-label={inputLabel}
            className="pricing-workplaces-input h-full w-11 border-x border-[rgba(230,96,38,0.2)] bg-transparent text-center outline-none"
            inputMode="numeric"
            min={1}
            disabled={disabled}
            onChange={(event) => {
              const nextDraftValue = event.currentTarget.value;
              setDraftValue(nextDraftValue);
              if (nextDraftValue === "") return;

              const nextValue = event.currentTarget.valueAsNumber;
              if (!Number.isFinite(nextValue) || nextValue <= 0) {
                commitValue(1);
                return;
              }
              commitValue(nextValue);
            }}
            onBlur={() => {
              if (draftValue === "") commitValue(1);
            }}
            type="number"
            value={draftValue}
          />
          <button
            aria-label="Увеличить количество рабочих мест"
            className="flex h-full w-8 items-center justify-center text-[18px] disabled:cursor-not-allowed disabled:opacity-30"
            disabled={disabled}
            onClick={() => commitValue(value + 1)}
            type="button"
          >
            +
          </button>
        </span>
      ) : (
        <span className="pricing-remove-btn flex h-[30px] min-w-[42px] items-center justify-center rounded-[50px] px-3 font-[family-name:var(--font-montserrat)] text-[16px] font-semibold leading-[normal] tracking-normal [font-variation-settings:normal]">
          1
        </span>
      )}
    </div>
  );
}

function FeatureList({ features, base = false, flush = false }: { features: string[]; base?: boolean; flush?: boolean }) {
  return (
    <ul className={base ? "mt-[11px] text-[14px] leading-5 tracking-[0.2px] text-[#646565]" : `${flush ? "mt-0" : "mt-5"} text-[14px] leading-5 tracking-[0.2px] text-[#646565]`}>
      {features.map((feature) => (
        <li className="flex items-center gap-2.5 py-[5px]" key={feature}>
          <span
            className={base ? "h-[7px] w-[9px] shrink-0 overflow-hidden" : "h-[6px] w-[6px] shrink-0 overflow-hidden"}
            aria-hidden="true"
          >
            <img
              alt=""
              className="h-full w-full object-contain"
              height={base ? 7 : 6}
              src={base ? "/pricing-check.svg" : "/pricing-bullet.svg"}
              width={base ? 9 : 6}
            />
          </span>
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

function TariffCard({ title, features, price, action, base, intro, variant = "module", onAction, disabled = false }: TariffCardProps) {
  const isIncluded = Boolean(base) || action === "Убрать";
  const displayedPrice = isIncluded ? price.replace(/^\+/, "") : price;
  const cardClass = base
    ? "flex min-h-[653px] flex-col overflow-hidden rounded-[20px] border border-[#d5d5c8] bg-[#f5f5ed] px-[25px] py-[35px]"
    : variant === "it"
      ? "flex min-h-[531px] flex-col overflow-hidden rounded-[20px] bg-[#e6e6de] px-[25px] py-[35px]"
      : "flex min-h-[653px] flex-col overflow-hidden px-[25px] py-[35px] min-[1248px]:px-0";

  return (
    <article className={cardClass}>
      <h3 className="max-w-[367px] text-[18px] font-medium leading-[25px] tracking-[0.1px] text-[#322f2f]">
        {title}
      </h3>
      {intro ? <p className="mt-5 py-[5px] text-[14px] leading-5 tracking-[0.2px] text-[#646565]">{intro}</p> : null}
      <FeatureList features={features} base={base} flush={Boolean(intro)} />
      <div className="relative mt-auto pt-6">
        <img alt="" aria-hidden="true" className="absolute left-0 top-0 h-px w-full" src="/pricing-divider.svg" />
        <p
          className={`${isIncluded ? "text-[#e66026]" : "text-[#322f2f]"} text-center font-[family-name:var(--font-montserrat)] text-[24px] font-semibold leading-[normal] tracking-normal transition-colors duration-200`}
        >
          {displayedPrice}
        </p>
        {base ? (
          <p className="mt-5 text-[13px] leading-5 tracking-[0.2px] text-[#686764]">
            *Базовый минимальный тариф включает обязательный набор услуг
          </p>
        ) : action ? (
          <div className="mt-6 flex justify-end">
            <button
              aria-pressed={isIncluded}
              className={`${action === "Добавить" ? "pricing-add-btn" : "pricing-remove-btn"} flex items-center justify-center rounded-[50px] px-[28px] py-[8px] font-[family-name:var(--font-montserrat)] text-[14px] font-medium leading-normal whitespace-nowrap`}
              disabled={disabled}
              onClick={onAction}
              type="button"
            >
              {action}
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function PricingFooter({
  total,
  className = "mt-6",
  onCallbackRequest,
  onPdfDownload,
  pdfStatus = "idle",
}: {
  total: string;
  className?: string;
  onCallbackRequest: () => void;
  onPdfDownload?: () => void;
  pdfStatus?: PdfDownloadStatus;
}) {
  const feedback =
    pdfStatus === "success"
      ? "Расчёт сформирован и скачан"
      : pdfStatus === "empty"
        ? "Услуги не выбраны"
      : pdfStatus === "error"
        ? "Не удалось сформировать PDF. Попробуйте ещё раз."
        : null;
  const feedbackColor =
    pdfStatus === "error"
      ? "text-[#a53d16]"
      : pdfStatus === "empty"
        ? "text-[#e66026]"
        : "text-[#646565]";

  return (
    <div className={`${className} flex flex-col gap-6 px-0 font-[family-name:var(--font-montserrat)] sm:flex-row sm:items-center sm:justify-between sm:px-[25px]`}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-[25px]">
          <button
            className="light-glass-btn flex items-center justify-center rounded-[50px] px-[28px] py-[8px] text-[14px] font-medium leading-normal whitespace-nowrap text-[#322f2f]"
            onClick={onCallbackRequest}
            type="button"
          >
            Запросить звонок
          </button>
          {onPdfDownload ? (
            <button
              className="flex min-h-9 items-center gap-2 text-[14px] font-medium leading-[normal] text-[#646565] transition-colors hover:text-[#e66026] disabled:cursor-wait disabled:opacity-65"
              disabled={pdfStatus === "loading"}
              onClick={onPdfDownload}
              type="button"
            >
              {pdfStatus === "loading" ? (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-[#d5d5c8] border-t-[#e66026]"
                />
              ) : null}
              {pdfStatus === "loading" ? "Формируем PDF…" : "Скачать PDF"}
            </button>
          ) : null}
        </div>
        {onPdfDownload ? (
          <p
            aria-live="polite"
            className={`${feedbackColor} min-h-4 text-[12px] leading-4`}
            role="status"
          >
            {feedback ?? ""}
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-end gap-[15px]">
        <span className="text-[24px] font-medium leading-[normal] text-[#6d6b69]">Итог</span>
        <strong className="text-[28px] font-semibold leading-[normal] text-[#e66026]">{total}</strong>
      </div>
    </div>
  );
}

export function SupportPricingSection() {
  const reduced = useHydratedReducedMotion();
  const animationCycle = useParallaxAnimationCycle();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingInView = useInView(headingRef, { amount: 0.5 });
  const headingPlayedCycle = useRef<number | null>(null);
  const [headingWaveKey, setHeadingWaveKey] = useState(0);
  const [workplaces, setWorkplaces] = useState(1);
  const [menuIncluded, setMenuIncluded] = useState(false);
  const [onsiteIncluded, setOnsiteIncluded] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<PdfDownloadStatus>("idle");
  const [itWorkplaces, setItWorkplaces] = useState(1);
  const [itIncluded, setItIncluded] = useState(false);
  const [itPdfStatus, setItPdfStatus] =
    useState<PdfDownloadStatus>("idle");
  const [callbackDialogOpen, setCallbackDialogOpen] = useState(false);
  const selectedAdditionalModuleIds: RkeeperAdditionalModuleId[] = [];
  if (menuIncluded) selectedAdditionalModuleIds.push("menu-and-dictionaries");
  if (onsiteIncluded) {
    selectedAdditionalModuleIds.push("onsite-hardware-support");
  }
  const rkeeperCalculation = calculateRkeeperPricing(
    workplaces,
    selectedAdditionalModuleIds,
  );
  const selectedItModuleIds: ItAdministrationModuleId[] = itIncluded
    ? [IT_ADMINISTRATION_MODULE_ID]
    : [];
  const itCalculation = calculateItAdministrationPricing(
    itWorkplaces,
    selectedItModuleIds,
  );
  const modulePrice = rkeeperCalculation.baseModule.monthlyPrice;
  const itAdministrationPrice =
    getItAdministrationModulePrice(itWorkplaces);
  const totalPrice = rkeeperCalculation.monthlyTotal;
  const itTotalPrice = itCalculation.monthlyTotal;
  const rkeeperPdfLoading = pdfStatus === "loading";
  const itPdfLoading = itPdfStatus === "loading";

  const handlePdfDownload = async () => {
    const analyticsPayload = {
      workplaceCount: workplaces,
      additionalModulesCount: selectedAdditionalModuleIds.length,
      monthlyTotal: totalPrice,
    };

    setPdfStatus("loading");
    trackCalculatorEvent(
      "calculator_pdf_click",
      RKEEPER_PRODUCT_ID,
      analyticsPayload,
    );

    try {
      await downloadCalculationPdf(
        "/api/calculators/rkeeper/pdf",
        {
          product: RKEEPER_PRODUCT_ID,
          workplaceCount: workplaces,
          selectedAdditionalModules: selectedAdditionalModuleIds,
        },
        "posadmin-rkeeper-calculation.pdf",
      );

      setPdfStatus("success");
      trackCalculatorEvent(
        "calculator_pdf_success",
        RKEEPER_PRODUCT_ID,
        analyticsPayload,
      );
    } catch {
      setPdfStatus("error");
      trackCalculatorEvent(
        "calculator_pdf_error",
        RKEEPER_PRODUCT_ID,
        analyticsPayload,
      );
    }
  };

  const handleItPdfDownload = async () => {
    if (selectedItModuleIds.length === 0) {
      setItPdfStatus("empty");
      return;
    }

    const analyticsPayload = {
      workplaceCount: itWorkplaces,
      additionalModulesCount: selectedItModuleIds.length,
      monthlyTotal: itTotalPrice,
    };

    setItPdfStatus("loading");
    trackCalculatorEvent(
      "calculator_pdf_click",
      IT_ADMINISTRATION_PRODUCT_ID,
      analyticsPayload,
    );

    try {
      await downloadCalculationPdf(
        "/api/calculators/it-administration/pdf",
        {
          product: IT_ADMINISTRATION_PRODUCT_ID,
          workplaceCount: itWorkplaces,
          selectedModules: selectedItModuleIds,
        },
        "posadmin-it-administration-calculation.pdf",
      );

      setItPdfStatus("success");
      trackCalculatorEvent(
        "calculator_pdf_success",
        IT_ADMINISTRATION_PRODUCT_ID,
        analyticsPayload,
      );
    } catch {
      setItPdfStatus("error");
      trackCalculatorEvent(
        "calculator_pdf_error",
        IT_ADMINISTRATION_PRODUCT_ID,
        analyticsPayload,
      );
    }
  };

  useEffect(() => {
    headingPlayedCycle.current = null;
    setHeadingWaveKey(0);
  }, [animationCycle]);

  useEffect(() => {
    if (!headingInView || headingPlayedCycle.current === animationCycle) return;
    headingPlayedCycle.current = animationCycle;
    setHeadingWaveKey(animationCycle + 1);
  }, [animationCycle, headingInView]);

  useEffect(() => {
    if (pdfStatus !== "success" && pdfStatus !== "error") return;
    const timer = window.setTimeout(() => setPdfStatus("idle"), 5_000);
    return () => window.clearTimeout(timer);
  }, [pdfStatus]);

  useEffect(() => {
    if (
      itPdfStatus !== "success" &&
      itPdfStatus !== "error" &&
      itPdfStatus !== "empty"
    ) {
      return;
    }
    const timer = window.setTimeout(() => setItPdfStatus("idle"), 5_000);
    return () => window.clearTimeout(timer);
  }, [itPdfStatus]);

  return (
    <section id="pricing" className="scroll-mt-20 bg-[#f5f5ed] px-4 py-20 font-[family-name:var(--font-inter)] text-[#322f2f] sm:px-6" aria-labelledby="support-pricing-title">
      <div className="mx-auto max-w-[1197px]">
        <h2
          ref={headingRef}
          id="support-pricing-title"
          aria-label="Тарифы на сопровождение"
          className="font-[family-name:var(--font-inter-display)] text-center text-[32px] font-medium leading-tight tracking-[-0.16px] text-[#313235] [font-variation-settings:'opsz'_32] sm:text-[40px] sm:leading-[44px]"
        >
          {headingWaveKey > 0 ? (
            <WaveWords
              key={headingWaveKey}
              text="Тарифы на сопровождение"
              base={0.18}
              duration={1.15}
              reduced={reduced}
            />
          ) : (
            <span className="invisible" aria-hidden="true">
              Тарифы на сопровождение
            </span>
          )}
        </h2>

        <div className="mt-[45px]">
          <h3 className="font-[family-name:var(--font-inter-display)] text-center text-[24px] font-medium leading-[29px] tracking-[0.3px] [font-variation-settings:'opsz'_32]">r_keeper</h3>
          <div className="mt-[15px]">
            <WorkplacesPrompt
              value={workplaces}
              onChange={setWorkplaces}
              disabled={rkeeperPdfLoading}
            />
          </div>

          <motion.div
            key={animationCycle}
            className="relative mt-[15px] pt-[17px]"
            initial={reduced ? false : "hidden"}
            viewport={{ once: true, amount: 0.14 }}
            whileInView="visible"
          >
            <motion.div
              className="pointer-events-none absolute left-[208.5px] top-0 z-10 hidden h-10 -translate-x-1/2 items-center rounded-full bg-[#e6e6de] px-[25px] text-[14px] text-[#969691] min-[1248px]:flex"
              variants={baseBadgeReveal}
            >
              Базовый модуль
            </motion.div>
            <motion.div
              className="pointer-events-none absolute left-[807.5px] top-0 z-10 hidden h-10 -translate-x-1/2 items-center rounded-full bg-[var(--milk)] px-[25px] text-[14px] text-[#969691] min-[1248px]:flex"
              variants={additionalBadgeReveal}
            >
              Дополнительные модули
            </motion.div>
            <motion.div
              className="overflow-hidden rounded-[20px]"
              variants={tariffShellEntrance}
            >
              <motion.div
                className="rkeeper-tariff-shell grid overflow-hidden rounded-[20px] bg-[#e6e6de] min-[1248px]:grid-cols-[417px_313px_1px_367px] min-[1248px]:gap-x-[25px] min-[1248px]:pr-[25px]"
                variants={tariffShellOpen}
              >
                <div className="min-w-0">
                  <TariffCard
                    title={RKEEPER_TARIFF.baseModule.name}
                    features={RKEEPER_TARIFF.baseModule.features}
                    price={formatMonthlyPrice(modulePrice)}
                    base
                  />
                </div>
                <motion.div
                  className="min-w-0"
                  variants={firstModuleContentReveal}
                >
                  <TariffCard
                    title={RKEEPER_TARIFF.additionalModules[0].name}
                    features={RKEEPER_TARIFF.additionalModules[0].features}
                    price={formatMonthlyPrice(modulePrice, true)}
                    action={menuIncluded ? "Убрать" : "Добавить"}
                    disabled={rkeeperPdfLoading}
                    onAction={() => setMenuIncluded((included) => !included)}
                  />
                </motion.div>
                <motion.div
                  className="relative hidden h-[501px] self-start min-[1248px]:block"
                  aria-hidden="true"
                  variants={dividerReveal}
                >
                  <div
                    className="h-full w-px"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(50,47,47,0) 0%, rgba(50,47,47,0.26) 50%, rgba(50,47,47,0) 100%)",
                    }}
                  />
                </motion.div>
                <motion.div
                  className="min-w-0"
                  variants={secondModuleContentReveal}
                >
                  <TariffCard
                    title={RKEEPER_TARIFF.additionalModules[1].name}
                    intro="Включает неограниченные выезды технического специалиста:"
                    features={RKEEPER_TARIFF.additionalModules[1].features}
                    price={formatMonthlyPrice(modulePrice, true)}
                    action={onsiteIncluded ? "Убрать" : "Добавить"}
                    disabled={rkeeperPdfLoading}
                    onAction={() => setOnsiteIncluded((included) => !included)}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
          <PricingFooter
            total={formatMonthlyPrice(totalPrice)}
            onCallbackRequest={() => setCallbackDialogOpen(true)}
            onPdfDownload={handlePdfDownload}
            pdfStatus={pdfStatus}
          />
        </div>

        <div className="mt-14">
          <h3 className="font-[family-name:var(--font-inter-display)] text-center text-[24px] font-medium leading-[29px] tracking-[0.3px] [font-variation-settings:'opsz'_32]">Системное IT администрирование</h3>
          <div className="mt-[15px]">
            <WorkplacesPrompt
              value={itWorkplaces}
              onChange={setItWorkplaces}
              disabled={itPdfLoading}
              label="Укажите количество рабочих мест сотрудников"
              inputLabel="Количество рабочих мест сотрудников"
            />
          </div>
          <div className="mt-[17px] grid min-[1248px]:grid-cols-[424px_763px]">
            <motion.div
              key={`it-card-${animationCycle}`}
              initial={reduced ? false : "hidden"}
              variants={tariffShellEntrance}
              viewport={{ once: true, amount: 0.14 }}
              whileInView="visible"
            >
              <TariffCard
                title={IT_ADMINISTRATION_TARIFF.module.name}
                features={[...IT_ADMINISTRATION_TARIFF.module.features]}
                price={formatMonthlyPrice(itAdministrationPrice, true)}
                action={itIncluded ? "Убрать" : "Добавить"}
                disabled={itPdfLoading}
                onAction={() => setItIncluded((included) => !included)}
                variant="it"
              />
            </motion.div>
            <div className="flex min-h-[420px] items-center justify-center p-5 lg:min-h-[531px] lg:p-0">
              <ItAdminVisual key={animationCycle} reduced={reduced} />
            </div>
          </div>
          <PricingFooter
            total={formatMonthlyPrice(itTotalPrice)}
            onCallbackRequest={() => setCallbackDialogOpen(true)}
            onPdfDownload={handleItPdfDownload}
            pdfStatus={itPdfStatus}
          />
        </div>
      </div>
      <CallbackDialog
        onClose={() => setCallbackDialogOpen(false)}
        open={callbackDialogOpen}
      />
    </section>
  );
}
