"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useHydratedReducedMotion } from "@/components/use-hydrated-reduced-motion";
import { useParallaxEntry } from "@/components/full-page-parallax";

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[21px]"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const ICONS = {
  servers: (
    <Glyph>
      <rect x="3" y="4" width="18" height="6" rx="2" />
      <rect x="3" y="14" width="18" height="6" rx="2" />
      <path d="M6.6 7h.01M6.6 17h.01" />
    </Glyph>
  ),
  shield: (
    <Glyph>
      <path d="M12 3.2 19 6v5c0 4.2-2.9 7.5-7 8.8C7.9 18.5 5 15.2 5 11V6l7-2.8Z" />
      <path d="m9.2 11.6 2 2 3.6-3.8" />
    </Glyph>
  ),
  receipt: (
    <Glyph>
      <path d="M6 3.4h12v17.2l-2.4-1.3-2.4 1.3-2.4-1.3-2.4 1.3L6 20.6Z" />
      <path d="M9.2 8.4h5.6M9.2 12.2h5.6" />
    </Glyph>
  ),
  wrench: (
    <Glyph>
      <path d="M20.2 5.4a4.6 4.6 0 0 1-6 6l-6.6 6.6a2.1 2.1 0 1 1-3-3l6.6-6.6a4.6 4.6 0 0 1 6-6l-2.9 2.9.7 2.4 2.4.7 2.8-3Z" />
    </Glyph>
  ),
  code: (
    <Glyph>
      <path d="m8.4 8.2-3.8 3.8 3.8 3.8M15.6 8.2l3.8 3.8-3.8 3.8M13.4 6.2l-2.8 11.6" />
    </Glyph>
  ),
};

// ЕГАИС ships from Figma as a tinted plate plus four separate glyph layers.
function EgaisBadge() {
  return (
    <span className="relative block size-[22px] shrink-0">
      <span className="absolute inset-0 rounded-[5px] border border-[rgba(29,64,180,0.08)] bg-[rgba(49,108,219,0.15)]" />
      <span className="absolute top-1/2 left-1/2 block size-[18px] -translate-x-1/2 -translate-y-1/2">
        <span className="absolute inset-[89.58%_35.42%_10.42%_35.42%]">
          <span className="absolute inset-[-0.5px_-8.16%]">
            <img
              src="/specialists/egais-1.svg"
              alt=""
              className="block size-full max-w-none"
            />
          </span>
        </span>
        <span className="absolute top-[70.83%] right-1/2 bottom-[12.5%] left-1/2">
          <span className="absolute inset-[-14.29%_-0.5px]">
            <img
              src="/specialists/egais-2.svg"
              alt=""
              className="block size-full max-w-none"
            />
          </span>
        </span>
        <span className="absolute inset-[33.33%_20.83%_29.17%_20.83%]">
          <img
            src="/specialists/egais-3.svg"
            alt=""
            className="block size-full max-w-none"
          />
        </span>
        <span className="absolute top-[12.5%] right-[20.83%] bottom-1/2 left-1/2">
          <span className="absolute inset-[-5.9%_-3.03%_-6.35%_-8.17%]">
            <img
              src="/specialists/egais-4.svg"
              alt=""
              className="block size-full max-w-none"
            />
          </span>
        </span>
      </span>
    </span>
  );
}

const GIS_BADGES = [
  "/specialists/icon-chz.svg",
  "/specialists/icon-mercury.svg",
  "/specialists/icon-edo.svg",
];

const TILES = [
  {
    icon: ICONS.servers,
    title: "Системные администраторы",
    detail: "Закрываем весь контур IT",
  },
  {
    icon: ICONS.shield,
    title: "ГИС-системы",
    detail: "ЕГАИС, Честный знак, Меркурий, ЭДО",
    badges: true,
  },
  {
    icon: ICONS.receipt,
    title: "Кассовая техника",
    detail: "Регистрация и сопровождение ККТ",
  },
  {
    icon: ICONS.wrench,
    title: "Выездные инженеры",
    detail: "Установка оборудования и устранение критических сбоев",
  },
  {
    icon: ICONS.code,
    title: "Разработка и интеграция",
    detail: "Под задачи конкретного предприятия",
    wide: true,
  },
] as const;

export function ServicesTiles() {
  const parallaxEntry = useParallaxEntry();
  const reduced = useHydratedReducedMotion();

  return (
    <ul className="grid h-full grid-cols-1 content-center gap-3 sm:grid-cols-2">
      {TILES.map((tile, index) => (
        <motion.li
          key={`${tile.title}-${parallaxEntry}`}
          className={`service-tile flex flex-col rounded-[16px] bg-[#FBFBF9] p-[16px] xl:p-[18px] ${
            "wide" in tile && tile.wide ? "sm:col-span-2" : ""
          }`}
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduced
              ? { duration: 0 }
              : {
                  duration: 0.55,
                  ease: [0.22, 0.7, 0.2, 1],
                  delay: 0.18 + index * 0.09,
                }
          }
        >
          <span className="flex size-[38px] shrink-0 items-center justify-center rounded-[11px] bg-[rgba(50,47,47,0.05)] text-[#6B6A65]">
            {tile.icon}
          </span>

          <span className="mt-[14px] text-[15px] font-medium leading-[20px] tracking-[0.1px] text-[#322F2F] xl:text-[16px]">
            {tile.title}
          </span>

          <span className="mt-[6px] text-[13px] leading-[19px] tracking-[0.15px] text-[rgba(49,50,53,0.66)] xl:text-[14px] xl:leading-[20px]">
            {tile.detail}
          </span>

          {"badges" in tile && tile.badges ? (
            <span className="mt-[12px] flex items-center gap-[8px]">
              <EgaisBadge />
              {GIS_BADGES.map((src) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="block size-[22px] shrink-0"
                />
              ))}
            </span>
          ) : null}
        </motion.li>
      ))}
    </ul>
  );
}
