import { ArrowRight } from "lucide-react";

import { Reveal, RevealHeading } from "@/domains/marketing/reveal";
import { SCOPE_DIFF } from "@/domains/marketing/landing-content";
import { cn } from "@/lib/utils";

const SIGN = { context: " ", added: "+", removed: "−" } as const;

const SIDE_FACTS = [
  { label: "Change type", value: "Scope amendment" },
  { label: "Supersedes", value: "v8, retained in full" },
] as const;

/**
 * A scope change as it appears on the record.
 *
 * The `+` and `−` are real characters in their own column rather than colour
 * alone, so the diff survives being pasted into a compliance questionnaire in
 * black and white — which is where a document like this usually ends up.
 */
export function ScopeArtifact() {
  return (
    <section id="scope" className="scroll-mt-24 py-[clamp(64px,8.2vw,118px)]">
      <div className="mx-auto max-w-[1320px] px-[clamp(20px,3.05vw,44px)]">
        <div className="grid items-start gap-[clamp(32px,4.4vw,66px)] [grid-template-columns:minmax(0,0.76fr)_minmax(0,1.24fr)] max-[1000px]:grid-cols-[minmax(0,1fr)] max-[1000px]:gap-[34px]">
          <div>
            <div className="mb-[26px] font-site-mono text-[10.5px] uppercase tracking-[0.16em] text-site-muted select-none">
              Scope change
            </div>
            <RevealHeading
              lead="What a change"
              accent="looks like on the record."
              className="max-w-[14ch] text-[clamp(26px,3.2vw,38px)] leading-[1.06] font-medium tracking-[-0.035em] text-site-ink"
            />
            <p className="mt-5 max-w-[40ch] text-[16.5px] leading-[1.65] text-site-ink-soft">
              The diff is against the version in force. Nothing is edited in
              place, so the question “what was it allowed to do in March” keeps
              an answer.
            </p>

            <dl className="mt-[30px] border-t border-site-rule">
              {SIDE_FACTS.map((fact) => (
                <div
                  key={fact.label}
                  className="flex items-baseline justify-between gap-4 border-b border-site-rule py-[11px]"
                >
                  <dt className="font-site-mono text-[10px] uppercase tracking-[0.13em] text-site-muted">
                    {fact.label}
                  </dt>
                  <dd className="m-0 text-right text-[14px] text-site-ink">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>

            {/* The section's go-deeper link. Sign-up tells firms to book a
                demo first, so every call to action on the page leads to the
                one form. */}
            <a
              href="#request"
              className="mt-[26px] inline-flex items-center gap-[9px] text-[15px] text-site-ink-soft hover:text-site-accent"
            >
              Book a demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          <Reveal className="grid overflow-hidden rounded-[10px] bg-site-ink text-site-cream [grid-template-columns:minmax(0,1.35fr)_minmax(0,1fr)] max-[1000px]:grid-cols-[minmax(0,1fr)]">
            <div className="min-w-0">
              <div className="flex justify-between gap-5 border-b border-site-hair px-6 py-[15px] font-site-mono text-[10.5px] uppercase tracking-[0.14em] text-site-cream-dim max-[560px]:flex-col max-[560px]:gap-[5px] max-[560px]:px-[18px] max-[560px]:py-[13px] max-[560px]:text-[9.5px]">
                <span>Scope diff · v8 → v9</span>
                <span>document_version 9</span>
              </div>
              <ol className="m-0 list-none py-[18px]">
                {SCOPE_DIFF.map((line, index) => (
                  <li
                    key={`${line.kind}-${String(index)}`}
                    className={cn(
                      "grid font-site-mono text-[12.5px] leading-[1.95] [grid-template-columns:30px_minmax(0,1fr)] max-[560px]:text-[10.5px] max-[560px]:leading-[1.85] max-[560px]:[grid-template-columns:22px_minmax(0,1fr)]",
                      line.kind === "added" &&
                        "bg-site-sky/[0.12] text-site-sky",
                      line.kind === "removed" &&
                        "bg-site-rose/10 text-site-rose",
                      line.kind === "context" && "text-site-cream-soft",
                    )}
                  >
                    <span className="text-center opacity-55">
                      {SIGN[line.kind]}
                    </span>
                    <span className="pr-[22px] whitespace-pre-wrap">
                      {line.text}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <aside className="border-l border-site-hair px-7 py-[26px] max-[1000px]:border-t max-[1000px]:border-l-0 max-[560px]:px-[18px] max-[560px]:py-[22px]">
              <div className="font-site-mono text-[10px] uppercase tracking-[0.14em] text-site-cream-dim">
                Accountable
              </div>
              <div className="mt-3.5 text-[21px] font-medium tracking-[-0.025em] text-site-accent">
                Head of Collections
              </div>
              <div className="mt-[5px] font-site-mono text-[11.5px] text-site-cream-dim">
                SMF24-000123 · collections operations
              </div>

              <div className="mt-[26px] border-t border-site-hair pt-4">
                {[
                  { label: "risk class", value: "high", hot: true },
                  { label: "new powers", value: "1", hot: false },
                  { label: "effective", value: "issued_at", hot: false },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between gap-3.5 font-site-mono text-[11.5px] leading-[2.1] text-site-cream-dim"
                  >
                    <span>{row.label}</span>
                    <b
                      className={cn(
                        "font-medium",
                        row.hot ? "text-site-accent" : "text-site-cream-soft",
                      )}
                    >
                      {row.value}
                    </b>
                  </div>
                ))}
              </div>

              <div className="mt-[22px] border-t border-site-hair pt-4 font-site-mono text-[11px] uppercase tracking-[0.08em] text-site-sky">
                Signed · v9 in force
              </div>
            </aside>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
