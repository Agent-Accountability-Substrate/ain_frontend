import { AgentIdentityDeck } from "@/domains/marketing/agent-identity-deck";
import { LandingPartnerCarousel } from "@/domains/marketing/landing-partner-carousel";
import { RevealHeading } from "@/domains/marketing/reveal";

/**
 * The second beat on the dark stage: one identifier, multiple signed versions.
 */
export function RecordBand() {
  return (
    <section
      id="record"
      className="scroll-mt-24 pt-[clamp(24px,2.8vw,40px)] pb-[clamp(70px,8.6vw,124px)]"
    >
      <div className="mx-auto max-w-[1320px] px-[clamp(20px,3.05vw,44px)]">
        <LandingPartnerCarousel />

        <div className="flex items-baseline justify-between border-t border-site-hair pt-[30px] font-site-mono text-[11px] font-medium uppercase tracking-[0.16em] text-site-cream-soft select-none max-[700px]:flex-col max-[700px]:items-start max-[700px]:gap-2 max-[700px]:text-[10px]">
          <span>One identifier</span>
          <span>Multiple signed versions</span>
        </div>

        <div className="mx-auto text-center">
          <RevealHeading
            lead="Every version it"
            accent="has ever had."
            className="mx-auto mt-[34px] max-w-[24ch] text-[clamp(30px,4.6vw,50px)] leading-[1.06] font-medium tracking-[-0.035em] text-site-cream"
          />

          <p className="mx-auto mt-[18px] max-w-[54ch] text-[16.5px] leading-[1.65] text-site-cream-soft">
            The identifier never changes. The scope and the accountable role do.
            Earlier versions are kept, so what the agent was allowed to do last
            March is still answerable.
          </p>
        </div>

        <AgentIdentityDeck />
      </div>
    </section>
  );
}
