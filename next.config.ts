import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

// Keep a running preview independent from production builds.
const nextConfig = (phase: string): NextConfig => ({
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next" : ".next-build",
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.posadmin.ru" }],
        destination: "https://posadmin.ru/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "private, no-store" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
        ],
      },
    ];
  },
});

export default nextConfig;
