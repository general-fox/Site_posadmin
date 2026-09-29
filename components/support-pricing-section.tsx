"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { CallbackDialog } from "./callback-dialog";
import { CitySelect } from "./city-select";
import { MobileCalculationBar } from "./mobile-calculation-bar";
import { ArrowRight, SectionReveal, useScrollReveal } from "./marketing-ui";
import { SectionAtmosphere } from "./section-atmosphere";
import { calculateRkeeperPricing, getRkeeperModulePrice, RKEEPER_PRODUCT_ID, RKEEPER_TARIFF, type RkeeperAdditionalModuleId } from "@/lib/rkeeper-pricing";
import { calculateItAdministrationPricing, getItAdministrationModulePrice, IT_ADMINISTRATION_MODULE_ID, IT_ADMINISTRATION_PRODUCT_ID, IT_ADMINISTRATION_TARIFF } from "@/lib/it-administration-pricing";
import { isOnsiteSupportAvailable, type OnsiteSupportLocation } from "@/lib/onsite-support";
import type { CalculationSelection } from "@/lib/calculation-request";
import { usePricing } from "./pricing-provider";
import { IS_REVIEW_DEMO } from "@/lib/demo-mode";
import { isPricingSnapshot, type PricingSnapshot } from "@/lib/pricing-snapshot";
import ui from "./marketing.module.css";
import styles from "./support-pricing.module.css";

type PdfStatus = "idle" | "loading" | "success" | "error" | "changed" | "demo";
type Service = "rkeeper" | "it";
const money = (value: number) => new Intl.NumberFormat("ru-RU").format(value);

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


function WorkplaceCount({ value, onChange, disabled, service }: { value: number; onChange: (value: number) => void; disabled: boolean; service: Service }) {
  const [draft, setDraft] = useState(String(value));
  const commit = (raw: string) => {
    const parsed = Number(raw);
    const normalized = Number.isFinite(parsed) ? Math.min(10_000, Math.max(1, Math.floor(parsed))) : value;
    setDraft(String(normalized));
    onChange(normalized);
  };
  const change = (next: number) => { setDraft(String(next)); onChange(next); };
  return <div className={styles.countRow}>
    <div><label htmlFor={`workplaces-${service}`}>Количество рабочих мест</label><p>{service === "rkeeper" ? "Кассы и станции официантов" : "Компьютеры ваших сотрудников"}</p></div>
    <div className={styles.stepper}>
      <button type="button" aria-label="Уменьшить количество рабочих мест" disabled={disabled || value <= 1} onClick={() => change(value - 1)}>−</button>
      <input id={`workplaces-${service}`} type="number" inputMode="numeric" min={1} max={10000} step={1} value={draft} disabled={disabled} onChange={(event) => { const raw = event.target.value; setDraft(raw); const n = Number(raw); if (raw && Number.isInteger(n) && n >= 1 && n <= 10000) onChange(n); }} onBlur={() => commit(draft)} onKeyDown={(event) => { if (event.key === "Enter") { commit(draft); event.currentTarget.blur(); } }} />
      <button type="button" aria-label="Увеличить количество рабочих мест" disabled={disabled || value >= 10000} onClick={() => change(value + 1)}>+</button>
    </div>
  </div>;
}

