"use client";

import { useState } from "react";
import { CallbackDialog } from "./callback-dialog";
import { ArrowRight, SectionReveal, useScrollReveal } from "./marketing-ui";
import { SectionAtmosphere } from "./section-atmosphere";
import { calculateRkeeperPricing, RKEEPER_PRODUCT_ID, RKEEPER_TARIFF, type RkeeperAdditionalModuleId } from "@/lib/rkeeper-pricing";
import { calculateItAdministrationPricing, getItAdministrationModulePrice, IT_ADMINISTRATION_MODULE_ID, IT_ADMINISTRATION_PRODUCT_ID, IT_ADMINISTRATION_TARIFF } from "@/lib/it-administration-pricing";
import ui from "./marketing.module.css";
import styles from "./support-pricing.module.css";

type PdfStatus = "idle" | "loading" | "success" | "error";
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

function ModuleCard({ name, features, price, selected, required, onChange, disabled }: { name: string; features: readonly string[]; price: number; selected: boolean; required?: boolean; onChange?: () => void; disabled: boolean }) {
  const revealRef = useScrollReveal<HTMLElement>({ distance: 12 });
  return <article ref={revealRef} data-scroll-reveal="" className={`${styles.module} ${selected ? styles.selected : ""}`}>
    <div className={styles.moduleTop}>
      <span className={styles.moduleIcon} aria-hidden="true">{required ? "↗" : "+"}</span>
      <div className={styles.moduleTitle}><h4>{name}</h4><p>{money(price)} ₽ <span>/ месяц</span></p></div>
      {required ? <span className={styles.included}>Включено</span> : <button className={styles.toggle} type="button" aria-label={`${selected ? "Убрать" : "Добавить"}: ${name}`} aria-pressed={selected} onClick={onChange} disabled={disabled}><span aria-hidden="true">{selected ? "✓" : "+"}</span><span>{selected ? "Добавлено" : "Добавить"}</span></button>}
    </div>
    <p className={styles.moduleHint}>{features.slice(0, 2).join(" · ")}</p>
    <details className={styles.details}><summary>Что входит <span aria-hidden="true">+</span></summary><ul>{features.map((feature) => <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>)}</ul></details>
  </article>;
}

