import { notFound, permanentRedirect } from "next/navigation";
import { SERVICES } from "@/lib/services";

type Props = { params: Promise<{ slug: string }> };

const supportDestinations: Record<string, string> = {
  "soprovozhdenie-r-keeper": "/#pricing",
  "it-administrirovanie": "/#it-pricing",
  "vyezdnoe-soprovozhdenie": "/#pricing",
};

export function generateStaticParams() {
  return SERVICES.map(({ slug }) => ({ slug }));
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  if (!SERVICES.some((service) => service.slug === slug)) notFound();

  permanentRedirect(supportDestinations[slug] ?? "/#launch");
}
