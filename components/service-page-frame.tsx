import type { ReactNode } from "react";
import Link from "next/link";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { JsonLd } from "./json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";
import styles from "./service-pages.module.css";

export function ServicePageFrame({ children, page = "services" }: { children: ReactNode; page?: "services" | "contacts" | "other" }) {
  return <div className={styles.page} data-header-surface="light">
    <SiteHeader page={page} />
    <main>{children}</main>
    <SiteFooter />
  </div>;
}

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return <>
    <JsonLd data={breadcrumbJsonLd(items)} />
    <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
      <ol>{items.map((item, index) => <li key={item.path}>
        {index === items.length - 1 ? <span aria-current="page">{item.name}</span> : <Link href={item.path}>{item.name}</Link>}
      </li>)}</ol>
    </nav>
  </>;
}

export function ServiceArrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg className={styles.arrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    {diagonal ? <path d="M6 18 18 6M6 6h12v12" /> : <path d="M4 12h16m-6-6 6 6-6 6" />}
  </svg>;
}
