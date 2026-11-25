"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LAUNCH_CONCEPTS, type LaunchConcept } from "@/lib/launch-concepts";
import {
  PROJECT_CAPABILITIES, PROJECT_REGISTER_LIMIT_NOTE, PROJECT_SCOPE_WORKS,
  getDefaultProjectSelection, type ProjectCapabilityId, type ProjectWorkId,
} from "@/lib/project-scope";
import { BaseBadge } from "./base-badge";
import { LaunchContactForm } from "./launch-contact-form";
import { SectionReveal, useScrollReveal } from "./marketing-ui";
import { UiIcon } from "./ui-icon";
import { WorkplaceCount } from "./workplace-count";
import ui from "./marketing.module.css";
import styles from "./launch-section.module.css";

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
  const headingRef = useRef<HTMLHeadingElement>(null);
  const wizardRef = useScrollReveal<HTMLDivElement>({ motion: "lift", after: headingRef });
  const formatRevealRef = useScrollReveal<HTMLElement>({ motion: "lift", sequence: true, after: wizardRef });
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
  }, [step, wizardRef]);

  const goToStep = (nextStep: LaunchStep) => {
    if (nextStep === step || submitting || complete) return;
    moveFocus.current = true;
    setFurthestStep((current) => Math.max(current, nextStep));
    setStep(nextStep);
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
        <div className={`${ui.sectionHeader} ${styles.intro}`}>
          <SectionReveal sectionEntryViewportFraction={0.4}>
            <p className={ui.eyebrow}>Проект · автоматизация HoReCa</p>
            <h2 ref={headingRef} id="launch-title" className={ui.heading}>Расчет автоматизации</h2>
          </SectionReveal>
          <SectionReveal delay={0.12}>
            <p className={ui.lead}>Укажите формат заведения и нужные работы. Менеджер подготовит смету и отправит её выбранным способом.</p>
          </SectionReveal>
        </div>

        <div className={styles.wizard} ref={wizardRef} data-scroll-reveal="">
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
            <section id="launch-step-0" ref={formatRevealRef} className={`${styles.stage} ${styles.formatStage}`} inert={step !== 0} aria-labelledby="launch-step-title-0" data-scroll-reveal="">
              <h3 id="launch-step-title-0" className={styles.stageTitle} tabIndex={-1}>Каким будет ваше заведение?</h3>
              <WorkplaceCount
                id={countId}
                value={selection.registers}
                description="Кассы и станции официантов"
                limitNote={PROJECT_REGISTER_LIMIT_NOTE}
                onChange={(registers) => setSelection((current) => ({ ...current, registers }))}
                revealItem
              />
              <fieldset className={styles.concepts}>
                <legend className={styles.srOnly}>Формат заведения</legend>
                {LAUNCH_CONCEPTS.map((concept) => (
                  <label key={concept.id} className={styles.concept} data-reveal-item="">
                    <input type="radio" name="launch-concept" value={concept.id} checked={concept.id === selection.conceptId} onChange={() => changeConcept(concept.id)} aria-labelledby={`${countId}-${concept.id}-name`} aria-describedby={`${countId}-${concept.id}-hint`} />
                    <span className={styles.radioMark} aria-hidden="true" />
                    <span className={styles.optionCopy}>
                      <span className={styles.optionTitle} id={`${countId}-${concept.id}-name`}>{concept.label}</span>
                      <span className={styles.optionHint} id={`${countId}-${concept.id}-hint`}>{concept.hint}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <div className={styles.actions}>
                <button type="button" className={ui.primary} onClick={() => goToStep(1)}>Далее <UiIcon name="arrow-right" /></button>
              </div>
            </section>

            <section id="launch-step-1" className={styles.stage} inert={step !== 1} aria-labelledby="launch-step-title-1">
              <h3 id="launch-step-title-1" className={styles.stageTitle} tabIndex={-1}>Какие работы нужны?</h3>
              <fieldset className={styles.workList}>
                <legend className={styles.srOnly}>Работы по автоматизации заведения</legend>
                {PROJECT_SCOPE_WORKS.map((work) => {
                  const checked = work.required || selection.selectedWorkIds.includes(work.id);
                  return (
                    <label key={work.id} className={styles.work} data-required={work.required}>
                      <input type="checkbox" name="project-work" value={work.id} checked={checked} disabled={work.required} onChange={(event) => toggleWork(work.id, event.target.checked)} aria-labelledby={`${countId}-${work.id}-name`} aria-describedby={`${countId}-${work.id}-description`} />
                      <span className={styles.checkMark} aria-hidden="true">{checked && <UiIcon name="check" />}</span>
                      <span className={styles.optionCopy}>
                        <span className={styles.optionTitle} id={`${countId}-${work.id}-name`}>{work.title}{work.required && <BaseBadge className={styles.included} label="Базовая услуга" />}</span>
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
