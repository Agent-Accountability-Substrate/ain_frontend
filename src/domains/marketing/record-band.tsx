import { PassportDeck } from "@/domains/marketing/passport-deck";
import { RevealHeading } from "@/domains/marketing/reveal";

/**
 * The second beat on the dark stage: one identifier, three signed versions.
 */
export function RecordBand() {
  return (
    <section
      id="record"
      className="scroll-mt-24 pt-[clamp(24px,2.8vw,40px)] pb-[clamp(70px,8.6vw,124px)]"
    >
      <div className="mx-auto max-w-[1320px] px-[clamp(20px,3.05vw,44px)]">
        <div className="flex items-baseline justify-between border-t border-site-hair pt-[30px] font-site-mono text-[10.5px] uppercase tracking-[0.16em] text-site-cream-dim select-none max-[700px]:flex-col max-[700px]:items-start max-[700px]:gap-2">
          <span>One identifier</span>
          <span>Three signed versions</span>
        </div>

        <RevealHeading
          lead="Every version it"
          accent="has ever had."
          className="mt-[34px] max-w-[24ch] text-[clamp(30px,4.6vw,50px)] leading-[1.06] font-medium tracking-[-0.035em] text-site-cream"
        />

        <p className="mt-[18px] max-w-[54ch] text-[16.5px] leading-[1.65] text-site-cream-soft">
          The identifier never changes. The scope and the accountable role do.
          Earlier versions are kept, so what the agent was allowed to do last
          March is still answerable.
        </p>

        <PassportDeck />
      </div>
    </section>
  );
}
