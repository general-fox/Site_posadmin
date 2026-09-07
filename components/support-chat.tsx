import type { CSSProperties } from "react";

const MESSAGES = [
  { from: "you", text: "Помогите провести скидку в заказ" },
  { from: "posadmin", text: "Поправили, проверьте" },
  { from: "you", text: "Не печатает принтер на Горячем цеху" },
  { from: "posadmin", text: "Конечно, когда вам удобно?" },
  { from: "you", text: "Помогите построить отчет по продажам за прошлый месяц" },
  { from: "posadmin", text: "Готово" },
  { from: "you", text: "Добавьте Цезарь в папку салаты" },
  { from: "posadmin", text: "Здравствуйте, принято" },
  { from: "you", text: "Добавьте пожалуйста на план зала Веранда 3 новых стола" },
  { from: "posadmin", text: "Добрый день, подключаемся" },
  { from: "you", text: "Кассовая смена не закрывается" },
] as const;

const CURTAIN_LAYERS = [
  { blur: "1px", from: "0%", to: "88%" },
  { blur: "2px", from: "0%", to: "68%" },
  { blur: "4px", from: "0%", to: "48%" },
  { blur: "8px", from: "0%", to: "30%" },
  { blur: "14px", from: "0%", to: "16%" },
] as const;

function ChatCurtain({ edge }: { edge: "top" | "bottom" }) {
  return (
    <div
      className={`chat-curtain ${edge === "top" ? "chat-curtain-top" : "chat-curtain-bottom"}`}
      aria-hidden
    >
      {CURTAIN_LAYERS.map((layer) => (
        <span
          key={layer.blur}
          className="chat-curtain-layer"
          style={
            {
              "--curtain-blur": layer.blur,
              "--curtain-from": layer.from,
              "--curtain-to": layer.to,
            } as CSSProperties
          }
        />
      ))}
      <span className="chat-curtain-wash" />
    </div>
  );
}

function Tail({ outgoing }: { outgoing: boolean }) {
  return (
    <svg
      className="block h-[14px] w-[24px]"
      viewBox="0 0 24 14"
      fill="currentColor"
      aria-hidden="true"
    >
      {outgoing ? (
        <path d="M0.848373 5.94366C6.09033 10.1542 9.75203 11.6466 15.5983 13.3277C16.204 13.5019 16.6515 12.7141 16.2334 12.2425C13.9065 9.61793 13.191 6.8757 15.7395 1.29483C15.9607 0.810356 15.5045 0.275628 14.9974 0.438333L1.04067 4.91612C0.589863 5.06075 0.479265 5.64718 0.848373 5.94366Z" />
      ) : (
        <path d="M23.1516 5.94366C17.9097 10.1542 14.248 11.6466 8.40167 13.3277C7.79598 13.5019 7.34855 12.7141 7.76663 12.2425C10.0935 9.61793 10.809 6.8757 8.26052 1.29483C8.03929 0.810356 8.49546 0.275628 9.0026 0.438333L22.9593 4.91612C23.4101 5.06075 23.5207 5.64718 23.1516 5.94366Z" />
      )}
    </svg>
  );
}

function Message({ from, text }: { from: "you" | "posadmin"; text: string }) {
  const outgoing = from === "you";

  return (
    <div
      className={`flex w-full flex-col py-[15px] ${
        outgoing ? "items-end" : "items-start"
      }`}
    >
      <div
        className={`flex max-w-[280px] flex-col gap-[6px] ${
          outgoing ? "items-end" : "items-start"
        }`}
      >
        <span className="px-[4px] text-[11px] leading-none tracking-[0.2px] whitespace-nowrap text-[#5C5B57]">
          {outgoing ? "Вы" : "Posadmin"}
        </span>
        <div
          className={`support-chat-bubble flex flex-col ${
            outgoing ? "items-end text-white" : "items-start text-[#E6E6DE]"
          }`}
        >
          <div
            className={`-mb-[8px] rounded-[20px] px-[16px] py-[11px] text-[14px] leading-[1.3] tracking-[0.15px] text-[#2A2828] ${
              outgoing
                ? "border border-[rgba(50,47,47,0.06)] bg-white"
                : "bg-[#E6E6DE]"
            }`}
          >
            {text}
          </div>
          <Tail outgoing={outgoing} />
        </div>
      </div>
    </div>
  );
}

export function SupportChat() {
  return (
    <div className="flex h-full flex-col gap-[24px] overflow-hidden rounded-[25px] px-[24px] pt-[24px] pb-[8px] md:gap-[32px]">
      <div className="flex w-full flex-col gap-[15px] text-[#322F2F]">
        <h3 className="text-[22px] font-normal leading-normal tracking-[0.45px] xl:text-[24px] xl:tracking-[0.6px]">
          Техническая поддержка 24/7
        </h3>
        <p className="text-[14px] leading-[20px] tracking-[0.2px]">
          Две линии технической поддержки&nbsp; оперативно решают ежедневные
          вопросы
        </p>
      </div>

      <div className="relative min-h-0 w-full flex-1 overflow-hidden">
        <ChatCurtain edge="top" />
        <div className="support-chat-track flex w-full flex-col px-4">
          {[0, 1].map((loop) =>
            MESSAGES.map((message, i) => (
              <Message
                key={`${loop}-${i}`}
                from={message.from}
                text={message.text}
              />
            )),
          )}
        </div>
        <ChatCurtain edge="bottom" />
      </div>
    </div>
  );
}
