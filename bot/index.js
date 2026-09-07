import "dotenv/config";
import { Bot, InlineKeyboard, Keyboard, GrammyError, HttpError } from "grammy";

const token = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID
  ? Number(process.env.ADMIN_CHAT_ID)
  : null;
const EMOJI = {
  request: process.env.EMOJI_REQUEST || "",
  services: process.env.EMOJI_SERVICES || "",
  products: process.env.EMOJI_PRODUCTS || "",
  confirm: process.env.EMOJI_CONFIRM || "",
  cancel: process.env.EMOJI_CANCEL || "",
  web: process.env.EMOJI_WEB || "",
  contact: process.env.EMOJI_CONTACT || "",
  newRequest: process.env.EMOJI_NEW_REQUEST || "",
  warning: process.env.EMOJI_WARNING || "",
  message: process.env.EMOJI_MESSAGE || "",
  question: process.env.EMOJI_QUESTION || "",
  rezebra: process.env.EMOJI_REZEBRA || "",
  loyalty: process.env.EMOJI_LOYALTY || "",
  soon: process.env.EMOJI_SOON || "",
  edit: process.env.EMOJI_EDIT || "",
  phone: process.env.EMOJI_PHONE || "",
};

if (!token) {
  console.error(
    "Нет BOT_TOKEN. Скопируйте bot/.env.example → bot/.env и вставьте токен.",
  );
  process.exit(1);
}

const bot = new Bot(token);
const sessions = new Map();

function ce(id, fallback) {
  if (!id) return fallback;
  return `<tg-emoji emoji-id="${id}">${fallback}</tg-emoji>`;
}

function icon(keyboard, emojiId) {
  if (emojiId) keyboard.icon(emojiId);
  return keyboard;
}

const mainMenu = icon(
  icon(
    icon(
      new InlineKeyboard().text("Оставить заявку", "menu:request"),
      EMOJI.request,
    )
      .row()
      .text("Услуги", "menu:services"),
    EMOJI.services,
  ).text("Продукты", "menu:products"),
  EMOJI.products,
);

const requestMenu = new InlineKeyboard().text("← Назад", "menu:back");
const editMenu = icon(
  icon(new InlineKeyboard().text("Да", "edit:confirm"), EMOJI.confirm).text(
    "Отмена",
    "edit:cancel",
  ),
  EMOJI.cancel,
);
const editQuestionMenu = new InlineKeyboard().text(
  "← Назад",
  "edit:back_to_contact",
);
const sectionMenu = new InlineKeyboard().text("← Назад", "section:back");
const productsMenu = icon(
  new InlineKeyboard().url("Открыть ReZebra", "https://rezebra.ru/"),
  EMOJI.web,
)
  .row()
  .text("← Назад", "section:back");

function contactKeyboard() {
  return new Keyboard()
    .requestContact("Поделиться номером")
    .text("Написать телефон")
    .row()
    .text("Связаться в Telegram")
    .text("← Назад")
    .resized()
    .oneTime();
}

