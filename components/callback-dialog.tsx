"use client";

import { motion } from "framer-motion";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { ArrowRight, useMarketingReducedMotion } from "./marketing-ui";
import ui from "./marketing.module.css";
import styles from "./callback-dialog.module.css";
import { getCalculationSummary, type CalculationSelection } from "@/lib/calculation-request";
import { usePricing } from "./pricing-provider";
import { DEMO_FORM_NOTICE, IS_REVIEW_DEMO } from "@/lib/demo-mode";
import type { CallbackSpecialist } from "@/lib/callback-specialist";
import { isPricingSnapshot, type PricingSnapshot } from "@/lib/pricing-snapshot";
import {
  CALLBACK_HOURS_LABEL,
  getCallbackDateError,
  getCallbackSlots,
  getMoscowDateTime,
  getNextCallbackSlot,
  validateCallbackSchedule,
} from "@/lib/callback-schedule";

type CallbackDialogProps = {
  onClose: () => void;
  open: boolean;
  calculation?: CalculationSelection;
  chooseSpecialist?: boolean;
};

function formatRussianPhone(value: string) {
  const rawDigits = value.replace(/\D/g, "");
  const hasRussianPrefix = value.trimStart().startsWith("+7");
  let nationalDigits = rawDigits;
  if (hasRussianPrefix && nationalDigits.startsWith("7")) {
    nationalDigits = nationalDigits.slice(1);
  }
  if (
    nationalDigits.length > 10 &&
    (nationalDigits.startsWith("7") || nationalDigits.startsWith("8"))
  ) {
    nationalDigits = nationalDigits.slice(1);
  }
  nationalDigits = nationalDigits.slice(0, 10);

  let formatted = "+7";
  if (nationalDigits.length === 0) return `${formatted} `;

  formatted += ` (${nationalDigits.slice(0, 3)}`;
  if (nationalDigits.length < 3) return formatted;

  formatted += ")";
  if (nationalDigits.length === 3) return `${formatted} `;

  formatted += ` ${nationalDigits.slice(3, 6)}`;
  if (nationalDigits.length > 6) {
    formatted += `-${nationalDigits.slice(6, 8)}`;
  }
  if (nationalDigits.length > 8) {
    formatted += `-${nationalDigits.slice(8, 10)}`;
  }
  return formatted;
}

