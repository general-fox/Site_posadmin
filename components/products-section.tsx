"use client";

import Image from "next/image";
import {
  motion,
  useInView,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CallbackDialog } from "@/components/callback-dialog";

import { ArrowRight, SectionReveal, useMarketingReducedMotion } from "./marketing-ui";
import { SectionAtmosphere } from "./section-atmosphere";
import ui from "./marketing.module.css";
import styles from "./products-section.module.css";

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
    eyebrow: "FlexBonusb",
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

function StarIcon() {
  return <svg className={styles.starIcon} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
    <path d="M12 3v18M3 12h18M5.636 5.636l12.728 12.728M5.636 18.364 18.364 5.636" />
  </svg>;
}

function TabIcon({ src }: { src: string }) {
  return <span
    aria-hidden="true"
    className={styles.tabIcon}
    style={{ WebkitMaskImage: `url("${src}")`, maskImage: `url("${src}")` }}
  />;
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
  const reduced = useMarketingReducedMotion();
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface)]/85 p-3 shadow-[0_10px_25px_rgba(50,47,47,0.035)]"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      transition={{ delay: reduced ? 0 : delay, duration: reduced ? 0 : 0.4, ease: EASE }}
    >
      <div className="flex items-center gap-2 text-[12px] text-[var(--text-body)]">
        <span className="flex size-6 items-center justify-center rounded-[7px] bg-[var(--surface-selected)]">
          <Icon size={12} src={icon} />
        </span>
        {label}
      </div>
      <p className="mt-3 break-words text-[18px] font-medium tracking-[-0.3px] text-[var(--ink)]">
        {value}
      </p>
      <p className="mt-1 text-[12px] text-[var(--text-olive)]">{note}</p>
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
      className={`rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface)]/80 shadow-[0_12px_32px_rgba(50,47,47,0.035)] ${className}`}
    >
      {children}
    </div>
  );
}

