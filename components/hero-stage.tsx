"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { HeroDust } from "@/components/hero-dust";
import { CircuitLines } from "@/components/circuit-lines";
import { HeroCapsules } from "@/components/hero-capsules";
import { FlipWords } from "@/components/flip-words";
import { WaveWords } from "@/components/wave-words";
import { useHydratedReducedMotion } from "@/components/use-hydrated-reduced-motion";
import { HeroActions } from "@/components/hero-actions";

const waveEase = [0.33, 1, 0.68, 1] as const;

function LightningIcon() {
  return (
    <div className="hero-lightning relative size-6 shrink-0" aria-hidden="true">
      <div className="absolute top-[2px] left-[5px] h-5 w-[14px]">
        <div className="absolute inset-[-21.74%_-30.41%]">
          <img
            src="/figma-hero/lightning.svg"
            alt=""
            className="block size-full max-w-none"
          />
        </div>
      </div>
    </div>
  );
}

export function GlowLayer() {
  return (
    <div className="hero-glow-board pointer-events-none absolute inset-0">
      <div className="hero-glow-figma">
        <img
          src="/figma-hero/vector-165.webp"
          alt=""
          className="hero-glow absolute top-[503.11px] left-[-41.66px] h-[364.974px] w-[423.197px]"
        />
        <img
          src="/figma-hero/vector-164.png?v=3"
          alt=""
          className="hero-glow absolute top-[-220.64px] left-[738.32px] h-[646.419px] w-[930.898px]"
        />
        <img
          src="/figma-hero/ellipse-353.webp"
          alt=""
          className="hero-glow absolute top-[-43.68px] left-[913.97px] h-[777.9px] w-[802.5px]"
        />
        <img
          src="/figma-hero/vector-163.png?v=3"
          alt=""
          className="hero-glow absolute top-[-2.19px] left-[621.5px] h-[659.946px] w-[868.953px]"
        />
      </div>
      <HeroDust />
    </div>
  );
}

export function HeroStage() {
  const reduced = useHydratedReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const titleBoxRef = useRef<HTMLHeadingElement>(null);
  const [titleSize, setTitleSize] = useState({ w: 460, h: 148, actionsHeight: 48, containerWidth: 1440, compact: false, short: false, mobile: false });
  const { compact, short, mobile } = titleSize;

  useLayoutEffect(() => {
    const el = titleBoxRef.current;
    const stage = stageRef.current;
    if (!el || !stage) return;
    const actions = stage.querySelector<HTMLElement>(".hero-actions");
    const measure = () => {
      const layout = getComputedStyle(stage);
      // Capsule offsets use layout pixels, independent of the hero's parallax.
      // CSS owns the responsive layout before hydration; JS only measures the
      // settled geometry for the decorative capsule trajectories.
      const next = {
        w: el.offsetWidth,
        h: el.offsetHeight,
        actionsHeight: actions?.offsetHeight ?? 48,
        containerWidth: stage.clientWidth,
        compact: layout.getPropertyValue("--hero-compact").trim() === "1",
        short: layout.getPropertyValue("--hero-short").trim() === "1",
        mobile: layout.getPropertyValue("--hero-mobile").trim() === "1",
      };
      setTitleSize((current) => current.w === next.w && current.h === next.h &&
        current.actionsHeight === next.actionsHeight &&
        current.containerWidth === next.containerWidth && current.compact === next.compact &&
        current.short === next.short && current.mobile === next.mobile ? current : next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(stage);
    if (actions) ro.observe(actions);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div ref={stageRef} className="hero-stage pointer-events-none absolute inset-0" data-compact={compact} data-short={short} data-mobile={mobile}>
      <noscript>
        <style>{`.hero-stage [data-hero-word], .hero-actions, .hero-dealer { opacity: 1 !important; transform: none !important; }`}</style>
      </noscript>
      <CircuitLines side="left" delay={0.12} reduced={reduced} />
      <CircuitLines side="right" delay={0.28} reduced={reduced} />

      <motion.div
        className="hero-dealer hero-glass-btn absolute bottom-[40px] left-[35.85px] flex items-center justify-center overflow-hidden rounded-[8px] px-[14px] py-[8px]"
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduced
            ? { duration: 0 }
            : {
                delay: 0.75,
                duration: 0.55,
                ease: waveEase,
              }
        }
      >
        <p className="font-[family-name:var(--font-montserrat)] text-[11px] font-medium leading-normal whitespace-nowrap text-[var(--milk)]">
          Официальный дилер r_keeper
        </p>
      </motion.div>

      <div className="hero-tagline absolute top-[88px] left-1/2 z-[2] flex w-[calc(100%-32px)] items-center justify-center gap-2 text-center sm:top-[102px] sm:w-auto sm:gap-2.5">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduced
              ? { duration: 0 }
              : { delay: 0.46, duration: 0.8, ease: waveEase }
          }
        >
          <LightningIcon />
        </motion.div>
        <p className="font-[family-name:var(--font-inter)] text-[14px] font-normal leading-[20px] tracking-[0.1px] text-[var(--milk)] sm:text-[18px] sm:leading-normal sm:tracking-[0.2px] sm:whitespace-nowrap">
          <WaveWords
            text="r_keeper, кассы и IT-поддержка 24/7 — одна команда."
            base={0.2}
            stagger={0.025}
            duration={0.55}
            reduced={reduced}
          />
        </p>
      </div>

      <div className="hero-content absolute inset-0 z-[2] flex flex-col items-center justify-center px-6 pt-20">
        <div className="hero-copy flex w-max max-w-full flex-col items-center">
          <div className="hero-title-group relative mb-8 overflow-visible">
            <HeroCapsules
              reduced={reduced}
              width={titleSize.w}
              height={titleSize.h}
              actionsHeight={titleSize.actionsHeight}
              containerWidth={titleSize.containerWidth}
              compact={compact}
              short={short}
              mobile={mobile}
            />
            <h1
              ref={titleBoxRef}
              className="relative z-20 flex flex-col items-center text-center font-[family-name:var(--font-inter)] text-[40px] font-medium leading-[1.08] tracking-[0.3px] whitespace-nowrap sm:text-[52px] lg:text-[64px] lg:tracking-[1.28px]"
            >
              <span className="sr-only">Автоматизация ресторанов, баров и кафе</span>
              <span className="text-[var(--milk)]" aria-hidden="true">
                <WaveWords
                  text="Автоматизация"
                  base={0.92}
                  duration={1.15}
                  reduced={reduced}
                />
              </span>
              <span className="text-[var(--milk)]/80" aria-hidden="true">
                <FlipWords
                  base={1.08}
                  duration={1.15}
                  reduced={reduced}
                />
              </span>
            </h1>
          </div>

          <HeroActions reduced={reduced} />
        </div>
      </div>
    </div>
  );
}