export function CallbackDialog({ onClose, open, calculation, chooseSpecialist = false }: CallbackDialogProps) {
  const { snapshot, updateSnapshot } = usePricing();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const submittingRef = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  const phoneHintId = useId();
  const scheduleHintId = useId();
  const scheduleErrorId = useId();
  const reduced = useMarketingReducedMotion();
  const [scheduleNow, setScheduleNow] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [contactSoon, setContactSoon] = useState(true);
  const [phone, setPhone] = useState("+7 ");
  const [specialist, setSpecialist] = useState<CallbackSpecialist | "">(chooseSpecialist ? "" : "manager");
  const summary = calculation ? getCalculationSummary(calculation, snapshot.config) : null;
  const dateError = !contactSoon && scheduleNow ? getCallbackDateError(selectedDate, scheduleNow) : null;
  const availableTimes = scheduleNow ? getCallbackSlots(selectedDate, scheduleNow) : [];
  const formatPrice = (value: number) => `${value.toLocaleString("ru-RU")} ₽`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      const now = new Date();
      const nextSlot = getNextCallbackSlot(now);

      setSubmitted(false);
      setSubmitting(false);
      submittingRef.current = false;
      setSubmitError("");
      setContactSoon(true);
      setPhone("+7 ");
      setSpecialist(chooseSpecialist ? "" : "manager");
      setScheduleNow(now);
      setSelectedDate(nextSlot.date);
      setSelectedTime(nextSlot.time);
      dialog.showModal();
      const frame = window.requestAnimationFrame(() => {
        if (chooseSpecialist) titleRef.current?.focus({ preventScroll: true });
        else phoneInputRef.current?.focus({ preventScroll: true });
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (!open && dialog.open) dialog.close();
  }, [open, chooseSpecialist]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [open]);

  const closeDialog = () => {
    if (!submittingRef.current) dialogRef.current?.close();
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) closeDialog();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (IS_REVIEW_DEMO) { setSubmitError(DEMO_FORM_NOTICE); return; }
    if (submittingRef.current) return;
    if (!specialist) {
      setSubmitError("Выберите, с кем хотите поговорить.");
      return;
    }
    if (calculation !== undefined && !summary) {
      setSubmitError("Не удалось проверить расчёт. Закройте форму и выберите услуги заново.");
      return;
    }
    const formData = new FormData(event.currentTarget);
    // Keep the submitted slot and the confirmation tied to the same state.
    // A native select may display its first option when an expired value is removed.
    const date = contactSoon ? "" : selectedDate;
    const time = contactSoon ? "" : selectedTime;

    if (!contactSoon) {
      const now = new Date();
      setScheduleNow(now);
      const scheduleError = validateCallbackSchedule(date, time, now);
      if (scheduleError) {
        if (!getCallbackSlots(date, now).includes(time)) setSelectedTime("");
        setSubmitError(scheduleError);
        return;
      }
    }

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/callback", {
        body: JSON.stringify({
          specialist,
          contactSoon,
          date,
          personalDataConsent:
            formData.get("personalDataConsent") === "on",
          phone,
          time,
          website: formData.get("website") || "",
          ...(summary ? { calculation: summary.selection, pricingRevision: snapshot.revision } : {}),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal: AbortSignal.timeout(15_000),
      });
      const result = (await response.json().catch(() => null)) as
        | { error?: string; ok?: boolean; snapshot?: PricingSnapshot }
        | null;

      if (response.status === 409 && isPricingSnapshot(result?.snapshot)) updateSnapshot(result.snapshot);
      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Не удалось отправить заявку.");
      }

      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")
          ? "Не удалось подтвердить отправку. Проверьте соединение и попробуйте ещё раз."
          : error instanceof Error
          ? error.message
          : "Не удалось отправить заявку. Попробуйте ещё раз.",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const showScheduleFields = () => {
    const now = new Date();
    setScheduleNow(now);
    // Switching modes should not discard a future slot the visitor chose.
    if (validateCallbackSchedule(selectedDate, selectedTime, now)) {
      const nextSlot = getNextCallbackSlot(now);
      setSelectedDate(nextSlot.date);
      setSelectedTime(nextSlot.time);
    }
    setContactSoon(false);
  };

  return (
    <dialog
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className={styles.dialog}
      data-lenis-prevent
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
      onClick={handleBackdropClick}
      onClose={onClose}
      ref={dialogRef}
    >
      {open ? (
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={styles.panel}
          initial={reduced ? false : { opacity: 0, scale: 0.99, y: 12 }}
          transition={{ duration: reduced ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            aria-label="Закрыть окно"
            className={styles.close}
            disabled={submitting}
            onClick={closeDialog}
            type="button"
          >
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16">
              <path d="M3 3L13 13M13 3L3 13" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
            </svg>
          </button>

          {submitted ? (
            <div className={styles.success} role="status">
              <span className={styles.successIcon} aria-hidden="true">
                <svg className="h-7 w-7" viewBox="0 0 28 28">
                  <path d="M7 14.5L11.5 19L21 9.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </span>
              <p className={ui.eyebrow}>Спасибо за обращение</p>
              <h2 className={styles.title} id={titleId}>Заявка принята</h2>
              <p className={styles.description} id={descriptionId}>
                {specialist === "technical"
                  ? "Заявка на звонок технического специалиста принята. Мы свяжемся с вами по указанному номеру."
                  : contactSoon
                  ? "Менеджер свяжется с вами в ближайшее рабочее время: по будням с 10:00 до 19:00 МСК."
                  : `Передали менеджеру удобное время звонка: ${new Date(`${selectedDate}T12:00:00+03:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", timeZone: "Europe/Moscow" })}, ${selectedTime} МСК.`}
                {summary ? " Ваш расчёт приложен к заявке." : ""}
              </p>
              <button
                className={`${ui.primary} ${styles.submit}`}
                onClick={closeDialog}
                type="button"
              >
                Готово
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} aria-busy={submitting}>
              <label className={styles.honeypot} aria-hidden="true">
                Не заполняйте это поле
                <input
                  autoComplete="off"
                  name="website"
                  tabIndex={-1}
                  type="text"
                />
              </label>
              <p className={`${ui.eyebrow} ${styles.eyebrow}`}>{chooseSpecialist ? "Обратный звонок" : "Связь с менеджером"}</p>
              <h2 className={styles.title} id={titleId} ref={titleRef} tabIndex={-1}>
                {chooseSpecialist ? "Кто вам нужен?" : summary ? "Обсудим ваш расчёт" : "Когда вам удобно поговорить?"}
              </h2>
              <p className={styles.description} id={descriptionId}>
                {IS_REVIEW_DEMO ? "Демонстрация формы: данные не отправляются. Для проверки можно использовать вымышленный номер." : chooseSpecialist ? "Выберите специалиста и оставьте номер. Передадим запрос нужной команде." : summary ? "Расчёт отправится менеджеру вместе с заявкой." : "Оставьте номер и выберите удобное время — мы свяжемся с вами и обсудим вашу задачу."}
              </p>

              {chooseSpecialist ? (
                <fieldset className={styles.specialists} disabled={submitting}>
                  <legend className={styles.label}>С кем хотите поговорить</legend>
                  <div className={styles.specialistChoices}>
                    <label className={`${styles.choice} ${styles.specialistChoice}`}>
                      <input type="radio" name="specialist" value="manager" checked={specialist === "manager"} required onChange={() => { setSpecialist("manager"); setSubmitError(""); }} />
                      <span><strong>Менеджер</strong><span>Проект, тарифы и подключение</span></span>
                    </label>
                    <label className={`${styles.choice} ${styles.specialistChoice}`}>
                      <input type="radio" name="specialist" value="technical" checked={specialist === "technical"} required onChange={() => { setSpecialist("technical"); setSubmitError(""); }} />
                      <span><strong>Технический специалист</strong><span>Кассы, r_keeper и IT-вопросы</span></span>
                    </label>
                  </div>
                  <p className={styles.specialistHint} aria-live="polite">
                    {specialist === "manager" ? "Менеджер перезвонит в рабочее время: по будням с 10:00 до 19:00 МСК." : specialist === "technical" ? "Передадим запрос технической команде. Специалист перезвонит по готовности." : "Заявку можно оставить в любое время."}
                  </p>
                </fieldset>
              ) : null}

              {summary ? (
                <section className={styles.calculation} aria-label="Выбранное сопровождение">
                  <div className={styles.calculationHeading}>
                    <p>{summary.productName}</p>
                    <p className={styles.calculationTotal}>{formatPrice(summary.monthlyTotal)}<span>/мес.</span></p>
                  </div>
                  <p className={styles.calculationMeta}>Рабочих мест: {summary.workplaceCount}{summary.locationLabel ? ` · ${summary.locationLabel}` : ""}</p>
                  <details className={styles.calculationDetails}>
                    <summary>Состав услуг</summary>
                    <ul>{summary.modules.map((module) => (
                      <li key={module.name}><span>{module.name}</span><span>{formatPrice(module.monthlyPrice)}/мес.</span></li>
                    ))}</ul>
                  </details>
                </section>
              ) : null}

              <label className={styles.phoneField}>
                <span className={styles.label}>Номер телефона</span>
                <input
                  aria-describedby={phoneHintId}
                  autoComplete="tel"
                  className={styles.fieldControl}
                  disabled={submitting}
                  inputMode="tel"
                  maxLength={18}
                  name="phone"
                  onChange={(event) => {
                    event.currentTarget.setCustomValidity("");
                    setPhone(formatRussianPhone(event.currentTarget.value));
                  }}
                  onInvalid={(event) => {
                    event.currentTarget.setCustomValidity(
                      "Введите российский номер полностью: +7 (999) 123-45-67",
                    );
                  }}
                  pattern={"\\+7 \\(\\d{3}\\) \\d{3}-\\d{2}-\\d{2}"}
                  ref={phoneInputRef}
                  required
                  title="Введите российский номер полностью: +7 (999) 123-45-67"
                  type="tel"
                  value={phone}
                />
                <span className={styles.hint} id={phoneHintId}>
                  Например, +7 (999) 123-45-67
                </span>
              </label>

              {!chooseSpecialist ? <fieldset className={styles.timing} disabled={submitting}>
                <legend className={styles.label}>Когда позвонить</legend>
                <div className={styles.choices}>
                  <label className={styles.choice}>
                    <input
                      checked={contactSoon}
                      name="callbackTiming"
                      onChange={() => { setContactSoon(true); setSubmitError(""); }}
                      type="radio"
                      value="soon"
                    />
                    <span>В ближайшее время</span>
                  </label>
                  <label className={styles.choice}>
                    <input
                      checked={!contactSoon}
                      name="callbackTiming"
                      onChange={() => { showScheduleFields(); setSubmitError(""); }}
                      type="radio"
                      value="scheduled"
                    />
                    <span>Выбрать дату</span>
                  </label>
                </div>
                <p className={styles.scheduleHint} id={scheduleHintId}>
                  {CALLBACK_HOURS_LABEL}. {!contactSoon ? "Выберите удобное время звонка." : "Заявку можно оставить в любое время."}
                </p>
              </fieldset> : null}

                {!contactSoon ? (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.schedule}
                    initial={reduced ? false : { opacity: 0, y: -4 }}
                    transition={{ duration: reduced ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <label>
                      <span className={styles.label}>Удобная дата</span>
                      <input
                        className={styles.fieldControl}
                        aria-describedby={`${scheduleHintId}${dateError ? ` ${scheduleErrorId}` : ""}`}
                        aria-invalid={Boolean(dateError)}
                        disabled={submitting}
                        min={scheduleNow ? getMoscowDateTime(scheduleNow).date : undefined}
                        name="date"
                        onChange={(event) => {
                          const nextDate = event.currentTarget.value;
                          const now = new Date();
                          setScheduleNow(now);
                          setSelectedDate(nextDate);
                          const slots = getCallbackSlots(nextDate, now);
                          if (!slots.includes(selectedTime)) setSelectedTime(slots[0] || "");
                          setSubmitError("");
                        }}
                        required
                        type="date"
                        value={selectedDate}
                      />
                    </label>
                    <label>
                      <span className={styles.label}>Время по Москве</span>
                      <select
                        className={styles.fieldControl}
                        aria-describedby={scheduleHintId}
                        disabled={submitting || availableTimes.length === 0}
                        name="time"
                        onChange={(event) => { setSelectedTime(event.currentTarget.value); setSubmitError(""); }}
                        onFocus={() => {
                          const now = new Date();
                          setScheduleNow(now);
                          const slots = getCallbackSlots(selectedDate, now);
                          if (!slots.includes(selectedTime)) setSelectedTime(slots[0] || "");
                        }}
                        required
                        value={selectedTime}
                      >
                        <option value="">{availableTimes.length === 0 ? "Нет доступного времени" : "Выберите время"}</option>
                        {availableTimes.map((time) => <option key={time} value={time}>{time}</option>)}
                      </select>
                    </label>
                    {dateError ? <p className={styles.scheduleError} id={scheduleErrorId} role="status">{dateError}</p> : null}
                  </motion.div>
                ) : null}
              <label className={styles.consent}>
                <input
                  name="personalDataConsent"
                  disabled={submitting}
                  required
                  type="checkbox"
                />
                <span>Я даю согласие на обработку персональных данных.</span>
              </label>

              {submitError ? (
                <p
                  className={styles.error}
                  role="alert"
                >
                  {submitError}
                </p>
              ) : null}

              <button
                className={`${ui.primary} ${styles.submit}`}
                disabled={submitting}
                aria-busy={submitting}
                type="submit"
              >
                {submitting ? "Отправляем…" : chooseSpecialist ? "Запросить звонок" : "Оставить заявку"}
                {!submitting && <ArrowRight />}
              </button>
            </form>
          )}
        </motion.div>
      ) : null}
    </dialog>
  );
}
