"use client";

import { useEffect, useRef } from "react";
import { useHydratedReducedMotion } from "@/components/use-hydrated-reduced-motion";

type Speck = {
  x: number;
  y: number;
  r: number;
  a: number;
  vx: number;
  vy: number;
  phase: number;
  spin: number;
  drift: number;
  twinkle: number;
  glow: boolean;
};

type HeroDustProps = {
  coverage?: "lower" | "full";
  subtle?: boolean;
};

function spawn(w: number, h: number, coverage: "lower" | "full", subtle: boolean): Speck {
  const depth = Math.random();
  const far = depth < 0.55;
  const mid = depth < 0.86;
  const top = coverage === "lower" ? h * 0.5 : 0;
  const size = subtle ? 0.9 : 1;
  const opacity = subtle ? 0.75 : 1;
  const speed = subtle ? 0.5 : 1;
  return {
    x: Math.random() * w,
    y: top + Math.random() * (h - top),
    r: (far ? 0.18 + Math.random() * 0.16 : mid ? 0.28 + Math.random() * 0.18 : 0.42 + Math.random() * 0.22) * size,
    a: (far ? 0.06 + Math.random() * 0.12 : mid ? 0.16 + Math.random() * 0.2 : 0.32 + Math.random() * 0.35) * opacity,
    vx: (Math.random() - 0.5) * (far ? 0.16 : mid ? 0.26 : 0.4) * speed,
    vy: -Math.abs(0.12 + Math.random() * (far ? 0.14 : mid ? 0.22 : 0.32)) * speed,
    phase: Math.random() * Math.PI * 2,
    spin: 0.0007 + Math.random() * 0.0012,
    drift: (0.55 + Math.random() * 0.9) * speed,
    twinkle: 0.0004 + Math.random() * 0.0011,
    glow: !subtle && !far && Math.random() > 0.82,
  };
}

export function HeroDust({ coverage = "lower", subtle = false }: HeroDustProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useHydratedReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    let specks: Speck[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let running = false;
    let inView = false;

    const resize = () => {
      width = Math.max(1, parent.clientWidth);
      height = Math.max(1, parent.clientHeight);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(subtle
        ? Math.min(160, Math.max(64, (width * height) / 10000))
        : Math.min(520, Math.max(280, (width * height) / 3600)));
      specks = Array.from({ length: count }, () => spawn(width, height, coverage, subtle));
      draw(0);
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const s of specks) {
        if (!reduced) {
          const top = coverage === "lower" ? height * 0.5 : 0;
          s.phase += s.spin;
          s.x += s.vx + Math.sin(t * s.spin + s.phase) * s.drift * 0.32;
          s.y += s.vy + Math.cos(t * s.spin * 0.85 + s.phase) * s.drift * 0.2;
          if (s.x < -8) s.x = width + 8;
          if (s.x > width + 8) s.x = -8;
          if (s.y < top) s.y = height + 6;
          if (s.y > height + 8) s.y = top;
        }

        const pulse = reduced ? 1 : 0.72 + 0.28 * Math.sin(t * s.twinkle + s.phase);
        const alpha = s.a * pulse;
        ctx.fillStyle = `rgba(245, 245, 237, ${alpha})`;

        if (s.glow) {
          const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 1.8);
          g.addColorStop(0, `rgba(245, 245, 237, ${alpha})`);
          g.addColorStop(0.45, `rgba(245, 245, 237, ${alpha * 0.22})`);
          g.addColorStop(1, "rgba(245, 245, 237, 0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 245, 237, ${alpha})`;
        ctx.fill();
      }
    };

    const loop = (t: number) => {
      if (!running) return;
      draw(t);
      if (running) frame = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running || reduced || !inView || document.hidden) return;
      running = true;
      frame = requestAnimationFrame(loop);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) start();
      else stop();
    });
    io.observe(parent);

    const onVis = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [coverage, reduced, subtle]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
      aria-hidden
    />
  );
}
