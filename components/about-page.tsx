"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CallbackDialog } from "@/components/callback-dialog";
import { FullPageParallax } from "@/components/full-page-parallax";
import { SiteHeader } from "@/components/site-header";
import { SiteLogoMark } from "@/components/site-logo-mark";

const EASE = [0.22, 1, 0.36, 1] as const;

const teamNodes = [
  { label: "Менеджер", className: "left-[4%] top-[16%] sm:left-[7%]" },
  { label: "Инженеры", className: "right-[3%] top-[16%] sm:right-[6%]" },
  { label: "Поддержка", className: "left-[1%] top-[55%] sm:left-[4%]" },
  { label: "ККТ и ГИС", className: "right-[1%] top-[55%] sm:right-[4%]" },
  {
    label: "Разработка",
    className: "bottom-[6%] left-1/2 -translate-x-1/2",
  },
] as const;

const outcomes = [
  {
    number: "01",
    title: "Запускаем",
    text: "Подбираем решения и оборудование, рассчитываем сроки, координируем монтаж и пусконаладку до готовности объекта.",
  },
  {
    number: "02",
    title: "Сопровождаем",
    text: "Поддерживаем программный и технический контур: r_keeper, ККТ, сети, рабочие места, ГИС и электронный документооборот.",
  },
  {
    number: "03",
    title: "Развиваем",
    text: "Находим причины повторяющихся проблем, создаём интеграции и дорабатываем системы под реальные процессы заведения.",
  },
] as const;

const processSteps = [
  {
    number: "01",
    title: "Вы описываете задачу",
    text: "В одном обращении — без поиска нужного отдела и повторного объяснения ситуации.",
  },
  {
    number: "02",
    title: "Менеджер собирает команду",
    text: "Подключает специалистов тех направлений, которые действительно нужны для решения.",
  },
  {
    number: "03",
    title: "Мы ведём задачу целиком",
    text: "Координируем участников, контролируем сроки и анализируем последствия решений.",
  },
  {
    number: "04",
    title: "Вы получаете результат",
    text: "Один ответственный контур вместо нескольких несвязанных подрядчиков.",
  },
] as const;

