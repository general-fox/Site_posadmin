"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { useHydratedReducedMotion } from "@/components/use-hydrated-reduced-motion";

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
  const dateInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const phoneHintId = useId();
  const reduced = useHydratedReducedMotion();
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
    setSelectedDate(currentDate);
    setSelectedTime(currentTime);
    setContactSoon(false);
    window.requestAnimationFrame(() => dateInputRef.current?.focus());
  };

  return (
    <dialog
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className="m-auto max-h-[calc(100svh-32px)] w-[min(520px,calc(100vw-32px))] overflow-visible bg-transparent p-0 text-[#322f2f] backdrop:bg-[rgba(15,15,10,0.56)] backdrop:backdrop-blur-[5px]"
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
          className="relative max-h-[calc(100svh-32px)] overflow-y-auto rounded-[28px] border border-[#d5d5c8] bg-[var(--milk)] px-5 py-6 shadow-[0_24px_80px_rgba(15,15,10,0.24)] sm:px-8 sm:py-8"
          initial={reduced ? false : { opacity: 0, scale: 0.96, y: 18 }}
          transition={{ duration: reduced ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            aria-label="Закрыть окно"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#d5d5c8] text-[#646565] transition-colors hover:border-[#e66026] hover:text-[#e66026] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e66026]"
            onClick={closeDialog}
            type="button"
          >
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16">
              <path d="M3 3L13 13M13 3L3 13" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
            </svg>
          </button>

          {submitted ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-2 text-center font-[family-name:var(--font-inter)]">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e66026] text-white" aria-hidden="true">
                <svg className="h-7 w-7" viewBox="0 0 28 28">
                  <path d="M7 14.5L11.5 19L21 9.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </span>
              <h2 className="mt-5 text-[28px] font-medium leading-[34px]" id={titleId}>Заявка принята</h2>
              <p className="mt-3 max-w-[360px] text-[15px] leading-6 text-[#646565]" id={descriptionId}>
                {contactSoon
                  ? "Менеджер свяжется с вами в ближайшее время."
                  : "Менеджер свяжется с вами в выбранные дату и время."}
              </p>
              <button
                className="mt-7 min-h-11 rounded-full bg-[#e66026] px-8 text-[14px] font-medium text-white transition-colors hover:bg-[#cf501c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e66026]"
                onClick={closeDialog}
                type="button"
              >
                Готово
              </button>
            </div>
          ) : (
            <form className="font-[family-name:var(--font-inter)]" onSubmit={handleSubmit}>
              <label className="absolute left-[-9999px]" aria-hidden="true">
                Не заполняйте это поле
                <input
                  autoComplete="off"
                  name="website"
                  tabIndex={-1}
                  type="text"
                />
              </label>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e66026] text-white" aria-hidden="true">
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path d="M7 3V6M17 3V6M4 9H20M6.5 5H17.5C18.881 5 20 6.119 20 7.5V18C20 19.381 18.881 20.5 17.5 20.5H6.5C5.119 20.5 4 19.381 4 18V7.5C4 6.119 5.119 5 6.5 5Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </span>
              <h2 className="mt-5 max-w-[390px] pr-10 text-[28px] font-medium leading-[34px]" id={titleId}>
                Когда вам удобно поговорить?
              </h2>
              <p className="mt-3 max-w-[420px] text-[15px] leading-6 text-[#646565]" id={descriptionId}>
                Оставьте номер — менеджер может позвонить в ближайшее время или в выбранные дату и время.
              </p>

              <label className="mt-7 block">
                <span className="mb-2 block text-[13px] font-medium text-[#646565]">Номер телефона</span>
                <input
                  aria-describedby={phoneHintId}
                  autoComplete="tel"
                  className="h-12 w-full rounded-[14px] border border-[#d5d5c8] bg-white/65 px-4 text-[15px] outline-none transition-colors placeholder:text-[#9d9c9b] hover:border-[#b8b8aa] focus:border-[#e66026]"
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
                <span className="mt-1.5 block text-[11px] leading-4 text-[#969691]" id={phoneHintId}>
                  Российский номер в формате +7 (999) 123-45-67
                </span>
              </label>

              <div className="mt-4 rounded-[16px] border border-[#d5d5c8] bg-white/35 px-4 py-3.5">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    checked={contactSoon}
                    className="h-5 w-5 shrink-0 cursor-pointer accent-[#e66026]"
                    name="contactSoon"
                    onChange={(event) => setContactSoon(event.target.checked)}
                    type="checkbox"
                  />
                  <span className="text-[14px] font-medium text-[#322f2f]">
                    Связаться в ближайшее время
                  </span>
                </label>
                <p className="mt-1 pl-8 text-[12px] leading-[18px] text-[#969691]">
                  Менеджер позвонит в ближайший рабочий период.
                </p>
                {contactSoon ? (
                  <button
                    className="mt-2 ml-8 text-left text-[13px] font-medium text-[#e66026] underline decoration-[#e66026]/35 underline-offset-4 transition-colors hover:text-[#cf501c]"
                    onClick={showScheduleFields}
                    type="button"
                  >
                    Выбрать дату и время
                  </button>
                ) : null}
              </div>

              <AnimatePresence initial={false}>
                {!contactSoon ? (
                  <motion.div
                    animate={{ height: "auto", opacity: 1, y: 0 }}
                    className="grid overflow-hidden sm:grid-cols-2"
                    exit={{ height: 0, opacity: 0, y: -6 }}
                    initial={reduced ? false : { height: 0, opacity: 0, y: -6 }}
                    transition={{ duration: reduced ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <label className="mt-4 block sm:pr-2">
                      <span className="mb-2 block text-[13px] font-medium text-[#646565]">Удобная дата</span>
                      <input
                        className="h-12 w-full rounded-[14px] border border-[#d5d5c8] bg-white/65 px-4 text-[15px] outline-none [color-scheme:light] transition-colors hover:border-[#b8b8aa] focus:border-[#e66026]"
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
                        ref={dateInputRef}
                        required
                        type="date"
                        value={selectedDate}
                      />
                    </label>
                    <label className="mt-4 block sm:pl-2">
                      <span className="mb-2 block text-[13px] font-medium text-[#646565]">Удобное время</span>
                      <input
                        className="h-12 w-full rounded-[14px] border border-[#d5d5c8] bg-white/65 px-4 text-[15px] outline-none [color-scheme:light] transition-colors hover:border-[#b8b8aa] focus:border-[#e66026]"
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
              </AnimatePresence>

              <label className="mt-5 flex cursor-pointer items-start gap-3 text-[12px] leading-[18px] text-[#646565]">
                <input
                  className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#e66026]"
                  name="personalDataConsent"
                  required
                  type="checkbox"
                />
                <span>Я даю согласие на обработку персональных данных.</span>
              </label>

              {submitError ? (
                <p
                  className="mt-4 rounded-[12px] bg-[#fff0ea] px-4 py-3 text-[13px] leading-5 text-[#a53d16]"
                  role="alert"
                >
                  {submitError}
                </p>
              ) : null}

              <button
                className="mt-5 min-h-12 w-full rounded-full bg-[#e66026] px-6 text-[15px] font-medium text-white transition-colors hover:bg-[#cf501c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e66026] disabled:cursor-wait disabled:opacity-65"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Отправляем…" : "Оставить заявку"}
              </button>
            </form>
          )}
        </motion.div>
      ) : null}
    </dialog>
  );
}
