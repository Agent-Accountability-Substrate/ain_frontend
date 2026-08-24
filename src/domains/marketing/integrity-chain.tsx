import { Reveal, RevealHeading } from "@/domains/marketing/reveal";
import { CHAIN_ENTRIES } from "@/domains/marketing/landing-content";
import { cn } from "@/lib/utils";

/**
 * The tamper demonstration.
 *
 * Entry 2 has been edited, so it no longer matches its own hash and every
 * entry chained after it fails with it. The table keeps its columns and
 * scrolls on a narrow screen rather than folding into stacked rows — stacking
 * would stop it reading as a chain, which is the only thing it is here to show.
 */
export function IntegrityChain() {
  return (
    <section
      id="integrity"
      className="site-dots site-figures-glow relative scroll-mt-24 overflow-clip bg-site-ink py-[clamp(64px,8.2vw,118px)] text-site-cream"
    >
      <div className="relative z-[1] mx-auto max-w-[1320px] px-[clamp(20px,3.05vw,44px)]">
        <div className="text-center">
          <div className="mb-6 font-site-mono text-[10.5px] uppercase tracking-[0.16em] text-site-cream-dim select-none">
            Integrity
          </div>
          <RevealHeading
            lead="A record you can argue with"
            accent="is not evidence."
            className="mx-auto max-w-[20ch] text-[clamp(32px,4.4vw,52px)] leading-[1.06] font-medium tracking-[-0.035em] text-site-cream"
          />
          <p className="mx-auto mt-6 max-w-[54ch] text-[16.5px] leading-[1.65] text-site-cream-soft">
            Every state change is canonicalised, hashed and signed into an
            append-only ledger, and each entry carries the hash of the one
            before it.
          </p>
        </div>

        <div className="mt-[54px] max-[700px]:overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                {["Event", "Event hash", "Signed", "Chain"].map((heading) => (
                  <th
                    key={heading}
                    className="border-b border-site-hair pr-6 pb-3 font-site-mono text-[10px] font-medium uppercase tracking-[0.14em] text-site-cream-dim last:pr-0 last:text-right max-[700px]:pr-[18px]"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CHAIN_ENTRIES.map((entry) => {
                const broken = entry.verdict !== "Verified";
                return (
                  <Reveal as="tr" key={entry.sequence}>
                    <td className="border-b border-site-cream/[0.07] py-[15px] pr-6 align-top font-site-mono text-[12.5px] whitespace-nowrap text-site-sky max-[700px]:pr-[18px]">
                      {entry.sequence} · {entry.event}
                    </td>
                    <td className="border-b border-site-cream/[0.07] py-[15px] pr-6 align-top font-site-mono text-[12.5px] max-[700px]:pr-[18px]">
                      <span
                        className={cn(
                          "whitespace-nowrap",
                          broken ? "text-site-rose" : "text-site-cream",
                        )}
                      >
                        {entry.hash}
                      </span>
                      <span className="mt-1 block text-[12px] text-site-cream-dim">
                        {entry.previous}
                      </span>
                    </td>
                    <td className="border-b border-site-cream/[0.07] py-[15px] pr-6 align-top font-site-mono text-[12.5px] whitespace-nowrap text-site-cream-dim max-[700px]:pr-[18px]">
                      {entry.signedOn}
                    </td>
                    <td
                      className={cn(
                        "border-b border-site-cream/[0.07] py-[15px] pr-0 text-right align-top font-site-mono text-[10.5px] uppercase tracking-[0.1em]",
                        broken ? "text-site-rose" : "text-site-verified",
                      )}
                    >
                      {entry.verdict}
                    </td>
                  </Reveal>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-8">
          <div className="font-site-mono text-[10.5px] uppercase tracking-[0.14em] text-site-cream-dim">
            If entry 2 is edited
          </div>
          <div className="mt-3 font-site-mono text-[13px] text-site-rose">
            Entry 2 hash no longer matches · 2 entries after it fail
            verification
          </div>
        </div>
      </div>
    </section>
  );
}
