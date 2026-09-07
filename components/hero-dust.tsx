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

function spawn(w: number, h: number): Speck {
  const depth = Math.random();
  const far = depth < 0.55;
  const mid = depth < 0.86;
  const top = h * 0.5;
  return {
    x: Math.random() * w,
    y: top + Math.random() * (h - top),
    r: far ? 0.18 + Math.random() * 0.16 : mid ? 0.28 + Math.random() * 0.18 : 0.42 + Math.random() * 0.22,
    a: far ? 0.06 + Math.random() * 0.12 : mid ? 0.16 + Math.random() * 0.2 : 0.32 + Math.random() * 0.35,
    vx: (Math.random() - 0.5) * (far ? 0.16 : mid ? 0.26 : 0.4),
    vy: -Math.abs(0.12 + Math.random() * (far ? 0.14 : mid ? 0.22 : 0.32)),
    phase: Math.random() * Math.PI * 2,
    spin: 0.0007 + Math.random() * 0.0012,
    drift: 0.55 + Math.random() * 0.9,
    twinkle: 0.0004 + Math.random() * 0.0011,
    glow: !far && Math.random() > 0.82,
  };
}

export function HeroDust() {
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

    const resize = () => {
      const next = parent.getBoundingClientRect();
      width = Math.max(1, Math.round(next.width));
      height = Math.max(1, Math.round(next.height));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(Math.min(520, Math.max(280, (width * height) / 3600)));
      specks = Array.from({ length: count }, () => spawn(width, height));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const s of specks) {
        if (!reduced) {
          const top = height * 0.5;
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
      draw(t);
      if (running) frame = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      frame = requestAnimationFrame(loop);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    resize();
    draw(0);
    if (!reduced) start();

    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const onVis = () => {
      if (document.hidden) stop();
      else if (!reduced) start();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stop();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
      aria-hidden
    />
  );
}
