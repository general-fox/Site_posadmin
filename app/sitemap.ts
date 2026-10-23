import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/about", "/contacts"];
  return paths.map((path) => ({ url: new URL(path, SITE_URL).toString() }));
}
