"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./base-badge.module.css";

export function BaseBadge({ className }: { className?: string }) {
  const tooltipId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  const cancelClose = () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const show = () => { cancelClose(); setOpen(true); };
  const hide = () => { cancelClose(); setOpen(false); setPosition(null); };
  const leave = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      if (!rootRef.current?.contains(document.activeElement)) {
        setOpen(false);
        setPosition(null);
      }
      closeTimer.current = null;
    }, 120);
  };

  useEffect(() => () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
  }, []);

  useLayoutEffect(() => {
    if (!open || !rootRef.current || !tooltipRef.current) return;
    const update = () => {
      if (!rootRef.current || !tooltipRef.current) return;
      const anchor = rootRef.current.getBoundingClientRect();
      if (anchor.bottom < 0 || anchor.top > window.innerHeight) {
        setOpen(false);
        setPosition(null);
        return;
      }
      const tooltip = tooltipRef.current.getBoundingClientRect();
      const left = Math.min(Math.max(anchor.left + (anchor.width - tooltip.width) / 2, 12), window.innerWidth - tooltip.width - 12);
      const above = anchor.top - tooltip.height - 8;
      const top = Math.min(Math.max(above >= 88 ? above : anchor.bottom + 8, 12), window.innerHeight - tooltip.height - 12);
      setPosition({ left, top });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => { setOpen(false); setPosition(null); };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target) && !tooltipRef.current?.contains(event.target)) close();
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return <span
    ref={rootRef}
    className={`${styles.wrapper}${className ? ` ${className}` : ""}`}
    tabIndex={0}
    aria-describedby={open ? tooltipId : undefined}
    onMouseEnter={show}
    onMouseLeave={leave}
    onFocus={show}
    onBlur={hide}
    onClick={show}
  >
    База
    {open && createPortal(<span
      ref={tooltipRef}
      id={tooltipId}
      role="tooltip"
      className={styles.tooltip}
      style={position ?? { left: 0, top: 0, visibility: "hidden" }}
      onMouseEnter={show}
      onMouseLeave={leave}
    >Включено по умолчанию</span>, document.body)}
  </span>;
}
