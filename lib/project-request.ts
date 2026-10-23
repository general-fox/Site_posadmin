/** Client-safe validation shared by the project form and its server endpoint. */
export const PROJECT_TASK_MAX_LENGTH = 1600;
export const PROJECT_CONTACT_MAX_LENGTH = 128;

export type ProjectStage = "new" | "existing";
export type ProjectContactMethod = "phone" | "telegram" | "chat";

export type ProjectRequest = {
  projectStage: ProjectStage;
  task: string;
  contactMethod: ProjectContactMethod;
  contact: string;
  personalDataConsent: true;
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

/** The manager contacts the client manually; this is not an automated chat integration. */
export function normalizeProjectChatContact(value: string): string | null {
  const input = value.trim();
  return input.length >= 5 && input.length <= PROJECT_CONTACT_MAX_LENGTH && !/[\u0000-\u001f\u007f]/.test(input)
    ? input
    : null;
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

  if (body.contactMethod !== "phone" && body.contactMethod !== "telegram" && body.contactMethod !== "chat") {
    return { ok: false, error: "Выберите удобный способ связи.", field: "contactMethod" };
  }

  const contact = typeof body.contact === "string"
    ? body.contactMethod === "phone"
      ? normalizeProjectPhone(body.contact)
      : body.contactMethod === "telegram"
        ? normalizeTelegramContact(body.contact)
        : normalizeProjectChatContact(body.contact)
    : null;
  if (!contact) {
    return {
      ok: false,
      error: body.contactMethod === "phone"
        ? "Проверьте номер: российский номер должен содержать 10 или 11 цифр."
        : body.contactMethod === "telegram"
          ? "Укажите имя пользователя в Telegram, например @username, или ссылку t.me/username."
          : "Укажите мессенджер и ваш контакт: номер, имя пользователя или ссылку на профиль.",
      field: "contact",
    };
  }

  if (body.personalDataConsent !== true) {
    return { ok: false, error: "Необходимо согласие на обработку персональных данных.", field: "personalDataConsent" };
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
    },
  };
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function buildProjectRequestMessage(data: ProjectRequest, requestId: string) {
  const stage = data.projectStage === "new" ? "Новый проект / открытие" : "Действующее предприятие";
  const contactLabel = data.contactMethod === "phone" ? "Телефон" : data.contactMethod === "telegram" ? "Telegram" : "Удобный чат";

  return [
    `🌐 <b>Новая заявка с сайта #${escapeHtml(requestId)}</b>`,
    "",
    `<b>Проект:</b> ${stage}`,
    "",
    "<b>Задача клиента:</b>",
    data.task ? escapeHtml(data.task) : "Не указана — уточнить при связи.",
    "",
    `<b>Как связаться:</b> ${contactLabel} — ${escapeHtml(data.contact)}`,
    "<b>Источник:</b> форма обсуждения проекта на posadmin.ru",
  ].join("\n");
}
