"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LAUNCH_CONCEPTS, type LaunchConcept } from "@/lib/launch-concepts";
import {
  PROJECT_PRICES_UPDATED_AT, PROJECT_REGISTER_MAX, PROJECT_REGISTER_MIN, PROJECT_WORKS,
  PROJECT_CAPABILITIES, PROJECT_CAPABILITIES_NOTICE,
  calculateProjectEstimate, formatCashRegisters, formatProjectMoney, getDefaultProjectSelection,
  type ProjectWorkId, type ProjectCapabilityId,
} from "@/lib/project-estimate";
import { ArrowRight, SectionReveal } from "./marketing-ui";
import { CallbackDialog } from "./callback-dialog";
import { BaseBadge } from "./base-badge";
import ui from "./marketing.module.css";
import styles from "./launch-section.module.css";
import pricingStyles from "./support-pricing.module.css";

function Check() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function LaunchSection() {
  const [selection, setSelection] = useState(getDefaultProjectSelection);
  const [registerDraft, setRegisterDraft] = useState(() => String(getDefaultProjectSelection().registers));
  const [registerLimitVisible, setRegisterLimitVisible] = useState(false);
  const registerLimitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const countId = useId();
  const totalId = useId();
  const registerLimitId = `${countId}-limit`;
  const capabilitiesHintId = `${countId}-capabilities`;
  const estimate = calculateProjectEstimate(selection);
  const pricesUpdatedDate = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Moscow" }).format(new Date(PROJECT_PRICES_UPDATED_AT));

  useEffect(() => () => {
    if (registerLimitTimer.current !== null) clearTimeout(registerLimitTimer.current);
  }, []);

  const showRegisterLimit = () => {
    if (registerLimitTimer.current !== null) clearTimeout(registerLimitTimer.current);
    setRegisterLimitVisible(true);
    registerLimitTimer.current = setTimeout(() => {
      setRegisterLimitVisible(false);
      registerLimitTimer.current = null;
    }, 5000);
  };

  const changeConcept = (conceptId: LaunchConcept["id"]) => setSelection((current) => current.conceptId === conceptId ? current : ({ ...getDefaultProjectSelection(conceptId), registers: current.registers, selectedCapabilityIds: current.selectedCapabilityIds ?? [] }));
  const changeRegisters = (registers: number) => {
    if (registers > PROJECT_REGISTER_MAX) showRegisterLimit();
    else if (registers < PROJECT_REGISTER_MAX) {
      if (registerLimitTimer.current !== null) clearTimeout(registerLimitTimer.current);
      registerLimitTimer.current = null;
      setRegisterLimitVisible(false);
    }
    const normalized = Math.min(PROJECT_REGISTER_MAX, Math.max(PROJECT_REGISTER_MIN, Math.floor(registers)));
    setRegisterDraft(String(normalized));
    setSelection((current) => ({ ...current, registers: normalized }));
  };
  const commitRegisters = () => {
    const parsed = Number(registerDraft);
    changeRegisters(registerDraft.trim() && Number.isFinite(parsed) ? parsed : selection.registers);
  };
  const toggleWork = (id: ProjectWorkId, checked: boolean) => setSelection((current) => ({ ...current, selectedWorkIds: checked ? [...new Set([...current.selectedWorkIds, id])] : current.selectedWorkIds.filter((value) => value !== id) }));
  const toggleCapability = (id: ProjectCapabilityId, checked: boolean) => setSelection((current) => ({
    ...current,
    selectedCapabilityIds: checked ? [...new Set([...(current.selectedCapabilityIds ?? []), id])] : (current.selectedCapabilityIds ?? []).filter((value) => value !== id),
  }));

  return <section id="launch" className={ui.section} aria-labelledby="launch-title">
    <div className={ui.shell}>
      <div className={ui.sectionHeader}>
        <SectionReveal distance={22}>
          <p className={ui.eyebrow}>Проект · автоматизация HoReCa</p>
          <h2 id="launch-title" className={ui.heading}>Расчёт автоматизации</h2>
        </SectionReveal>
        <SectionReveal distance={18} delay={0.1}>
          <p className={styles.updatedAt}>Актуально на <time dateTime={PROJECT_PRICES_UPDATED_AT}>{pricesUpdatedDate} г.</time></p>
        </SectionReveal>
      </div>

      <div className={styles.stages}>
        <section className={styles.stage} id="launch-step-0" aria-labelledby="launch-step-title-0">
          <div className={styles.stageContent}>
          <div className={styles.formatHeader}>
            <h3 id="launch-step-title-0" className={styles.stageTitle}>Каким будет ваше заведение?</h3>
            <div className={`${pricingStyles.countRow} ${styles.registers}`}>
              <div><label htmlFor={countId}>Кассовые места</label></div>
              <div className={pricingStyles.stepper}>
                <button type="button" aria-label="Уменьшить число кассовых мест" disabled={selection.registers === PROJECT_REGISTER_MIN} onClick={() => changeRegisters(selection.registers - 1)}>−</button>
                <input id={countId} type="number" inputMode="numeric" min={PROJECT_REGISTER_MIN} max={PROJECT_REGISTER_MAX} step="1" value={registerDraft} aria-describedby={registerLimitVisible ? registerLimitId : undefined}
                  onChange={(event) => {
                    const raw = event.target.value;
                    setRegisterDraft(raw);
                    const value = Number(raw);
                    if (raw && Number.isInteger(value) && value >= PROJECT_REGISTER_MIN && value <= PROJECT_REGISTER_MAX) {
                      setSelection((current) => ({ ...current, registers: value }));
                    }
                  }}
                  onBlur={commitRegisters}
                  onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
                <button type="button" aria-label="Увеличить число кассовых мест" aria-describedby={registerLimitVisible ? registerLimitId : undefined} onClick={() => changeRegisters(selection.registers + 1)}>+</button>
              </div>
              {registerLimitVisible && <p id={registerLimitId} className={styles.registerLimit} role="status">Для большего числа касс менеджер подготовит отдельную смету.</p>}
            </div>
          </div>
          <div className={styles.formatLayout}>
            <fieldset className={styles.concepts}>
              <legend className={styles.srOnly}>Концепция заведения</legend>
              {LAUNCH_CONCEPTS.map((item) => <label key={item.id} className={styles.concept}>
                <input type="radio" name="launch-concept" value={item.id} checked={item.id === selection.conceptId} onChange={() => changeConcept(item.id)} />
                <span><strong>{item.label}</strong><span>{item.hint}</span></span>
                <span className={styles.radioMark} aria-hidden="true" />
              </label>)}
            </fieldset>
          </div>
          </div>
        </section>

        <div className={styles.estimateLayout}>
        <h3 id="launch-step-title-1" className={`${styles.stageTitle} ${styles.estimateTitle}`}>Соберите основу проекта</h3>
        <section className={styles.stage} id="launch-step-1" aria-labelledby="launch-step-title-1">
          <div className={styles.stageContent}>
          <fieldset className={styles.workList}>
            <legend className={styles.srOnly}>Работы по автоматизации заведения</legend>
            {PROJECT_WORKS.map((work) => {
              const checked = work.required || selection.selectedWorkIds.includes(work.id);
              const quantity = work.unit === "register" ? selection.registers : 1;
              return <label key={work.id} className={styles.work} data-required={work.required}>
                <input type="checkbox" name="project-work" value={work.id} checked={checked} disabled={work.required} onChange={(event) => toggleWork(work.id, event.target.checked)} aria-describedby={`${countId}-${work.id}`} />
                <span className={styles.checkMark} aria-hidden="true">{checked && <Check />}</span>
                <span className={styles.workCopy}><strong>{work.title}{work.required && <BaseBadge className={styles.included} />}</strong><span id={`${countId}-${work.id}`}>{work.description}</span></span>
                <span className={styles.workPrice}><strong>{formatProjectMoney(work.price * quantity)}</strong>{work.unit === "register" && <span>{quantity} × {formatProjectMoney(work.price)}</span>}</span>
              </label>;
            })}
          </fieldset>
          <fieldset className={styles.capabilities} aria-describedby={capabilitiesHintId}>
            <legend>Дополнительные возможности</legend>
            <p id={capabilitiesHintId}>{PROJECT_CAPABILITIES_NOTICE}</p>
            <div className={styles.capabilityChoices}>
              {PROJECT_CAPABILITIES.map((capability) => <label key={capability.id} className={styles.capability}>
                <input type="checkbox" name="project-capability" value={capability.id} checked={selection.selectedCapabilityIds?.includes(capability.id) ?? false} onChange={(event) => toggleCapability(capability.id, event.target.checked)} />
                <span>{capability.title}</span>
              </label>)}
            </div>
          </fieldset>
          </div>
        </section>

        <aside className={styles.estimateStage} id="launch-step-2" aria-labelledby="launch-step-title-2">
          <div className={styles.resultCard}>
            <div className={styles.resultOverview}>
              <div className={styles.resultHeader}><h3 id="launch-step-title-2">Ваш расчёт</h3></div>
              <p className={styles.resultContext}>{estimate.concept.label}<span>{formatCashRegisters(estimate.registers)}</span></p>
              <p className={styles.totalValue} id={totalId} aria-live="polite" aria-atomic="true">{formatProjectMoney(estimate.total)}</p>
              <p className={styles.resultPeriod}>За выбранные работы · разово</p>
            </div>
            <div className={styles.resultActions}>
              <details className={styles.resultDetails}>
                <summary>Состав расчёта <span className={styles.resultCount}>{estimate.items.length}</span><span className={styles.resultExpand} aria-hidden="true">+</span></summary>
                <ul className={styles.resultList} aria-label="Выбранные работы" tabIndex={0}>
                  {estimate.items.map(item => <li key={item.id}><span>{item.title}{item.quantity > 1 && <small>{item.quantity} × {formatProjectMoney(item.price)}</small>}</span><strong>{formatProjectMoney(item.total)}</strong></li>)}
                </ul>
              </details>
              {estimate.capabilities.length > 0 && <div className={styles.resultCapabilities}>
                <h4>Индивидуальный расчёт</h4>
                <ul>{estimate.capabilities.map(({ id, title }) => <li key={id}>{title}</li>)}</ul>
                <p>В сумму выше не включено.</p>
              </div>}
              <button type="button" className={ui.primary} aria-haspopup="dialog" aria-describedby={totalId} onClick={() => setDialogOpen(true)}>Уточнить смету проекта <ArrowRight /></button>
            </div>
          </div>
        </aside>
        </div>
      </div>

      <div className={styles.afterLaunch}><span><strong>Открылись? Остаёмся рядом.</strong> Ежедневная поддержка — по отдельным тарифам на обслуживание.</span><a className={ui.textLink} href="#pricing">Посмотреть тарифы <ArrowRight /></a></div>
    </div>
    <CallbackDialog open={dialogOpen} onClose={() => setDialogOpen(false)} projectEstimate={selection} />
  </section>;
}
