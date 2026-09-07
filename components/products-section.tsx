"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CallbackDialog } from "@/components/callback-dialog";

type ProductView = "overview" | "booking" | "guests" | "campaigns";

const PRODUCT_VIEWS: Array<{
  id: ProductView;
  icon: string;
  label: string;
  eyebrow: string;
  title: string;
}> = [
  {
    id: "overview",
    icon: "/products/dashboard.svg",
    label: "Обзор",
    eyebrow: "Бизнес-пульс",
    title: "Главное — на одном экране",
  },
  {
    id: "booking",
    icon: "/products/calendar.svg",
    label: "Бронирование",
    eyebrow: "ReZebra",
    title: "Загрузка зала без накладок",
  },
  {
    id: "guests",
    icon: "/products/guests.svg",
    label: "Гости",
    eyebrow: "FexBonus",
    title: "Каждый гость — знакомый",
  },
  {
    id: "campaigns",
    icon: "/products/campaigns.svg",
    label: "Рассылки",
    eyebrow: "Коммуникации",
    title: "Сообщения, которые ждут",
  },
];

const SIDE_NAV = [
  { icon: "/products/dashboard.svg", label: "Главная" },
  { icon: "/products/guests.svg", label: "Гости" },
  { icon: "/products/orders.svg", label: "Заказы" },
  { icon: "/products/catalog.svg", label: "Номенклатура" },
  { icon: "/products/messages.svg", label: "Коммуникации" },
  { icon: "/products/analytics.svg", label: "Отчёты" },
] as const;

const EASE = [0.22, 1, 0.36, 1] as const;

function Icon({ src, size = 16 }: { src: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="relative block shrink-0"
      style={{ height: size, width: size }}
    >
      <Image alt="" fill sizes={`${size}px`} src={src} />
    </span>
  );
}

