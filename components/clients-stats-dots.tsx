"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

/** Cards & Expenses on ramp.com — guilloche preset. */
const NUM_RAYS = 8;
const DOTS_PER_RAY = 302;
const INNER_RADIUS = 244;
const SPACING = 200;
const GROWTH = 7.9;
const ANGLE_SWEEP = 6;
const TWIST = -3;
const TAPER = -0.29;
const FOCAL_X = 1.1;
const FOCAL_Y = 0.65;
const FOV = 1020;
const ISO = FOV / 600;
const DOT_SIZE = 1;
const ANIM_SPEED = 2;
const DOT_COLOR = "rgba(50, 47, 47, 0.37)";
/** Nudge so the rightmost waves aren't clipped by the card. */
const SHIFT_X = -68;
/** Original Figma Group 549: rotate(-169.87deg) scaleY(-1). */
const LAYOUT_ROT = (-169.87 * Math.PI) / 180;
const LAYOUT_COS = Math.cos(LAYOUT_ROT);
const LAYOUT_SIN = Math.sin(LAYOUT_ROT);

function drawGuilloche(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  angleOffset: number,
  rotYDeg: number,
) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = DOT_COLOR;
  ctx.beginPath();

  const cosY = Math.cos(rotYDeg * DEG);
  const cx = FOCAL_X * width;
  const cy = FOCAL_Y * height;
  const phase = angleOffset * TAU;

  for (let ray = 0; ray < NUM_RAYS; ray++) {
    const p = ray / (NUM_RAYS - 1);
    const baseR = INNER_RADIUS + p * (SPACING - INNER_RADIUS);
    const rayPhase = ray * TWIST + phase;
    const amp = GROWTH * Math.max(0, 1 + TAPER * (p - 0.5) * 2);

    for (let i = 0; i < DOTS_PER_RAY; i++) {
      const theta = (i / DOTS_PER_RAY) * TAU;
      const radius = baseR + amp * Math.sin(ANGLE_SWEEP * theta + rayPhase);
      const x = radius * Math.cos(theta);
      const y = radius * Math.sin(theta);
      const rx = x * cosY;
      const ry = y;
      const px = cx + rx * ISO;
      const py = cy + ry * ISO;
      const dx = px - width / 2;
      const dy = -(py - height / 2);
      const sx = width / 2 + dx * LAYOUT_COS - dy * LAYOUT_SIN + SHIFT_X;
      const sy = height / 2 + dx * LAYOUT_SIN + dy * LAYOUT_COS;

      if (sx < -150 || sx > width + 150 || sy < -150 || sy > height + 150) {
        continue;
      }

      ctx.moveTo(sx + DOT_SIZE, sy);
      ctx.arc(sx, sy, DOT_SIZE, 0, TAU);
    }
  }

  ctx.fill();
}

export function ClientsStatsDots() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const card = canvas.closest(".clients-stats-card");
    let width = 0;
    let height = 0;
    let dpr = 1;
    let angleOffset = 0;
    let hover = false;
    let hoverMix = 0;
    let visible = true;
    let last = performance.now();
    let frame = 0;
    let running = false;

    const size = { w: 0, h: 0, dpr: 0 };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (width <= 0 || height <= 0) return;
      if (size.w === width && size.h === height && size.dpr === dpr) return;
      size.w = width;
      size.h = height;
      size.dpr = dpr;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const paint = (rotY = 0) => {
      if (width <= 0 || height <= 0) return;
      drawGuilloche(ctx, width, height, angleOffset, rotY);
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (visible) {
        if (dpr !== Math.min(window.devicePixelRatio || 1, 2)) resize();
        hoverMix += (+hover - hoverMix) * Math.min(1, 3 * dt);
        angleOffset = (angleOffset + ANIM_SPEED * dt * 0.04 * (1 + 2.5 * hoverMix)) % 1;
        paint(3 * hoverMix);
      }

      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    resize();
    paint(0);

    if (reduced) return;

    const onEnter = () => {
      hover = true;
    };
    const onLeave = () => {
      hover = false;
    };
    card?.addEventListener("pointerenter", onEnter);
    card?.addEventListener("pointerleave", onLeave);

    const ro = new ResizeObserver(() => {
      resize();
      if (!running) paint(3 * hoverMix);
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true;
        if (visible) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(canvas);
    if (visible) start();

    const dprQuery = () => window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    let mql = dprQuery();
    const onDpr = () => {
      resize();
      paint(3 * hoverMix);
      mql.removeEventListener("change", onDpr);
      mql = dprQuery();
      mql.addEventListener("change", onDpr);
    };
    mql.addEventListener("change", onDpr);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      mql.removeEventListener("change", onDpr);
      card?.removeEventListener("pointerenter", onEnter);
      card?.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced]);

  return (
    <div className="clients-stats-lines" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
