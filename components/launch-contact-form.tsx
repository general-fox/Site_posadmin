"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { DEMO_FORM_NOTICE, IS_REVIEW_DEMO } from "@/lib/demo-mode";
import { getProjectScope, PROJECT_EQUIPMENT, PROJECT_REGISTER_LIMIT_NOTE, type ProjectEstimateSelection } from "@/lib/project-scope";
import {
  normalizeProjectEmail,
  normalizeProjectMessengerPhone,
  normalizeTelegramContact,
  PROJECT_CONTACT_MAX_LENGTH,
  PROJECT_TASK_MAX_LENGTH,
} from "@/lib/project-request";
import { formatProjectMessengerInput, RUSSIAN_PHONE_PREFIX } from "@/lib/russian-phone";
import { UiIcon } from "./ui-icon";
import shared from "./callback-dialog.module.css";
import styles from "./launch-contact-form.module.css";
import wizard from "./launch-section.module.css";
import ui from "./marketing.module.css";

const channels = [
  {
    id: "email", label: "Почта", fieldLabel: "Электронная почта", type: "email", autoComplete: "email",
    hint: "Например, name@example.ru.", error: "Проверьте адрес электронной почты.", normalize: normalizeProjectEmail,
  },
  {
    id: "telegram", label: "Telegram", fieldLabel: "Ваш профиль в Telegram", type: "text", autoComplete: "off",
    hint: "Введите имя пользователя или ссылку, например @username или t.me/username.", error: "Укажите имя пользователя или ссылку на свой профиль в Telegram.", normalize: normalizeTelegramContact,
  },
  {
    id: "whatsapp", label: "WhatsApp", fieldLabel: "Номер в WhatsApp", type: "tel", autoComplete: "tel",
    hint: "Введите номер, привязанный к WhatsApp. Например, +7 (999) 123-45-67.", error: "Проверьте номер телефона для WhatsApp.", normalize: normalizeProjectMessengerPhone,
  },
  {
    id: "max", label: "MAX", fieldLabel: "Номер в MAX", type: "tel", autoComplete: "tel",
    hint: "Введите номер, привязанный к MAX. Например, +7 (999) 123-45-67.", error: "Проверьте номер телефона для MAX.", normalize: normalizeProjectMessengerPhone,
  },
] as const;
const contactFieldEntranceIndex = channels.length + 2;

type ContactChannel = (typeof channels)[number];
type ContactMethod = ContactChannel["id"];
type SubmissionError = { message: string; field?: string; focus?: boolean };
const formFields = ["contactMethod", "contact", "task", "personalDataConsent"];

type LaunchContactFormProps = {
  selection: ProjectEstimateSelection;
  onBack: () => void;
  onComplete: () => void;
  onPendingChange?: (pending: boolean) => void;
};

