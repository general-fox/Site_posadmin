"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LAUNCH_CONCEPTS, type LaunchConcept } from "@/lib/launch-concepts";
import {
  PROJECT_CAPABILITIES, PROJECT_EQUIPMENT, PROJECT_SCOPE_WORKS,
  getDefaultProjectSelection, type ProjectCapabilityId, type ProjectEquipmentId, type ProjectWorkId,
} from "@/lib/project-scope";
import { LaunchContactForm } from "./launch-contact-form";
import { SectionReveal } from "./marketing-ui";
import { UiIcon } from "./ui-icon";
import ui from "./marketing.module.css";
import styles from "./launch-section.module.css";
import pricingStyles from "./support-pricing.module.css";

const steps = [
  { id: 0, label: "Заведение" },
  { id: 1, label: "Работы" },
  { id: 2, label: "Контакты" },
] as const;
type LaunchStep = (typeof steps)[number]["id"];

export function LaunchSection() {
  const [step, setStep] = useState<LaunchStep>(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [selection, setSelection] = useState(getDefaultProjectSelection);
  const [equipmentDrafts, setEquipmentDrafts] = useState(() => Object.fromEntries(
    PROJECT_EQUIPMENT.map(({ id, defaultValue }) => [id, String(defaultValue)]),
  ) as Record<ProjectEquipmentId, string>);
  const wizardRef = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);
  const countId = useId();

  useEffect(() => {
    const wizard = wizardRef.current;
    if (!wizard || !moveFocus.current) return;
    moveFocus.current = false;
    const heading = wizard.querySelector<HTMLElement>(`#launch-step-title-${step}`);
    heading?.focus({ preventScroll: true });
    if (wizard.getBoundingClientRect().top < 84 || (heading && heading.getBoundingClientRect().bottom > window.innerHeight)) {
      wizard.scrollIntoView({ block: "start", behavior: "instant" });
    }
  }, [step]);

  const goToStep = (nextStep: LaunchStep) => {
    if (nextStep === step || submitting || complete) return;
    moveFocus.current = true;
    setFurthestStep((current) => Math.max(current, nextStep));
    setStep(nextStep);
  };

  const changeEquipment = (id: ProjectEquipmentId, quantity: number) => {
    const equipment = PROJECT_EQUIPMENT.find((item) => item.id === id)!;
    const normalized = Math.min(equipment.max, Math.max(equipment.min, Math.floor(quantity)));
    setEquipmentDrafts((current) => ({ ...current, [id]: String(normalized) }));
    setSelection((current) => ({ ...current, [id]: normalized }));
  };

  const commitEquipment = (id: ProjectEquipmentId) => {
    const draft = equipmentDrafts[id];
    const parsed = Number(draft);
    changeEquipment(id, draft.trim() && Number.isFinite(parsed) ? parsed : selection[id] ?? 0);
  };

  const changeConcept = (conceptId: LaunchConcept["id"]) => {
    setSelection((current) => ({ ...current, conceptId }));
  };

  const toggleWork = (id: ProjectWorkId, checked: boolean) => setSelection((current) => ({
    ...current,
    selectedWorkIds: checked ? [...new Set([...current.selectedWorkIds, id])] : current.selectedWorkIds.filter((value) => value !== id),
  }));

  const toggleCapability = (id: ProjectCapabilityId, checked: boolean) => setSelection((current) => ({
    ...current,
    selectedCapabilityIds: checked ? [...new Set([...(current.selectedCapabilityIds ?? []), id])] : (current.selectedCapabilityIds ?? []).filter((value) => value !== id),
  }));

  const progressText = complete ? "Анкета отправлена" : `Шаг ${step + 1} из ${steps.length}`;
  const goToWorks = () => goToStep(1);

  return (
    <section id="launch" className={ui.section} aria-labelledby="launch-title">
      <div className={ui.shell}>
        <div className={ui.sectionHeader}>
          <SectionReveal>
            <p className={ui.eyebrow}>Проект · автоматизация HoReCa</p>
            <h2 id="launch-title" className={ui.heading}>Расчет автоматизации</h2>
          </SectionReveal>
          <SectionReveal delay={0.2}>
            <p className={ui.lead}>Укажите оборудование, формат заведения и нужные работы. Менеджер подготовит смету и отправит её выбранным способом.</p>
          </SectionReveal>
        </div>

        <div className={styles.wizard} ref={wizardRef}>
          <div className={styles.progress}>
            <div
              className={styles.progressLabel}
              role="progressbar"
              aria-label="Заполнение анкеты"
              aria-valuemin={0}
              aria-valuemax={steps.length}
              aria-valuenow={step + 1}
              aria-valuetext={complete ? progressText : `${progressText}. ${steps[step].label}`}
            >{progressText}</div>
            <nav aria-label="Этапы анкеты">
              <ol className={styles.progressList}>
                {steps.map(({ id, label }) => {
                  const current = !complete && id === step;
                  const visited = complete || id <= furthestStep;
                  return (
                    <li key={id}>
                      <button
                        className={styles.progressStep}
                        type="button"
                        aria-current={current ? "step" : undefined}
                        aria-controls={`launch-step-${id}`}
                        data-state={current ? "current" : visited ? "visited" : "next"}
                        data-filled={id <= step || complete}
                        disabled={current || !visited || submitting || complete}
                        onClick={() => goToStep(id)}
                      >
                        <span className={styles.progressTrack} aria-hidden="true" />
                        <span className={styles.progressCaption}>
                          <span className={styles.stepNumber} aria-hidden="true">
                            {visited && !current ? <UiIcon name="check" size={13} /> : id + 1}
                          </span>
                          {label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>

          <div className={styles.panels}>
            <section id="launch-step-0" className={`${styles.stage} ${styles.formatStage}`} inert={step !== 0} aria-labelledby="launch-step-title-0">
              <h3 id="launch-step-title-0" className={styles.stageTitle} tabIndex={-1}>Каким будет ваше заведение?</h3>
              <div className={styles.setupGrid}>
                <fieldset className={styles.setupGroup} aria-describedby={`${countId}-equipment-hint`}>
                  <legend>Оборудование</legend>
                  <p id={`${countId}-equipment-hint`} className={styles.setupHint}>Укажите количество.</p>
                  <div className={styles.equipmentList}>
                    {PROJECT_EQUIPMENT.map(({ id, label, hint, min, max }) => {
                      const quantity = selection[id] ?? 0;
                      const inputId = `${countId}-${id}`;
                      return (
                        <div key={id} className={styles.equipmentRow}>
                          <div className={styles.equipmentCopy}>
                            <label htmlFor={inputId}>{label}</label>
                            <p id={`${inputId}-hint`}>{hint}</p>
                          </div>
                          <div className={pricingStyles.stepper}>
                            <button type="button" aria-label={`Уменьшить: ${label}`} disabled={quantity === min} onClick={() => changeEquipment(id, quantity - 1)}><UiIcon name="minus" /></button>
                            <input
                              id={inputId}
                              name={id}
                              type="number"
                              inputMode="numeric"
                              min={min}
                              max={max}
                              step="1"
                              value={equipmentDrafts[id]}
                              aria-describedby={`${inputId}-hint`}
                              onChange={(event) => {
                                const raw = event.target.value;
                                setEquipmentDrafts((current) => ({ ...current, [id]: raw }));
                                const value = Number(raw);
                                if (raw && Number.isInteger(value) && value >= min && value <= max) {
                                  setSelection((current) => ({ ...current, [id]: value }));
                                }
                              }}
                              onBlur={() => commitEquipment(id)}
                              onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
                            />
                            <button type="button" aria-label={`Увеличить: ${label}`} disabled={quantity === max} onClick={() => changeEquipment(id, quantity + 1)}><UiIcon name="plus" /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </fieldset>
                <fieldset className={styles.setupGroup}>
                  <legend>Формат заведения</legend>
                  <p className={styles.setupHint}>Выберите концепцию — учтём её при подготовке сметы.</p>
                  <div className={styles.concepts}>
                    {LAUNCH_CONCEPTS.map((item) => (
                      <label key={item.id} className={styles.concept}>
                        <input type="radio" name="launch-concept" value={item.id} checked={item.id === selection.conceptId} onChange={() => changeConcept(item.id)} aria-labelledby={`${countId}-${item.id}-name`} aria-describedby={`${countId}-${item.id}-hint`} />
                        <span className={styles.radioMark} aria-hidden="true" />
                        <span className={styles.optionCopy}>
                          <span className={styles.optionTitle} id={`${countId}-${item.id}-name`}>{item.label}</span>
                          <span className={styles.optionHint} id={`${countId}-${item.id}-hint`}>{item.hint}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
              <div className={styles.actions}>
                <button type="button" className={ui.primary} onClick={() => goToStep(1)}>Далее <UiIcon name="arrow-right" /></button>
              </div>
            </section>

            <section id="launch-step-1" className={styles.stage} inert={step !== 1} aria-labelledby="launch-step-title-1">
              <h3 id="launch-step-title-1" className={styles.stageTitle} tabIndex={-1}>Какие работы нужны?</h3>
              <fieldset className={styles.workList}>
                <legend className={styles.srOnly}>Работы по автоматизации заведения</legend>
                {PROJECT_SCOPE_WORKS.map((work) => {
                  const checked = selection.selectedWorkIds.includes(work.id);
                  return (
                    <label key={work.id} className={styles.work}>
                      <input type="checkbox" name="project-work" value={work.id} checked={checked} onChange={(event) => toggleWork(work.id, event.target.checked)} aria-labelledby={`${countId}-${work.id}-name`} aria-describedby={`${countId}-${work.id}-description`} />
                      <span className={styles.checkMark} aria-hidden="true">{checked && <UiIcon name="check" />}</span>
                      <span className={styles.optionCopy}>
                        <span className={styles.optionTitle} id={`${countId}-${work.id}-name`}>{work.title}</span>
                        <span className={styles.optionHint} id={`${countId}-${work.id}-description`}>{work.description}</span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
              <fieldset className={styles.capabilities}>
                <legend>Дополнительные возможности</legend>
                <div className={styles.capabilityChoices}>
                  {PROJECT_CAPABILITIES.map((capability) => (
                    <label key={capability.id} className={styles.capability}>
                      <input type="checkbox" name="project-capability" value={capability.id} checked={selection.selectedCapabilityIds?.includes(capability.id) ?? false} onChange={(event) => toggleCapability(capability.id, event.target.checked)} />
                      <span>{capability.title}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className={styles.actions}>
                <button type="button" className={`${ui.secondary} ${styles.back}`} aria-label="Назад" onClick={() => goToStep(0)}>
                  <UiIcon name="chevron-down" size={16} className="rotate-90" />
                  <span className={styles.backLabel}>Назад</span>
                </button>
                <button type="button" className={ui.primary} onClick={() => goToStep(2)}>Далее <UiIcon name="arrow-right" /></button>
              </div>
            </section>

            <div className={styles.stage} inert={step !== 2}>
              <LaunchContactForm
                selection={selection}
                onBack={goToWorks}
                onComplete={() => setComplete(true)}
                onPendingChange={setSubmitting}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