function MetricCard({
  icon,
  label,
  value,
  note,
  delay,
}: {
  icon: string;
  label: string;
  value: string;
  note: string;
  delay: number;
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[13px] border border-[#e7e6df] bg-white/85 p-3 shadow-[0_10px_25px_rgba(50,47,47,0.035)]"
      initial={{ opacity: 0, y: 8 }}
      transition={{ delay, duration: 0.4, ease: EASE }}
    >
      <div className="flex items-center gap-2 text-[10px] text-[#85837a]">
        <span className="flex size-6 items-center justify-center rounded-[7px] bg-[#f1eee5]">
          <Icon size={12} src={icon} />
        </span>
        {label}
      </div>
      <p className="mt-3 text-[17px] font-medium tracking-[-0.3px] text-[#322f2f]">
        {value}
      </p>
      <p className="mt-1 text-[9px] text-[#4f8d71]">{note}</p>
    </motion.div>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[14px] border border-[#e7e6df] bg-white/80 shadow-[0_12px_32px_rgba(50,47,47,0.035)] ${className}`}
    >
      {children}
    </div>
  );
}

function OverviewView() {
  const bars = [38, 50, 46, 68, 58, 79, 72, 94, 82, 100, 92, 112];

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <MetricCard delay={0.03} icon="/products/analytics.svg" label="Выручка" note="↑ 12,4% к периоду" value="1 487 540 ₽" />
        <MetricCard delay={0.08} icon="/products/orders.svg" label="Заказы" note="↑ 86 заказов" value="342" />
        <MetricCard delay={0.13} icon="/products/guests.svg" label="Гости" note="68 новых гостей" value="1 204" />
        <MetricCard delay={0.18} icon="/products/tasks.svg" label="Средний чек" note="↑ 7,8%" value="4 349 ₽" />
      </div>

      <div className="mt-2.5 grid gap-2.5 lg:grid-cols-[1.45fr_0.8fr]">
        <Panel className="min-h-[176px] p-3.5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium">Динамика выручки</p>
              <p className="mt-1 text-[9px] text-[#969691]">Последние 12 дней</p>
            </div>
            <span className="rounded-full bg-[#f3f1ea] px-2.5 py-1 text-[8px] text-[#646565]">Все объекты</span>
          </div>
          <div className="mt-5 flex h-[92px] items-end gap-1.5 border-b border-[#e9e7df] px-1">
            {bars.map((height, index) => (
              <motion.span
                animate={{ height }}
                className="min-w-0 flex-1 rounded-t-[4px] bg-[#e66026]"
                initial={{ height: 4 }}
                key={`${height}-${index}`}
                transition={{ delay: 0.08 + index * 0.025, duration: 0.55, ease: EASE }}
                style={{ opacity: 0.3 + index * 0.055 }}
              />
            ))}
          </div>
        </Panel>

        <Panel className="flex min-h-[176px] items-center gap-5 p-4">
          <motion.div
            animate={{ rotate: 0, scale: 1 }}
            className="relative grid size-[94px] shrink-0 place-items-center rounded-full"
            initial={{ rotate: -35, scale: 0.82 }}
            style={{ background: "conic-gradient(#e66026 0 68%, #d8d7cf 68% 88%, #f0b18f 88%)" }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <span className="absolute inset-[13px] rounded-full bg-[#fbfbf8]" />
            <span className="relative text-center text-[16px] font-medium">68%<small className="block text-[8px] font-normal text-[#969691]">с гостем</small></span>
          </motion.div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium">Заказы с гостем</p>
            <p className="mt-2 text-[9px] leading-[14px] text-[#85837a]">Чем больше известных гостей, тем точнее предложения и выше возвратность.</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function BookingView() {
  const times = ["18:00", "18:30", "19:00", "19:30", "20:00"];
  const tables = [
    { name: "Стол 4", guests: "2 гостя", left: "8%", width: "30%", tone: "bg-[#dfeee8]" },
    { name: "Стол 8", guests: "4 гостя", left: "34%", width: "38%", tone: "bg-[#f7d9c9]" },
    { name: "VIP 2", guests: "6 гостей", left: "58%", width: "38%", tone: "bg-[#ece5d5]" },
  ];

  return (
    <div className="grid gap-2.5 lg:grid-cols-[1.35fr_0.65fr]">
      <Panel className="min-h-[262px] overflow-hidden p-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium">Загрузка зала</p>
            <p className="mt-1 text-[9px] text-[#969691]">Сегодня, вечер</p>
          </div>
          <span className="rounded-full bg-[#fff0e8] px-2.5 py-1 text-[8px] font-medium text-[#d6531d]">72% занято</span>
        </div>
        <div className="mt-5 grid grid-cols-5 border-b border-[#e8e6df] pb-2 text-center text-[8px] text-[#969691]">
          {times.map((time) => <span key={time}>{time}</span>)}
        </div>
        <div className="relative mt-2 h-[157px] overflow-hidden rounded-[10px] bg-[#f5f5ef]">
          <div className="absolute inset-0 grid grid-cols-5">{times.map((time) => <span className="border-r border-white" key={time} />)}</div>
          {tables.map((table, index) => (
            <motion.div
              animate={{ opacity: 1, scaleX: 1 }}
              className={`absolute h-[38px] origin-left rounded-[9px] px-3 py-2 ${table.tone}`}
              initial={{ opacity: 0, scaleX: 0.4 }}
              key={table.name}
              style={{ left: table.left, top: 12 + index * 47, width: table.width }}
              transition={{ delay: 0.08 + index * 0.1, duration: 0.5, ease: EASE }}
            >
              <p className="truncate text-[9px] font-medium">{table.name}</p>
              <p className="mt-0.5 truncate text-[7px] text-[#85837a]">{table.guests}</p>
            </motion.div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-1">
        <Panel className="p-3.5">
          <p className="text-[9px] text-[#85837a]">Бронирований сегодня</p>
          <p className="mt-2 text-[22px] font-medium">48</p>
          <p className="mt-1 text-[8px] text-[#4f8d71]">+9 к прошлой субботе</p>
        </Panel>
        <Panel className="p-3.5">
          <p className="text-[9px] text-[#85837a]">Ближайший визит</p>
          <p className="mt-2 text-[13px] font-medium">Мария · 19:30</p>
          <p className="mt-1 text-[8px] text-[#85837a]">4 гостя · стол 8</p>
        </Panel>
      </div>
    </div>
  );
}

function GuestsView() {
  const guests = [
    { name: "Анна Волкова", visits: "24 визита", bonus: "8 450 бонусов", tag: "Постоянный" },
    { name: "Максим Орлов", visits: "11 визитов", bonus: "3 120 бонусов", tag: "Вернулся" },
    { name: "Елена Соколова", visits: "7 визитов", bonus: "1 860 бонусов", tag: "Новый" },
  ];

  return (
    <div className="grid gap-2.5 lg:grid-cols-[0.72fr_1.28fr]">
      <Panel className="p-3.5">
        <p className="text-[11px] font-medium">Сегменты</p>
        <p className="mt-1 text-[9px] text-[#969691]">Готовые аудитории</p>
        <div className="mt-4 space-y-2">
          {[
            ["Постоянные гости", "482", "84%"],
            ["Давно не были", "126", "42%"],
            ["Новички", "94", "28%"],
          ].map(([name, count, width], index) => (
            <div className="rounded-[10px] bg-[#f5f5ef] p-2.5" key={name}>
              <div className="flex justify-between gap-3 text-[9px]"><span>{name}</span><strong className="font-medium">{count}</strong></div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#dfded6]">
                <motion.div animate={{ width }} className="h-full rounded-full bg-[#e66026]" initial={{ width: 0 }} transition={{ delay: 0.08 + index * 0.08, duration: 0.55, ease: EASE }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="border-b border-[#e8e6df] px-3.5 py-3">
          <p className="text-[11px] font-medium">Карточки гостей</p>
          <p className="mt-1 text-[9px] text-[#969691]">История визитов, предпочтения и бонусы</p>
        </div>
        <div className="divide-y divide-[#eceae3]">
          {guests.map((guest, index) => (
            <motion.div animate={{ opacity: 1, x: 0 }} className="grid grid-cols-[1fr_auto] items-center gap-3 px-3.5 py-3" initial={{ opacity: 0, x: 10 }} key={guest.name} transition={{ delay: 0.08 + index * 0.08, duration: 0.4, ease: EASE }}>
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#ece9df] text-[10px] font-medium text-[#e66026]">{guest.name.split(" ").map((part) => part[0]).join("")}</span>
                <div className="min-w-0"><p className="truncate text-[10px] font-medium">{guest.name}</p><p className="mt-1 text-[8px] text-[#969691]">{guest.visits} · {guest.bonus}</p></div>
              </div>
              <span className="rounded-full bg-[#eff4ec] px-2 py-1 text-[7px] text-[#4f7a58]">{guest.tag}</span>
            </motion.div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function CampaignsView() {
  const channels = [
    { name: "Telegram", delivered: "1 284", width: "92%", color: "bg-[#4c9bd6]" },
    { name: "SMS", delivered: "846", width: "68%", color: "bg-[#e66026]" },
  ];

  return (
    <div className="grid gap-2.5 lg:grid-cols-[1.2fr_0.8fr]">
      <Panel className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-[11px] font-medium">Возвращаем любимых гостей</p><p className="mt-1 text-[9px] text-[#969691]">Кампания «Давно не виделись»</p></div>
          <span className="rounded-full bg-[#edf5ef] px-2.5 py-1 text-[8px] text-[#4f7a58]">Запущена</span>
        </div>
        <div className="mt-4 rounded-[12px] border border-[#e8e6df] bg-[#f7f6f1] p-3">
          <p className="text-[8px] uppercase tracking-[0.8px] text-[#969691]">Сообщение</p>
          <p className="mt-2 text-[10px] leading-[16px]">Анна, мы скучали. Загляните на ужин до воскресенья — десерт уже ждёт вас.</p>
        </div>
        <div className="mt-4 space-y-3">
          {channels.map((channel, index) => (
            <div className="grid grid-cols-[60px_1fr_42px] items-center gap-3" key={channel.name}>
              <span className="text-[9px]">{channel.name}</span>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#e4e2db]"><motion.div animate={{ width: channel.width }} className={`h-full rounded-full ${channel.color}`} initial={{ width: 0 }} transition={{ delay: 0.12 + index * 0.12, duration: 0.65, ease: EASE }} /></div>
              <span className="text-right text-[9px] text-[#646565]">{channel.delivered}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="grid grid-cols-2 gap-px overflow-hidden bg-[#e8e6df]">
        {[
          ["Аудитория", "2 130"],
          ["Доставлено", "94%"],
          ["Вернулись", "186"],
          ["Выручка", "542 300 ₽"],
        ].map(([label, value], index) => (
          <motion.div animate={{ opacity: 1 }} className="bg-white/90 p-4" initial={{ opacity: 0 }} key={label} transition={{ delay: 0.06 + index * 0.07 }}><p className="text-[8px] text-[#969691]">{label}</p><p className="mt-2 text-[14px] font-medium">{value}</p></motion.div>
        ))}
      </Panel>
    </div>
  );
}

function ViewContent({ view }: { view: ProductView }) {
  if (view === "booking") return <BookingView />;
  if (view === "guests") return <GuestsView />;
  if (view === "campaigns") return <CampaignsView />;
  return <OverviewView />;
}

function ProductDashboard({
  activeView,
  onViewChange,
}: {
  activeView: ProductView;
  onViewChange: (view: ProductView) => void;
}) {
  const current = PRODUCT_VIEWS.find((view) => view.id === activeView) ?? PRODUCT_VIEWS[0];

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-[#cfcec6] bg-[#e7e6de] shadow-[0_32px_90px_rgba(50,47,47,0.18)]">
      <div className="flex h-9 items-center border-b border-[#d3d1c9] px-3">
        <div className="flex gap-1.5" aria-hidden="true"><span className="size-2 rounded-full bg-[#c7c5be]" /><span className="size-2 rounded-full bg-[#d1cfc8]" /><span className="size-2 rounded-full bg-[#d9d7d0]" /></div>
        <p className="absolute left-1/2 -translate-x-1/2 font-[family-name:var(--font-montserrat)] text-[9px] font-medium tracking-[0.15px]">POSADMIN SPACE</p>
        <span className="ml-auto rounded-full bg-[#f5f5ed] px-2 py-1 text-[7px] text-[#85837a]">Все системы работают</span>
      </div>

      <div className="grid min-h-[500px] bg-[#f8f8f4] md:grid-cols-[156px_1fr] lg:min-h-[520px]">
        <aside className="hidden border-r border-[#e5e3dc] bg-[#fbfbf8] px-2.5 py-4 md:block">
          <div className="flex items-center gap-2 px-2">
            <span className="grid size-7 place-items-center rounded-[8px] bg-[#322f2f] text-[10px] font-semibold text-white">P</span>
            <div><p className="text-[9px] font-medium">PosAdmin</p><p className="mt-0.5 text-[7px] text-[#969691]">единое пространство</p></div>
          </div>
          <div className="mt-5 space-y-1">
            {SIDE_NAV.map((item, index) => (
              <div className={`flex h-8 items-center gap-2.5 rounded-[8px] px-2.5 text-[8px] ${index === 0 ? "bg-[#eceae2] font-medium text-[#e66026]" : "text-[#646565]"}`} key={item.label}>
                <Icon size={12} src={item.icon} />{item.label}
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[11px] bg-[#322f2f] p-3 text-white">
            <p className="text-[8px] font-medium">ReZebra + FexBonus</p>
            <p className="mt-1.5 text-[7px] leading-[11px] text-white/55">Скоро в одном окне</p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/15"><motion.div animate={{ width: "76%" }} className="h-full rounded-full bg-[#e66026]" initial={{ width: 0 }} transition={{ delay: 0.5, duration: 0.8, ease: EASE }} /></div>
          </div>
        </aside>

        <div className="min-w-0 p-3 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[8px] font-semibold uppercase tracking-[1.2px] text-[#e66026]">{current.eyebrow}</p>
              <h3 className="mt-1.5 text-[17px] font-medium tracking-[-0.25px] sm:text-[20px]">{current.title}</h3>
            </div>
            <div className="flex items-center gap-1 rounded-[10px] bg-[#eceae2] p-1 sm:justify-end">
              {PRODUCT_VIEWS.map((view) => (
                <button
                  aria-label={`Показать раздел «${view.label}»`}
                  className={`relative flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[8px] transition-colors sm:px-3 ${activeView === view.id ? "text-[#322f2f]" : "text-[#85837a] hover:text-[#322f2f]"}`}
                  key={view.id}
                  onClick={() => onViewChange(view.id)}
                  type="button"
                >
                  {activeView === view.id ? <motion.span className="absolute inset-0 rounded-[8px] bg-[#fbfbf8] shadow-[0_4px_12px_rgba(50,47,47,0.08)]" layoutId="product-view-pill" transition={{ duration: 0.3, ease: EASE }} /> : null}
                  <span className="relative"><Icon size={11} src={view.icon} /></span><span className="relative hidden xl:inline">{view.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 border-t border-[#e5e3dc] pt-4">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} initial={{ opacity: 0, y: 10 }} key={activeView} transition={{ duration: 0.32, ease: EASE }}>
                <ViewContent view={activeView} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductsSection() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.25 });
  const [activeView, setActiveView] = useState<ProductView>("overview");
  const [autoPlay, setAutoPlay] = useState(true);
  const [callbackOpen, setCallbackOpen] = useState(false);

  useEffect(() => {
    if (!inView || reduced || !autoPlay) return;
    const timer = window.setInterval(() => {
      setActiveView((current) => {
        const index = PRODUCT_VIEWS.findIndex((view) => view.id === current);
        return PRODUCT_VIEWS[(index + 1) % PRODUCT_VIEWS.length].id;
      });
    }, 3_500);
    return () => window.clearInterval(timer);
  }, [autoPlay, inView, reduced]);

  const selectView = (view: ProductView) => {
    setAutoPlay(false);
    setActiveView(view);
  };

  return (
    <section
      aria-labelledby="products-title"
      className="relative scroll-mt-20 overflow-hidden bg-[#f5f5ed] px-4 py-20 font-[family-name:var(--font-inter)] text-[#322f2f] sm:px-6 sm:py-24"
      id="products"
      ref={sectionRef}
    >
      <div className="pointer-events-none absolute left-1/2 top-[310px] h-[620px] w-[1200px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(230,96,38,0.11),transparent_67%)] blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1197px]">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          transition={{ duration: 0.7, ease: EASE }}
          viewport={{ once: true, amount: 0.5 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="text-center font-[family-name:var(--font-montserrat)] text-[11px] font-medium uppercase tracking-[1.6px] text-[#e66026]">Сделано в Posadmin</p>
          <h2 className="mt-4 text-center font-[family-name:var(--font-inter-display)] text-[34px] font-medium leading-[1.08] tracking-[-0.8px] text-[#313235] [font-variation-settings:'opsz'_32] sm:text-[48px]" id="products-title">
            Собственные продукты
          </h2>
          <p className="mx-auto mt-4 max-w-[760px] text-center text-[18px] font-medium leading-[26px] tracking-[0.1px] sm:text-[22px] sm:leading-[30px]">Бронирование и лояльность — в одном пространстве</p>
          <p className="mx-auto mt-4 max-w-[850px] text-center text-[14px] leading-[22px] text-[#646565] sm:text-[16px] sm:leading-[26px]">ReZebra помогает управлять бронями, FexBonus — гостями, скидками и сертификатами. Скоро обе системы объединятся: с отчётами по гостям и персональными рассылками через Telegram и SMS.</p>
        </motion.div>

        <div className="relative mt-11 rounded-[30px] bg-[#e5e5dc] p-2.5 sm:p-5 lg:p-10">
          <div className="pointer-events-none absolute inset-0 rounded-[30px] opacity-35 [background-image:radial-gradient(#aaa89f_0.8px,transparent_0.8px)] [background-size:16px_16px]" aria-hidden="true" />
          <motion.div animate={reduced ? undefined : { y: [0, -7, 0] }} className="absolute -left-1 top-8 z-10 hidden rounded-full border border-white/70 bg-[#fbfbf8]/90 px-4 py-2 text-[10px] font-medium shadow-[0_10px_30px_rgba(50,47,47,0.12)] backdrop-blur sm:block lg:left-3" transition={{ duration: 4.4, ease: "easeInOut", repeat: Infinity }}>ReZebra · бронирование</motion.div>
          <motion.div animate={reduced ? undefined : { y: [0, 8, 0] }} className="absolute -right-1 bottom-9 z-10 hidden rounded-full border border-white/70 bg-[#fbfbf8]/90 px-4 py-2 text-[10px] font-medium shadow-[0_10px_30px_rgba(50,47,47,0.12)] backdrop-blur sm:block lg:right-3" transition={{ delay: 0.8, duration: 5, ease: "easeInOut", repeat: Infinity }}>FexBonus · лояльность</motion.div>

          <motion.div
            initial={reduced ? false : { opacity: 0, scale: 0.96, y: 28 }}
            transition={{ duration: 0.75, ease: EASE }}
            viewport={{ once: true, amount: 0.18 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
          >
            <ProductDashboard activeView={activeView} onViewChange={selectView} />
          </motion.div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
          <motion.a className="group rounded-[20px] border border-[#deddd5] bg-white/45 p-5 transition-colors hover:bg-white/75" href="https://rezebra.ru/" initial={reduced ? false : { opacity: 0, x: -18 }} rel="noreferrer" target="_blank" viewport={{ once: true, amount: 0.5 }} whileInView={{ opacity: 1, x: 0 }}>
            <div className="flex items-start justify-between gap-5"><div><p className="text-[11px] font-medium uppercase tracking-[1px] text-[#e66026]">ReZebra</p><h3 className="mt-2 text-[18px] font-medium">Бронирование без накладок</h3><p className="mt-2 text-[13px] leading-5 text-[#646565]">Столы, загрузка залов и история визитов — всегда перед глазами.</p></div><span className="mt-1 text-[20px] transition-transform group-hover:translate-x-1" aria-hidden="true">↗</span></div>
          </motion.a>

          <div className="hidden items-center px-2 lg:flex" aria-hidden="true"><span className="h-px w-10 bg-[#cfcec6]" /><span className="size-2 rounded-full bg-[#e66026]" /><span className="h-px w-10 bg-[#cfcec6]" /></div>

          <motion.div className="rounded-[20px] border border-[#deddd5] bg-white/45 p-5" initial={reduced ? false : { opacity: 0, x: 18 }} viewport={{ once: true, amount: 0.5 }} whileInView={{ opacity: 1, x: 0 }}>
            <p className="text-[11px] font-medium uppercase tracking-[1px] text-[#e66026]">FexBonus</p><h3 className="mt-2 text-[18px] font-medium">Лояльность, которая знает гостя</h3><p className="mt-2 text-[13px] leading-5 text-[#646565]">Бонусы, сертификаты, сегменты и персональные предложения в нужный момент.</p>
          </motion.div>
        </div>

        <div className="mt-8 text-center">
          <button className="min-h-12 rounded-full bg-[#322f2f] px-7 text-[14px] font-medium text-[#f5f5ed] transition-transform hover:-translate-y-0.5 hover:bg-[#e66026] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e66026]" onClick={() => setCallbackOpen(true)} type="button">Обсудить подключение</button>
        </div>
      </div>

      <CallbackDialog onClose={() => setCallbackOpen(false)} open={callbackOpen} />
    </section>
  );
}
