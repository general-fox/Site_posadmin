"use client";

import { motion } from "framer-motion";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { normalizeProjectPhone, normalizeTelegramContact, PROJECT_TASK_MAX_LENGTH, PROJECT_CONTACT_MAX_LENGTH, type ProjectStage, type ProjectContactMethod } from "@/lib/project-request";
import { ArrowRight, useMarketingReducedMotion } from "./marketing-ui";
import shared from "./callback-dialog.module.css";
import styles from "./project-dialog.module.css";
import ui from "./marketing.module.css";

const stageNames = { new: "Новый проект", existing: "Действующее предприятие" };

export function ProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const pendingRef = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const taskHintId = useId();
  const contactHintId = useId();
  const reduced = useMarketingReducedMotion();
  const [step, setStep] = useState(0);
  const [projectStage, setProjectStage] = useState<ProjectStage | "">("");
  const [task, setTask] = useState("");
  const [contactMethod, setContactMethod] = useState<ProjectContactMethod>("phone");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestId, setRequestId] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
    return () => {
      cancelAnimationFrame(frame);
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [open, step, requestId]);

  const clearError = () => { setError(""); setErrorField(""); };
  const goToStep = (next: number) => { clearError(); setStep(next); };
  const close = () => {
    if (pendingRef.current) return;
    dialogRef.current?.close();
  };
  const onDialogClose = () => {
    onClose();
    if (requestId) {
      setStep(0); setProjectStage(""); setTask(""); setPhone("");
      setTelegram(""); setContactMethod("phone"); setConsent(false); setRequestId("");
    }
    clearError();
  };
  const showError = (message: string, field: string) => {
    setError(message); setErrorField(field);
    formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pendingRef.current) return;
    if (step === 0) {
      if (!projectStage) { showError("Выберите, новый это проект или действующее предприятие.", "projectStage"); return; }
      goToStep(1); return;
    }
    if (step === 1) {
      if (!task.trim()) { showError("Расскажите, с какой задачей вы обращаетесь.", "task"); return; }
      goToStep(2); return;
    }
    const contact = contactMethod === "phone" ? normalizeProjectPhone(phone) : normalizeTelegramContact(telegram);
    if (!contact) {
      showError(contactMethod === "phone"
        ? "Проверьте номер: он должен содержать 10 цифр или 11 с первой 7 или 8."
        : "Укажите имя пользователя в Telegram, например @username, или ссылку t.me/username.", "contact");
      return;
    }
    if (!consent) { showError("Нужно ваше согласие на обработку персональных данных.", "personalDataConsent"); return; }
    const website = new FormData(event.currentTarget).get("website") || "";
    pendingRef.current = true;
    setSubmitting(true); clearError();
    try {
      const response = await fetch("/api/project-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectStage, task: task.trim(), contactMethod, contact, personalDataConsent: consent, website }),
        signal: AbortSignal.timeout(15_000),
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; requestId?: string; error?: string; field?: string } | null;
      if (!response.ok || !result?.ok || !result.requestId) {
        setError(result?.error || "Не удалось отправить заявку. Попробуйте ещё раз.");
        setErrorField(result?.field || "");
        return;
      }
      setRequestId(result.requestId);
    } catch {
      setError("Не удалось получить подтверждение отправки. Проверьте соединение и попробуйте ещё раз.");
    } finally {
      pendingRef.current = false;
      setSubmitting(false);
    }
  };

  const titles = ["На каком этапе ваш бизнес?", projectStage === "new" ? "Что нужно для запуска?" : "Какую задачу поможем решить?", "Как с вами связаться?"];
  const descriptions = [
    "Так мы поймём, с чего начать и каких специалистов подключить.",
    projectStage === "new" ? "Расскажите о проекте и о том, что хотите настроить. Если пока не знаете, что потребуется, — поможем разобраться." : "Опишите вопрос в удобной для вас форме. Можно рассказать, что не работает или что хотите улучшить.",
    "Оставьте удобный контакт. Менеджер уже будет знать вашу задачу — не придётся объяснять всё заново.",
  ];

  return <dialog ref={dialogRef} className={`${shared.dialog} ${styles.dialog}`} aria-labelledby={titleId} aria-describedby={descriptionId}
    data-lenis-prevent onCancel={(event) => { event.preventDefault(); close(); }}
    onClick={(event) => { if (event.target === event.currentTarget) close(); }} onClose={onDialogClose}>
    {open && <motion.div className={`${shared.panel} ${styles.panel}`} initial={reduced ? false : { opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduced ? 0 : .24, ease: [.22, 1, .36, 1] }}>
      <button type="button" className={shared.close} aria-label="Закрыть окно" onClick={close} disabled={submitting}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m3 3 10 10M13 3 3 13" /></svg>
      </button>
      {requestId ? <div className={shared.success}>
        <span className={shared.successIcon} aria-hidden="true"><svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2"><path d="m7 14 5 5L21 9" /></svg></span>
        <p className={ui.eyebrow}>Спасибо за обращение</p>
        <h2 className={shared.title} id={titleId} ref={headingRef} tabIndex={-1}>Задача уже у нашей команды</h2>
        <p className={shared.description} id={descriptionId}>Менеджер свяжется с вами в ближайшее время по будням с 10:00 до 19:00.</p>
        <p className={styles.requestNumber}>Номер заявки: {requestId}</p>
        <button type="button" className={`${ui.primary} ${shared.submit}`} onClick={close}>Готово</button>
      </div> : <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <label className={shared.honeypot} aria-hidden="true">Не заполняйте это поле<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>
        <div className={styles.progressLabel}><span>Обсудим ваш проект</span><span aria-live="polite">Шаг {step + 1} из 3</span></div>
        <div className={styles.progress} aria-hidden="true">{[0, 1, 2].map((index) => <span key={index} data-complete={index <= step} />)}</div>
        <motion.div key={step} initial={reduced ? false : { opacity: .5 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : .18 }}>
          <h2 className={shared.title} id={titleId} ref={headingRef} tabIndex={-1}>{titles[step]}</h2>
          <p className={shared.description} id={descriptionId}>{descriptions[step]}</p>
          {step === 0 && <fieldset className={styles.stageOptions} aria-label="Этап бизнеса" aria-describedby={error ? errorId : undefined}>
            {(["new", "existing"] as const).map((value) => <label className={styles.stageOption} key={value}>
              <input name="projectStage" type="radio" value={value} checked={projectStage === value} onChange={() => { setProjectStage(value); clearError(); }} required />
              <span><strong>{stageNames[value]}</strong><span>{value === "new" ? "Планируем открытие — нужна подготовка к запуску" : "Уже работаем — нужна поддержка или изменения"}</span></span>
              <span className={styles.selectionMark} aria-hidden="true">✓</span>
            </label>)}
          </fieldset>}
          {step === 1 && <div className={styles.taskField}>
            <label className={shared.label} htmlFor={`${titleId}-task`}>Ваша задача</label>
            <textarea className={`${shared.fieldControl} ${styles.textarea}`} id={`${titleId}-task`} name="task" value={task} maxLength={PROJECT_TASK_MAX_LENGTH} required
              aria-invalid={errorField === "task"} aria-describedby={`${taskHintId}${errorField === "task" ? ` ${errorId}` : ""}`}
              placeholder={projectStage === "new" ? "Например: открываем кафе на 40 мест. Нужны касса, r_keeper и настройка оборудования…" : "Например: хотим объединить кассы и складской учёт и подключить поддержку…"}
              onChange={(event) => { setTask(event.target.value); clearError(); }} />
            <div className={styles.taskHint} id={taskHintId}><span>Можно своими словами, без технических терминов.</span><span>{task.length}/{PROJECT_TASK_MAX_LENGTH}</span></div>
          </div>}
          {step === 2 && <>
            <div className={styles.summary}><span>{projectStage && stageNames[projectStage]}</span><button type="button" disabled={submitting} onClick={() => goToStep(1)}>Изменить задачу</button><p>{task}</p></div>
            <fieldset className={styles.contactMethods} disabled={submitting}>
              <legend className={shared.label}>Удобный способ связи</legend>
              <div className={shared.choices}>{(["phone", "telegram"] as const).map((method) => <label className={shared.choice} key={method}>
                <input type="radio" name="contactMethod" value={method} checked={contactMethod === method} onChange={() => { setContactMethod(method); clearError(); }} />
                <span>{method === "phone" ? "По телефону" : "В Telegram"}</span>
              </label>)}</div>
            </fieldset>
            <label className={styles.contactField}><span className={shared.label}>{contactMethod === "phone" ? "Номер телефона" : "Имя пользователя в Telegram"}</span>
              <input className={shared.fieldControl} name="contact" type={contactMethod === "phone" ? "tel" : "text"} inputMode={contactMethod === "phone" ? "tel" : "text"}
                autoComplete={contactMethod === "phone" ? "tel" : "off"} spellCheck={false} autoCapitalize="none" value={contactMethod === "phone" ? phone : telegram} maxLength={PROJECT_CONTACT_MAX_LENGTH} required disabled={submitting}
                placeholder={contactMethod === "phone" ? "+7 (999) 123-45-67" : "@username"} aria-invalid={errorField === "contact"} aria-describedby={`${contactHintId}${errorField === "contact" ? ` ${errorId}` : ""}`}
                onChange={(event) => { (contactMethod === "phone" ? setPhone : setTelegram)(event.target.value); clearError(); }} />
              <span className={shared.hint} id={contactHintId}>{contactMethod === "phone" ? "Российский номер — можно начать с +7, 8 или ввести 10 цифр." : "Укажите @имя из настроек Telegram или ссылку на ваш профиль."}</span>
            </label>
            <label className={shared.consent}><input type="checkbox" name="personalDataConsent" checked={consent} onChange={(event) => { setConsent(event.target.checked); clearError(); }} required disabled={submitting} aria-invalid={errorField === "personalDataConsent"} aria-describedby={errorField === "personalDataConsent" ? errorId : undefined} /><span>Я даю согласие на обработку персональных данных.</span></label>
          </>}
        </motion.div>
        {error && <p className={shared.error} id={errorId} role="alert">{error}</p>}
        <div className={styles.actions}>
          {step > 0 && <button className={`${ui.secondary} ${styles.back}`} type="button" disabled={submitting} onClick={() => goToStep(step - 1)}>Назад</button>}
          <button className={`${ui.primary} ${styles.next}`} type="submit" disabled={submitting} aria-busy={submitting}>{submitting ? "Отправляем…" : step === 2 ? "Отправить заявку" : "Продолжить"}{!submitting && <ArrowRight />}</button>
        </div>
        <p className={styles.footnote}>{step === 2 ? "Менеджер на связи по будням с 10:00 до 19:00." : "Три шага — и подключим нужных специалистов."}</p>
      </form>}
    </motion.div>}
  </dialog>;
}
