"use client";

import type { ReactNode } from "react";
import { useScrollReveal } from "./marketing-ui";
import styles from "./services-tiles.module.css";

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const TILES = [
  {
    title: "Системные администраторы",
    detail: "Сети, серверы и рабочие места.",
    icon: <Glyph><rect x="3" y="4" width="18" height="6" rx="2" /><rect x="3" y="14" width="18" height="6" rx="2" /><path d="M6.6 7h.01M6.6 17h.01" /></Glyph>,
  },
  {
    title: "ГИС-системы",
    detail: "ЕГАИС, Честный знак, Меркурий и ЭДО.",
    icon: <Glyph><path d="M12 3.2 19 6v5c0 4.2-2.9 7.5-7 8.8C7.9 18.5 5 15.2 5 11V6l7-2.8Z" /><path d="m9.2 11.6 2 2 3.6-3.8" /></Glyph>,
  },
  {
    title: "Кассовая техника",
    detail: "Регистрация и сопровождение ККТ.",
    icon: <Glyph><path d="M6 3.4h12v17.2l-2.4-1.3-2.4 1.3-2.4-1.3-2.4 1.3L6 20.6Z" /><path d="M9.2 8.4h5.6M9.2 12.2h5.6" /></Glyph>,
  },
  {
    title: "Выездные инженеры",
    detail: "Монтаж оборудования и устранение сбоев.",
    icon: <Glyph><path d="M20.2 5.4a4.6 4.6 0 0 1-6 6l-6.6 6.6a2.1 2.1 0 1 1-3-3l6.6-6.6a4.6 4.6 0 0 1 6-6l-2.9 2.9.7 2.4 2.4.7 2.8-3Z" /></Glyph>,
  },
  {
    title: "Разработка и интеграции",
    detail: "Соединяем системы и автоматизируем процессы.",
    icon: <Glyph><path d="m8.4 8.2-3.8 3.8 3.8 3.8M15.6 8.2l3.8 3.8-3.8 3.8M13.4 6.2l-2.8 11.6" /></Glyph>,
    wide: true,
  },
] as const;

function ServiceCard({ tile, index }: { tile: typeof TILES[number]; index: number }) {
  const ref = useScrollReveal<HTMLLIElement>({ delay: 0.1 + index * 0.055, distance: 12 });

  return (
    <li ref={ref} className={`${styles.card} ${"wide" in tile ? styles.wide : ""}`}>
      <div className={styles.copy}>
        <h3>{tile.title}</h3>
        <p>{tile.detail}</p>
      </div>
      <span className={styles.icon} aria-hidden="true">{tile.icon}</span>
    </li>
  );
}

export function ServicesTiles() {
  return (
    <ul className={styles.grid} aria-label="Направления работы команды">
      {TILES.map((tile, index) => <ServiceCard key={tile.title} tile={tile} index={index} />)}
    </ul>
  );
}