export function SupportPricingSection() {
  const summaryRevealRef = useScrollReveal<HTMLElement>({ distance: 0 });
  const [service, setService] = useState<Service>("rkeeper");
  const [workplaces, setWorkplaces] = useState({ rkeeper: 1, it: 1 });
  const [modules, setModules] = useState<RkeeperAdditionalModuleId[]>([]);
  const [itIncluded, setItIncluded] = useState(false);
  const [status, setStatus] = useState<Record<Service, PdfStatus>>({ rkeeper: "idle", it: "idle" });
  const [callbackOpen, setCallbackOpen] = useState(false);
  const rkeeper = calculateRkeeperPricing(workplaces.rkeeper, modules);
  const it = calculateItAdministrationPricing(workplaces.it, itIncluded ? [IT_ADMINISTRATION_MODULE_ID] : []);
  const selected = service === "rkeeper" ? [rkeeper.baseModule, ...rkeeper.additionalModules] : it.selectedModules;
  const total = service === "rkeeper" ? rkeeper.monthlyTotal : it.monthlyTotal;
  const loading = status[service] === "loading";
  const resetFeedback = () => setStatus((current) => ({ ...current, [service]: "idle" }));
  const toggleModule = (id: RkeeperAdditionalModuleId) => { setModules((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); resetFeedback(); };
  const download = async () => {
    if (!selected.length || loading) return;
    const target = service;
    const product = target === "rkeeper" ? RKEEPER_PRODUCT_ID : IT_ADMINISTRATION_PRODUCT_ID;
    const payload = { workplaceCount: workplaces[target], additionalModulesCount: target === "rkeeper" ? modules.length : Number(itIncluded), monthlyTotal: total };
    setStatus((current) => ({ ...current, [target]: "loading" }));
    trackCalculatorEvent("calculator_pdf_click", product, payload);
    try {
      await downloadCalculationPdf(
        target === "rkeeper" ? "/api/calculators/rkeeper/pdf" : "/api/calculators/it-administration/pdf",
        { product, workplaceCount: workplaces[target], ...(target === "rkeeper" ? { selectedAdditionalModules: modules } : { selectedModules: [IT_ADMINISTRATION_MODULE_ID] }) },
        `posadmin-${target}-calculation.pdf`,
      );
      setStatus((current) => ({ ...current, [target]: "success" }));
      trackCalculatorEvent("calculator_pdf_success", product, payload);
    } catch {
      setStatus((current) => ({ ...current, [target]: "error" }));
      trackCalculatorEvent("calculator_pdf_error", product, payload);
    }
  };

  return <section id="pricing" className={`${ui.section} ${styles.section} section-atmosphere-host`} aria-labelledby="support-pricing-title">
    <SectionAtmosphere side="right" />
    <div className={ui.shell}>
      <div className={ui.sectionHeader}>
        <SectionReveal distance={22}><p className={ui.eyebrow}>Прайс · сопровождение</p><h2 className={ui.heading} id="support-pricing-title">Ваша команда<br /><span className={ui.muted}>Ваш набор услуг</span></h2></SectionReveal>
        <SectionReveal distance={18} delay={0.12}><p className={ui.lead}>Выберите направление, укажите количество рабочих мест и добавьте нужные модули. Стоимость видна сразу — расчёт можно сохранить в PDF.</p></SectionReveal>
      </div>
      <div>
        <SectionReveal distance={12}>
        <div className={styles.tabs} role="group" aria-label="Направление сопровождения">
          <button type="button" aria-pressed={service === "rkeeper"} onClick={() => setService("rkeeper")}>r_keeper <span>Для ресторана</span></button>
          <button type="button" aria-pressed={service === "it"} onClick={() => setService("it")}>IT-администрирование <span>Для вашей команды</span></button>
        </div>
        </SectionReveal>
        <div className={styles.calculator}>
          <div className={styles.configuration}>
            <SectionReveal key={service} distance={12}>
            <div className={styles.configHeading}><span className={styles.step}>01</span><h3>Настройте сопровождение</h3></div>
            <WorkplaceCount key={service} value={workplaces[service]} service={service} disabled={loading} onChange={(value) => { setWorkplaces((current) => ({ ...current, [service]: value })); resetFeedback(); }} />
            </SectionReveal>
            <div className={styles.modules}>
              {service === "rkeeper" ? <>
                <ModuleCard {...RKEEPER_TARIFF.baseModule} price={rkeeper.baseModule.monthlyPrice} selected required disabled={loading} />
                <p className={styles.optionalLabel}>Дополнительно — только то, что нужно</p>
                {RKEEPER_TARIFF.additionalModules.map((module) => <ModuleCard key={module.id} {...module} price={rkeeper.baseModule.monthlyPrice} selected={modules.includes(module.id)} onChange={() => toggleModule(module.id)} disabled={loading} />)}
              </> : <ModuleCard {...IT_ADMINISTRATION_TARIFF.module} price={getItAdministrationModulePrice(workplaces.it)} selected={itIncluded} onChange={() => { setItIncluded((current) => !current); resetFeedback(); }} disabled={loading} />}
            </div>
          </div>
          <aside ref={summaryRevealRef} data-scroll-reveal="" className={styles.summary} aria-label="Итог расчёта">
            <div className={styles.summaryTop}><p>Ваше сопровождение</p><span className={styles.liveDot}>Расчёт онлайн</span></div>
            <div aria-live="polite" aria-atomic="true"><p className={styles.total}>{money(total)} <span>₽</span></p><p className={styles.period}>в месяц · рабочих мест: {workplaces[service]}</p></div>
            <div className={styles.summaryItems}>{selected.length ? selected.map((module) => <div key={module.id}><span>{module.name}</span><strong>{money(module.monthlyPrice)} ₽</strong></div>) : <p>Добавьте IT-сопровождение, чтобы увидеть итог и сохранить расчёт.</p>}</div>
            <button className={ui.primary} type="button" onClick={() => setCallbackOpen(true)}>Обсудить подключение <ArrowRight /></button>
            <button className={ui.secondary} type="button" onClick={download} disabled={loading || !selected.length}>{loading ? "Готовим PDF…" : status[service] === "error" ? "Повторить скачивание PDF" : "Скачать расчёт в PDF"} <span aria-hidden="true">↓</span></button>
            <p className={styles.feedback} role="status">{status[service] === "success" ? "Расчёт готов. Файл отправлен на скачивание." : status[service] === "error" ? "Не удалось создать PDF. Попробуйте ещё раз." : "Состав работ и условия уточним перед подключением."}</p>
          </aside>
        </div>
        <SectionReveal className={styles.help} distance={20}><div><span aria-hidden="true">↗</span><p>Не знаете, что выбрать?<br /><span>Расскажите о задаче — поможем собрать нужный набор услуг.</span></p></div><button type="button" className={ui.textLink} onClick={() => setCallbackOpen(true)}>Помогите с выбором <ArrowRight /></button></SectionReveal>
      </div>
    </div>
    <CallbackDialog open={callbackOpen} onClose={() => setCallbackOpen(false)} />
  </section>;
}
