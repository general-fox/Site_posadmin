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
        color: "#1D1D1F",
        background: "#FFFFFF",
        fontFamily: "Inter",
        position: "relative",
      }}>
        <div style={{ position: "absolute", right: 76, top: 72, width: 20, height: 20, borderRadius: "50%", background: "#2563EB" }} />
        <div style={{ display: "flex", width: 284, height: 52, transform: "scale(3)", transformOrigin: "left top" }}>
          <SiteLogoMark />
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 55, fontSize: 64, letterSpacing: -2.5, lineHeight: 1.14 }}>
          <span>Автоматизация и поддержка</span>
          <span>ресторанов 24/7</span>
        </div>
        <div style={{ display: "flex", marginTop: 34, fontSize: 27, color: "#595D63" }}>
          r_keeper · IT-сопровождение · Поддержка 24/7
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 27, fontSize: 24 }}>
          <span>posadmin.ru</span>
          <span style={{ color: "#595D63" }}>Рестораны · Кафе · Бары</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Inter", data: font, weight: 400, style: "normal" }],
    },
  );
}
