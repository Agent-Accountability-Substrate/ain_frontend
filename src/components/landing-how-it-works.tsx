import { AgentIdentityDeck } from "./agent-identity-deck";
import {
  GlyphEveryVersion,
  GlyphPermanentIdentifier,
  GlyphScopeChecks,
} from "./capability-glyphs";

const STEP_GLYPHS = [
  GlyphPermanentIdentifier,
  GlyphEveryVersion,
  GlyphScopeChecks,
] as const;

const STEPS = [
  {
    step: "01",
    title: "Register the agent, and the human",
    body: "The agent is issued a permanent identifier. What it is allowed to do, and who answers for it, are bound into one document.",
  },
  {
    step: "02",
    title: "Sign it, and keep every version",
    body: "The document is signed. Changing scope or owner writes a new signed version and keeps the old one, so what was true last March is still answerable.",
  },
  {
    step: "03",
    title: "Ask three questions, get three answers",
    body: "Was the agent active? Is its record intact? Was this action authorised? A valid identity is not the same answer as an authorised action, so they never arrive merged.",
  },
] as const;

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-line bg-wash-blue">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-32 lg:px-8">
        <p className="font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-secondary">
          How it works
        </p>
        <h2 className="mt-6 max-w-[30ch] text-balance text-[32px] font-normal leading-[1.06] tracking-[-0.03em] text-ink sm:text-[42px] lg:text-[52px]">
          One record, signed once, answerable later.
        </h2>

        <ol className="mt-14 grid gap-10 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-line">
          {STEPS.map((step, index) => {
            const Glyph = STEP_GLYPHS[index]!;

            return (
              <li
                key={step.step}
                className="border-t border-line-soft pt-8 first:border-t-0 first:pt-0 lg:border-t-0 lg:px-10 lg:pt-0 lg:first:pl-0 lg:last:pr-0"
              >
                <div className="flex items-end justify-between text-ink">
                  <span className="font-mono text-[44px] font-medium leading-none tracking-[-0.02em] text-slate-500">
                    {step.step}
                  </span>
                  <Glyph />
                </div>
                <h3 className="mt-6 text-lg font-medium leading-snug text-ink">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-[42ch] text-base leading-7 text-slate-700">
                  {step.body}
                </p>
              </li>
            );
          })}
        </ol>

        {/* Attached to step 02, which claims the register "keeps the old one".
          A paragraph cannot show a version chain; three cards can. The deck is
          an artifact, so it keeps its frame — the steps above gave theirs up. */}
        <AgentIdentityDeck />
      </div>
    </section>
  );
}
