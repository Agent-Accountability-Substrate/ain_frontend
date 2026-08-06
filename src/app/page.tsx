import { AgentIdentityDeck } from "@/components/agent-identity-deck";
import { HeroEvidenceField } from "@/components/hero-evidence-field";
import { HeroRotatingProofWord } from "@/components/hero-rotating-proof-word";
import { LandingNav } from "@/components/landing-nav";
import { SignInButton } from "@/components/sign-in-button";

export default function HomePage() {
  return (
    <>
      <LandingNav />
      <main className="relative overflow-hidden bg-[#F7FAFF] pb-20">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="hero-proof-stage">
            <HeroEvidenceField />

            <section className="hero-proof-copy mx-auto max-w-4xl text-center">
              <div className="inline-flex rounded-full border border-[#E4E6ED] bg-[#EDF0F7] px-4 py-2 font-medium  text-xs tracking-[0.06em] text-[var(--secondary)]">
                ✨ Accountability infrastructure for autonomous AI
              </div>
              <h1 className="mt-8 text-2xl font-semibold tracking-tight text-[#091126] sm:text-5xl md:text-[44px] lg:text-[62px]">
                Prove which AI agent acted, what it was allowed to do, and{" "}
                <span className="font-instrument italic text-[#091126]">
                  who was <HeroRotatingProofWord />
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-slate-700 sm:text-[16px]">
                Give every consequential agent a permanent identity, signed
                authority record and verifiable action trail - without placing
                another dependency inside its runtime.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <SignInButton className="w-full sm:w-auto px-6 py-3" />
                <a
                  href="#download"
                  className="inline-flex items-center justify-center rounded-[12px] bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
                >
                  Verify an AIN
                </a>
              </div>

              <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                Designed for consequential agent workflows in regulated UK and
                EU organisations.
              </p>
            </section>
          </div>

          <AgentIdentityDeck />

          <section className="mt-8 rounded-[14px] border border-[#E8ECEF] bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--secondary)]">
              Accountability questions
            </p>
            <div className="mt-4 grid gap-3 text-sm text-slate-700">
              <p>Which agent acted?</p>
              <p>Which version governed it?</p>
              <p>What was it authorised to do?</p>
              <p>Who was accountable?</p>
              <p>What evidence can be reviewed?</p>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Regulatory and legal interpretation requires appropriate
              professional review.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-[12px] border border-[#EEF2F4] bg-[#FBFDFF] p-3 text-xs text-slate-700">
                SMCR
              </div>
              <div className="rounded-[12px] border border-[#EEF2F4] bg-[#FBFDFF] p-3 text-xs text-slate-700">
                Consumer Duty
              </div>
              <div className="rounded-[12px] border border-[#EEF2F4] bg-[#FBFDFF] p-3 text-xs text-slate-700">
                EU AI Act
              </div>
            </div>
          </section>

          <section id="feature" className="mt-16 space-y-6">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--secondary)]">
                Core capabilities
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#091126] sm:text-4xl">
                Calm, precise controls for agent operations
              </h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-[24px] border border-[#E4E6ED] bg-white p-6 shadow-sm">
                <p className="text-base font-semibold text-[#091126]">
                  Agent identity mapping
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  A strong registry model that keeps agent references readable
                  and auditable.
                </p>
              </div>
              <div className="rounded-[24px] border border-[#E4E6ED] bg-white p-6 shadow-sm">
                <p className="text-base font-semibold text-[#091126]">
                  Record chain verification
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Link actions together with a traceable record chain for
                  compliance workflows.
                </p>
              </div>
              <div className="rounded-[24px] border border-[#E4E6ED] bg-white p-6 shadow-sm">
                <p className="text-base font-semibold text-[#091126]">
                  Minimal public summary
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  A compact landing experience that highlights core trust
                  signals without noise.
                </p>
              </div>
            </div>
          </section>

          <section
            id="story"
            className="rounded-[24px] border border-[#E4E6ED] bg-[#EDF0F7]/90 p-8"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--secondary)]">
              Our approach
            </p>
            <h3 className="mt-4 text-2xl font-semibold text-[#091126]">
              Built for engineering teams and compliance reviewers alike.
            </h3>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700">
              This landing page is designed to feel technical, credible, and
              product-led. It avoids hype and decoration in favor of clear
              structure, compact verification panels, and focused callouts.
            </p>
          </section>

          <section
            id="download"
            className="flex flex-col gap-6 rounded-[24px] border border-[#E4E6ED] bg-white p-8 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--secondary)]">
                Get started
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-[#091126]">
                Download the AIN Registry schema and onboarding guide.
              </h3>
            </div>
            <a
              href="#"
              className="inline-flex items-center justify-center rounded-[12px] bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              Download now
            </a>
          </section>
        </div>
      </main>
    </>
  );
}