function ModuleCard({ name, features, price, selected, required, onChange, disabled, unavailable = false, unavailableLabel, descriptionId, children }: { name: string; features: readonly string[]; price: number; selected: boolean; required?: boolean; onChange?: () => void; disabled: boolean; unavailable?: boolean; unavailableLabel?: string; descriptionId?: string; children?: ReactNode }) {
  const revealRef = useScrollReveal<HTMLElement>({ distance: 12 });
  return <article ref={revealRef} data-scroll-reveal="" className={`${styles.module} ${selected ? styles.selected : ""}`}>
    <div className={styles.moduleTop}>
      <span className={styles.moduleIcon} aria-hidden="true">{required ? "↗" : <svg width="16" height="16" viewBox="0 0 16 16" fill="none" focusable="false"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}</span>
      <div className={styles.moduleTitle}><h4>{name}</h4><p>{money(price)} ₽ <span>/ месяц</span></p></div>
      {required ? <span className={styles.included}>Включено</span> : <button className={styles.toggle} type="button" aria-label={`${unavailableLabel ?? (selected ? "Убрать" : "Добавить")}: ${name}`} aria-describedby={descriptionId} aria-pressed={selected} onClick={onChange} disabled={disabled || unavailable}><span aria-hidden="true">{selected ? "✓" : "+"}</span><span>{unavailableLabel ?? (selected ? "Добавлено" : "Добавить")}</span></button>}
    </div>
    {children}
    <p className={styles.moduleHint}>{features.slice(0, 2).join(" · ")}</p>
    <details className={styles.details}><summary>Что входит <span aria-hidden="true">+</span></summary><ul>{features.map((feature) => <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>)}</ul></details>
  </article>;
}