export function LaunchContactForm({ selection, onBack, onComplete, onPendingChange }: LaunchContactFormProps) {
  const [channel, setChannel] = useState<ContactChannel>(channels[0]);
  const [contacts, setContacts] = useState<Partial<Record<ContactMethod, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<SubmissionError | null>(null);
  const [requestId, setRequestId] = useState("");
  const pending = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const taskDisclosureRef = useRef<HTMLDetailsElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const fieldId = useId();
  const contactHintId = useId();
  const scopeTitleId = useId();
  const taskId = useId();
  const errorId = useId();
  const taskHintId = useId();
  const equipmentAtLimit = PROJECT_EQUIPMENT.filter(({ id, max }) => selection[id] === max);
  const equipmentLimitNote = equipmentAtLimit.some(({ id }) => id !== "registers" && id !== "waiterStations")
    ? "Если оборудования нужно больше указанного лимита, напишите количество в комментарии."
    : equipmentAtLimit.length > 0 ? PROJECT_REGISTER_LIMIT_NOTE : null;
  const phoneChannel = channel.type === "tel";
  const scope = getProjectScope(selection);

  useEffect(() => {
    if (!error?.field || error.focus === false || !formRef.current) return;
    if (error.field === "task" && taskDisclosureRef.current) taskDisclosureRef.current.open = true;
    const field = formRef.current.elements.namedItem(error.field);
    if (field instanceof HTMLElement) field.focus();
    else if (error.field === "contactMethod") formRef.current.querySelector<HTMLInputElement>("[name=contactMethod]:checked")?.focus();
  }, [error]);

  useEffect(() => {
    if (requestId) successRef.current?.focus();
  }, [requestId]);

  const fieldError = (field: string) => error?.field === field
    ? <span id={errorId} className={styles.fieldError} role="alert">{error.message}</span>
    : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    if (IS_REVIEW_DEMO) {
      setError({ message: DEMO_FORM_NOTICE });
      return;
    }

    const form = new FormData(event.currentTarget);
    const contact = channel.normalize(contacts[channel.id] ?? "");
    if (!contact) {
      setError({ message: channel.error, field: "contact" });
      return;
    }
    if (!form.has("personalDataConsent")) {
      setError({ message: "Дайте согласие на обработку персональных данных.", field: "personalDataConsent" });
      return;
    }

    const task = String(form.get("task") ?? "").trim();
    const website = String(form.get("website") ?? "");
    pending.current = true;
    setSubmitting(true);
    setError(null);

    try {
      onPendingChange?.(true);
      const response = await fetch("/api/project-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectStage: "new", task, contactMethod: channel.id, contact,
          personalDataConsent: true, projectSelection: selection, website,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      const result = await response.json().catch(() => null) as {
        ok?: boolean; requestId?: string; error?: string; field?: string;
      } | null;
      if (!response.ok || !result?.ok || !result.requestId) {
        setError({ message: result?.error || "Не удалось отправить анкету. Попробуйте ещё раз.", field: result?.field });
        return;
      }
      setRequestId(result.requestId);
      onComplete();
    } catch {
      setError({ message: "Не удалось получить подтверждение отправки. Проверьте соединение и попробуйте ещё раз." });
    } finally {
      pending.current = false;
      setSubmitting(false);
      onPendingChange?.(false);
    }
  }

  return (
    <section id="launch-step-2" className={styles.section} aria-labelledby="launch-step-title-2">
      <h3 id="launch-step-title-2" className={wizard.stageTitle} tabIndex={-1} data-stage-entry="">Куда отправить смету?</h3>
      {requestId ? (
        <div ref={successRef} className={styles.success} role="status" tabIndex={-1}>
          <span className={styles.successIcon}><UiIcon name="check" size={20} /></span>
          <div><strong>Анкета отправлена</strong><p>Менеджер подготовит смету и отправит её выбранным способом. Номер заявки {requestId}.</p></div>
        </div>
      ) : (
        <form ref={formRef} className={styles.form} aria-busy={submitting} noValidate onSubmit={submit} onChange={() => setError(null)}>
          <label className={shared.honeypot} aria-hidden="true">
            Не заполняйте это поле
            <input autoComplete="off" name="website" tabIndex={-1} type="text" />
          </label>

          <div className={styles.body}>
            <div className={styles.contactFields}>
              <fieldset className={styles.channels} disabled={submitting}
                aria-invalid={error?.field === "contactMethod" || undefined}
                aria-describedby={error?.field === "contactMethod" ? errorId : undefined}>
                <legend className={shared.label} data-stage-entry="" style={{ "--entry-index": 1 } as CSSProperties}>Способ получения сметы</legend>
                <div className={styles.channelChoices}>
                  {channels.map((item, index) => (
                    <label key={item.id} className={styles.channel} data-stage-entry="" style={{ "--entry-index": index + 2 } as CSSProperties}>
                      <input checked={channel.id === item.id} name="contactMethod" type="radio" value={item.id} onChange={() => setChannel(item)} />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
                {fieldError("contactMethod")}
              </fieldset>

              <div className={styles.field} data-stage-entry="" style={{ "--entry-index": contactFieldEntranceIndex } as CSSProperties}>
                <label htmlFor={fieldId} className={shared.label}>{channel.fieldLabel}</label>
                <input
                  id={fieldId}
                  aria-describedby={error?.field === "contact" ? `${contactHintId} ${errorId}` : contactHintId}
                  aria-invalid={error?.field === "contact" || undefined}
                  autoCapitalize="none"
                  autoComplete={channel.autoComplete}
                  className={`${shared.fieldControl} ${styles.input}`}
                  disabled={submitting}
                  maxLength={PROJECT_CONTACT_MAX_LENGTH}
                  name="contact"
                  onBlur={phoneChannel ? (event) => {
                    const value = event.currentTarget.value.trim();
                    if (!value || value === "+") {
                      setContacts((current) => ({ ...current, [channel.id]: RUSSIAN_PHONE_PREFIX }));
                    } else if (value !== RUSSIAN_PHONE_PREFIX.trim() && !channel.normalize(value)) {
                      setError({ message: channel.error, field: "contact", focus: false });
                    }
                  } : undefined}
                  onChange={(event) => {
                    const rawValue = event.currentTarget.value;
                    const value = phoneChannel ? formatProjectMessengerInput(rawValue) : rawValue;
                    setContacts((current) => ({ ...current, [channel.id]: value }));
                  }}
                  required
                  spellCheck={false}
                  type={channel.type}
                  value={contacts[channel.id] ?? (phoneChannel ? RUSSIAN_PHONE_PREFIX : "")}
                />
                <span id={contactHintId} className={styles.contactHint}>{channel.hint}</span>
                {fieldError("contact")}
              </div>

              <div data-stage-entry="" style={{ "--entry-index": contactFieldEntranceIndex + 1 } as CSSProperties}>
                <details ref={taskDisclosureRef} className={styles.comment}>
                  <summary>Комментарий к проекту <UiIcon name="chevron-down" size={16} /></summary>
                  <label htmlFor={taskId} className="sr-only">Комментарий к проекту</label>
                  <textarea
                    id={taskId}
                    aria-describedby={[equipmentLimitNote && taskHintId, error?.field === "task" && errorId].filter(Boolean).join(" ") || undefined}
                    aria-invalid={error?.field === "task" || undefined}
                    className={`${shared.fieldControl} ${styles.input} ${styles.textarea}`}
                    disabled={submitting}
                    maxLength={PROJECT_TASK_MAX_LENGTH}
                    name="task"
                    rows={2}
                  />
                  {fieldError("task")}
                </details>
                {equipmentLimitNote && <p id={taskHintId} className={styles.equipmentHint}>{equipmentLimitNote}</p>}
              </div>
            </div>
            {scope && (
              <aside className={styles.scope} aria-labelledby={scopeTitleId} data-stage-entry="" style={{ "--entry-index": contactFieldEntranceIndex + 2 } as CSSProperties}>
                <h4 id={scopeTitleId}>Ваш проект</h4>
                <p className={styles.scopeMeta}>{scope.concept.label}</p>
                <dl className={styles.equipmentSummary}>
                  {scope.equipment.map(({ id, label, quantity }) => (
                    <div key={id}><dt>{label}</dt><dd>{quantity} шт.</dd></div>
                  ))}
                </dl>
                <details className={`${styles.comment} ${styles.scopeDetails}`}>
                  <summary>
                    <span>Состав проекта</span>
                    <span className={styles.scopeCount}>{scope.works.length + scope.capabilities.length}</span>
                    <UiIcon name="chevron-down" size={16} />
                  </summary>
                  {scope.works.length > 0
                    ? <ul>{scope.works.map(({ id, title }) => <li key={id}>{title}</li>)}</ul>
                    : <p className={styles.scopeMeta}>Услуги пока не выбраны — уточним состав при обсуждении проекта.</p>}
                  {scope.capabilities.length > 0 && <div className={styles.scopeExtras}>
                    <p>Дополнительные возможности</p>
                    <ul>{scope.capabilities.map(({ id, title }) => <li key={id}>{title}</li>)}</ul>
                  </div>}
                </details>
              </aside>
            )}
          </div>

          <div data-stage-entry="" style={{ "--entry-index": contactFieldEntranceIndex + 3 } as CSSProperties}>
            <label className={`${shared.consent} ${styles.consent}`}>
              <input
                aria-describedby={error?.field === "personalDataConsent" ? errorId : undefined}
                aria-invalid={error?.field === "personalDataConsent" || undefined}
                disabled={submitting}
                name="personalDataConsent"
                required
                type="checkbox"
              />
              <span>Я даю согласие на обработку персональных данных.</span>
            </label>
            {fieldError("personalDataConsent")}
          </div>
          <div className={`${wizard.actions} ${styles.actions}`} data-stage-entry="" style={{ "--entry-index": contactFieldEntranceIndex + 4 } as CSSProperties}>
            <button className={`${ui.secondary} ${wizard.back}`} aria-label="Назад" disabled={submitting} type="button" onClick={onBack}>
              <UiIcon name="chevron-down" size={16} className="rotate-90" />
              <span className={wizard.backLabel}>Назад</span>
            </button>
            <button className={`${ui.primary} ${styles.submit}`} disabled={submitting} type="submit">
              {submitting ? "Отправляем…" : "Отправить анкету"} <UiIcon name="arrow-right" />
            </button>
          </div>

          {error && !formFields.includes(error.field ?? "") && <p id={errorId} className={styles.error} role="alert">{error.message}</p>}
        </form>
      )}
    </section>
  );
}
