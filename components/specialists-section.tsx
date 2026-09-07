"use client";

import { useHydratedReducedMotion } from "@/components/use-hydrated-reduced-motion";
import { SupportChat } from "@/components/support-chat";
import { ServicesTiles } from "@/components/services-tiles";
import { WaveWords } from "@/components/wave-words";
import { useParallaxEntry } from "@/components/full-page-parallax";

const DIVIDER =
  "linear-gradient(180deg, rgba(50,47,47,0) 0%, rgba(50,47,47,0.26) 50%, rgba(50,47,47,0) 100%)";

export function SpecialistsSection() {
  const reduced = useHydratedReducedMotion();
  const parallaxEntry = useParallaxEntry();

  return (
    <section
      id="about"
      className="relative w-full overflow-x-clip bg-[#F5F5ED] font-[family-name:var(--font-inter)]"
    >
      <div className="mx-auto flex min-h-svh w-full max-w-[1440px] flex-col px-4 pt-[120px] pb-24 md:h-svh md:px-10 md:pt-[172px] md:pb-16 xl:px-[120px]">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-[32px] font-medium leading-[36px] tracking-[-0.16px] text-[#313235] sm:text-[40px] sm:leading-[44px] sm:whitespace-nowrap">
            <WaveWords
              key={parallaxEntry}
              text="Профильные специалисты"
              base={0.18}
              duration={1.15}
              reduced={reduced}
            />
          </h2>

          <div className="mt-3 flex max-w-[680px] flex-col items-center text-[14px] leading-[21px] tracking-[0.1px] text-[rgba(49,50,53,0.72)] sm:text-[16px] sm:leading-[24px] sm:tracking-[0.15px]">
            <p>Мы объединяем специалистов разных направлений в одну команду.</p>
            <p className="flex flex-wrap items-center justify-center gap-x-[5px] gap-y-1">
              <span>Все обращения проходят через персональный чат в Telegram</span>
              <img
                src="/specialists/telegram-dark.svg"
                alt=""
                className="size-[20px] shrink-0"
                aria-hidden="true"
              />
              <span>или MAX</span>
              <img
                src="/specialists/max-dark.svg"
                alt=""
                className="size-[17px] shrink-0"
                aria-hidden="true"
              />
            </p>
          </div>

          <div className="mt-4 flex justify-center">
            <a
              href="/about"
              className="light-glass-btn flex items-center justify-center rounded-[50px] px-[28px] py-[8px] font-[family-name:var(--font-montserrat)] text-[14px] font-medium leading-normal whitespace-nowrap text-[#322F2F]"
            >
              Подробнее о нас
            </a>
          </div>
        </div>

        <div className="specialists-lower mt-8 flex w-full flex-col gap-8 md:mt-10 md:min-h-0 md:flex-1 md:flex-row md:gap-4">
          <div className="mx-auto h-[510px] w-full max-w-[390px] shrink-0 md:mx-0 md:h-auto md:w-[340px] xl:w-[390px]">
            <SupportChat />
          </div>

          <div
            className="hidden w-px shrink-0 md:block"
            style={{ background: DIVIDER }}
            aria-hidden
          />

          <div className="min-w-0 flex-1 md:pl-6 xl:pl-10">
            <ServicesTiles />
          </div>
        </div>
      </div>
    </section>
  );
}
