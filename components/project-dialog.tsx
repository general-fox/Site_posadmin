"use client";

import { motion } from "framer-motion";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { normalizeProjectPhone, normalizeTelegramContact, normalizeProjectChatContact, PROJECT_TASK_MAX_LENGTH, PROJECT_CONTACT_MAX_LENGTH, type ProjectStage, type ProjectContactMethod } from "@/lib/project-request";
import { ArrowRight, useMarketingReducedMotion } from "./marketing-ui";
import shared from "./callback-dialog.module.css";
import styles from "./project-dialog.module.css";
import ui from "./marketing.module.css";
import { DEMO_FORM_NOTICE, IS_REVIEW_DEMO } from "@/lib/demo-mode";

const stageNames = { new: "Открытие заведения", existing: "Действующее заведение" };
type ProjectStep = 0 | 1;

export type ProjectBrief = {
  label: string;
  text: string;
  preview?: {
    total: string;
    scope: string;
    items: { title: string; detail: string; amount: string }[];
    notice: string;
    exclusions: string;
  };
};

export function ProjectDialog({ open, onClose, initialStage, projectBrief }: { open: boolean; onClose: () => void; initialStage?: ProjectStage; projectBrief?: ProjectBrief }) {
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
  const [step, setStep] = useState<ProjectStep>(initialStage ? 1 : 0);
  const [projectStage, setProjectStage] = useState<ProjectStage | "">(initialStage || "");
  const [task, setTask] = useState("");
  const [taskExpanded, setTaskExpanded] = useState(false);
  const [contactMethod, setContactMethod] = useState<ProjectContactMethod>("phone");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [chat, setChat] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestId, setRequestId] = useState("");
  const briefText = projectBrief && projectStage === "new" ? projectBrief.text : "";
  const briefPreview = briefText ? projectBrief?.preview : undefined;
  const taskLimit = PROJECT_TASK_MAX_LENGTH - (briefText ? briefText.length + 2 : 0);
  const contactValue = contactMethod === "phone" ? phone : contactMethod === "telegram" ? telegram : chat;
  const contactError = contactMethod === "phone"
    ? "Проверьте номер: он должен содержать 10 цифр или 11 с первой 7 или 8."
    : contactMethod === "telegram"
      ? "Укажите имя пользователя в Telegram, например @username, или ссылку t.me/username."
      : "Укажите мессенджер и ваш контакт: номер, имя пользователя или ссылку на профиль.";

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
    return () => { document.documentElement.style.overflow = previousOverflow; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [open, step, requestId]);

  useEffect(() => {
    if (!open || !errorField) return;
    const frame = requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`[name="${errorField}"]`)?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open, error, errorField]);

  const clearError = () => { setError(""); setErrorField(""); };
  const goToStep = (next: ProjectStep) => { clearError(); setStep(next); };
  const close = () => {
    if (pendingRef.current) return;
    dialogRef.current?.close();
  };
  const onDialogClose = () => {
    onClose();
    if (requestId) {
      setStep(initialStage ? 1 : 0); setProjectStage(initialStage || ""); setTask(""); setTaskExpanded(false); setPhone("");
      setTelegram(""); setChat(""); setContactMethod("phone"); setConsent(false); setRequestId("");
    }
    clearError();
  };
  const showError = (message: string, field: string) => {
    if (field === "projectStage") setStep(0);
    if (field === "task") setTaskExpanded(true);
    setError(message); setErrorField(field);
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus());
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pendingRef.current) return;
    if (!projectStage) {
      showError("Выберите, планируете открытие или уже работаете.", "projectStage"); return;
    }
    if (task.trim().length > taskLimit) {
      showError(`Сократите описание до ${taskLimit} символов.`, "task"); return;
    }
    if (step === 0) { goToStep(1); return; }
    if (IS_REVIEW_DEMO) { showError(DEMO_FORM_NOTICE, ""); return; }
    const contact = contactMethod === "phone" ? normalizeProjectPhone(phone) : contactMethod === "telegram" ? normalizeTelegramContact(telegram) : normalizeProjectChatContact(chat);
    if (!contact) {
      showError(contactError, "contact");
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
        body: JSON.stringify({ projectStage, task: [briefText, task.trim()].filter(Boolean).join("\n\n"), contactMethod, contact, personalDataConsent: consent, website }),
        signal: AbortSignal.timeout(15_000),
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; requestId?: string; error?: string; field?: string } | null;
      if (!response.ok || !result?.ok || !result.requestId) {
        const responseField = result?.field || "";
        const field = ["projectStage", "task", "contact", "contactMethod", "personalDataConsent"].includes(responseField) ? responseField : "";
        showError(result?.error || "Не удалось отправить заявку. Попробуйте ещё раз.", field);
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

  const taskField = <div className={styles.taskField}>
    <label className={shared.label} htmlFor={`${titleId}-task`}>Пожелания к проекту <span className={styles.optional}>необязательно</span></label>
    <textarea className={`${shared.fieldControl} ${styles.textarea}`} id={`${titleId}-task`} name="task" value={task} maxLength={taskLimit} disabled={submitting}
      aria-invalid={errorField === "task"} aria-describedby={`${taskHintId}${errorField === "task" ? ` ${errorId}` : ""}`}
      placeholder={projectStage === "new" ? "Например: открываем кафе. Нужны r_keeper, касса и настройка оборудования." : "Например: нужна поддержка касс и складского учёта."}
      onChange={(event) => { setTask(event.target.value); clearError(); }} />
    <div className={styles.taskHint} id={taskHintId}><span>Остальное обсудим при связи.</span><span>{task.length}/{taskLimit}</span></div>
  </div>;

  const titles = ["На каком этапе ваш бизнес?", briefPreview ? "Уточним смету проекта" : briefText ? "Рассчитаем ваш запуск" : initialStage === "new" && projectStage === "new" ? "Обсудим открытие" : "Как с вами связаться?"];
  const descriptions = [
    "Выберите подходящий вариант. Детали можно обсудить с менеджером.",
    briefText ? "Менеджер уточнит детали и подготовит смету. Отправим её в удобный чат или обсудим по телефону." : "Оставьте контакт — поможем разобраться с задачами и подобрать решение.",
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
        <h2 className={shared.title} id={titleId} ref={headingRef} tabIndex={-1}>Заявка уже у нашей команды</h2>
        <p className={shared.description} id={descriptionId}>Менеджер свяжется с вами по выбранному контакту. Мы на связи по будням с 10:00 до 19:00 МСК.</p>
        <p className={styles.requestNumber}>Номер заявки: {requestId}</p>
        <button type="button" className={`${ui.primary} ${shared.submit}`} onClick={close}>Готово</button>
      </div> : <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <label className={shared.honeypot} aria-hidden="true">Не заполняйте это поле<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>
        <div className={styles.progressLabel}><span>Обсудим ваш проект</span>{!initialStage && <span aria-live="polite">Шаг {step + 1} из 2</span>}</div>
        {!initialStage && <div className={styles.progress} aria-hidden="true">{[0, 1].map((index) => <span key={index} data-complete={index <= step} />)}</div>}
        <motion.div key={step} initial={reduced ? false : { opacity: .5 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : .18 }}>
          <h2 className={shared.title} id={titleId} ref={headingRef} tabIndex={-1}>{titles[step]}</h2>
          <p className={shared.description} id={descriptionId}>{IS_REVIEW_DEMO && step === 1 ? "Демонстрация формы: данные не отправляются. Для проверки можно использовать вымышленный контакт." : descriptions[step]}</p>
          {step === 0 && <fieldset className={styles.stageOptions} aria-label="Этап бизнеса" aria-describedby={errorField === "projectStage" ? errorId : undefined}>
            {(["new", "existing"] as const).map((value) => <label className={styles.stageOption} key={value}>
              <input name="projectStage" type="radio" value={value} checked={projectStage === value} onChange={() => { setProjectStage(value); clearError(); }} required />
              <span><strong>{stageNames[value]}</strong><span>{value === "new" ? "Готовимся к запуску" : "Нужна поддержка или изменения"}</span></span>
              <span className={styles.selectionMark} aria-hidden="true"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m2 6 2.5 2.5L10 3" /></svg></span>
            </label>)}
          </fieldset>}
          {step === 0 && taskField}
          {step === 1 && <>
            <div className={styles.summary}><span>{briefText ? `${briefPreview ? "Проект" : "Запуск с нуля"} · ${projectBrief?.label}` : projectStage && stageNames[projectStage]}</span>{!projectBrief && <button type="button" disabled={submitting} onClick={() => goToStep(0)}>Изменить</button>}</div>
            {briefPreview && <section className={styles.estimatePreview} aria-label="Предварительный расчёт проекта">
              <div className={styles.estimateHeader}><div><p>Предварительный ориентир</p><span>{briefPreview.scope}</span></div><strong>{briefPreview.total}</strong></div>
              <p className={styles.estimateNotice}>{briefPreview.notice}</p>
              <details className={styles.estimateDetails}>
                <summary>Состав проекта <span>{briefPreview.items.length} поз.</span></summary>
                <ul>{briefPreview.items.map((item) => <li key={item.title}><div><strong>{item.title}</strong><span>{item.detail}</span></div><span>{item.amount}</span></li>)}</ul>
                <p>{briefPreview.exclusions}</p>
              </details>
            </section>}
            <fieldset className={styles.contactMethods} disabled={submitting}>
              <legend className={shared.label}>Удобный способ связи</legend>
              <div className={`${shared.choices} ${styles.contactChoices}`}>{(["phone", "telegram", "chat"] as const).map((method) => <label className={shared.choice} key={method}>
                <input type="radio" name="contactMethod" value={method} checked={contactMethod === method} onChange={() => { setContactMethod(method); clearError(); }} />
                <span>{method === "phone" ? "Звонок" : method === "telegram" ? "Telegram" : "Другой чат"}</span>
              </label>)}</div>
            </fieldset>
            <label className={styles.contactField}><span className={shared.label}>{contactMethod === "phone" ? "Номер телефона" : contactMethod === "telegram" ? "Имя пользователя в Telegram" : "Мессенджер и ваш контакт"}</span>
              <input className={shared.fieldControl} name="contact" type={contactMethod === "phone" ? "tel" : "text"} inputMode={contactMethod === "phone" ? "tel" : "text"}
                autoComplete={contactMethod === "phone" ? "tel" : "off"} spellCheck={false} autoCapitalize="none" value={contactValue} maxLength={PROJECT_CONTACT_MAX_LENGTH} required disabled={submitting}
                placeholder={contactMethod === "phone" ? "+7 (999) 123-45-67" : contactMethod === "telegram" ? "@username" : "Название чата: номер, ник или ссылка"} aria-invalid={errorField === "contact"} aria-describedby={`${contactHintId}${errorField === "contact" ? ` ${errorId}` : ""}`}
                onChange={(event) => { (contactMethod === "phone" ? setPhone : contactMethod === "telegram" ? setTelegram : setChat)(event.target.value); clearError(); }} />
              <span className={shared.hint} id={contactHintId}>{contactMethod === "phone" ? "Можно начать с +7, 8 или ввести 10 цифр." : contactMethod === "telegram" ? "@Имя из настроек Telegram или ссылка t.me/username." : "Напишите, где вам удобно получить расчёт и как найти вас в этом чате."}</span>
            </label>
            <details className={styles.taskDisclosure} open={taskExpanded} onToggle={(event) => setTaskExpanded(event.currentTarget.open)}>
              <summary>{task.trim() ? "Пожелания к проекту" : "Добавить пожелания"}<span>{task.trim() ? "добавлены" : "необязательно"}</span></summary>
              {taskField}
            </details>
            <label className={shared.consent}><input type="checkbox" name="personalDataConsent" checked={consent} onChange={(event) => { setConsent(event.target.checked); clearError(); }} required disabled={submitting} aria-invalid={errorField === "personalDataConsent"} aria-describedby={errorField === "personalDataConsent" ? errorId : undefined} /><span>Я даю согласие на обработку персональных данных.</span></label>
          </>}
        </motion.div>
        {error && <p className={shared.error} id={errorId} role="alert">{error}</p>}
        <div className={styles.actions}>
          {step > 0 && !initialStage && <button className={`${ui.secondary} ${styles.back}`} type="button" disabled={submitting} onClick={() => goToStep(0)}>Назад</button>}
          <button className={`${ui.primary} ${styles.next}`} type="submit" disabled={submitting} aria-busy={submitting}>{submitting ? "Отправляем…" : step === 1 ? "Отправить заявку" : "Продолжить"}{!submitting && <ArrowRight />}</button>
        </div>
        <p className={styles.footnote}>Менеджер на связи по будням, 10:00–19:00 МСК.</p>
      </form>}
    </motion.div>}
  </dialog>;
}