function contactMethodKeyboard() {
  return new Keyboard()
    .text("Звонок")
    .text("Telegram")
    .row()
    .text("MAX")
    .text("Неважно")
    .resized()
    .oneTime();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function showContactChoice(ctx) {
  await ctx.reply(
    `${ce(EMOJI.contact, "📲")} <b>Как мы можем с вами связаться?</b>\n\n` +
      "Выберите удобный для вас способ связи.",
    {
      parse_mode: "HTML",
      reply_markup: contactKeyboard(),
    },
  );
}

function normalizePhone(value) {
  const input = value.trim();
  if (!/^[+\d\s().-]+$/.test(input)) return null;

  const plusCount = (input.match(/\+/g) || []).length;
  if (plusCount > 1 || (plusCount === 1 && !input.startsWith("+"))) {
    return null;
  }

  const digits = input.replace(/\D/g, "");
  let nationalNumber;

  if (input.startsWith("+") && !/^7\d{10}$/.test(digits)) return null;

  if (digits.length === 10) {
    nationalNumber = digits;
  } else if (
    digits.length === 11 &&
    (digits.startsWith("7") || digits.startsWith("8"))
  ) {
    nationalNumber = digits.slice(1);
  } else {
    return null;
  }

  if (!/^[3489]\d{9}$/.test(nationalNumber)) return null;
  return `+7${nationalNumber}`;
}

async function contactReceived(ctx, session, contact) {
  session.contact = contact;
  session.step = "complete";
  const requestId = `${String(Date.now()).slice(-6)}${Math.floor(
    10 + Math.random() * 90,
  )}`;

  const adminText =
    `${ce(EMOJI.newRequest, "🆕")} <b>Новая заявка #${requestId}</b>\n\n` +
    `<b>Вопрос:</b> ${escapeHtml(session.question)}\n\n` +
    `<b>Контакт:</b> ${escapeHtml(session.contact)}\n` +
    `<b>Предпочтительный способ связи:</b> ${escapeHtml(session.contactMethod || "Telegram")}\n` +
    `<b>Telegram:</b> ${ctx.from.username ? `@${ctx.from.username}` : "—"}`;

  if (ADMIN_CHAT_ID) {
    try {
      await ctx.api.sendMessage(ADMIN_CHAT_ID, adminText, {
        parse_mode: "HTML",
      });
    } catch (error) {
      console.error("Не удалось зарегистрировать заявку:", error);
      session.step = "contact_choice";
      await ctx.reply(
        `${ce(EMOJI.warning, "⚠️")} Не удалось зарегистрировать заявку. Пожалуйста, попробуйте ещё раз.`,
        { parse_mode: "HTML", reply_markup: contactKeyboard() },
      );
      return;
    }
  } else {
    console.error("ADMIN_CHAT_ID не задан. Заявка не отправлена.");
    session.step = "contact_choice";
    await ctx.reply(
      `${ce(EMOJI.warning, "⚠️")} Не удалось зарегистрировать заявку. Пожалуйста, попробуйте ещё раз.`,
      { parse_mode: "HTML", reply_markup: contactKeyboard() },
    );
    return;
  }

  await ctx.reply(
    `${ce(EMOJI.confirm, "✅")} <b>Спасибо, ваша заявка зарегистрирована.</b>\n\n` +
      `Номер заявки: <code>#${requestId}</code>\n\n` +
      "Менеджер свяжется с вами в ближайшее время по будням " +
      "с 10:00 до 19:00.",
    {
      parse_mode: "HTML",
      reply_markup: { remove_keyboard: true },
    },
  );
}

async function askContactMethod(ctx, session, phone) {
  session.contact = phone;
  session.step = "contact_method";
  await ctx.reply(
    `${ce(EMOJI.message, "💬")} <b>Как вам удобнее получить ответ?</b>\n\n` +
      "Выберите подходящий способ связи.",
    {
      parse_mode: "HTML",
      reply_markup: contactMethodKeyboard(),
    },
  );
}

const MAIN_TEXT =
  `${ce(EMOJI.question, "❓")} <b>Какой вопрос вас интересует?</b>\n\n` +
  "Вы можете ознакомиться с кратким списком наших услуг и продуктов " +
  "или оставить заявку на связь с менеджером.";

const SERVICES_TEXT =
  `${ce(EMOJI.services, "🛠")} <b>Услуги POSADMIN</b>\n\n` +
  "• внедрение и сопровождение r_keeper\n" +
  "• системное IT-администрирование\n" +
  "• сопровождение ЕГАИС, Честного знака, Меркурия и ЭДО\n" +
  "• регистрация и обслуживание кассовой техники\n" +
  "• установка оборудования и выезд инженеров\n" +
  "• разработка и интеграции под задачи заведения\n\n" +
  "Чтобы уточнить стоимость или состав работ, оставьте заявку — " +
  "менеджер поможет подобрать решение.";

const PRODUCTS_TEXT =
  `${ce(EMOJI.products, "📦")} <b>Продукты POSADMIN</b>\n\n` +
  `${ce(EMOJI.rezebra, "🦓")} <b>ReZebra</b> — система бронирования для заведений. ` +
  "Помогает организовать работу с бронями и гостями.\n\n" +
  `${ce(EMOJI.loyalty, "🎁")} <b>FexBonus</b> — система лояльности для работы с постоянными ` +
  "гостями и персональными предложениями.\n\n" +
  `${ce(EMOJI.soon, "🚀")} <b>Скоро в едином пространстве</b>\n` +
  "ReZebra и FexBonus будут объединены для более удобного управления " +
  "заведением. В планах:\n\n" +
  "• отчёты и аналитика по гостям\n" +
  "• единая работа с бронированиями и лояльностью\n" +
  "• создание рассылок для гостей через Telegram и SMS";

bot.command("start", async (ctx) => {
  sessions.delete(ctx.from.id);
  await ctx.reply(MAIN_TEXT, {
    parse_mode: "HTML",
    reply_markup: mainMenu,
  });
});

bot.callbackQuery("menu:request", async (ctx) => {
  sessions.set(ctx.from.id, { step: "question", question: "", contact: "" });
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `${ce(EMOJI.message, "💬")} <b>Чем мы можем вам помочь?</b>\n\n` +
      "Расскажите в одном сообщении о своём вопросе в удобной для вас форме.",
    {
      parse_mode: "HTML",
      reply_markup: requestMenu,
    },
  );
});

bot.callbackQuery("menu:back", async (ctx) => {
  sessions.delete(ctx.from.id);
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(MAIN_TEXT, {
    parse_mode: "HTML",
    reply_markup: mainMenu,
  });
});

bot.callbackQuery("menu:services", async (ctx) => {
  sessions.delete(ctx.from.id);
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(SERVICES_TEXT, {
    parse_mode: "HTML",
    reply_markup: sectionMenu,
  });
});

bot.callbackQuery("menu:products", async (ctx) => {
  sessions.delete(ctx.from.id);
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(PRODUCTS_TEXT, {
    parse_mode: "HTML",
    reply_markup: productsMenu,
  });
});

