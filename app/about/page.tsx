import type { Metadata } from "next";
import { AboutPage } from "@/components/about-page";

export const metadata: Metadata = {
  title: "О компании — Posadmin",
  description:
    "Posadmin — единая команда специалистов по автоматизации ресторанов, баров и кафе.",
};

export default function AboutRoute() {
  return <AboutPage />;
}
