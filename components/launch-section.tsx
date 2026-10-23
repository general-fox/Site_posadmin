"use client";

import { useId, useState } from "react";
import { LAUNCH_CONCEPTS, type LaunchConcept } from "@/lib/launch-concepts";
import {
  PROJECT_ESTIMATE_EXCLUSIONS, PROJECT_ESTIMATE_NOTICE, PROJECT_REGISTER_MAX, PROJECT_REGISTER_MIN, PROJECT_WORKS,
  buildProjectEstimateBrief, calculateProjectEstimate, formatCashRegisters, formatProjectMoney, getDefaultProjectSelection,
  type ProjectWorkId,
} from "@/lib/project-estimate";
import { ArrowRight, SectionReveal } from "./marketing-ui";
import { ProjectDialog } from "./project-dialog";
import ui from "./marketing.module.css";
import styles from "./launch-section.module.css";

function Check() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function LaunchSection() {
  const [selection, setSelection] = useState(getDefaultProjectSelection);
  const [dialogOpen, setDialogOpen] = useState(false);
  const countId = useId();
  const totalId = useId();
  const estimate = calculateProjectEstimate(selection);
  const { concept } = estimate;

  const changeConcept = (conceptId: LaunchConcept["id"]) => setSelection((current) => ({ ...getDefaultProjectSelection(conceptId), registers: current.registers }));
  const changeRegisters = (registers: number) => setSelection((current) => ({ ...current, registers }));
  const toggleWork = (id: ProjectWorkId, checked: boolean) => setSelection((current) => ({ ...current, selectedWorkIds: checked ? [...new Set([...current.selectedWorkIds, id])] : current.selectedWorkIds.filter((value) => value !== id) }));

  return <section id="launch" className={ui.section} aria-labelledby="launch-title">
    <div className={ui.shell}>
      <div className={ui.sectionHeader}>
        <SectionReveal distance={22}>
          <p className={ui.eyebrow}>Проект · автоматизация HoReCa</p>
          <h2 id="launch-title" className={ui.heading}>От идеи заведения<br /><span className={ui.muted}>до первой рабочей смены.</span></h2>
        </SectionReveal>
        <SectionReveal distance={18} delay={0.1}>
          <p className={ui.lead}>Запустим ресторан, кафе, бар, отель или сеть с нуля. Подберём системы, настроим оборудование и объединим процессы. Выберите основу проекта — получите предварительный ориентир по работам.</p>
        </SectionReveal>
      </div>

      <SectionReveal distance={16}>
        <div className={styles.planner}>
          <div className={styles.selection}>
            <span className={styles.stepLabel}>01 / Формат и масштаб</span>
            <h3>Каким будет ваше заведение?</h3>
            <p className={styles.selectionLead}>Для каждого формата предложим набор работ. Любую дополнительную задачу можно включить или убрать.</p>
            <fieldset className={styles.concepts}>
              <legend className={styles.srOnly}>Концепция заведения</legend>
              {LAUNCH_CONCEPTS.map((item) => <label key={item.id} className={styles.concept}>
                <input type="radio" name="launch-concept" value={item.id} checked={item.id === selection.conceptId} onChange={() => changeConcept(item.id)} aria-controls="launch-scope" />
                <span><strong>{item.label}</strong><span>{item.hint}</span></span>
                <span className={styles.radioMark} aria-hidden="true" />
              </label>)}
            </fieldset>

            <div className={styles.registers}>
              <label htmlFor={countId}>Кассовые места</label>
              <div className={styles.registerControls}>
                <button type="button" aria-label="Уменьшить число кассовых мест" disabled={selection.registers === PROJECT_REGISTER_MIN} onClick={() => changeRegisters(selection.registers - 1)}>−</button>
                <output htmlFor={countId}>{selection.registers}</output>
                <button type="button" aria-label="Увеличить число кассовых мест" disabled={selection.registers === PROJECT_REGISTER_MAX} onClick={() => changeRegisters(selection.registers + 1)}>+</button>
              </div>
              <input id={countId} type="range" min={PROJECT_REGISTER_MIN} max={PROJECT_REGISTER_MAX} step="1" value={selection.registers} aria-valuetext={formatCashRegisters(selection.registers)} aria-describedby={`${countId}-hint`} onChange={(event) => changeRegisters(Number(event.target.value))} />
              <p id={`${countId}-hint`}>От 1 до 10 мест в одном заведении. Для сети или большего числа касс менеджер подготовит отдельную смету.</p>
            </div>

            <div className={styles.conceptFocus}><Check /><p>{concept.focus}</p></div>
            <p className={styles.note}>При смене концепции подставим рекомендованный набор. Количество касс сохранится.</p>
          </div>

          <div className={styles.scope} id="launch-scope">
            <div className={styles.scopeTop}><span className={styles.stepLabel}>02 / Состав работ</span><span className={styles.scopeBadge}><Check />Единая команда</span></div>
            <h3>Соберите основу проекта</h3>
            <p className={styles.scopeLead}>Два базовых пункта уже включены. Остальное — по вашим задачам. Все суммы ниже — за работы, разово.</p>
            <fieldset className={styles.workList}>
              <legend className={styles.srOnly}>Работы по автоматизации заведения</legend>
              {PROJECT_WORKS.map((work) => {
                const checked = work.required || selection.selectedWorkIds.includes(work.id);
                const quantity = work.unit === "register" ? selection.registers : 1;
                return <label key={work.id} className={styles.work} data-required={work.required}>
                  <input type="checkbox" name="project-work" value={work.id} checked={checked} disabled={work.required} onChange={(event) => toggleWork(work.id, event.target.checked)} aria-describedby={`${countId}-${work.id}`} />
                  <span className={styles.checkMark} aria-hidden="true">{checked && <Check />}</span>
                  <span className={styles.workCopy}><strong>{work.title}{work.required && <span className={styles.included}>База</span>}</strong><span id={`${countId}-${work.id}`}>{work.description}</span></span>
                  <span className={styles.workPrice}><strong>{formatProjectMoney(work.price * quantity)}</strong><span>{work.unit === "register" ? `${quantity} × ${formatProjectMoney(work.price)}` : "за проект"}</span></span>
                </label>;
              })}
            </fieldset>
            <p className={styles.extraScope}>Нужны ЕГАИС, маркировка, Меркурий, видеонаблюдение, телефония или индивидуальная интеграция? Включим в проект после уточнения задачи.</p>
          </div>
        </div>

        <div className={styles.estimate}>
          <div className={styles.total}>
            <span className={styles.stepLabel}>03 / Предварительный ориентир</span>
            <p className={styles.totalValue} id={totalId} aria-live="polite" aria-atomic="true"><span className={styles.srOnly}>Предварительный ориентир: </span>{formatProjectMoney(estimate.total)}<span>за выбранные работы</span></p>
            <p className={styles.draftNotice}>{PROJECT_ESTIMATE_NOTICE}</p>
            <p className={styles.exclusions}>{PROJECT_ESTIMATE_EXCLUSIONS}</p>
          </div>
          <div className={styles.estimateAction}>
            <p>Менеджер проверит состав, уточнит детали и пришлёт смету в удобный чат или обсудит по телефону.</p>
            <button type="button" className={ui.primary} aria-haspopup="dialog" aria-describedby={totalId} onClick={() => setDialogOpen(true)}>Уточнить смету проекта <ArrowRight /></button>
            <span>Формат, выбранные работы и сумму добавим в заявку</span>
          </div>
        </div>
      </SectionReveal>

      <div className={styles.afterLaunch}><span><strong>Открылись? Остаёмся рядом.</strong> Ежедневная поддержка — по отдельным тарифам на обслуживание.</span><a className={ui.textLink} href="#pricing">Посмотреть тарифы <ArrowRight /></a></div>
    </div>
    <ProjectDialog open={dialogOpen} onClose={() => setDialogOpen(false)} initialStage="new" projectBrief={{
      label: concept.label,
      text: buildProjectEstimateBrief(estimate),
      preview: {
        total: formatProjectMoney(estimate.total),
        scope: formatCashRegisters(estimate.registers),
        items: estimate.items.map((item) => ({ title: item.title, detail: `${item.quantity} × ${formatProjectMoney(item.price)}`, amount: formatProjectMoney(item.total) })),
        notice: PROJECT_ESTIMATE_NOTICE,
        exclusions: PROJECT_ESTIMATE_EXCLUSIONS,
      },
    }} />
  </section>;
}
