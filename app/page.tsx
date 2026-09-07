import { SiteHeader } from "@/components/site-header";
import { HeroSection } from "@/components/hero-section";
import { GlowLayer } from "@/components/hero-stage";
import { SpecialistsSection } from "@/components/specialists-section";
import { ClientsSection } from "@/components/clients-section";
import { FullPageParallax } from "@/components/full-page-parallax";
import { SupportPricingSection } from "@/components/support-pricing-section";
import { ProductsSection } from "@/components/products-section";

export default function HomePage() {
  return (
    <FullPageParallax header={<SiteHeader />}>
      <div className="relative flex h-svh w-full flex-col overflow-hidden rounded-b-[50px] bg-[#0F0F0A]">
        <GlowLayer />
        <div className="h-20 shrink-0" aria-hidden="true" />
        <HeroSection />
      </div>
      <SpecialistsSection />
      <ClientsSection />
      <SupportPricingSection />
      <ProductsSection />
    </FullPageParallax>
  );
}