bot.callbackQuery("section:back", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(MAIN_TEXT, {
    parse_mode: "HTML",
    reply_markup: mainMenu,
  });
});

bot.callbackQuery("edit:confirm", async (ctx) => {
  const session = sessions.get(ctx.from.id);
  await ctx.answerCallbackQuery();
  if (!session || session.step !== "edit_confirm") return;

  session.step = "question_edit";
  await ctx.deleteMessage();
  await ctx.reply(
    `${ce(EMOJI.message, "💬")} <b>Чем мы можем вам помочь?</b>\n\n` +
      "Расскажите в одном сообщении о своём вопросе в удобной для вас форме.",
    {
      parse_mode: "HTML",
      reply_markup: editQuestionMenu,
    },
  );
});

bot.callbackQuery("edit:back_to_contact", async (ctx) => {
  const session = sessions.get(ctx.from.id);
  await ctx.answerCallbackQuery();
  if (!session || session.step !== "question_edit") return;

  sessions.delete(ctx.from.id);
  await ctx.editMessageText(MAIN_TEXT, {
    parse_mode: "HTML",
    reply_markup: mainMenu,
  });
});

bot.callbackQuery("edit:cancel", async (ctx) => {
  const session = sessions.get(ctx.from.id);
  await ctx.answerCallbackQuery();
  if (!session || session.step !== "edit_confirm") return;

  session.step = "contact_choice";
  await ctx.deleteMessage();
  await showContactChoice(ctx);
});

bot.on("message:contact", async (ctx) => {
  const session = sessions.get(ctx.from.id);
  if (!session || session.step !== "contact_choice") return;

  await askContactMethod(ctx, session, ctx.message.contact.phone_number);
});

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim();
  if (text.startsWith("/")) return;

  const session = sessions.get(ctx.from.id);
  if (!session) return;

  if (session.step === "question" || session.step === "question_edit") {
    if (escapeHtml(text).length > 3500) {
      await ctx.reply(
        `${ce(EMOJI.warning, "⚠️")} Сообщение получилось слишком длинным. ` +
          "Пожалуйста, сократите его до 3500 символов и отправьте ещё раз.",
        { parse_mode: "HTML" },
      );
      return;
    }

    session.question = text;
    session.step = "contact_choice";
    await showContactChoice(ctx);
    return;
  }

  if (session.step === "contact_choice") {
    if (text === "← Назад") {
      session.step = "edit_confirm";
      await ctx.reply("Возвращаемся к предыдущему шагу.", {
        reply_markup: { remove_keyboard: true },
      });
      await ctx.reply(
        `${ce(EMOJI.edit, "✏️")} <b>Хотите отредактировать прошлое сообщение?</b>\n\n` +
          `<blockquote>${escapeHtml(session.question)}</blockquote>`,
        {
          parse_mode: "HTML",
          reply_markup: editMenu,
        },
      );
      return;
    }

    if (text === "Написать телефон") {
      session.step = "phone";
      await ctx.reply(
        `${ce(EMOJI.phone, "📞")} <b>Укажите номер для связи</b>\n\n` +
          "Отправьте номер телефона, по которому менеджер сможет с вами связаться.",
        {
          parse_mode: "HTML",
          reply_markup: { remove_keyboard: true },
        },
      );
      return;
    }

    if (text === "Связаться в Telegram") {
      if (!ctx.from.username) {
        await ctx.reply(
          "В вашем профиле не указан username Telegram. " +
            "Выберите другой способ связи.",
          { reply_markup: contactKeyboard() },
        );
        return;
      }

      await contactReceived(ctx, session, `Telegram: @${ctx.from.username}`);
      return;
    }

    await ctx.reply("Выберите способ связи с помощью кнопок ниже.", {
      reply_markup: contactKeyboard(),
    });
    return;
  }

  if (session.step === "phone") {
    const phone = normalizePhone(text);
    if (!phone) {
      await ctx.reply(
        `${ce(EMOJI.warning, "⚠️")} Не удалось распознать номер. ` +
          "Проверьте правильность ввода: номер должен содержать от 10 до 11 цифр.",
        { parse_mode: "HTML" },
      );
      return;
    }

    await askContactMethod(ctx, session, phone);
    return;
  }

  if (session.step === "contact_method") {
    const methods = new Set([
      "Звонок",
      "Telegram",
      "MAX",
      "Неважно",
    ]);
    if (!methods.has(text)) {
      await ctx.reply("Выберите способ связи с помощью кнопок ниже.", {
        reply_markup: contactMethodKeyboard(),
      });
      return;
    }

    session.contactMethod = text;
    await contactReceived(ctx, session, session.contact);
  }
});

bot.catch((err) => {
  const error = err.error;

  if (error instanceof GrammyError) {
    console.error("Grammy error:", error.description);
  } else if (error instanceof HttpError) {
    console.error("HTTP error:", error);
  } else {
    console.error("Error:", error);
  }
});

bot.start({
  onStart: (info) => {
    console.log(`Бот @${info.username} запущен`);
  },
});