const principles = [
  {
    number: "01",
    title: "Ответственность",
    text: "Решаем задачи комплексно, отвечаем за качество и сроки и заранее оцениваем последствия каждого решения.",
  },
  {
    number: "02",
    title: "Репутация",
    text: "Дорожим доверием клиентов, честно говорим о ситуации и не принимаем решений, за которые придётся оправдываться.",
  },
  {
    number: "03",
    title: "Решение вместо оправданий",
    text: "Не ограничиваемся устранением симптомов: ищем первопричину и предлагаем рабочий вариант действий.",
  },
  {
    number: "04",
    title: "Развитие и инициатива",
    text: "Постоянно улучшаем навыки, инструменты и внутренние процессы, если это делает работу клиента стабильнее.",
  },
  {
    number: "05",
    title: "Самостоятельность и команда",
    text: "Берём задачу в работу сами, а когда нужны дополнительные компетенции — сразу подключаем опытных коллег.",
  },
] as const;

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      transition={{ delay, duration: 0.8, ease: EASE }}
      viewport={{ amount: 0.18, once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 16 16">
      <path
        d="M3.5 8H12.5M8.8 4.3L12.5 8L8.8 11.7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function TeamNode({
  className,
  index,
  label,
}: {
  className: string;
  index: number;
  label: string;
}) {
  return (
    <motion.div
      animate={{ y: [0, index % 2 === 0 ? -6 : 6, 0] }}
      className={`absolute z-10 flex min-h-10 items-center rounded-full border border-[#f5f5ed]/15 bg-[#f5f5ed]/10 px-3 text-[10px] font-medium whitespace-nowrap text-[#f5f5ed] shadow-[0_14px_40px_rgba(0,0,0,0.24)] backdrop-blur-md sm:min-h-11 sm:px-4 sm:text-[12px] ${className}`}
      initial={{ opacity: 0, scale: 0.84 }}
      transition={{
        delay: 0.75 + index * 0.12,
        duration: 4 + index * 0.35,
        ease: "easeInOut",
        opacity: { delay: 0.55 + index * 0.1, duration: 0.55 },
        repeat: Infinity,
        scale: { delay: 0.55 + index * 0.1, duration: 0.55 },
      }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
    >
      <span className="mr-2 size-1.5 rounded-full bg-[#e66026] shadow-[0_0_10px_rgba(230,96,38,0.9)]" />
      {label}
    </motion.div>
  );
}

function TeamConstellation() {
  const paths = [
    "M300 270 C245 235 190 180 105 115",
    "M300 270 C360 228 420 175 500 115",
    "M300 270 C235 285 160 315 78 345",
    "M300 270 C370 285 445 315 526 345",
    "M300 270 C300 350 300 430 300 505",
  ];

  return (
    <div className="relative mx-auto aspect-[1.04] w-full max-w-[610px] overflow-hidden rounded-[34px] border border-[#f5f5ed]/10 bg-[#f5f5ed]/[0.035] shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(230,96,38,0.17),transparent_25%),radial-gradient(circle_at_50%_50%,rgba(245,245,237,0.06),transparent_58%)]" />
      <div className="absolute left-1/2 top-1/2 size-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f5f5ed]/[0.06]" />
      <div className="absolute left-1/2 top-1/2 size-[48%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f5f5ed]/[0.08]" />

      <svg
        aria-hidden="true"
        className="absolute inset-0 size-full"
        preserveAspectRatio="none"
        viewBox="0 0 600 560"
      >
        <defs>
          <linearGradient id="about-line" x1="0" x2="1">
            <stop offset="0" stopColor="#f5f5ed" stopOpacity="0.08" />
            <stop offset="0.52" stopColor="#e66026" stopOpacity="0.68" />
            <stop offset="1" stopColor="#f5f5ed" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient
            id="about-line-vertical"
            gradientUnits="userSpaceOnUse"
            x1="300"
            x2="300"
            y1="270"
            y2="505"
          >
            <stop offset="0" stopColor="#e66026" stopOpacity="0.68" />
            <stop offset="0.68" stopColor="#e66026" stopOpacity="0.42" />
            <stop offset="1" stopColor="#f5f5ed" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        {paths.map((path, index) => (
          <g key={path}>
            <motion.path
              d={path}
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              stroke={
                index === paths.length - 1
                  ? "url(#about-line-vertical)"
                  : "url(#about-line)"
              }
              strokeDasharray="7 8"
              strokeWidth="1.2"
              transition={{ delay: 0.3 + index * 0.09, duration: 1.25, ease: EASE }}
              viewport={{ once: true }}
              whileInView={{ pathLength: 1, opacity: 1 }}
            />
            <motion.circle
              animate={{ opacity: [0, 1, 0] }}
              fill="#f5f5ed"
              r="2.4"
              transition={{
                delay: index * 0.5,
                duration: 2.4,
                ease: "linear",
                repeat: Infinity,
              }}
            >
              <animateMotion dur={`${3.4 + index * 0.35}s`} path={path} repeatCount="indefinite" />
            </motion.circle>
          </g>
        ))}
      </svg>

      <motion.div
        animate={{ scale: [1, 1.035, 1] }}
        className="absolute left-1/2 top-1/2 z-20 flex size-[132px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-[#f5f5ed]/15 bg-[#171711]/90 shadow-[0_0_80px_rgba(230,96,38,0.16)] backdrop-blur-xl sm:size-[164px]"
        initial={{ opacity: 0, scale: 0.82 }}
        transition={{
          duration: 4.4,
          ease: "easeInOut",
          opacity: { delay: 0.15, duration: 0.65 },
          repeat: Infinity,
          scale: { duration: 4.4, ease: "easeInOut", repeat: Infinity },
        }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <SiteLogoMark className="h-auto w-[78px] text-[#f5f5ed] sm:w-[94px]" />
        <span className="mt-2 text-[9px] tracking-[0.16em] text-[#f5f5ed]/45 uppercase sm:text-[10px]">
          единая команда
        </span>
      </motion.div>

      {teamNodes.map((node, index) => (
        <TeamNode key={node.label} {...node} index={index} />
      ))}
    </div>
  );
}

export function AboutPage() {
  const [callbackOpen, setCallbackOpen] = useState(false);

  return (
    <FullPageParallax header={<SiteHeader page="about" />}>
      <section
        className="relative min-h-[820px] overflow-hidden rounded-b-[44px] bg-[#0f0f0a] font-[family-name:var(--font-inter)] text-[#f5f5ed] sm:rounded-b-[56px]"
        data-about-hero
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-[16%] top-[42%] h-[540px] w-[540px] rounded-full bg-[#e66026]/10 blur-[120px]" />
          <div className="absolute -right-[12%] -top-[12%] h-[620px] w-[620px] rounded-full bg-[#f5f5ed]/[0.055] blur-[130px]" />
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(245,245,237,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(245,245,237,.18)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_92%)]" />
        </div>

        <div className="relative mx-auto grid min-h-[820px] w-full max-w-[1440px] items-center gap-14 px-4 pb-20 pt-32 md:px-10 md:pt-36 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16 xl:px-[120px]">
          <div className="max-w-[600px]">
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] font-medium tracking-[0.18em] text-[#e66026] uppercase"
              initial={{ opacity: 0, y: 12 }}
              transition={{ delay: 0.22, duration: 0.65, ease: EASE }}
            >
              Posadmin · о компании
            </motion.p>
            <motion.h1
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 text-[44px] font-medium leading-[0.98] tracking-[0.3px] sm:text-[62px] sm:tracking-[0.6px] lg:text-[72px] lg:tracking-[1.28px]"
              initial={{ opacity: 0, y: 34 }}
              transition={{ delay: 0.32, duration: 1, ease: EASE }}
            >
              Автоматизация,
              <span className="block text-[#f5f5ed]/55">за которой стоит команда</span>
            </motion.h1>
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="mt-7 max-w-[570px] text-[16px] leading-[26px] tracking-[0.1px] text-[#f5f5ed]/68 sm:text-[18px] sm:leading-[29px] sm:tracking-[0.15px]"
              initial={{ opacity: 0, y: 24 }}
              transition={{ delay: 0.48, duration: 0.8, ease: EASE }}
            >
              Объединяем специалистов по программному обеспечению, оборудованию,
              кассам, государственным системам и интеграциям. Вам не приходится
              координировать нескольких подрядчиков — мы берём эту работу на себя.
            </motion.p>
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mt-9 flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.62, duration: 0.7, ease: EASE }}
            >
              <button
                className="flex min-h-12 items-center gap-3 rounded-full bg-[#e66026] px-7 text-[14px] font-medium text-white transition-transform hover:-translate-y-0.5 hover:bg-[#cf501c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f5ed]"
                onClick={() => setCallbackOpen(true)}
                type="button"
              >
                Обсудить проект
                <ArrowIcon />
              </button>
              <a
                className="hero-glass-btn flex min-h-12 items-center rounded-full px-7 text-[14px] font-medium text-[#f5f5ed]"
                href="#approach"
              >
                Как мы работаем
              </a>
            </motion.div>
          </div>

          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            initial={{ opacity: 0, scale: 0.96, y: 26 }}
            transition={{ delay: 0.38, duration: 1.05, ease: EASE }}
          >
            <TeamConstellation />
          </motion.div>
        </div>
      </section>

      <section
        aria-label="Компания в цифрах"
        className="flex min-h-svh items-center bg-[#f5f5ed] px-4 py-20 font-[family-name:var(--font-inter)] text-[#322f2f] md:px-10 md:py-24 xl:px-[120px]"
      >
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="grid gap-px overflow-hidden rounded-[30px] border border-[#d8d7cf] bg-[#d8d7cf] sm:grid-cols-3">
            {[
              ["Более 15 лет", "на рынке автоматизации"],
              ["1 000+", "запущенных объектов"],
              ["До 15 минут", "первичное реагирование"],
            ].map(([value, label], index) => (
              <motion.div
                className="bg-[#f5f5ed] px-7 py-9 sm:min-h-[190px] sm:px-8 sm:py-10"
                initial={{ opacity: 0, y: 22 }}
                key={value}
                transition={{ delay: index * 0.1, duration: 0.7, ease: EASE }}
                viewport={{ amount: 0.5, once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <p className="text-[38px] font-medium leading-none tracking-[-0.16px] sm:text-[44px]">
                  {value}
                </p>
                <p className="mt-4 text-[14px] leading-5 tracking-[0.1px] text-[#646565]">
                  {label}
                </p>
              </motion.div>
            ))}
          </div>

          <Reveal className="mt-14 grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <p className="pt-2 text-[11px] font-medium tracking-[0.18em] text-[#e66026] uppercase">
              Чем мы занимаемся
            </p>
            <div>
              <h2 className="max-w-[850px] text-[36px] font-medium leading-[1.06] tracking-[-0.16px] sm:text-[52px]">
                Весь контур автоматизации — в одной команде
              </h2>
              <p className="mt-6 max-w-[770px] text-[16px] leading-[27px] tracking-[0.1px] text-[#646565] sm:text-[18px] sm:leading-[30px] sm:tracking-[0.15px]">
                От первого расчёта и установки оборудования до ежедневной
                технической поддержки и разработки индивидуальных решений. Один
                менеджер сопровождает проект и координирует нужных специалистов.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="overflow-x-clip bg-[#f5f5ed] font-[family-name:var(--font-inter)] text-[#322f2f]">
        <section className="px-4 py-16 md:px-10 md:py-24 xl:px-[120px]">
          <div className="mx-auto w-full max-w-[1200px]">
          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {outcomes.map((outcome, index) => (
              <motion.article
                className="group min-h-[320px] rounded-[28px] border border-[#d8d7cf] bg-white/45 p-7 transition-colors hover:bg-white/75 sm:p-8"
                initial={{ opacity: 0, y: 34 }}
                key={outcome.title}
                transition={{ delay: index * 0.11, duration: 0.75, ease: EASE }}
                viewport={{ amount: 0.25, once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-medium tracking-[0.15em] text-[#969691]">
                    {outcome.number}
                  </span>
                  <motion.span
                    className="size-2 rounded-full bg-[#e66026]"
                    transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity }}
                    whileInView={{ boxShadow: ["0 0 0 0 rgba(230,96,38,.35)", "0 0 0 12px rgba(230,96,38,0)"] }}
                  />
                </div>
                <h3 className="mt-24 text-[30px] font-medium tracking-[-0.16px]">
                  {outcome.title}
                </h3>
                <p className="mt-4 text-[14px] leading-[23px] tracking-[0.1px] text-[#646565]">
                  {outcome.text}
                </p>
              </motion.article>
            ))}
          </div>
          </div>
        </section>

      <section className="px-4 py-16 md:px-10 md:py-24 xl:px-[120px]" id="approach">
        <div className="relative mx-auto w-full max-w-[1200px] overflow-hidden rounded-[38px] bg-[#0f0f0a] px-6 py-14 text-[#f5f5ed] sm:px-10 sm:py-16 lg:px-14 lg:py-20">
          <div className="pointer-events-none absolute -right-32 top-0 size-[440px] rounded-full bg-[#e66026]/12 blur-[100px]" />
          <Reveal className="relative max-w-[770px]">
            <p className="text-[11px] font-medium tracking-[0.18em] text-[#e66026] uppercase">
              Один чат · одна команда
            </p>
            <h2 className="mt-5 text-[36px] font-medium leading-[1.06] tracking-[-0.16px] sm:text-[52px]">
              Вы ставите задачу один раз. Дальше координация — на нас.
            </h2>
          </Reveal>

          <div className="relative mt-14 grid gap-4 lg:grid-cols-4">
            <motion.div
              className="absolute left-[7%] right-[7%] top-[23px] hidden h-px origin-left bg-gradient-to-r from-[#e66026] via-[#f5f5ed]/30 to-[#e66026] lg:block"
              initial={{ scaleX: 0 }}
              transition={{ delay: 0.2, duration: 1.4, ease: EASE }}
              viewport={{ amount: 0.8, once: true }}
              whileInView={{ scaleX: 1 }}
            />
            {processSteps.map((step, index) => (
              <motion.article
                className="relative rounded-[24px] border border-[#f5f5ed]/10 bg-[#f5f5ed]/[0.055] p-6 backdrop-blur-sm"
                initial={{ opacity: 0, y: 28 }}
                key={step.number}
                transition={{ delay: 0.28 + index * 0.12, duration: 0.7, ease: EASE }}
                viewport={{ amount: 0.25, once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <span className="relative z-10 flex size-12 items-center justify-center rounded-full border border-[#e66026]/40 bg-[#171711] text-[11px] font-medium text-[#e66026]">
                  {step.number}
                </span>
                <h3 className="mt-9 text-[20px] font-medium leading-[26px] tracking-[0.1px]">
                  {step.title}
                </h3>
                <p className="mt-3 text-[13px] leading-[21px] tracking-[0.1px] text-[#f5f5ed]/55">
                  {step.text}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 md:px-10 md:py-28 xl:px-[120px]">
        <div className="mx-auto w-full max-w-[1200px]">
          <Reveal className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <p className="pt-2 text-[11px] font-medium tracking-[0.18em] text-[#e66026] uppercase">
              Философия компании
            </p>
            <div>
              <h2 className="max-w-[850px] text-[36px] font-medium leading-[1.06] tracking-[-0.16px] sm:text-[52px]">
                Ищем решение, а не оправдание
              </h2>
              <p className="mt-6 max-w-[780px] text-[16px] leading-[27px] tracking-[0.1px] text-[#646565] sm:text-[18px] sm:leading-[30px] sm:tracking-[0.15px]">
                Мы работаем на результат, дорожим репутацией и постоянно
                развиваемся. Для клиента это означает вдумчивые решения,
                качественные инструменты и команду, которая не перекладывает
                ответственность.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 border-t border-[#d8d7cf]">
            {principles.map((principle, index) => (
              <motion.article
                className="grid gap-4 border-b border-[#d8d7cf] py-7 sm:grid-cols-[72px_0.7fr_1.3fr] sm:items-start sm:gap-8 sm:py-9"
                initial={{ opacity: 0, x: index % 2 === 0 ? -22 : 22 }}
                key={principle.title}
                transition={{ duration: 0.7, ease: EASE }}
                viewport={{ amount: 0.45, once: true }}
                whileInView={{ opacity: 1, x: 0 }}
              >
                <span className="text-[11px] font-medium tracking-[0.15em] text-[#969691]">
                  {principle.number}
                </span>
                <h3 className="text-[22px] font-medium tracking-[-0.16px] sm:text-[25px]">
                  {principle.title}
                </h3>
                <p className="max-w-[600px] text-[14px] leading-[23px] tracking-[0.1px] text-[#646565] sm:text-[15px] sm:leading-[25px] sm:tracking-[0.15px]">
                  {principle.text}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-6 pt-8 md:px-10 md:pb-10 xl:px-[120px]" id="contact">
        <div className="relative mx-auto w-full max-w-[1200px] overflow-hidden rounded-[38px] bg-[#e66026] px-6 py-12 text-white sm:px-10 sm:py-16 lg:px-14">
          <div className="pointer-events-none absolute -right-24 -top-48 size-[520px] rounded-full border border-white/20" />
          <div className="pointer-events-none absolute -right-8 -top-32 size-[360px] rounded-full border border-white/20" />
          <div className="relative grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <Reveal>
              <p className="text-[11px] font-medium tracking-[0.18em] text-white/65 uppercase">
                Давайте обсудим задачу
              </p>
              <h2 className="mt-5 max-w-[760px] text-[40px] font-medium leading-[1.02] tracking-[-0.16px] sm:text-[58px]">
                Соберём команду под ваш проект
              </h2>
              <p className="mt-5 max-w-[630px] text-[15px] leading-[25px] tracking-[0.1px] text-white/75 sm:text-[17px] sm:leading-[28px] sm:tracking-[0.15px]">
                Оставьте заявку — менеджер уточнит задачу и подключит нужных
                специалистов. По будням с 10:00 до 19:00.
              </p>
            </Reveal>

            <Reveal className="flex flex-col items-start lg:items-end" delay={0.12}>
              <a
                className="text-[25px] font-medium tracking-[0.1px] sm:text-[30px]"
                href="tel:88006004036"
              >
                8 (800) 600-40-36
              </a>
              <a
                className="mt-2 text-[14px] text-white/70 transition-colors hover:text-white"
                href="https://t.me/posadmin"
                rel="noreferrer"
                target="_blank"
              >
                Telegram · @posadmin
              </a>
              <button
                className="mt-7 flex min-h-12 items-center gap-3 rounded-full bg-white px-7 text-[14px] font-medium text-[#322f2f] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                onClick={() => setCallbackOpen(true)}
                type="button"
              >
                Оставить заявку
                <ArrowIcon />
              </button>
            </Reveal>
          </div>
        </div>
      </section>

      <footer className="px-4 py-8 md:px-10 xl:px-[120px]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 border-t border-[#d8d7cf] pt-7 text-[#646565] sm:flex-row sm:items-center sm:justify-between">
          <Link aria-label="Posadmin — на главную" href="/">
            <SiteLogoMark className="h-auto w-[95px] text-[#322f2f]" />
          </Link>
          <p className="text-[12px]">© 2026 Posadmin. Автоматизация ресторанного бизнеса.</p>
        </div>
      </footer>

      <CallbackDialog onClose={() => setCallbackOpen(false)} open={callbackOpen} />
      </div>
    </FullPageParallax>
  );
}
