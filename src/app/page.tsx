import { HeroEvidenceField } from "@/components/hero-evidence-field";
import { LandingAccessForm } from "@/components/landing-access";
import { LandingBoundary } from "@/components/landing-boundary";
import { LandingFaq } from "@/components/landing-faq";
import { LandingHowItWorks } from "@/components/landing-how-it-works";
import { LandingIntegrity } from "@/components/landing-integrity";
import { LandingNav } from "@/components/landing-nav";
import { LandingRegisterEntry } from "@/components/landing-register-entry";
import { LandingScopeChange } from "@/components/landing-scope-change";

export default function HomePage() {
  return (
    <>
      <div className="bg-ink px-4 py-2.5 text-center text-xs font-medium tracking-[0.02em] text-white/90">
        Built for UK regulated firms. Never in your agents&rsquo; runtime path.
      </div>

      <LandingNav />

      <main className="bg-band">
        <section
          id="home"
          className="hero-proof-stage relative overflow-hidden py-20 md:py-32"
        >
          <HeroEvidenceField />

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-32">
            <div className="hero-proof-copy">
              {/* The one ruled eyebrow on the page. It reads as a document
                  header, which is worth doing once and not at every section. */}
              <div className="flex items-baseline gap-4">
                <p className="font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-secondary">
                  Accountability register
                </p>
                <span aria-hidden="true" className="h-px flex-1 bg-line" />
                <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-steel">
                  Private preview
                </p>
              </div>

              <h1 className="mt-8 max-w-[16em] text-balance text-[32px] font-normal leading-[1.04] tracking-[-0.035em] text-ink sm:text-[44px] lg:text-[58px]">
                The accountability register for autonomous agents.
              </h1>

              {/* Says what the register is for, not what it contains. Listing
                  the fields here spent the record section's reveal three
                  screens before it arrives, so that section landed as
                  elaboration rather than as the thing itself. "Built for
                  regulated firms" is dropped: the band above the nav already
                  says it. */}
              <p className="mt-10 max-w-[34em] text-[17px] leading-[1.55] text-slate-700 sm:text-[20px]">
                Every action an agent takes can be traced to the authority it
                relied on, and to the role that answers for it.
              </p>

              <div className="mt-12 flex flex-col gap-3 sm:flex-row md:justify-self-start">
                <a
                  href="#talk"
                  className="inline-flex items-center justify-center rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
                >
                  Request access
                </a>
                <a
                  href="#record"
                  className="inline-flex items-center justify-center rounded-sm border border-line-strong bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-secondary hover:text-secondary"
                >
                  What a record contains
                </a>
              </div>
            </div>
          </div>
        </section>

        <LandingRegisterEntry />

        <LandingScopeChange />

        <LandingHowItWorks />

        <LandingBoundary />

        <LandingIntegrity />

        <LandingFaq />

        <div className="relative overflow-hidden border-t border-line">
          {/* eslint-disable-next-line @next/next/no-img-element -- an SVG
              passes through next/image unoptimized, and this one is
              decorative, mobile-hidden and last on the page, never the LCP. */}
          <img
            src="/media/globe.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 ml-[-76px] hidden w-[860px] max-w-none -translate-y-1/2 select-none opacity-90 md:block"
          />
          <section className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-60 lg:px-8">
            <svg
              width="44"
              height="44"
              viewBox="0 0 44 44"
              aria-hidden="true"
              className="mb-6"
            >
              <circle
                cx="22"
                cy="22"
                r="20"
                fill="none"
                stroke="var(--warm-600)"
                strokeWidth="1.5"
              />
              <circle
                cx="22"
                cy="22"
                r="15"
                fill="none"
                stroke="var(--warm-600)"
                strokeWidth="1"
                strokeDasharray="2 4"
                opacity="0.7"
              />
              <rect
                x="15"
                y="13"
                width="14"
                height="18"
                rx="2.5"
                fill="none"
                stroke="#091126"
                strokeWidth="1.5"
              />
              <circle cx="22" cy="22" r="2.5" fill="var(--warm-500)" />
            </svg>

            <h2 className="max-w-[20ch] text-balance text-[32px] font-normal leading-[1.06] tracking-[-0.03em] text-ink sm:text-[42px] lg:text-[52px]">
              Register the agent before you have to explain it.
            </h2>
            <p className="mt-5 max-w-[65ch] text-base leading-7 text-slate-700">
              If you can name the person accountable for an agent but cannot
              point to the record that binds them to its authorised scope, that
              is the gap we are building against.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                Start now
              </a>
              <a
                href="mailto:contact@subrahq.com?subject=AIN%20Registry"
                className="inline-flex items-center justify-center rounded-sm border border-line-strong bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-secondary hover:text-secondary"
              >
                Let&rsquo;s connect
              </a>
            </div>
          </section>
        </div>
      </main>

      {/*
        For a regulated buyer the footer is where checkable legal facts live
        (Plaid prints its FCA number, company number and LEI there), so a page
        that simply stops at the last section reads as an absence rather than
        as restraint. The entity block below is deliberately empty rather than
        invented; see the TODO.
      */}
      <footer className="border-t border-line bg-white">
        <div
          id="talk"
          className="mx-auto max-w-7xl border-b border-line px-4 py-14 sm:px-6 lg:px-8"
        >
          <LandingAccessForm />
        </div>

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:px-8">
          <div>
            <p className="text-sm font-semibold text-ink">AIN Registry</p>
            <p className="mt-3 max-w-[52ch] text-sm leading-6 text-slate-600">
              The accountability register for autonomous agents. Built for UK
              regulated firms, and never in your agents&rsquo; runtime path.
            </p>
            {/*
              TODO(valentin): REQUIRED BEFORE LAUNCH. Registered company name
              and number, registered address, and the ICO registration if one
              applies. This is the first thing a compliance reviewer looks for
              and the last thing that should be guessed at, so nothing is
              printed here until you supply it.
            */}
          </div>

          <nav aria-label="Footer" className="grid gap-3 sm:grid-cols-2">
            <a
              href="#how-it-works"
              className="text-sm text-slate-600 transition hover:text-ink"
            >
              How it works
            </a>
            <a
              href="#integrity"
              className="text-sm text-slate-600 transition hover:text-ink"
            >
              Integrity
            </a>
            <a
              href="#record"
              className="text-sm text-slate-600 transition hover:text-ink"
            >
              See a record
            </a>
            <a
              href="mailto:contact@subrahq.com?subject=AIN%20Registry"
              className="text-sm text-slate-600 transition hover:text-ink"
            >
              contact@subrahq.com
            </a>
          </nav>
        </div>

        <div className="mx-auto max-w-7xl border-t border-line-soft px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-xs text-slate-500">
            UK / EU data residency. Signing keys never leave the trust boundary.
          </p>
        </div>
      </footer>
    </>
  );
}
