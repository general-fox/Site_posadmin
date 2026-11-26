"use client";

import { useRef, useState, type ReactNode, type RefObject } from "react";
import { CallbackDialog } from "./callback-dialog";
import { BaseBadge } from "./base-badge";
import { OnsiteLocationDialog } from "./onsite-location-dialog";
import { MobileCalculationBar } from "./mobile-calculation-bar";
import { UiIcon } from "./ui-icon";
import { WorkplaceCount } from "./workplace-count";
import { ArrowRight, SectionReveal, useScrollReveal } from "./marketing-ui";
import { useDisclosureCentering } from "./use-disclosure-centering";
import { calculateRkeeperPricing, getRkeeperModulePrice, RKEEPER_PRODUCT_ID, RKEEPER_TARIFF, type RkeeperAdditionalModuleId } from "@/lib/rkeeper-pricing";
import { calculateItAdministrationPricing, getItAdministrationModulePrice, IT_ADMINISTRATION_MODULE_ID, IT_ADMINISTRATION_TARIFF } from "@/lib/it-administration-pricing";
import { isOnsiteSupportAvailable, ONSITE_SUPPORT_LOCATIONS, type OnsiteLocationSelection } from "@/lib/onsite-support";
import type { CalculationSelection } from "@/lib/calculation-request";
import { usePricing } from "./pricing-provider";
import { IS_REVIEW_DEMO } from "@/lib/demo-mode";
import { isPricingSnapshot, type PricingSnapshot } from "@/lib/pricing-snapshot";
import { PRICING_VALIDITY_YEAR } from "@/lib/pricing-config";
import { MIN_ONLINE_WORKPLACES, ONLINE_WORKPLACE_LIMIT_NOTE } from "@/lib/workplace-count";
import ui from "./marketing.module.css";
import styles from "./support-pricing.module.css";

type PdfStatus = "idle" | "loading" | "success" | "error" | "changed" | "demo";
const money = (value: number) => new Intl.NumberFormat("ru-RU").format(value);
const onsiteModuleId = "onsite-hardware-support" satisfies RkeeperAdditionalModuleId;
const summaryId = "rkeeper-calculation";
const addModuleLabel = "Добавить";
const addedModuleLabel = "Добавлено";

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

class PricingChangedError extends Error {
  constructor(public snapshot: PricingSnapshot) { super("Pricing changed"); }
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

