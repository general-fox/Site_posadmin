import { SiteHeader } from "@/components/site-header";
import { HeroSection } from "@/components/hero-section";
import { GlowLayer } from "@/components/hero-stage";
import { SpecialistsSection } from "@/components/specialists-section";
import { ClientsSection } from "@/components/clients-section";
import { FullPageParallax } from "@/components/full-page-parallax";
import { SupportPricingSection } from "@/components/support-pricing-section";
import { ProductsSection } from "@/components/products-section";
import { LaunchSection } from "@/components/launch-section";
import { buildPageMetadata, SITE_DESCRIPTION } from "@/lib/seo";
import { getPricingSnapshot } from "@/lib/pricing-store";
import { PricingProvider } from "@/components/pricing-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "Автоматизация ресторанов и сопровождение r_keeper",
  description: SITE_DESCRIPTION,
  path: "/",
});

export default function HomePage() {
  const pricing = getPricingSnapshot();
  return (
    <PricingProvider initialSnapshot={pricing}>
    <FullPageParallax header={<SiteHeader />}>
      <div data-header-surface="dark" className="hero-surface relative flex h-svh w-full flex-col overflow-hidden bg-[var(--hero-background)]">
        <GlowLayer />
        <div className="h-20 shrink-0" aria-hidden="true" />
        <HeroSection />
      </div>
      <SpecialistsSection />
      <ClientsSection />
      <SupportPricingSection />
      <SupportPricingSection service="it" />
      <LaunchSection />
      <ProductsSection />
    </FullPageParallax>
    </PricingProvider>
  );
}
