import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/contacts"];
  return paths.map((path) => ({ url: new URL(path, SITE_URL).toString() }));
}
