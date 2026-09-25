import { AboutPage } from "@/components/about-page";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "О компании",
  description:
    "Команда Posadmin: специалисты по r_keeper, IT-инфраструктуре и автоматизации ресторанов, кафе и баров. Поддержка 24/7 и единый чат для решения задач.",
  path: "/about",
});

export default function AboutRoute() {
  return <>
    <JsonLd data={breadcrumbJsonLd([
      { name: "Главная", path: "/" },
      { name: "О компании", path: "/about" },
    ])} />
    <AboutPage />
  </>;
}
