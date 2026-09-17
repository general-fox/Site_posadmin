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

type CallbackDialogProps = {
  onClose: () => void;
  open: boolean;
};

function getLocalDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLocalTimeValue(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

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

export function CallbackDialog({ onClose, open }: CallbackDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const phoneHintId = useId();
  const reduced = useMarketingReducedMotion();
  const [minDate, setMinDate] = useState("");
  const [minTime, setMinTime] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [contactSoon, setContactSoon] = useState(true);
  const [phone, setPhone] = useState("+7 ");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      const now = new Date();
      const currentDate = getLocalDateValue(now);
      const currentTime = getLocalTimeValue(now);

      setSubmitted(false);
      setSubmitting(false);
      setSubmitError("");
      setContactSoon(true);
      setPhone("+7 ");
      setMinDate(currentDate);
      setMinTime(currentTime);
      setSelectedDate(currentDate);
      setSelectedTime(currentTime);
      dialog.showModal();
      const frame = window.requestAnimationFrame(() => {
        phoneInputRef.current?.focus();
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [open]);

  const closeDialog = () => dialogRef.current?.close();

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) closeDialog();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const date = String(formData.get("date") || "");
    const time = String(formData.get("time") || "");

    if (!contactSoon) {
      const now = new Date();
      const currentDate = getLocalDateValue(now);
      const currentTime = getLocalTimeValue(now);

      setMinDate(currentDate);
      setMinTime(currentTime);

      if (
        date < currentDate ||
        (date === currentDate && time < currentTime)
      ) {
        setSubmitError("Выберите дату и время не раньше текущих.");
        return;
      }
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/callback", {
        body: JSON.stringify({
          contactSoon,
          date,
          personalDataConsent:
            formData.get("personalDataConsent") === "on",
          phone,
          time,
          website: formData.get("website") || "",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json().catch(() => null)) as
        | { error?: string; ok?: boolean }
        | null;

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Не удалось отправить заявку.");
      }

      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Не удалось отправить заявку. Попробуйте ещё раз.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const showScheduleFields = () => {
    const now = new Date();
    const currentDate = getLocalDateValue(now);
    const currentTime = getLocalTimeValue(now);

    setMinDate(currentDate);
    setMinTime(currentTime);
    // Switching modes should not discard a future slot the visitor chose.
    if (!selectedDate || selectedDate < currentDate) {
      setSelectedDate(currentDate);
      setSelectedTime(currentTime);
    } else if (selectedDate === currentDate && selectedTime < currentTime) {
      setSelectedTime(currentTime);
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
                {contactSoon
                  ? "Менеджер свяжется с вами в ближайшее время."
                  : "Менеджер свяжется с вами в выбранные дату и время."}
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
            <form onSubmit={handleSubmit}>
              <label className={styles.honeypot} aria-hidden="true">
                Не заполняйте это поле
                <input
                  autoComplete="off"
                  name="website"
                  tabIndex={-1}
                  type="text"
                />
              </label>
              <p className={`${ui.eyebrow} ${styles.eyebrow}`}>Связь с менеджером</p>
              <h2 className={styles.title} id={titleId}>
                Когда вам удобно поговорить?
              </h2>
              <p className={styles.description} id={descriptionId}>
                Оставьте номер и выберите удобное время — мы свяжемся с вами и обсудим вашу задачу.
              </p>

              <label className={styles.phoneField}>
                <span className={styles.label}>Номер телефона</span>
                <input
                  aria-describedby={phoneHintId}
                  autoComplete="tel"
                  className={styles.fieldControl}
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

              <fieldset className={styles.timing}>
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
                <p className={styles.scheduleHint}>
                  {contactSoon ? "Менеджер на связи в будни с 10:00 до 19:00." : "Укажите удобные для вас дату и время звонка."}
                </p>
              </fieldset>

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
                        min={minDate}
                        name="date"
                        onChange={(event) => {
                          const nextDate = event.currentTarget.value;
                          const now = new Date();
                          const currentDate = getLocalDateValue(now);
                          const currentTime = getLocalTimeValue(now);

                          setMinDate(currentDate);
                          setMinTime(currentTime);
                          setSelectedDate(nextDate);
                          if (
                            nextDate === currentDate &&
                            selectedTime < currentTime
                          ) {
                            setSelectedTime(currentTime);
                          }
                        }}
                        required
                        type="date"
                        value={selectedDate}
                      />
                    </label>
                    <label>
                      <span className={styles.label}>Удобное время</span>
                      <input
                        className={styles.fieldControl}
                        min={selectedDate === minDate ? minTime : undefined}
                        name="time"
                        onChange={(event) =>
                          setSelectedTime(event.currentTarget.value)
                        }
                        onFocus={() => {
                          const now = new Date();
                          const currentDate = getLocalDateValue(now);
                          const currentTime = getLocalTimeValue(now);

                          setMinDate(currentDate);
                          setMinTime(currentTime);
                          if (
                            selectedDate === currentDate &&
                            selectedTime < currentTime
                          ) {
                            setSelectedTime(currentTime);
                          }
                        }}
                        required
                        type="time"
                        value={selectedTime}
                      />
                    </label>
                  </motion.div>
                ) : null}
              <label className={styles.consent}>
                <input
                  name="personalDataConsent"
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
                {submitting ? "Отправляем…" : "Оставить заявку"}
                {!submitting && <ArrowRight />}
              </button>
            </form>
          )}
        </motion.div>
      ) : null}
    </dialog>
  );
}