  if (response.status === 409) {
    const result = await response.json();
    if (isPricingSnapshot(result.snapshot)) throw new PricingChangedError(result.snapshot);
  }
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


const moduleEntranceInterval = 0.09;

function ModuleCard({ anchorId, name, features, price, selected, required, onChange, disabled, opensDialog, children, entranceIndex = 0, revealAfter }: {
  anchorId?: string;
  name: string;
  features: readonly string[];
  price: number | null;
  selected: boolean;
  required?: boolean;
  onChange?: () => void;
  disabled: boolean;
  opensDialog?: boolean;
  entranceIndex?: number;
  revealAfter: RefObject<HTMLElement | null>;
  children?: ReactNode;
}) {
  const revealRef = useScrollReveal<HTMLElement>({
    motion: "lift",
    blur: false,
    delay: Math.min(entranceIndex + 1, 2) * moduleEntranceInterval,
    after: revealAfter,
  });
  const disclosureCentering = useDisclosureCentering();
  return <article id={anchorId} ref={revealRef} data-scroll-reveal="" data-disclosure-panel="" className={`${styles.module} ${required || selected ? styles.selected : ""}`}>
    <div className={styles.moduleTop}>
      <h3 className={styles.moduleName}>{name}</h3>
      <div className={styles.modulePricing}>
        <p className={styles.modulePrice}>{price === null ? "По запросу" : <>{money(price)} ₽ <span>/ месяц</span></>}</p>
        {required ? <BaseBadge className={styles.included} label="Базовый тариф" /> : (
          <button
            className={styles.toggle}
            type="button"
            aria-label={`${selected ? "Убрать" : addModuleLabel}: ${name}`}
            aria-haspopup={opensDialog ? "dialog" : undefined}
            aria-pressed={selected}
            onClick={onChange}
            disabled={disabled}
          >
            <UiIcon name={selected ? "check" : "plus"} size={16} />
            <span className={styles.toggleLabel} aria-hidden="true">
              <span>{selected ? addedModuleLabel : addModuleLabel}</span>
              <span className={styles.toggleLabelMeasure}>{addModuleLabel}</span>
              <span className={styles.toggleLabelMeasure}>{addedModuleLabel}</span>
            </span>
          </button>
        )}
      </div>
    </div>
    {children}
    <details {...disclosureCentering} className={styles.details}>
      <summary data-button-reveal="off">Что входит <UiIcon name="plus" /></summary>
      <ul>{features.map((feature) => <li key={feature}><UiIcon name="check" size={14} />{feature}</li>)}</ul>
    </details>
  </article>;
}

export function SupportPricingSection() {
  const { snapshot, updateSnapshot } = usePricing();
  const configurationRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const summaryRevealRef = useScrollReveal<HTMLElement>({ motion: "lift", blur: false, after: headingRef });
  const [workplaces, setWorkplaces] = useState(MIN_ONLINE_WORKPLACES);
  const [additionalModules, setAdditionalModules] = useState<RkeeperAdditionalModuleId[]>([]);
  const [onsiteSelection, setOnsiteSelection] = useState<OnsiteLocationSelection>();
  const [onsiteDialogOpen, setOnsiteDialogOpen] = useState(false);
  const [itIncluded, setItIncluded] = useState(false);
  const [status, setStatus] = useState<PdfStatus>("idle");
  const [callbackOpen, setCallbackOpen] = useState(false);
  const location = onsiteSelection?.location;
  const onsiteByRequest = location === "other";
  const onsiteCity = onsiteByRequest ? onsiteSelection?.otherCity : ONSITE_SUPPORT_LOCATIONS.find(({ id }) => id === location)?.name;
  const modules: RkeeperAdditionalModuleId[] = isOnsiteSupportAvailable(location) ? [...additionalModules, onsiteModuleId] : additionalModules;
  const rkeeper = calculateRkeeperPricing(workplaces, modules, location, snapshot.config);
  const it = calculateItAdministrationPricing(workplaces, itIncluded ? [IT_ADMINISTRATION_MODULE_ID] : [], snapshot.config);
  const selected = [rkeeper.baseModule, ...rkeeper.additionalModules, ...it.selectedModules];
  const total = rkeeper.monthlyTotal + it.monthlyTotal;
  const loading = status === "loading";
  const resetFeedback = () => setStatus("idle");
  const calculation: CalculationSelection = {
    product: RKEEPER_PRODUCT_ID,
    workplaceCount: workplaces,
    selectedAdditionalModules: modules,
    includeItSupport: itIncluded,
    ...onsiteSelection,
  };
  const confirmOnsiteLocation = (next: OnsiteLocationSelection) => {
    setOnsiteSelection(next);
    resetFeedback();
  };
  const toggleModule = (id: RkeeperAdditionalModuleId) => {
    if (id === onsiteModuleId) {
      if (!onsiteSelection) {
        setOnsiteDialogOpen(true);
        return;
      }
      setOnsiteSelection(undefined);
    } else {
      setAdditionalModules((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    }
    resetFeedback();
  };
  const download = async () => {
    if (IS_REVIEW_DEMO) { setStatus("demo"); return; }
    if (loading) return;
    const product = RKEEPER_PRODUCT_ID;
    const payload = { workplaceCount: workplaces, additionalModulesCount: modules.length + Number(itIncluded), monthlyTotal: total };
    setStatus("loading");
    trackCalculatorEvent("calculator_pdf_click", product, payload);
    try {
      await downloadCalculationPdf(
        "/api/calculators/rkeeper/pdf",
        { ...calculation, pricingRevision: snapshot.revision },
        "posadmin-rkeeper-calculation.pdf",
      );
      setStatus("success");
      trackCalculatorEvent("calculator_pdf_success", product, payload);
    } catch (error) {
      if (error instanceof PricingChangedError) {
        updateSnapshot(error.snapshot);
        setStatus("changed");
        return;
      }
      setStatus("error");
      trackCalculatorEvent("calculator_pdf_error", product, payload);
    }
  };

  return <section id="pricing" className={`${ui.section} ${styles.section} section-atmosphere-host`} aria-labelledby="support-pricing-title">
    <div className={ui.shell}>
      <div className={ui.sectionHeader}>
        <SectionReveal className={styles.fullHeading}>
          <p className={ui.eyebrow}>Тарифы · r_keeper</p>
          <h2 ref={headingRef} className={ui.heading} id="support-pricing-title">Расчет сопровождения</h2>
        </SectionReveal>
      </div>
      <div className={styles.calculator}>
        <div ref={configurationRef} className={styles.configuration}>
          <SectionReveal motion="lift" blur={false} after={headingRef} className={styles.countControl}>
            <WorkplaceCount
              id="workplaces-rkeeper"
              value={workplaces}
              description="Кассы, станции официантов и компьютеры сотрудников"
              limitNote={ONLINE_WORKPLACE_LIMIT_NOTE}
              disabled={loading}
              onChange={(value) => { setWorkplaces(value); resetFeedback(); }}
            />
          </SectionReveal>
          <div className={styles.modules}>
            <ModuleCard {...RKEEPER_TARIFF.baseModule} revealAfter={headingRef} price={rkeeper.baseModule.monthlyPrice} selected required disabled={loading} />
            {RKEEPER_TARIFF.additionalModules.map((module, index) => {
              const onsite = module.id === onsiteModuleId;
              return <ModuleCard
                key={module.id}
                {...module}
                revealAfter={headingRef}
                entranceIndex={index + 1}
                price={onsite && onsiteByRequest ? null : getRkeeperModulePrice(workplaces, snapshot.config, module.id)}
                selected={onsite ? Boolean(onsiteSelection) : modules.includes(module.id)}
                onChange={() => toggleModule(module.id)}
                disabled={loading}
                opensDialog={onsite && !onsiteSelection}
              >
                {onsite && onsiteCity && <div className={styles.onsiteSelection}>
                  <span role="status">{onsiteCity}</span>
                  <button className={styles.editCity} type="button" title="Изменить город выезда" aria-label="Изменить город выезда" aria-haspopup="dialog" onClick={() => setOnsiteDialogOpen(true)} disabled={loading}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M9.75 3.5 12.5 6.25M3 13l2.9-.7 7-7a1.94 1.94 0 0 0-2.75-2.75l-7 7L3 13Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>}
              </ModuleCard>;
            })}
            <ModuleCard
              anchorId="it-pricing"
              {...IT_ADMINISTRATION_TARIFF.module}
              revealAfter={headingRef}
              entranceIndex={RKEEPER_TARIFF.additionalModules.length + 1}
              price={getItAdministrationModulePrice(workplaces, snapshot.config)}
              selected={itIncluded}
              onChange={() => { setItIncluded((current) => !current); resetFeedback(); }}
              disabled={loading}
            />
          </div>
        </div>
        <div className={styles.summaryColumn}>
          <p className={styles.updatedAt}>Актуально на <span>{PRICING_VALIDITY_YEAR} г.</span></p>
          <aside id={summaryId} ref={summaryRevealRef} tabIndex={-1} data-scroll-reveal="" className={styles.summary} aria-label="Итог расчёта сопровождения">
            <div className={styles.summaryTop}><p>Ваше сопровождение</p><span className={styles.liveDot}>Расчёт онлайн</span></div>
            <div aria-live="polite" aria-atomic="true">
              <p className={styles.total}>{money(total)} <span>₽</span></p>
              <p className={styles.period}>в месяц · рабочих мест: {workplaces}</p>
            </div>
            <div className={styles.summaryItems}>
              {selected.map((module) => (
                <div key={module.id}>
                  <span className={styles.summaryItemName}>
                    <UiIcon name="check" size={14} className={styles.summaryCheck} />
                    {module.name}
                  </span>
                  <strong>{money(module.monthlyPrice)} ₽</strong>
                </div>
              ))}
              {onsiteByRequest && <div>
                <span className={styles.summaryItemName}>Выездное сопровождение</span>
                <strong>По запросу</strong>
              </div>}
            </div>
            <button className={ui.primary} type="button" onClick={() => setCallbackOpen(true)}>Обсудить проект <ArrowRight /></button>
            <button className={ui.secondary} type="button" onClick={download} disabled={loading}>{loading ? "Готовим PDF…" : status === "error" ? "Повторить скачивание PDF" : "Скачать расчёт в PDF"} <UiIcon name="arrow-down" /></button>
            <p className={styles.feedback} role="status">{status === "demo" ? "В демоверсии можно проверить расчёт. Скачивание PDF будет доступно после запуска сайта на хостинге." : status === "changed" ? "Цены обновились. Проверьте новый расчёт и скачайте PDF ещё раз." : status === "success" ? "Расчёт готов. Файл отправлен на скачивание." : status === "error" ? "Не удалось создать PDF. Попробуйте ещё раз." : null}</p>
          </aside>
        </div>
      </div>
    </div>
    <MobileCalculationBar configurationRef={configurationRef} summaryRef={summaryRevealRef} summaryId={summaryId} productName="Сопровождение" total={total} hasSelection dialogOpen={callbackOpen || onsiteDialogOpen} />
    {onsiteDialogOpen && <OnsiteLocationDialog selection={onsiteSelection} onConfirm={confirmOnsiteLocation} onClose={() => setOnsiteDialogOpen(false)} />}
    <CallbackDialog open={callbackOpen} onClose={() => setCallbackOpen(false)} calculation={calculation} />
  </section>;
}