function OverviewView() {
  const reduced = useMarketingReducedMotion();
  const bars = [38, 50, 46, 68, 58, 79, 72, 94, 82, 100, 92, 112];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard delay={0.03} icon="/products/analytics.svg" label="Выручка" note="↑ 12,4% к периоду" value="1 487 540 ₽" />
        <MetricCard delay={0.08} icon="/products/orders.svg" label="Заказы" note="↑ 86 заказов" value="342" />
        <MetricCard delay={0.13} icon="/products/guests.svg" label="Гости" note="68 новых гостей" value="1 204" />
        <MetricCard delay={0.18} icon="/products/tasks.svg" label="Средний чек" note="↑ 7,8%" value="4 349 ₽" />
      </div>

      <div className="mt-2.5 grid gap-2.5 xl:grid-cols-[1.45fr_0.8fr]">
        <Panel className="min-h-[176px] p-3.5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-medium">Динамика выручки</p>
              <p className="mt-1 text-[12px] text-[var(--text-muted)]">Последние 12 дней</p>
            </div>
            <span className="rounded-full bg-[var(--surface-soft)] px-2.5 py-1 text-[12px] text-[var(--text-body)]">Все объекты</span>
          </div>
          <div className="mt-6 flex h-[124px] items-end gap-1.5 border-b border-[var(--border)] px-1">
            {bars.map((height, index) => (
              <motion.span
                animate={{ height }}
                className="min-w-0 flex-1 rounded-t-[4px] bg-[var(--orange)]"
                initial={reduced ? false : { height: 4 }}
                key={`${height}-${index}`}
                transition={{ delay: reduced ? 0 : 0.08 + index * 0.025, duration: reduced ? 0 : 0.55, ease: EASE }}
                style={{ opacity: 0.3 + index * 0.055 }}
              />
            ))}
          </div>
        </Panel>

        <Panel className="flex min-h-[176px] items-center gap-5 p-4">
          <motion.div
            animate={{ rotate: 0, scale: 1 }}
            className="relative grid size-[94px] shrink-0 place-items-center rounded-full"
            initial={reduced ? false : { rotate: -12, scale: 0.96 }}
            style={{ background: "conic-gradient(var(--orange) 0 68%, var(--border) 68% 88%, var(--accent-border) 88%)" }}
            transition={{ duration: reduced ? 0 : 0.7, ease: EASE }}
          >
            <span className="absolute inset-[13px] rounded-full bg-[var(--surface)]" />
            <span className="relative text-center text-[16px] font-medium">68%<small className="block text-[12px] font-normal text-[var(--text-muted)]">с гостем</small></span>
          </motion.div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium">Заказы с гостем</p>
            <p className="mt-2 text-[12px] leading-[1.6] text-[var(--text-body)]">Чем больше известных гостей, тем точнее предложения и выше возвратность.</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function BookingView() {
  const reduced = useMarketingReducedMotion();
  const times = ["18:00", "18:30", "19:00", "19:30", "20:00"];
  const tables = [
    { name: "Стол 4", guests: "2 гостя", left: "8%", width: "30%", tone: "bg-[var(--surface-selected)]" },
    { name: "Стол 8", guests: "4 гостя", left: "34%", width: "38%", tone: "bg-[#f7d9c9]" },
    { name: "VIP 2", guests: "6 гостей", left: "58%", width: "38%", tone: "bg-[#ece5d5]" },
  ];

  return (
    <div className="grid gap-2.5 xl:grid-cols-[1.35fr_0.65fr]">
      <Panel className="min-h-[262px] overflow-hidden p-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium">Загрузка зала</p>
            <p className="mt-1 text-[12px] text-[var(--text-muted)]">Сегодня, вечер</p>
          </div>
          <span className="rounded-full bg-[#fff0e8] px-2.5 py-1 text-[12px] font-medium text-[#d6531d]">72% занято</span>
        </div>
        <div className="mt-5 grid grid-cols-5 border-b border-[var(--border)] pb-2 text-center text-[12px] text-[var(--text-muted)]">
          {times.map((time) => <span key={time}>{time}</span>)}
        </div>
        <div className="relative mt-2 h-[204px] overflow-hidden rounded-[10px] bg-[var(--surface-soft)]">
          <div className="absolute inset-0 grid grid-cols-5">{times.map((time) => <span className="border-r border-white" key={time} />)}</div>
          {tables.map((table, index) => (
            <motion.div
              animate={{ opacity: 1, scaleX: 1 }}
              className={`absolute h-[54px] origin-left rounded-[9px] px-3 py-2 ${table.tone}`}
              initial={reduced ? false : { opacity: 0, scaleX: 0.96 }}
              key={table.name}
              style={{ left: table.left, top: 12 + index * 64, width: table.width }}
              transition={{ delay: reduced ? 0 : 0.08 + index * 0.1, duration: reduced ? 0 : 0.5, ease: EASE }}
            >
              <p className="text-[12px] font-medium">{table.name}</p>
              <p className="mt-0.5 text-[12px] text-[var(--text-body)]">{table.guests}</p>
            </motion.div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-1">
        <Panel className="p-3.5">
          <p className="text-[12px] text-[var(--text-body)]">Бронирований сегодня</p>
          <p className="mt-2 text-[22px] font-medium">48</p>
          <p className="mt-1 text-[12px] text-[var(--text-olive)]">+9 к прошлой субботе</p>
        </Panel>
        <Panel className="p-3.5">
          <p className="text-[12px] text-[var(--text-body)]">Ближайший визит</p>
          <p className="mt-2 text-[13px] font-medium">Мария · 19:30</p>
          <p className="mt-1 text-[12px] text-[var(--text-body)]">4 гостя · стол 8</p>
        </Panel>
      </div>
    </div>
  );
}

function GuestsView() {
  const reduced = useMarketingReducedMotion();
  const guests = [
    { name: "Анна Волкова", visits: "24 визита", bonus: "8 450 бонусов", tag: "Постоянный" },
    { name: "Максим Орлов", visits: "11 визитов", bonus: "3 120 бонусов", tag: "Вернулся" },
    { name: "Елена Соколова", visits: "7 визитов", bonus: "1 860 бонусов", tag: "Новый" },
  ];

  return (
    <div className="grid gap-2.5 xl:grid-cols-[0.72fr_1.28fr]">
      <Panel className="p-3.5">
        <p className="text-[12px] font-medium">Сегменты</p>
        <p className="mt-1 text-[12px] text-[var(--text-muted)]">Готовые аудитории</p>
        <div className="mt-4 space-y-2">
          {[
            ["Постоянные гости", "482", "84%"],
            ["Давно не были", "126", "42%"],
            ["Новички", "94", "28%"],
          ].map(([name, count, width], index) => (
            <div className="rounded-[10px] bg-[var(--surface-soft)] p-2.5" key={name}>
              <div className="flex justify-between gap-3 text-[12px]"><span>{name}</span><strong className="font-medium">{count}</strong></div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--border)]">
                <motion.div animate={{ width }} className="h-full rounded-full bg-[var(--orange)]" initial={reduced ? false : { width: 0 }} transition={{ delay: reduced ? 0 : 0.08 + index * 0.08, duration: reduced ? 0 : 0.55, ease: EASE }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="border-b border-[var(--border)] px-3.5 py-3">
          <p className="text-[12px] font-medium">Карточки гостей</p>
          <p className="mt-1 text-[12px] text-[var(--text-muted)]">История визитов, предпочтения и бонусы</p>
        </div>
        <div className="divide-y divide-[var(--border-soft)]">
          {guests.map((guest, index) => (
            <motion.div animate={{ opacity: 1, x: 0 }} className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-3" initial={reduced ? false : { opacity: 0, x: 10 }} key={guest.name} transition={{ delay: reduced ? 0 : 0.08 + index * 0.08, duration: reduced ? 0 : 0.4, ease: EASE }}>
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--surface-muted)] text-[12px] font-medium text-[var(--accent-text)]">{guest.name.split(" ").map((part) => part[0]).join("")}</span>
                <div className="min-w-0"><p className="truncate text-[12px] font-medium">{guest.name}</p><p className="mt-1 text-[12px] text-[var(--text-muted)]">{guest.visits} · {guest.bonus}</p></div>
              </div>
              <span className="rounded-full bg-[var(--surface-selected)] px-2 py-1 text-[12px] text-[var(--text-olive)]">{guest.tag}</span>
            </motion.div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function CampaignsView() {
  const reduced = useMarketingReducedMotion();
  const channels = [
    { name: "Telegram", delivered: "1 284", width: "92%", color: "bg-[#4c9bd6]" },
    { name: "SMS", delivered: "846", width: "68%", color: "bg-[var(--orange)]" },
  ];

  return (
    <div className="grid gap-2.5 xl:grid-cols-[1.2fr_0.8fr]">
      <Panel className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-[12px] font-medium">Возвращаем любимых гостей</p><p className="mt-1 text-[12px] text-[var(--text-muted)]">Кампания «Давно не виделись»</p></div>
          <span className="rounded-full bg-[var(--surface-selected)] px-2.5 py-1 text-[12px] text-[var(--text-olive)]">Запущена</span>
        </div>
        <div className="mt-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface-soft)] p-3">
          <p className="text-[12px] uppercase tracking-[0.8px] text-[var(--text-muted)]">Сообщение</p>
          <p className="mt-2 text-[13px] leading-[1.6]">Анна, мы скучали. Загляните на ужин до воскресенья — десерт уже ждёт вас.</p>
        </div>
        <div className="mt-4 space-y-3">
          {channels.map((channel, index) => (
            <div className="grid grid-cols-[60px_1fr_42px] items-center gap-3" key={channel.name}>
              <span className="text-[12px]">{channel.name}</span>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]"><motion.div animate={{ width: channel.width }} className={`h-full rounded-full ${channel.color}`} initial={reduced ? false : { width: 0 }} transition={{ delay: reduced ? 0 : 0.12 + index * 0.12, duration: reduced ? 0 : 0.65, ease: EASE }} /></div>
              <span className="text-right text-[12px] text-[var(--text-body)]">{channel.delivered}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="grid grid-cols-2 gap-px overflow-hidden bg-[var(--border)]">
        {[
          ["Аудитория", "2 130"],
          ["Доставлено", "94%"],
          ["Вернулись", "186"],
          ["Выручка", "542 300 ₽"],
        ].map(([label, value], index) => (
          <motion.div animate={{ opacity: 1 }} className="bg-[var(--surface)]/90 p-4" initial={reduced ? false : { opacity: 0 }} key={label} transition={{ delay: reduced ? 0 : 0.06 + index * 0.07, duration: reduced ? 0 : 0.4, ease: EASE }}><p className="text-[12px] text-[var(--text-muted)]">{label}</p><p className="mt-2 text-[14px] font-medium">{value}</p></motion.div>
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
}: {
  activeView: ProductView;
}) {
  const reduced = useMarketingReducedMotion();

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-[var(--border-strong)] bg-[var(--surface-deep)] shadow-[0_32px_90px_rgba(50,47,47,0.18)]">
      <div className="relative flex min-h-11 items-center gap-3 border-b border-[var(--border)] px-3">
        <div className="flex gap-1.5" aria-hidden="true"><span className="size-2 rounded-full bg-[#c7c5be]" /><span className="size-2 rounded-full bg-[#d1cfc8]" /><span className="size-2 rounded-full bg-[#d9d7d0]" /></div>
        <p className="font-[family-name:var(--font-montserrat)] text-[12px] font-medium tracking-[0.15px]">Flex Spase</p>
        <span className="ml-auto hidden rounded-full bg-[var(--milk)] px-2 py-1 text-[12px] text-[var(--text-body)] sm:block">Пример интерфейса</span>
      </div>

      <div className="grid min-h-[620px] bg-[var(--surface)] lg:min-h-[560px] lg:grid-cols-[180px_1fr]">
        <aside className="hidden border-r border-[var(--border)] bg-[var(--surface)] px-2.5 py-4 lg:block">
          <div className="flex items-center gap-2 px-2">
            <span className="grid size-7 place-items-center rounded-[8px] bg-[var(--ink)] text-[12px] font-semibold text-white">P</span>
            <div><p className="text-[12px] font-medium">PosAdmin</p><p className="mt-0.5 text-[12px] text-[var(--text-muted)]">единое пространство</p></div>
          </div>
          <div className="mt-5 space-y-1">
            {SIDE_NAV.map((item, index) => (
              <div className={`flex h-8 items-center gap-2.5 rounded-[8px] px-2.5 text-[12px] ${index === 0 ? "bg-[var(--surface-muted)] font-medium text-[var(--accent-text)]" : "text-[var(--text-body)]"}`} key={item.label}>
                <Icon size={12} src={item.icon} />{item.label}
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[11px] bg-[var(--ink)] p-3 text-white">
            <p className="text-[12px] font-medium">ReZebra + FlexBonusb</p>
            <p className="mt-1.5 text-[12px] leading-[1.6] text-white/75">Скоро в одном окне</p>
          </div>
        </aside>

        <div className={`${styles.demoStage} min-w-0 p-3 sm:p-5`}>
          {PRODUCT_VIEWS.map((view) => {
            const active = view.id === activeView;
            return <div
              key={view.id}
              className={styles.demoSlide}
              aria-hidden={!active}
              inert={!active}
              style={{ visibility: active ? "visible" : "hidden" }}
            >
              <motion.div
                initial={false}
                animate={{ opacity: active ? 1 : 0, y: reduced || active ? 0 : 6 }}
                transition={{ duration: reduced ? 0 : 0.38, ease: EASE }}
              >
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[1.2px] text-[var(--accent-text)]">{view.eyebrow}</p>
                  <h3 className="mt-1.5 text-[17px] font-medium tracking-[-0.25px] sm:text-[20px]">{view.title}</h3>
                </div>
                <div className="mt-4 border-t border-[var(--border)] pt-4">
                  <ViewContent view={view.id} />
                </div>
              </motion.div>
            </div>;
          })}
        </div>
      </div>
    </div>
  );
}

const VIEW_DESCRIPTIONS: Record<ProductView, string> = {
  overview: "Показатели заведения, бронирования и активность гостей — без переключения между системами.",
  booking: "Наглядная схема зала, свободные столы и брони на выбранную дату.",
  guests: "История визитов и предпочтения помогают лучше понимать каждого гостя.",
  campaigns: "Сегменты гостей, персональные сообщения в Telegram и SMS, результаты рассылок.",
};

export function ProductsSection() {
  const reduced = useMarketingReducedMotion();
  const demoRef = useRef<HTMLDivElement>(null);
  const inView = useInView(demoRef, { amount: 0.3 });
  // Selecting any tab, including the active one, restarts its full dwell time.
  const [viewSelection, setViewSelection] = useState<{ id: ProductView }>({ id: "overview" });
  const activeView = viewSelection.id;
  const [visibleDocument, setVisibleDocument] = useState(true);
  const [callbackOpen, setCallbackOpen] = useState(false);

  useEffect(() => {
    const handleVisibility = () => setVisibleDocument(!document.hidden);
    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    if (!inView || reduced || !visibleDocument) return;
    const timer = window.setTimeout(() => {
      setViewSelection({ id: PRODUCT_VIEWS[(PRODUCT_VIEWS.findIndex((view) => view.id === viewSelection.id) + 1) % PRODUCT_VIEWS.length].id });
    }, 3_500);
    return () => window.clearTimeout(timer);
  }, [inView, reduced, visibleDocument, viewSelection]);

  return <section aria-labelledby="products-title" className={`${ui.section} ${styles.section} section-atmosphere-host`} id="products">
    <SectionAtmosphere />
    <div className={ui.shell}>
      <div className={ui.sectionHeader}>
        <SectionReveal distance={22}><p className={ui.eyebrow}>Сделано в Posadmin</p><h2 className={ui.heading} id="products-title">Больше внимания<br /><span className={ui.muted}>вашим гостям</span></h2></SectionReveal>
        <SectionReveal distance={18} delay={0.12}><p className={ui.lead}>Собственные продукты для ежедневной работы заведения. Управляйте бронированиями, развивайте лояльность и возвращайте гостей.</p></SectionReveal>
      </div>
      <div className={styles.productGrid}>
        <SectionReveal className={`${styles.productCard} ${styles.bookingCard}`} distance={24}>
          <div className={styles.cardTop}><span className={styles.wordmark}>ReZebra</span><span className={ui.badge}>Бронирование</span></div>
          <h3>Место для<br />каждого гостя</h3>
          <p>Брони, столы и загрузка зала в одной системе. Вся информация под рукой у вашей команды.</p>
          <div className={styles.bookingScene} aria-hidden="true">
            <div className={styles.bookingIllustration}>
              <div className={styles.miniToolbar}><span>Пятница · Основной зал</span><span>18:00 — 22:00</span></div>
              <div className={styles.tablePlan}>{["01", "02", "03", "04", "05", "06"].map((table, i) => <span key={table} className={i === 1 || i === 4 ? styles.reservedTable : ""}>{table}</span>)}</div>
            </div>
            <div className={styles.bookingToast}><span>✓</span><div>Бронь подтверждена<small>Стол 02 · 4 гостя · 19:30</small></div></div>
          </div>
          <div className={styles.cardBottom}><span>Залы · Бронирования · Визиты</span><a href="https://rezebra.ru/" target="_blank" rel="noreferrer" className={ui.textLink}>На сайт ReZebra <ArrowRight diagonal /></a></div>
        </SectionReveal>
        <SectionReveal className={`${styles.productCard} ${styles.loyaltyCard}`} delay={0.1} distance={24}>
          <div className={styles.cardTop}><span className={styles.wordmark}>FlexBonusb<span><StarIcon /></span></span><span className={ui.badge}>Лояльность</span></div>
          <h3>Первый визит<br />Начало истории</h3>
          <p>Бонусы, скидки и сертификаты, которые дают гостям повод вернуться. Предложения — с учётом их интересов.</p>
          <div className={styles.loyaltyIllustration} aria-hidden="true">
            <div className={styles.loyaltyPass}><div><span>FlexBonusb</span><span>Карта гостя</span></div><p>Приятно видеть<br />вас снова.</p><div><span>Ваш баланс</span><strong>2 400 <small>бонусов</small></strong></div></div>
            <div className={styles.bonusToast}><span><StarIcon /></span><div>+350 бонусов<small>За новый визит</small></div></div>
          </div>
          <div className={styles.cardBottom}><span>Бонусы · Скидки · Сертификаты</span><button type="button" className={ui.textLink} onClick={() => setCallbackOpen(true)}>Узнать о подключении <ArrowRight /></button></div>
        </SectionReveal>
      </div>
      <div className={styles.space}>
        <SectionReveal className={styles.spaceIntro} distance={22}><div><span className={ui.badge}>Следующий шаг · в разработке</span><h3>Два продукта<br />Одно пространство</h3></div><p className={ui.lead}>Объединяем ReZebra и FlexBonusb, добавляем отчёты по гостям и рассылки через Telegram и SMS. Посмотрите, каким может быть ваш рабочий день.</p></SectionReveal>
        <SectionReveal distance={18}>
        <div ref={demoRef}>
          <div className={styles.demoControls}>
            <div className={styles.viewTabs} role="group" aria-label="Примеры разделов программы">{PRODUCT_VIEWS.map((view) => <button type="button" aria-pressed={activeView === view.id} key={view.id} onClick={() => setViewSelection({ id: view.id })}><TabIcon src={view.icon} />{view.label}</button>)}</div>
          </div>
          <div className={styles.demoDescription}>
            {PRODUCT_VIEWS.map((view) => <p key={view.id} aria-hidden={activeView !== view.id} inert={activeView !== view.id} style={{ visibility: activeView === view.id ? "visible" : "hidden" }}>{VIEW_DESCRIPTIONS[view.id]}</p>)}
          </div>
          <div className={styles.dashboard}><ProductDashboard activeView={activeView} /></div>
          <p className={styles.caption}>Концепция общего пространства. Интерфейс и данные показаны для примера. Финальный интерфейс может отличаться. Скоро запустим демо.</p>
        </div>
        </SectionReveal>
      </div>
    </div>
    <CallbackDialog onClose={() => setCallbackOpen(false)} open={callbackOpen} />
  </section>;
}
