import { RevealHeading } from "@/domains/marketing/reveal";

const CHIPS = [
  "UK / EU data residency",
  "Never in your agents’ runtime path",
  "Signed, versioned, permanently held",
] as const;

/**
 * The orbiting figure at the hero's shoulder.
 *
 * Its box is a fixed 620px and the rings are placed by `inset`, so below
 * 1000px it is scaled rather than resized — resizing would lose the ratios
 * between the three rings and the core. The right offset cancels the stage's
 * own inset so the figure holds still while the stage opens out underneath it.
 */
function HeroOrbits() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-[210px] right-[calc(-300px-var(--site-inset)*(1-var(--expand)))] z-0 h-[620px] w-[620px] origin-[100%_0] max-[1000px]:scale-[0.72] max-[700px]:top-10 max-[700px]:right-[calc(-155px-var(--site-inset)*(1-var(--expand)))] max-[700px]:scale-50 max-[700px]:opacity-50"
    >
      <span className="site-ring animate-site-orbit inset-0" />
      <span className="site-ring site-ring-pale inset-[78px] border-dashed border-site-cream/20 animate-site-orbit-mid" />
      <span className="site-ring inset-[174px] border-site-cream/[0.13] animate-site-orbit-slow" />
      <span className="site-core absolute inset-[268px] rounded-full" />
      <span className="site-node absolute top-[13%] left-[26%] h-[7px] w-[7px] rounded-full bg-site-accent" />
      <span className="site-node absolute top-[55%] left-[7%] h-[7px] w-[7px] rounded-full bg-site-accent [animation-delay:700ms]" />
      <span className="site-node absolute right-[12%] bottom-[17%] h-[7px] w-[7px] rounded-full bg-site-accent [animation-delay:1.4s]" />
    </div>
  );
}

export function SiteHero() {
  return (
    <section className="relative pt-[clamp(66px,9vw,130px)] pb-[clamp(64px,8.2vw,118px)]">
      <HeroOrbits />

      <div className="relative z-[1] mx-auto max-w-[1320px] px-[clamp(20px,3.05vw,44px)]">
        <div className="grid items-end gap-[92px] [grid-template-columns:minmax(0,1.42fr)_minmax(0,0.78fr)] max-[1000px]:grid-cols-[minmax(0,1fr)] max-[1000px]:gap-11">
          <div>
            <div
              className="mb-9 flex items-center gap-[13px] font-site-mono text-[11px] font-medium uppercase tracking-[0.16em] text-site-cream-soft select-none max-[560px]:mb-7 max-[560px]:flex-wrap max-[560px]:gap-[9px] max-[560px]:text-[10px]"
              data-testid="hero-eyebrow"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-site-accent" />
              Evidence and accountability for consequential AI agents
              <span className="h-px flex-none basis-[46px] bg-site-hair max-[560px]:basis-4" />
              Beta
            </div>
            <RevealHeading
              level={1}
              lead="Evidence for every consequential action"
              accent="an AI agent takes."
              className="max-w-[15ch] text-[clamp(38px,7.4vw,80px)] leading-[1.02] font-medium tracking-[-0.038em] text-site-cream"
            />
          </div>

          <div>
            <p className="mb-[30px] max-w-[40ch] text-[17px] leading-[1.62] text-site-cream-soft">
              Subra binds each consequential action to the identity presented,
              the organisation, the accountable owner, the declared scope, and
              the policy and model versions in force - then produces signed
              evidence that can be checked independently later, by someone else.
            </p>
            <div className="flex flex-wrap items-center gap-6 max-[560px]:flex-col max-[560px]:items-stretch max-[560px]:gap-[18px]">
              <a
                href="#request"
                className="inline-flex items-center justify-center rounded-full border border-transparent bg-site-cream px-[26px] py-[13px] text-[15px] font-medium tracking-[-0.012em] text-site-ink transition-colors duration-300 ease-site hover:bg-[#dfdbd2]"
              >
                Book a demo
              </a>
              <a
                href="#record"
                className="inline-flex items-center justify-center rounded-full border border-site-cream/[0.16] px-[26px] py-[13px] text-[15px] font-medium tracking-[-0.012em] text-site-cream-soft transition-colors duration-300 ease-site hover:border-site-cream/55 hover:text-site-cream"
              >
                See what a record contains
              </a>
            </div>
          </div>
        </div>

        <div className="mt-[clamp(38px,6vw,86px)] flex flex-wrap gap-3 select-none">
          {CHIPS.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-[9px] rounded-full border border-site-hair px-[18px] py-[9px] font-site-mono text-[11px] text-site-cream-soft"
            >
              <span className="h-1 w-1 rounded-full bg-site-accent" />
              {chip}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