export function SupportPricingSection({ service = "rkeeper" }: { service?: Service }) {
  const { snapshot, updateSnapshot } = usePricing();
  const configurationRef = useRef<HTMLDivElement>(null);
  const summaryRevealRef = useScrollReveal<HTMLElement>({ distance: 0 });
  const locationId = useId();
  const locationHintId = useId();
  const [workplaces, setWorkplaces] = useState(1);
  const [modules, setModules] = useState<RkeeperAdditionalModuleId[]>([]);
  const [location, setLocation] = useState<OnsiteSupportLocation | "">("");
  const [onsiteRemoved, setOnsiteRemoved] = useState(false);
  const [itIncluded, setItIncluded] = useState(false);
  const [status, setStatus] = useState<PdfStatus>("idle");
  const [callbackOpen, setCallbackOpen] = useState(false);
  const rkeeper = calculateRkeeperPricing(workplaces, modules, location || undefined, snapshot.config);
  const onsiteAvailable = isOnsiteSupportAvailable(location);
  const it = calculateItAdministrationPricing(workplaces, itIncluded ? [IT_ADMINISTRATION_MODULE_ID] : [], snapshot.config);
  const selected = service === "rkeeper" ? [rkeeper.baseModule, ...rkeeper.additionalModules] : it.selectedModules;
  const total = service === "rkeeper" ? rkeeper.monthlyTotal : it.monthlyTotal;
  const loading = status === "loading";
  const resetFeedback = () => setStatus("idle");
  const titleId = service === "rkeeper" ? "support-pricing-title" : "it-pricing-title";
  const summaryId = service === "rkeeper" ? "rkeeper-calculation" : "it-calculation";
  const calculation: CalculationSelection = service === "rkeeper"
    ? { product: RKEEPER_PRODUCT_ID, workplaceCount: workplaces, selectedAdditionalModules: modules, ...(location ? { location } : {}) }
    : { product: IT_ADMINISTRATION_PRODUCT_ID, workplaceCount: workplaces, selectedModules: itIncluded ? [IT_ADMINISTRATION_MODULE_ID] : [] };
  const changeLocation = (next: OnsiteSupportLocation) => {
    const removeOnsite = !isOnsiteSupportAvailable(next);
    setOnsiteRemoved(removeOnsite && modules.includes("onsite-hardware-support"));
    setLocation(next);
    if (removeOnsite) setModules((current) => current.filter((id) => id !== "onsite-hardware-support"));
    resetFeedback();
  };
  const toggleModule = (id: RkeeperAdditionalModuleId) => {
    if (id === "onsite-hardware-support" && !onsiteAvailable) return;
    setModules((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    resetFeedback();
  };
  const download = async () => {
    if (IS_REVIEW_DEMO) { setStatus("demo"); return; }
    if (!selected.length || loading) return;
    const target = service;
    const product = target === "rkeeper" ? RKEEPER_PRODUCT_ID : IT_ADMINISTRATION_PRODUCT_ID;
    const payload = { workplaceCount: workplaces, additionalModulesCount: target === "rkeeper" ? modules.length : Number(itIncluded), monthlyTotal: total };
    setStatus("loading");
    trackCalculatorEvent("calculator_pdf_click", product, payload);
    try {
      await downloadCalculationPdf(
        target === "rkeeper" ? "/api/calculators/rkeeper/pdf" : "/api/calculators/it-administration/pdf",
        { product, workplaceCount: workplaces, pricingRevision: snapshot.revision, ...(target === "rkeeper" ? { selectedAdditionalModules: modules, ...(location ? { location } : {}) } : { selectedModules: [IT_ADMINISTRATION_MODULE_ID] }) },
        `posadmin-${target}-calculation.pdf`,
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

  return <section id={service === "rkeeper" ? "pricing" : "it-pricing"} className={`${ui.section} ${styles.section} section-atmosphere-host`} aria-labelledby={titleId}>
    <SectionAtmosphere side={service === "rkeeper" ? "right" : "left"} />
    <div className={ui.shell}>
      <div className={ui.sectionHeader}>
        <SectionReveal distance={22}>
          <p className={ui.eyebrow}>{service === "rkeeper" ? "Прайс · r_keeper" : "Прайс · IT-сопровождение"}</p>
          <h2 className={`${ui.heading} ${service === "it" ? styles.itHeading : ""}`} id={titleId}>{service === "rkeeper" ? <>Ваша команда<br /><span className={ui.muted}>Ваш набор услуг</span></> : <>IT-администрирование<br /><span className={ui.muted}>Для вашей команды</span></>}</h2>
        </SectionReveal>
        <SectionReveal distance={18} delay={0.12}><p className={ui.lead}>{service === "rkeeper" ? "Сопровождение r_keeper для вашего ресторана. Укажите количество касс и станций официантов, добавьте нужные модули и сохраните расчёт в PDF." : "Поддержка компьютеров сотрудников, сетей и IT-инфраструктуры. Укажите количество рабочих мест, добавьте сопровождение и сохраните расчёт в PDF."}</p></SectionReveal>
      </div>
      <div>
        <div className={styles.calculator}>
          <div ref={configurationRef} className={styles.configuration}>
            <SectionReveal distance={12}>
            <div className={styles.configHeading}><h3>{service === "rkeeper" ? "Сопровождение r_keeper" : "IT-сопровождение"}</h3></div>
            <WorkplaceCount value={workplaces} service={service} disabled={loading} onChange={(value) => { setWorkplaces(value); resetFeedback(); }} />
            </SectionReveal>
            <div className={styles.modules}>
              {service === "rkeeper" ? <>
                <ModuleCard {...RKEEPER_TARIFF.baseModule} price={rkeeper.baseModule.monthlyPrice} selected required disabled={loading} />
                <p className={styles.optionalLabel}>Дополнительно — только то, что нужно</p>
                {RKEEPER_TARIFF.additionalModules.map((module) => {
                  const onsite = module.id === "onsite-hardware-support";
                  return <ModuleCard
                    key={module.id}
                    {...module}
                    price={getRkeeperModulePrice(workplaces, snapshot.config, module.id)}
                    selected={modules.includes(module.id)}
                    onChange={() => toggleModule(module.id)}
                    disabled={loading}
                    unavailable={onsite && !onsiteAvailable}
                    unavailableLabel={onsite && location === "other" ? "Недоступно" : undefined}
                    descriptionId={onsite ? locationHintId : undefined}
                  >
                    {onsite && <div className={styles.locationField}>
                      <label htmlFor={locationId}>Город или регион заведения</label>
                      <CitySelect id={locationId} descriptionId={locationHintId} value={location} disabled={loading} onChange={changeLocation} />
                      <p id={locationHintId} className={styles.locationHint} data-available={onsiteAvailable} data-prompt={!location} role="status" aria-atomic="true">
                        {!location && <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M12.5 6.5c0 3-4.5 7-4.5 7s-4.5-4-4.5-7a4.5 4.5 0 0 1 9 0Z" stroke="currentColor" strokeWidth="1.3" /><circle cx="8" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.3" /></svg>}
                        <span>{!location ? "Выберите город, чтобы добавить выезд." : onsiteAvailable ? modules.includes(module.id) ? "Выездное сопровождение добавлено." : "Выезд доступен — можно добавить в расчёт." : onsiteRemoved ? "Здесь выезд недоступен — услуга убрана из расчёта." : "Здесь выезд недоступен. Удалённая поддержка доступна."}</span>
                      </p>
                    </div>}
                  </ModuleCard>;
                })}
              </> : <ModuleCard {...IT_ADMINISTRATION_TARIFF.module} price={getItAdministrationModulePrice(workplaces, snapshot.config)} selected={itIncluded} onChange={() => { setItIncluded((current) => !current); resetFeedback(); }} disabled={loading} />}
            </div>
          </div>
          <aside id={summaryId} ref={summaryRevealRef} tabIndex={-1} data-scroll-reveal="" className={styles.summary} aria-label={`Итог расчёта ${service === "rkeeper" ? "r_keeper" : "IT-администрирования"}`}>
            <div className={styles.summaryTop}><p>{service === "rkeeper" ? "Ваше сопровождение r_keeper" : "Ваше IT-сопровождение"}</p><span className={styles.liveDot}>Расчёт онлайн</span></div>
            <div aria-live="polite" aria-atomic="true">{selected.length ? <><p className={styles.total}>{money(total)} <span>₽</span></p><p className={styles.period}>в месяц · рабочих мест: {workplaces}</p></> : <><p className={styles.emptyTotal}>Выберите сопровождение</p><p className={styles.period}>Рабочих мест: {workplaces}</p></>}</div>
            <div className={styles.summaryItems}>{selected.length ? selected.map((module) => <div key={module.id}><span>{module.name}</span><strong>{money(module.monthlyPrice)} ₽</strong></div>) : <p>Добавьте IT-сопровождение, чтобы увидеть итог и сохранить расчёт.</p>}</div>
            <button className={ui.primary} type="button" onClick={() => setCallbackOpen(true)}>Обсудить подключение <ArrowRight /></button>
            <button className={ui.secondary} type="button" onClick={download} disabled={loading || !selected.length}>{loading ? "Готовим PDF…" : status === "error" ? "Повторить скачивание PDF" : "Скачать расчёт в PDF"} <span aria-hidden="true">↓</span></button>
            <p className={styles.feedback} role="status">{status === "demo" ? "В демоверсии можно проверить расчёт. Скачивание PDF будет доступно после запуска сайта на хостинге." : status === "changed" ? "Цены обновились. Проверьте новый расчёт и скачайте PDF ещё раз." : status === "success" ? "Расчёт готов. Файл отправлен на скачивание." : status === "error" ? "Не удалось создать PDF. Попробуйте ещё раз." : "Состав работ и условия уточним перед подключением."}</p>
          </aside>
        </div>
        {service === "it" && <SectionReveal className={styles.help} distance={20}><div><span aria-hidden="true">↗</span><p>Не знаете, что выбрать?<br /><span>Расскажите о задаче — поможем собрать нужный набор услуг.</span></p></div><button type="button" className={ui.textLink} onClick={() => setCallbackOpen(true)}>Помогите с выбором <ArrowRight /></button></SectionReveal>}
      </div>
    </div>
    <MobileCalculationBar configurationRef={configurationRef} summaryRef={summaryRevealRef} summaryId={summaryId} productName={service === "rkeeper" ? "r_keeper" : "IT-сопровождение"} total={total} hasSelection={selected.length > 0} dialogOpen={callbackOpen} />
    <CallbackDialog open={callbackOpen} onClose={() => setCallbackOpen(false)} calculation={selected.length ? calculation : undefined} />
  </section>;
}
