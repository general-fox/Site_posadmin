import type { MetadataRoute } from "next";
import { SERVICES } from "@/lib/services";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/about", "/services", "/contacts"];
  return [
    ...paths.map((path) => ({ url: new URL(path, SITE_URL).toString() })),
    ...SERVICES.map((service) => ({
      url: `${SITE_URL}/services/${service.slug}`,
    })),
  ];
}
