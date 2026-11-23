"use client";

import Image from "next/image";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { ReZebraPlannerScreen } from "./rezebra-planner-screen";
import { ReZebraReservationScreen } from "./rezebra-reservation-screen";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";
import styles from "./rezebra-preview.module.css";

const screens = [
  { label: "План зала", content: ReZebraPlannerScreen },
  { label: "Создание резерва", content: ReZebraReservationScreen },
] as const;

const tabletWidth = 1536;
const tabletHeight = 1024;
// Display outline in the source image, including the camera cutout.
const screenOutline = "M312 99 769 75Q773 76 775 82Q777 87 783 87L816 85Q825 85 830 79Q834 74 841 72L1391 43Q1414 42 1408 65L1212 894Q1205 925 1186 921L65 843Q43 842 51 820L279 123Q287 100 312 99Z";

export function ReZebraPreview() {
  const [active, setActive] = useState(0);
  const [scale, setScale] = useState(0);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [paused, setPaused] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const instructionsId = useId();
  const device = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ id: number; x: number; y: number } | null>(null);
  const reduceMotion = useHydratedReducedMotion();

  useLayoutEffect(() => {
    const element = device.current;
    if (!element) return;
    setScale(element.clientWidth / tabletWidth);
    const resize = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / tabletWidth));
    resize.observe(element);
    return () => resize.disconnect();
  }, []);

  useEffect(() => {
    const element = device.current;
    if (!element) return;
    const visibility = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 });
    visibility.observe(element);
    return () => visibility.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || hovered || paused || reduceMotion) return;
    const timer = window.setTimeout(() => setActive((index) => (index + 1) % screens.length), 7000);
    return () => window.clearTimeout(timer);
  }, [active, hovered, paused, reduceMotion, visible]);

  function switchScreen() {
    const next = (active + 1) % screens.length;
    setPaused(true);
    setActive(next);
    setAnnouncement(`${screens[next].label}. ${next + 1} из ${screens.length}.`);
  }

  function startSwipe(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    pointerStart.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function finishSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = pointerStart.current;
    if (start?.id !== event.pointerId) return;
    pointerStart.current = null;
    const dx = Math.abs(event.clientX - start.x);
    const dy = Math.abs(event.clientY - start.y);
    const threshold = Math.min(50, event.currentTarget.clientWidth * 0.14);
    if (dx >= threshold && dx > dy * 1.3) switchScreen();
  }

  function cancelSwipe() {
    pointerStart.current = null;
  }

  function handleKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      switchScreen();
    } else if (event.key === " " && !reduceMotion) {
      event.preventDefault();
      setPaused(!paused);
      setAnnouncement(paused ? "Автоматическая смена экранов включена." : "Автоматическая смена экранов остановлена.");
    }
  }

  return <figure className={styles.preview} aria-label="Интерфейс ReZebra на планшете">
    <div className={styles.deviceStage}>
      <div
        ref={device}
        className={styles.device}
        role="region"
        aria-roledescription="карусель"
        aria-label={screens[active].label}
        aria-describedby={instructionsId}
        tabIndex={0}
        onPointerDown={startSwipe}
        onPointerUp={finishSwipe}
        onPointerCancel={cancelSwipe}
        onLostPointerCapture={cancelSwipe}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setPaused(true)}
        onKeyDown={handleKeys}
      >
        <Image
          className={styles.deviceImage}
          src="/products/rezebra-tablet.png"
          alt=""
          width={tabletWidth}
          height={tabletHeight}
          sizes="(max-width: 767px) 90vw, 670px"
          draggable={false}
        />
        <svg className={styles.screenBase} viewBox={`0 0 ${tabletWidth} ${tabletHeight}`} aria-hidden="true">
          <path d={screenOutline} fill="#303030" />
        </svg>
        <span
          className={styles.deviceCanvas}
          style={{ transform: `scale(${scale})`, clipPath: `path("${screenOutline}")` }}
          aria-hidden="true"
        >
          <span className={styles.projectedScreen}>
            <span className={styles.screenTrack} style={{ transform: `translateX(-${active * 100}%)` }}>
              {screens.map(({ label, content: Screen }) => <span className={styles.slide} key={label}><Screen /></span>)}
            </span>
          </span>
        </span>
      </div>
    </div>
    <span className={styles.srOnly} id={instructionsId}>
      Для смены экрана проведите влево или вправо либо используйте стрелки клавиатуры.
      {!reduceMotion && " Пробел останавливает или продолжает автоматическую смену."}
    </span>
    <span className={styles.srOnly} role="status">{announcement}</span>
  </figure>;
}
