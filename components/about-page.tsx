"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CallbackDialog } from "@/components/callback-dialog";
import { SiteHeader } from "@/components/site-header";
import { SiteLogoMark } from "@/components/site-logo-mark";
import styles from "./about-page.module.css";

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
    label: "Запуск объекта",
    title: "Запускаем",
    text: "Подбираем решения и оборудование, рассчитываем сроки, координируем монтаж и пусконаладку до готовности объекта.",
  },
  {
    number: "02",
    label: "Единое окно",
    title: "Сопровождаем",
    text: "Поддерживаем программный и технический контур: r_keeper, ККТ, сети, рабочие места, ГИС и электронный документооборот.",
  },
  {
    number: "03",
    label: "Интеграции",
    title: "Развиваем",
    text: "Находим причины повторяющихся проблем, создаём интеграции и дорабатываем системы под реальные процессы заведения.",
  },
] as const;

const processSteps = [
  {
    number: "01",
    label: "Обращение",
    title: "Вы описываете задачу",
    text: "В одном обращении — без поиска нужного отдела и повторного объяснения ситуации.",
  },
  {
    number: "02",
    label: "Подбор команды",
    title: "Менеджер собирает команду",
    text: "Подключает специалистов тех направлений, которые действительно нужны для решения.",
  },
  {
    number: "03",
    label: "Контроль",
    title: "Мы ведём задачу целиком",
    text: "Координируем участников, контролируем сроки и анализируем последствия решений.",
  },
  {
    number: "04",
    label: "Результат",
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

function LaunchPreview() {
  return (
    <div className="absolute right-5 -bottom-9 left-5 h-[148px] transform-gpu overflow-hidden rounded-t-[18px] border border-b-0 border-[#d8d7cf] bg-[#fbfbf7]/92 p-4 shadow-[0_14px_40px_rgba(50,47,47,0.08)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-focus:-translate-y-9 group-hover:-translate-y-9 sm:right-6 sm:left-6">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-medium tracking-[0.14em] text-[#969691] uppercase">
          Готовность объекта
        </span>
        <span className="rounded-full bg-[#e66026]/10 px-2.5 py-1 text-[9px] font-medium text-[#b64719]">
          в работе
        </span>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#deded5]">
        <motion.div
          className="h-full rounded-full bg-[#e66026]"
          initial={{ width: "18%" }}
          transition={{ delay: 0.3, duration: 1.2, ease: EASE }}
          viewport={{ amount: 0.6, once: true }}
          whileInView={{ width: "78%" }}
        />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-[9px] text-[#646565]">
        <span>Расчёт</span>
        <span className="text-center">Монтаж</span>
        <span className="text-right">Запуск</span>
      </div>
      <div className="absolute inset-x-4 bottom-3 flex items-center justify-between border-t border-[#e3e2da] pt-2.5 text-[9px]">
        <span className="text-[#969691]">Следующий этап</span>
        <span className="font-medium text-[#322f2f]">Пусконаладка →</span>
      </div>
    </div>
  );
}

function SupportPreview() {
  const systems = ["r_keeper", "ККТ и ОФД", "Сеть и рабочие места"];

  return (
    <div className="absolute right-5 -bottom-9 left-5 h-[162px] transform-gpu overflow-hidden rounded-t-[18px] border border-b-0 border-[#d8d7cf] bg-[#fbfbf7]/92 px-4 pt-3 shadow-[0_14px_40px_rgba(50,47,47,0.08)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-focus:-translate-y-9 group-hover:-translate-y-9 sm:right-6 sm:left-6">
      <div className="flex items-center justify-between border-b border-[#e3e2da] pb-2.5">
        <span className="text-[10px] font-medium">Состояние систем</span>
        <span className="flex items-center gap-1.5 text-[9px] text-[#5e6d50]">
          <motion.span
            animate={{ opacity: [0.45, 1, 0.45] }}
            className="size-1.5 rounded-full bg-[#799462]"
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          стабильно
        </span>
      </div>
      <div className="divide-y divide-[#ebeae3]">
        {systems.map((system, index) => (
          <div className="flex items-center justify-between py-2" key={system}>
            <span className="text-[9px] text-[#646565]">{system}</span>
            <span className="flex items-center gap-1.5 text-[9px] text-[#969691]">
              {index === 1 ? "проверено 2 мин назад" : "в сети"}
              <span className="size-1.5 rounded-full bg-[#799462]" />
            </span>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-4 bottom-3 flex items-center justify-between border-t border-[#e3e2da] pt-2.5 text-[9px]">
        <span className="text-[#969691]">Мониторинг</span>
        <span className="font-medium text-[#5e6d50]">24/7 без пауз</span>
      </div>
    </div>
  );
}

function DevelopmentPreview() {
  const nodes = ["CRM", "Склад", "r_keeper", "Доставка"];

  return (
    <div className="absolute right-5 -bottom-9 left-5 h-[154px] transform-gpu overflow-hidden rounded-t-[18px] border border-b-0 border-[#d8d7cf] bg-[#fbfbf7]/92 shadow-[0_14px_40px_rgba(50,47,47,0.08)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-focus:-translate-y-9 group-hover:-translate-y-9 sm:right-6 sm:left-6">
      <svg
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[118px] w-full"
        preserveAspectRatio="none"
        viewBox="0 0 320 118"
      >
        <path
          d="M55 34 C92 34 102 59 138 59 M182 59 C218 59 229 34 266 34 M160 76 V101"
          fill="none"
          stroke="#c9c8bf"
          strokeDasharray="4 5"
          strokeWidth="1.2"
        />
        <motion.path
          d="M55 34 C92 34 102 59 138 59 M182 59 C218 59 229 34 266 34"
          fill="none"
          initial={{ pathLength: 0 }}
          stroke="#e66026"
          strokeWidth="1.5"
          transition={{ delay: 0.2, duration: 1.2, ease: EASE }}
          viewport={{ amount: 0.7, once: true }}
          whileInView={{ pathLength: 1 }}
        />
      </svg>
      <div className="absolute inset-x-4 top-4 flex items-start justify-between">
        {nodes.slice(0, 2).map((node) => (
          <span
            className="rounded-full border border-[#d8d7cf] bg-white px-2.5 py-1.5 text-[9px] font-medium"
            key={node}
          >
            {node}
          </span>
        ))}
      </div>
      <div className="absolute top-[43px] left-1/2 -translate-x-1/2 rounded-full bg-[#322f2f] px-3 py-2 text-[9px] font-medium text-[#f5f5ed] shadow-lg">
        {nodes[2]}
      </div>
      <div className="absolute top-[82px] left-1/2 -translate-x-1/2 rounded-full border border-[#e66026]/25 bg-[#fff4ed] px-2.5 py-1.5 text-[9px] font-medium text-[#b64719]">
        {nodes[3]}
      </div>
      <div className="absolute inset-x-4 bottom-3 flex items-center justify-between border-t border-[#e3e2da] pt-2.5 text-[9px]">
        <span className="text-[#969691]">Связано систем</span>
        <span className="font-medium text-[#322f2f]">4 · единый контур</span>
      </div>
    </div>
  );
}

function AutomationPreview({ index }: { index: number }) {
  if (index === 0) return <LaunchPreview />;
  if (index === 1) return <SupportPreview />;
  return <DevelopmentPreview />;
}

function ProcessPreview({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="absolute right-6 -bottom-9 left-6 h-[172px] transform-gpu overflow-hidden rounded-t-[20px] border border-b-0 border-[#d8d7cf] bg-[#fbfbf7] p-4 shadow-[0_18px_45px_rgba(15,15,10,0.09)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-focus:-translate-y-9 group-hover:-translate-y-9 sm:right-7 sm:left-7">
        <div className="flex items-center justify-between border-b border-[#e6e5de] pb-3">
          <span className="text-[9px] font-medium tracking-[0.13em] text-[#969691] uppercase">
            Новое обращение
          </span>
          <span className="flex items-center gap-1.5 text-[9px] text-[#b64719]">
            <span className="size-1.5 rounded-full bg-[#e66026]" />
            принято
          </span>
        </div>
        <div className="mt-3 max-w-[82%] rounded-[13px] rounded-tl-[4px] bg-[#eeeee7] px-3.5 py-2.5 text-[10px] leading-[15px] text-[#555552]">
          Нужно подготовить новую кассовую зону к открытию в пятницу.
        </div>
        <div className="absolute inset-x-4 bottom-3 flex items-center justify-between border-t border-[#e3e2da] pt-2.5 text-[9px]">
          <span className="text-[#969691]">Канал связи</span>
          <span className="font-medium text-[#322f2f]">один рабочий чат</span>
        </div>
      </div>
    );
  }

  if (index === 1) {
    const members = [
      ["АМ", "Аккаунт-менеджер", "координация"],
      ["ИК", "Инженер ККТ", "подключён"],
      ["РП", "Специалист r_keeper", "подключён"],
    ];

    return (
      <div className="absolute right-6 -bottom-9 left-6 h-[178px] transform-gpu overflow-hidden rounded-t-[20px] border border-b-0 border-[#d8d7cf] bg-[#fbfbf7] px-4 pt-3 shadow-[0_18px_45px_rgba(15,15,10,0.09)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-focus:-translate-y-9 group-hover:-translate-y-9 sm:right-7 sm:left-7">
        <div className="flex items-center justify-between pb-2">
          <span className="text-[9px] font-medium tracking-[0.13em] text-[#969691] uppercase">
            Команда задачи
          </span>
          <span className="rounded-full bg-[#ecece5] px-2 py-1 text-[8px] text-[#646565]">
            3 специалиста
          </span>
        </div>
        <div className="divide-y divide-[#e9e8e1]">
          {members.map(([initials, role, status], memberIndex) => (
            <div className="flex items-center gap-2.5 py-1.5" key={role}>
              <span
                className={`flex size-6 items-center justify-center rounded-full text-[7px] font-semibold ${
                  memberIndex === 0
                    ? "bg-[#322f2f] text-white"
                    : "bg-[#e66026]/12 text-[#b64719]"
                }`}
              >
                {initials}
              </span>
              <span className="min-w-0 flex-1 truncate text-[9px] font-medium text-[#4f4e4b]">
                {role}
              </span>
              <span className="text-[8px] text-[#969691]">{status}</span>
            </div>
          ))}
        </div>
        <div className="absolute inset-x-4 bottom-3 flex items-center justify-between border-t border-[#e3e2da] pt-2.5 text-[9px]">
          <span className="text-[#969691]">Ответственный</span>
          <span className="font-medium text-[#322f2f]">один менеджер</span>
        </div>
      </div>
    );
  }

  if (index === 2) {
    const stages = ["Диагностика", "Решение", "Проверка"];

    return (
      <div className="absolute right-6 -bottom-9 left-6 h-[172px] transform-gpu overflow-hidden rounded-t-[20px] border border-b-0 border-[#d8d7cf] bg-[#fbfbf7] p-4 shadow-[0_18px_45px_rgba(15,15,10,0.09)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-focus:-translate-y-9 group-hover:-translate-y-9 sm:right-7 sm:left-7">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-medium tracking-[0.13em] text-[#969691] uppercase">
            Ход работ
          </span>
          <span className="text-[9px] font-medium text-[#b64719]">67%</span>
        </div>
        <div className="relative mt-5 flex justify-between before:absolute before:top-[7px] before:right-3 before:left-3 before:h-px before:bg-[#d8d7cf]">
          {stages.map((stage, stageIndex) => (
            <div className="relative z-10 flex w-[31%] flex-col items-center" key={stage}>
              <motion.span
                className={`size-[15px] rounded-full border-[4px] border-[#fbfbf7] ${
                  stageIndex < 2 ? "bg-[#e66026]" : "bg-[#cfcec6]"
                }`}
                initial={{ scale: 0.6 }}
                transition={{ delay: 0.25 + stageIndex * 0.13, duration: 0.5, ease: EASE }}
                viewport={{ amount: 0.7, once: true }}
                whileInView={{ scale: 1 }}
              />
              <span className="mt-2 text-center text-[8px] leading-3 text-[#646565]">
                {stage}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#e2e1da]">
          <motion.div
            className="h-full rounded-full bg-[#e66026]"
            initial={{ width: "18%" }}
            transition={{ delay: 0.3, duration: 1.1, ease: EASE }}
            viewport={{ amount: 0.7, once: true }}
            whileInView={{ width: "67%" }}
          />
        </div>
        <div className="absolute inset-x-4 bottom-3 flex items-center justify-between border-t border-[#e3e2da] pt-2.5 text-[9px]">
          <span className="text-[#969691]">Контроль</span>
          <span className="font-medium text-[#322f2f]">до полной готовности</span>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute right-6 -bottom-9 left-6 h-[172px] transform-gpu overflow-hidden rounded-t-[20px] border border-b-0 border-[#d8d7cf] bg-[#fbfbf7] px-5 pt-5 shadow-[0_18px_45px_rgba(15,15,10,0.09)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-focus:-translate-y-9 group-hover:-translate-y-9 sm:right-7 sm:left-7">
      <div className="flex items-center gap-4">
        <motion.span
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#718b5e] text-white"
          initial={{ scale: 0.72, rotate: -12 }}
          transition={{ delay: 0.25, duration: 0.65, ease: EASE }}
          viewport={{ amount: 0.7, once: true }}
          whileInView={{ scale: 1, rotate: 0 }}
        >
          <svg aria-hidden="true" className="size-5" viewBox="0 0 20 20">
            <path
              d="m5.2 10.2 3.1 3.1 6.6-7"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </motion.span>
        <div>
          <p className="text-[9px] font-medium tracking-[0.13em] text-[#718b5e] uppercase">
            Задача закрыта
          </p>
          <p className="mt-1.5 text-[15px] font-medium leading-5 text-[#322f2f]">
            Всё готово к работе
          </p>
          <p className="mt-1 text-[9px] leading-[14px] text-[#777772]">
            Результат и отчёт — в одном диалоге
          </p>
        </div>
      </div>
      <div className="absolute inset-x-5 bottom-3 flex items-center justify-between border-t border-[#e3e2da] pt-2.5 text-[9px]">
        <span className="text-[#969691]">Материалы</span>
        <span className="font-medium text-[#322f2f]">отчёт уже отправлен</span>
      </div>
    </div>
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
      className={`absolute z-10 flex min-h-9 items-center rounded-full border border-[#f5f5ed]/15 bg-[#f5f5ed]/10 px-2 text-[9px] font-medium whitespace-nowrap text-[#f5f5ed] shadow-[0_14px_40px_rgba(0,0,0,0.24)] backdrop-blur-md lg:min-h-10 lg:px-2.5 lg:text-[10px] ${className}`}
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
        className="absolute left-1/2 top-1/2 z-20 flex size-[32%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-[#f5f5ed]/15 bg-[#171711]/90 shadow-[0_0_80px_rgba(230,96,38,0.16)] backdrop-blur-xl"
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
        <SiteLogoMark className="h-auto w-[68%] text-[#f5f5ed]" />
        <span className="mt-2 text-[7px] tracking-[0.08em] text-[#f5f5ed]/60 uppercase lg:text-[8px]">
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
    <div className={styles.page}>
      <SiteHeader page="about" />
      <main className={styles.content} aria-label="О компании Posadmin">
      <section
        className={styles.hero}
        aria-labelledby="about-title"
        data-about-hero
        data-header-surface="dark"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-[16%] top-[42%] h-[540px] w-[540px] rounded-full bg-[#e66026]/10 blur-[120px]" />
          <div className="absolute -right-[12%] -top-[12%] h-[620px] w-[620px] rounded-full bg-[#f5f5ed]/[0.055] blur-[130px]" />
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(245,245,237,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(245,245,237,.18)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_92%)]" />
        </div>

        <div className={styles.heroLayout}>
          <div className="min-w-0">
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
              className={styles.heroTitle}
              id="about-title"
              initial={{ opacity: 0, y: 34 }}
              transition={{ delay: 0.32, duration: 1, ease: EASE }}
            >
              Автоматизация,
              <span className="block text-[#f5f5ed]/68">за которой стоит команда</span>
            </motion.h1>
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className={styles.heroCopy}
              initial={{ opacity: 0, y: 24 }}
              transition={{ delay: 0.48, duration: 0.8, ease: EASE }}
            >
              <p>Объединяем специалистов по программному обеспечению, оборудованию,
              кассам, государственным системам и интеграциям.</p>
              <p>Вам не приходится координировать нескольких подрядчиков — мы берём эту работу на себя.</p>
            </motion.div>
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mt-7 flex flex-wrap items-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.62, duration: 0.7, ease: EASE }}
            >
              <button
                className="flex min-h-12 items-center gap-2 rounded-full bg-[#e66026] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#cf501c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f5ed] sm:px-5 sm:text-[14px]"
                onClick={() => setCallbackOpen(true)}
                type="button"
              >
                Обсудить проект
                <ArrowIcon />
              </button>
              <a
                className="flex min-h-12 items-center rounded-full text-[13px] font-medium text-[#f5f5ed]/85 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f5ed] sm:px-3 sm:text-[14px]"
                href="#approach"
              >
                Как мы работаем
              </a>
            </motion.div>
          </div>

          <motion.div
            className={styles.heroDiagram}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            initial={{ opacity: 0, scale: 0.96, y: 26 }}
            transition={{ delay: 0.38, duration: 1.05, ease: EASE }}
          >
            <TeamConstellation />
          </motion.div>
        </div>
      </section>

      <section
        aria-labelledby="about-services-title"
        id="expertise"
      >
        <div className="mx-auto w-full max-w-[1200px]">
          <Reveal>
            <p className="text-[11px] font-medium tracking-[0.18em] text-[#e66026] uppercase">
              Чем мы занимаемся
            </p>
            <h2 className={styles.sectionTitle} id="about-services-title">
              <span className="block">Весь контур автоматизации.</span>
              <span className="mt-1 block text-[#777772]">
                Одна команда на каждом этапе.
              </span>
            </h2>

            <div className={styles.introDetails}>
              <p className={styles.sectionCopy}>
                От первого расчёта и установки оборудования до ежедневной
                технической поддержки и разработки индивидуальных решений. Один
                менеджер сопровождает проект и координирует нужных специалистов.
              </p>

              <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[18px] border border-[#d8d7cf] bg-[#d8d7cf]">
                {[
                  ["15+ лет", "автоматизируем бизнес"],
                  ["1 000+", "запущенных объектов"],
                  ["до 15 мин", "первичная реакция"],
                ].map(([value, label], index) => (
                  <motion.div
                    className="bg-[#efefe8] px-3 py-4 sm:px-4"
                    initial={{ opacity: 0, y: 12 }}
                    key={value}
                    transition={{ delay: 0.12 + index * 0.08, duration: 0.6, ease: EASE }}
                    viewport={{ amount: 0.5, once: true }}
                    whileInView={{ opacity: 1, y: 0 }}
                  >
                    <p className="text-[17px] font-medium leading-snug tracking-[-0.16px] sm:text-[20px]">
                      {value}
                    </p>
                    <p className="mt-2 text-[10px] leading-[15px] text-[#646565] sm:text-[11px] sm:leading-4">
                      {label}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {outcomes.map((outcome, index) => (
              <motion.article
                className="group relative min-h-[360px] overflow-hidden rounded-[28px] border border-[#d8d7cf] bg-[#ecece5] p-6 pb-[186px] outline-none transition-[border-color,box-shadow] duration-300 focus-visible:border-[#e66026]/55 focus-visible:shadow-[0_0_0_4px_rgba(230,96,38,0.12)] sm:p-7 sm:pb-[186px]"
                initial={{ opacity: 0, y: 28 }}
                key={outcome.title}
                transition={{ delay: index * 0.1, duration: 0.72, ease: EASE }}
                tabIndex={0}
                viewport={{ amount: 0.25, once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle,rgba(50,47,47,.16)_0.7px,transparent_0.8px)] [background-size:13px_13px] [mask-image:linear-gradient(to_bottom,black,transparent_68%)]" />
                <div className="relative flex items-start justify-between gap-5">
                  <div>
                    <p className="text-[9px] font-medium tracking-[0.15em] text-[#e66026] uppercase">
                      {outcome.label}
                    </p>
                    <h3 className="mt-3 text-[25px] font-medium leading-[1.2] tracking-[-0.3px] sm:text-[26px]">
                      {outcome.title}
                    </h3>
                  </div>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#d8d7cf] bg-[#f8f8f3] text-[#322f2f] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-focus:-rotate-90 group-hover:-rotate-90">
                    <ArrowIcon />
                  </span>
                </div>
                <p className="relative mt-4 max-w-[420px] text-[14px] leading-[23px] text-[#646565]">
                  {outcome.text}
                </p>

                <AutomationPreview index={index} />
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="approach" aria-labelledby="about-process-title">
        <div data-header-surface="light" className={styles.panel}>
          <div className="pointer-events-none absolute -right-32 top-0 size-[440px] rounded-full bg-[#e66026]/10 blur-[100px]" />
          <Reveal className="relative max-w-[900px]">
            <p className="text-[11px] font-medium tracking-[0.18em] text-[#e66026] uppercase">
              Один чат · одна команда
            </p>
            <h2 className={styles.sectionTitle} id="about-process-title">
              Вы ставите задачу один раз. Дальше координация — на нас.
            </h2>
          </Reveal>

          <div
            className="relative mt-8 grid gap-4 lg:grid-cols-2"
            data-header-surface="light"
          >
            {processSteps.map((step, index) => (
              <motion.article
                className="group relative min-h-[360px] overflow-hidden rounded-[28px] border border-[#cfcdc3] bg-[#f1f0ea] p-6 pb-[202px] text-[#322f2f] outline-none transition-[border-color,box-shadow] duration-300 focus-visible:border-[#e66026]/55 focus-visible:shadow-[0_0_0_4px_rgba(230,96,38,0.12)] sm:p-7 sm:pb-[202px]"
                initial={{ opacity: 0, y: 28 }}
                key={step.number}
                transition={{ delay: 0.28 + index * 0.12, duration: 0.7, ease: EASE }}
                tabIndex={0}
                viewport={{ amount: 0.25, once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(circle,rgba(50,47,47,.15)_0.7px,transparent_0.8px)] [background-size:13px_13px] [mask-image:linear-gradient(to_bottom,black,transparent_58%)]" />
                <div className="relative flex items-start justify-between gap-5">
                  <div>
                    <p className="text-[9px] font-medium tracking-[0.15em] text-[#e66026] uppercase">
                      {step.number} · {step.label}
                    </p>
                    <h3 className="mt-3 max-w-[360px] text-[24px] font-medium leading-[1.2] tracking-[-0.3px] sm:text-[28px]">
                      {step.title}
                    </h3>
                  </div>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#d8d7cf] bg-[#f8f8f3] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-focus:-rotate-90 group-hover:-rotate-90">
                    <ArrowIcon />
                  </span>
                </div>
                <p className="relative mt-4 max-w-[440px] text-[14px] leading-[23px] text-[#646565]">
                  {step.text}
                </p>

                <ProcessPreview index={index} />
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="about-principles-title">
        <div className="mx-auto w-full max-w-[1200px]">
          <Reveal className={styles.principlesHeader}>
            <div>
            <p className="text-[11px] font-medium tracking-[0.18em] text-[#e66026] uppercase">
              Философия компании
            </p>
              <h2 className={styles.sectionTitle} id="about-principles-title">
                Ищем решение, а не оправдание
              </h2>
            </div>
              <p className={styles.sectionCopy}>
                Мы работаем на результат, дорожим репутацией и постоянно
                развиваемся. Для клиента это означает вдумчивые решения,
                качественные инструменты и команду, которая не перекладывает
                ответственность.
              </p>
          </Reveal>

          <div className="mt-8 border-t border-[#d8d7cf]">
            {principles.map((principle) => (
              <motion.article
                className="grid gap-4 border-b border-[#d8d7cf] py-7 sm:grid-cols-[72px_0.7fr_1.3fr] sm:items-start sm:gap-8 sm:py-9"
                initial={{ opacity: 0, y: 20 }}
                key={principle.title}
                transition={{ duration: 0.7, ease: EASE }}
                viewport={{ amount: 0.45, once: true }}
                whileInView={{ opacity: 1, y: 0 }}
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

      <section id="contact" aria-labelledby="about-contact-title">
        <div className="relative overflow-hidden rounded-[28px] bg-[#e66026] p-7 text-white sm:rounded-[32px] sm:p-9 lg:p-10">
          <div className="pointer-events-none absolute -right-24 -top-48 size-[520px] rounded-full border border-white/20" />
          <div className="pointer-events-none absolute -right-8 -top-32 size-[360px] rounded-full border border-white/20" />
          <div className="relative grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <Reveal>
              <p className="text-[11px] font-medium tracking-[0.18em] text-white/65 uppercase">
                Давайте обсудим задачу
              </p>
              <h2 className={styles.sectionTitle} id="about-contact-title">
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
      </main>

      <footer className={styles.footer}>
          <Link aria-label="Posadmin — на главную" href="/">
            <SiteLogoMark className="h-auto w-[95px] text-[#322f2f]" />
          </Link>
          <p className="text-[12px]">© 2026 Posadmin. Автоматизация ресторанного бизнеса.</p>
      </footer>

      <CallbackDialog onClose={() => setCallbackOpen(false)} open={callbackOpen} />
    </div>
  );
}
