"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useMarketingReducedMotion } from "./marketing-ui";
import styles from "./support-chat.module.css";

const CONVERSATIONS = [
  [
    { from: "you", text: "Не печатает принтер на кухне.", time: "12:04" },
    { from: "team", text: "Печать восстановили. Проверьте, пожалуйста.", time: "12:06" },
    { from: "you", text: "Всё работает, спасибо!", time: "12:07" },
  ],
  [
    { from: "you", text: "Добавьте три стола на веранду, пожалуйста.", time: "14:20" },
    { from: "team", text: "Готово, столы добавлены.", time: "14:24" },
    { from: "you", text: "Вижу, спасибо!", time: "14:25" },
  ],
  [
    { from: "you", text: "Нужен отчёт по продажам за месяц.", time: "16:10" },
    { from: "team", text: "Отчёт готов — можно скачать.", time: "16:14" },
    { from: "you", text: "Получилось, спасибо!", time: "16:15" },
  ],
] as const;

// Question → operator typing → answer → guest typing → thanks → result → transition.
const STEP_DURATION = [1300, 2200, 1800, 1300, 700, 4200, 450] as const;

export function SupportChat() {
  const rootRef = useRef<HTMLDivElement>(null);
  const remainingTime = useRef<number>(STEP_DURATION[0]);
  const reducedMotion = useMarketingReducedMotion();
  const [inView, setInView] = useState(false);
  const [visibleDocument, setVisibleDocument] = useState(true);
  const [timeline, setTimeline] = useState({ conversation: 0, step: 0 });
  const running = inView && visibleDocument && !reducedMotion;
  const step = reducedMotion ? 5 : timeline.step;
  const messages = CONVERSATIONS[reducedMotion ? 0 : timeline.conversation];
  const typing = step === 1 ? "team" : step === 3 ? "you" : null;
  const visibleCount = step >= 4 ? 3 : step >= 2 ? 2 : 1;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    }, { threshold: 0.3 });
    observer.observe(root);
    const handleVisibility = () => setVisibleDocument(!document.hidden);
    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const startedAt = performance.now();
    let completed = false;
    const timeout = window.setTimeout(() => {
      completed = true;
      const nextStep = (timeline.step + 1) % STEP_DURATION.length;
      remainingTime.current = STEP_DURATION[nextStep];
      setTimeline({
        step: nextStep,
        conversation: nextStep === 0
          ? (timeline.conversation + 1) % CONVERSATIONS.length
          : timeline.conversation,
      });
    }, remainingTime.current);
    return () => {
      window.clearTimeout(timeout);
      if (!completed) {
        remainingTime.current = Math.max(0, remainingTime.current - (performance.now() - startedAt));
      }
    };
  }, [running, timeline]);

  return (
    <div className={styles.root} ref={rootRef} data-running={running} data-reduced={reducedMotion}>
      <div className={styles.intro}>
        <div><h3>Поддержка 24/7</h3><p>Две линии поддержки — в одном чате.</p></div>
      </div>

      <div className={styles.window}>
        <div className={styles.header}>
          <span className={styles.avatar} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14v-3a8 8 0 0 1 16 0v3M4 11H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2v-6H4Zm16 0h1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2v-6h1Zm0 6v1a3 3 0 0 1-3 3h-3" /><path d="M11 20h3v2h-3z" /></svg>
          </span>
          <div className={styles.identity}><span>Команда Posadmin</span><small>Telegram или MAX</small></div>
          <span className={styles.status}><i aria-hidden="true" />{typing === "team" ? "печатает…" : "На связи"}</span>
        </div>

        <div className={styles.conversation} key={reducedMotion ? "static" : timeline.conversation} data-leaving={step === 6} aria-live="off">
          <motion.ol layout={!reducedMotion} className={styles.messages} aria-label="Анимация переписки с технической поддержкой">
            <AnimatePresence initial={false} mode="popLayout">
              {messages.slice(0, visibleCount).map((message, index) => (
                <motion.li
                  layout={!reducedMotion ? "position" : false}
                  key={message.text}
                  className={[styles.message, message.from === "you" ? styles.outgoing : styles.incoming].join(" ")}
                  initial={reducedMotion ? false : { opacity: 0, y: 9, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, transition: { duration: reducedMotion ? 0 : 0.15 } }}
                  transition={{ duration: reducedMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className={styles.srOnly}>{message.from === "you" ? "Вы: " : "Posadmin: "}</span>
                  <p>{message.text}</p>
                  <span className={styles.timestamp} aria-hidden="true">{message.time}{message.from === "you" && <svg width="15" height="10" viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="m1 6 4 4 8-8" />{(index > 0 || step > 0) && <path d="m10 10 7-8" />}</svg>}</span>
                </motion.li>
              ))}
              {typing && <motion.li
                layout="position"
                key={`typing-${typing}`}
                className={`${styles.typing} ${typing === "team" ? styles.typingIncoming : styles.typingOutgoing}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={{ duration: 0.25 }}
                aria-hidden="true"
              ><span /><span /><span /></motion.li>}
            </AnimatePresence>
          </motion.ol>
          <div className={styles.resultSlot}>
            <span className={styles.resolved} data-visible={step >= 5} aria-hidden={step < 5}><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m4 8 2.5 2.5L12 5" /><circle cx="8" cy="8" r="6.5" /></svg>Задача решена</span>
          </div>
        </div>
      </div>
    </div>
  );
}
