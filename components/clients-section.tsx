"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimation, useReducedMotion } from "framer-motion";
import { ClientsStatsDots } from "@/components/clients-stats-dots";
import { LiquidLogo } from "@/components/liquid-logo";
import { WaveWords } from "@/components/wave-words";
import { useParallaxAnimationCycle } from "@/components/full-page-parallax";

const CLIENTS = [
  { name: "Avrora", src: "/clients/avrora.svg" },
  { name: "Afina", src: "/clients/afina.svg" },
  { name: "Loona", src: "/clients/loona.svg" },
  { name: "Phantom", src: "/clients/phantom.svg" },
  { name: "Patriki", src: "/clients/patriki.svg" },
  { name: "Stars Coffee", src: "/clients/stars.svg" },
  { name: "Ava", src: "/clients/ava.svg" },
  { name: "Магадан", src: "/clients/magadan.svg" },
  { name: "Колбасный цех", src: "/clients/kc.svg" },
  { name: "Сыроварня", src: "/clients/sirovarnya.svg" },
] as const;

const TILE_EASE = [0.22, 0.7, 0.2, 1] as const;

function ClientsWave({
  text,
  waveKey,
  reduced,
  align,
}: {
  text: string;
  waveKey: number;
  reduced: boolean | null;
  align?: "center" | "start";
}) {
  if (waveKey === 0) {
    return (
      <span className="invisible" aria-hidden>
        {text}
      </span>
    );
  }

  return (
    <WaveWords
      key={waveKey}
      text={text}
      base={0.18}
      duration={1.15}
      reduced={reduced}
      align={align}
    />
  );
}

export function ClientsSection() {
  const reduced = useReducedMotion();
  const animationCycle = useParallaxAnimationCycle();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useRef(false);
  const copyPlayed = useRef(false);
  const [waveKey, setWaveKey] = useState(0);
  const [logoColumns, setLogoColumns] = useState(5);
  const controls = useAnimation();

  useEffect(() => {
    copyPlayed.current = false;
    inView.current = false;
    setWaveKey(0);
    void controls.set(
      reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    );
  }, [animationCycle, controls, reduced]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const syncColumns = () => setLogoColumns(media.matches ? 2 : 5);
    syncColumns();
    media.addEventListener("change", syncColumns);
    return () => media.removeEventListener("change", syncColumns);
  }, []);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const play = () => {
      if (!copyPlayed.current) {
        copyPlayed.current = true;
        setWaveKey(animationCycle + 1);
      }
      if (reduced) {
        void controls.start({ opacity: 1, y: 0, transition: { duration: 0 } });
        return;
      }

      void controls.start((row: number) => ({
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.55,
          ease: TILE_EASE,
          delay: 0.18 + row * 0.16,
        },
      }));
    };

    const reset = () => {
      void controls.set(
        reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
      );
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = entry?.isIntersecting ?? false;
        if (visible && !inView.current) play();
        if (!visible && inView.current) reset();
        inView.current = visible;
      },
      { threshold: 0.2 },
    );

    io.observe(node);
    return () => io.disconnect();
  }, [animationCycle, controls, logoColumns, reduced]);

  return (
    <section
      ref={sectionRef}
      className="clients-section bg-[#F5F5ED] font-[family-name:var(--font-inter)]"
    >
      <div className="clients-inner">
        <h2>
          <ClientsWave
            text="Наши клиенты"
            waveKey={waveKey}
            reduced={reduced}
          />
        </h2>

        <div className="clients-layout">
          <div className="clients-grid">
            {CLIENTS.map((client, index) => (
              <motion.div
                className="client-logo-card"
                key={client.name}
                custom={Math.floor(index / logoColumns)}
                initial={reduced ? false : { opacity: 0, y: 16 }}
                animate={controls}
              >
                <LiquidLogo
                  src={client.src}
                  alt={client.name}
                  className="client-logo-canvas"
                />
              </motion.div>
            ))}
          </div>

          <div className="clients-stats-card">
            <ClientsStatsDots />

            <div className="clients-stat-block clients-stat-block-top">
              <p className="clients-stat-value">
                <ClientsWave
                  text="Более 15 лет"
                  waveKey={waveKey}
                  reduced={reduced}
                  align="start"
                />
              </p>
              <p className="clients-stat-caption">на рынке</p>
            </div>

            <div className="clients-stat-block clients-stat-block-bottom">
              <p className="clients-stat-value">
                <ClientsWave
                  text="1 000 +"
                  waveKey={waveKey}
                  reduced={reduced}
                  align="start"
                />
              </p>
              <p className="clients-stat-caption">запущенных объектов</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
