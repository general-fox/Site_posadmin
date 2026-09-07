"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { HeroDust } from "@/components/hero-dust";
import { CircuitLines } from "@/components/circuit-lines";
import { HeroCapsules } from "@/components/hero-capsules";
import { FlipWords } from "@/components/flip-words";
import { WaveWords } from "@/components/wave-words";
import { useHydratedReducedMotion } from "@/components/use-hydrated-reduced-motion";

const waveEase = [0.33, 1, 0.68, 1] as const;

function LightningIcon() {
  return (
    <div className="relative size-6 shrink-0">
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
          src="/figma-hero/vector-165.png?v=3"
          alt=""
          className="hero-glow absolute top-[503.11px] left-[-41.66px] h-[364.974px] w-[423.197px]"
        />
        <img
          src="/figma-hero/vector-164.png?v=3"
          alt=""
          className="hero-glow absolute top-[-220.64px] left-[738.32px] h-[646.419px] w-[930.898px]"
        />
        <img
          src="/figma-hero/ellipse-353.png?v=3"
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
  const titleBoxRef = useRef<HTMLHeadingElement>(null);
  const [titleSize, setTitleSize] = useState({ w: 460, h: 148 });
  const [titleDone, setTitleDone] = useState(false);

  // Safety net in case the title animation never reports completion.
  useEffect(() => {
    if (reduced) {
      setTitleDone(true);
      return;
    }
    const timer = setTimeout(() => setTitleDone(true), 3400);
    return () => clearTimeout(timer);
  }, [reduced]);

  useLayoutEffect(() => {
    const el = titleBoxRef.current;
    if (!el) return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      setTitleSize({ w: Math.round(box.width), h: Math.round(box.height) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0">
      <CircuitLines side="left" delay={0.12} reduced={reduced} />
      <CircuitLines side="right" delay={0.28} reduced={reduced} />

      <motion.div
        className="hero-glass-btn absolute bottom-[40px] left-[35.85px] flex items-center justify-center overflow-hidden rounded-[50px] px-[14px] py-[8px]"
        initial={reduced ? false : { opacity: 0, scale: 0.44 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={
          reduced
            ? { duration: 0 }
            : {
                delay: 1.15,
                opacity: { duration: 0.26, ease: "easeOut" },
                scale: {
                  type: "spring",
                  stiffness: 420,
                  damping: 10.5,
                  mass: 0.7,
                },
              }
        }
      >
        <p className="font-[family-name:var(--font-montserrat)] text-[11px] font-medium leading-normal whitespace-nowrap text-[#F5F5ED]">
          Официальный дилер r_keeper
        </p>
      </motion.div>

      <div className="absolute top-[88px] left-1/2 z-[2] flex w-[calc(100%-32px)] -translate-x-1/2 items-center justify-center gap-2 text-center sm:top-[102px] sm:w-auto sm:gap-2.5">
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
        <p className="font-[family-name:var(--font-inter)] text-[14px] font-normal leading-[20px] tracking-[0.1px] text-[#F5F5ED] sm:text-[18px] sm:leading-normal sm:tracking-[0.2px] sm:whitespace-nowrap">
          <WaveWords
            text="Единая команда для всего контура автоматизации"
            base={0.52}
            stagger={0.075}
            duration={0.9}
            reduced={reduced}
          />
        </p>
      </div>

      <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center px-6 pt-20">
        <div className="flex w-max max-w-full flex-col items-center">
          <div className="relative mb-8 overflow-visible">
            <h1
              ref={titleBoxRef}
              className="relative z-20 flex flex-col items-center text-center font-[family-name:var(--font-inter)] text-[40px] font-medium leading-[1.08] tracking-[0.3px] whitespace-nowrap sm:text-[52px] lg:text-[64px] lg:tracking-[1.28px]"
            >
              <span className="text-[#F5F5ED]">
                <WaveWords
                  text="Автоматизация"
                  base={0.92}
                  duration={1.15}
                  reduced={reduced}
                />
              </span>
              <span className="text-[#F5F5ED]/80">
                <FlipWords
                  base={1.08}
                  duration={1.15}
                  reduced={reduced}
                  onFirstComplete={() => setTitleDone(true)}
                />
              </span>
            </h1>
            <HeroCapsules
              reduced={reduced}
              width={titleSize.w}
              height={titleSize.h}
            />
          </div>

          <motion.a
            href="/#contact"
            className="hero-glass-btn pointer-events-auto flex items-center justify-center rounded-[50px] px-[35px] py-[13px] font-[family-name:var(--font-montserrat)] text-[14px] font-medium leading-normal whitespace-nowrap text-[#F5F5ED]"
            initial={reduced ? false : { opacity: 0, scale: 0.44 }}
            animate={
              titleDone
                ? { opacity: 1, scale: 1 }
                : { opacity: 0, scale: 0.44 }
            }
            transition={
              reduced
                ? { duration: 0 }
                : {
                    delay: 0.14,
                    opacity: { duration: 0.26, ease: "easeOut" },
                    scale: {
                      type: "spring",
                      stiffness: 420,
                      damping: 10.5,
                      mass: 0.7,
                    },
                  }
            }
          >
            Запустить проект
          </motion.a>
        </div>
      </div>
    </div>
  );
}
