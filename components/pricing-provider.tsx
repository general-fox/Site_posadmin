"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_PRICING } from "@/lib/pricing-config";
import { isPricingSnapshot, type PricingSnapshot } from "@/lib/pricing-snapshot";

const initial: PricingSnapshot = { config: DEFAULT_PRICING, revision: 0, updatedAt: null };
const PricingContext = createContext<{ snapshot: PricingSnapshot; updateSnapshot: (next: PricingSnapshot) => void }>({ snapshot: initial, updateSnapshot: () => {} });

export function PricingProvider({ initialSnapshot, children }: { initialSnapshot: PricingSnapshot; children: ReactNode }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const updateSnapshot = useCallback((next: PricingSnapshot) => {
    if (isPricingSnapshot(next)) setSnapshot((current) => next.revision > current.revision ? next : current);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch("/api/pricing", { cache: "no-store", signal: controller.signal });
        if (response.ok) updateSnapshot(await response.json());
      } catch { /* Keep the last verified prices; submit endpoints check the version. */ }
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [updateSnapshot]);
  const value = useMemo(() => ({ snapshot, updateSnapshot }), [snapshot, updateSnapshot]);
  return <PricingContext.Provider value={value}>{children}</PricingContext.Provider>;
}

export const usePricing = () => useContext(PricingContext);
