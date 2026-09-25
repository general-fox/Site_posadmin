import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { SiteLogoMark } from "@/components/site-logo-mark";

export const alt = "Posadmin — автоматизация ресторанов и поддержка r_keeper";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default async function OpenGraphImage() {
  const font = await readFile(
    path.join(process.cwd(), "assets/fonts/pdf/Inter-Regular.ttf"),
  );

  return new ImageResponse(
    (
      <div style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: "64px 76px",
        color: "#322f2b",
        background: "#f5f5ed",
        fontFamily: "Inter",
        position: "relative",
      }}>
        <div style={{ position: "absolute", right: -75, top: -95, width: 510, height: 510, borderRadius: "50%", background: "#ecc39b", opacity: 0.45 }} />
        <div style={{ display: "flex", width: 284, height: 52, transform: "scale(3)", transformOrigin: "left top" }}>
          <SiteLogoMark />
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 55, fontSize: 64, letterSpacing: -2.5, lineHeight: 1.14 }}>
          <span>Автоматизация ресторанов.</span>
          <span>Вся команда в одном чате.</span>
        </div>
        <div style={{ display: "flex", marginTop: 34, fontSize: 27, color: "#646456" }}>
          r_keeper · IT-сопровождение · Поддержка 24/7
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 27, borderTop: "1px solid #c3c3ad", fontSize: 24 }}>
          <span>posadmin.ru</span>
          <span style={{ color: "#6b6b3b" }}>Рестораны · Кафе · Бары</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Inter", data: font, weight: 400, style: "normal" }],
    },
  );
}
