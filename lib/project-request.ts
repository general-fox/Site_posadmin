import { getProjectScope, type ProjectEstimateSelection } from "@/lib/project-scope";

/** Client-safe validation shared by the project form and its server endpoint. */
export const PROJECT_TASK_MAX_LENGTH = 1600;
export const PROJECT_CONTACT_MAX_LENGTH = 128;

export type ProjectStage = "new" | "existing";
export type ProjectContactMethod = "phone" | "telegram" | "chat" | "email" | "whatsapp" | "max";

export type ProjectRequest = {
  projectStage: ProjectStage;
  task: string;
  contactMethod: ProjectContactMethod;
  contact: string;
  personalDataConsent: true;
  projectSelection?: ProjectEstimateSelection;
};

type ProjectRequestField = keyof ProjectRequest | "website";

export type ProjectRequestValidation =
  | { ok: true; data: ProjectRequest; honeypot: false }
  | { ok: true; honeypot: true }
  | { ok: false; error: string; field?: ProjectRequestField };

export function normalizeProjectPhone(value: string): string | null {
  const input = value.trim();
  if (input.length > PROJECT_CONTACT_MAX_LENGTH || !/^[+\d\s().-]+$/.test(input)) {
    return null;
  }

  const digits = input.replace(/\D/g, "");
  const nationalNumber = digits.length === 10
    ? digits
    : digits.length === 11 && /^[78]/.test(digits)
      ? digits.slice(1)
      : "";

  return /^[3489]\d{9}$/.test(nationalNumber) ? `+7${nationalNumber}` : null;
}

export function normalizeTelegramContact(value: string): string | null {
  const input = value.trim();
  if (input.length > PROJECT_CONTACT_MAX_LENGTH) return null;

  // Accept a username or a profile URL, never invites, messages or another host.
  const username = input
    .replace(/^(?:https?:\/\/)?(?:www\.)?t\.me\//i, "")
    .replace(/^@/, "")
    .replace(/\/$/, "");

  return /^[a-z][a-z\d_]{4,31}$/i.test(username) ? `@${username}` : null;
}

export function normalizeProjectEmail(value: string): string | null {
  const input = value.trim();
  if (input.length > PROJECT_CONTACT_MAX_LENGTH) return null;

  const [local, domain, extra] = input.split("@");
  if (extra !== undefined || !domain || !/^[a-z\d!#$%&'*+/=?^_`{|}~.-]{1,64}$/i.test(local)) return null;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return null;

  const labels = domain.split(".");
  if (labels.length < 2 || labels.some((label) => !/^[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?$/u.test(label))) return null;
  return `${local}@${domain.toLowerCase()}`;
}

export function normalizeProjectMessengerPhone(value: string): string | null {
  const input = value.trim();
  if (input.length > PROJECT_CONTACT_MAX_LENGTH || !/^\+?[\d .()\u00a0\u202f-]+$/.test(input)) return null;
  if (!input.startsWith("+")) return normalizeProjectPhone(input);

  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("7") && digits.length !== 11) return null;
  return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
}

/** The manager contacts the client manually; this is not an automated chat integration. */
export function normalizeProjectChatContact(value: string): string | null {
  const input = value.trim();
  return input.length >= 5 && input.length <= PROJECT_CONTACT_MAX_LENGTH && !/[\u0000-\u001f\u007f]/.test(input)
    ? input
    : null;
}

const MESSENGER_PHONE_ERROR = "Укажите номер телефона с кодом страны, например +7 (999) 123-45-67.";

const PROJECT_CONTACTS = {
  phone: {
    label: "Телефон",
    error: "Проверьте номер: российский номер должен содержать 10 или 11 цифр.",
    normalize: normalizeProjectPhone,
  },
  telegram: {
    label: "Telegram",
    error: "Укажите имя пользователя в Telegram, например @username, или ссылку t.me/username.",
    normalize: normalizeTelegramContact,
  },
  chat: {
    label: "Удобный чат",
    error: "Укажите мессенджер и ваш контакт: номер, имя пользователя или ссылку на профиль.",
    normalize: normalizeProjectChatContact,
  },
  email: {
    label: "Email",
    error: "Укажите адрес электронной почты, например hello@example.ru.",
    normalize: normalizeProjectEmail,
  },
  whatsapp: { label: "WhatsApp", error: MESSENGER_PHONE_ERROR, normalize: normalizeProjectMessengerPhone },
  max: { label: "MAX", error: MESSENGER_PHONE_ERROR, normalize: normalizeProjectMessengerPhone },
} satisfies Record<ProjectContactMethod, { label: string; error: string; normalize: (value: string) => string | null }>;

function isProjectContactMethod(value: unknown): value is ProjectContactMethod {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(PROJECT_CONTACTS, value);
}

export function validateProjectRequest(value: unknown): ProjectRequestValidation {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, error: "Некорректные данные заявки." };
  }

  const body = value as Record<string, unknown>;

  if (body.website !== undefined && typeof body.website !== "string") {
    return { ok: false, error: "Некорректные данные заявки.", field: "website" };
  }
  if (typeof body.website === "string" && body.website.trim()) {
    return { ok: true, honeypot: true };
  }

  if (body.projectStage !== "new" && body.projectStage !== "existing") {
    return { ok: false, error: "Укажите, запускаете ли вы новый проект или уже работаете.", field: "projectStage" };
  }

  if (body.task !== undefined && typeof body.task !== "string") {
    return { ok: false, error: "Описание задачи должно быть текстом.", field: "task" };
  }
  const task = typeof body.task === "string" ? body.task.trim() : "";
  if (task.length > PROJECT_TASK_MAX_LENGTH) {
    return { ok: false, error: `Описание должно содержать не больше ${PROJECT_TASK_MAX_LENGTH} символов.`, field: "task" };
  }

  if (!isProjectContactMethod(body.contactMethod)) {
    return { ok: false, error: "Выберите удобный способ связи.", field: "contactMethod" };
  }

  const contactOption = PROJECT_CONTACTS[body.contactMethod];
  const contact = typeof body.contact === "string" ? contactOption.normalize(body.contact) : null;
  if (!contact) {
    return {
      ok: false,
      error: contactOption.error,
      field: "contact",
    };
  }

  if (body.personalDataConsent !== true) {
    return { ok: false, error: "Необходимо согласие на обработку персональных данных.", field: "personalDataConsent" };
  }

  const project = body.projectSelection !== undefined ? getProjectScope(body.projectSelection) : null;
  if (body.projectSelection !== undefined && !project) {
    return { ok: false, error: "Проверьте ответы в анкете автоматизации.", field: "projectSelection" };
  }

  return {
    ok: true,
    honeypot: false,
    data: {
      projectStage: body.projectStage,
      task,
      contactMethod: body.contactMethod,
      contact,
      personalDataConsent: true,
      ...(project ? { projectSelection: project.selection } : {}),
    },
  };
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function buildProjectRequestMessage(data: ProjectRequest, requestId: string) {
  const stage = data.projectStage === "new" ? "Новый проект / открытие" : "Действующее предприятие";
  const contactLabel = PROJECT_CONTACTS[data.contactMethod].label;
  const project = data.projectSelection ? getProjectScope(data.projectSelection) : null;
  const questionnaire = project ? [
    "<b>Анкета автоматизации</b>",
    `<b>Формат:</b> ${escapeHtml(project.concept.label)}`,
    "",
    "<b>Оборудование:</b>",
    ...project.equipment.map(({ label, quantity }) => `• ${escapeHtml(label)}: ${quantity} шт.`),
    "",
    "<b>Работы:</b>",
    ...(project.works.length
      ? project.works.map(({ title }) => `• ${escapeHtml(title)}`)
      : ["Не выбраны — уточнить при обсуждении проекта."]),
    ...(project.capabilities.length ? [
      "",
      "<b>Дополнительные возможности:</b>",
      ...project.capabilities.map(({ title }) => `• ${escapeHtml(title)}`),
    ] : []),
    "",
  ] : [];

  return [
    `🌐 <b>Новая заявка с сайта #${escapeHtml(requestId)}</b>`,
    "",
    `<b>Проект:</b> ${stage}`,
    "",
    ...questionnaire,
    ...(data.task || !project ? [
      "<b>Задача клиента:</b>",
      data.task ? escapeHtml(data.task) : "Не указана — уточнить при связи.",
      "",
    ] : []),
    `<b>Как связаться:</b> ${contactLabel} — ${escapeHtml(data.contact)}`,
    `<b>Источник:</b> ${project ? "анкета автоматизации" : "форма обсуждения проекта"} на posadmin.ru`,
  ].join("\n");
}
