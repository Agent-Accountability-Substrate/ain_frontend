"use client";

import { Check } from "lucide-react";
import { useActionState } from "react";

import { RevealHeading } from "@/domains/marketing/reveal";
import {
  requestAccessAction,
  type AccessRequestState,
} from "@/domains/marketing/access-request";
import { PARTNER_EMAIL } from "@/domains/marketing/landing-content";

const INITIAL: AccessRequestState = { status: "idle" };

/**
 * The closing ask — the one thing every "Book a demo" on the page leads to.
 *
 * Two fields and a honeypot. The honeypot is rendered off-screen rather than
 * `display: none`, because a bot that reads computed styles skips the latter;
 * a human never sees it either way, so the mockup's design is unaffected by
 * its presence.
 */
export function AccessForm() {
  const [state, formAction, pending] = useActionState(
    requestAccessAction,
    INITIAL,
  );

  const sent = state.status === "sent";
  const failed = state.status === "error";

  return (
    <section
      id="request"
      className="scroll-mt-24 border-t border-site-rule pt-[clamp(70px,8.8vw,126px)] pb-[clamp(60px,7.5vw,108px)]"
    >
      <div className="mx-auto max-w-[1320px] px-[clamp(20px,3.05vw,44px)]">
        <div className="site-dots relative grid items-start gap-[clamp(30px,4.4vw,64px)] overflow-hidden rounded-[clamp(14px,1.8vw,26px)] bg-site-ink p-[clamp(32px,4.6vw,66px)] text-site-cream [grid-template-columns:minmax(0,1.02fr)_minmax(0,0.98fr)] after:pointer-events-none after:absolute after:inset-0 after:z-0 after:bg-[radial-gradient(58%_46%_at_92%_112%,rgba(255,233,198,0.1),transparent_72%)] after:content-[''] max-[1000px]:grid-cols-[minmax(0,1fr)]">
          <div className="relative z-[1]">
            <div className="mb-[22px] font-site-mono text-[10.5px] uppercase tracking-[0.16em] text-site-cream-dim select-none">
              Book a demo
            </div>
            <RevealHeading
              lead="Register the agent"
              accent="before you have to explain it."
              className="max-w-[15ch] text-[clamp(28px,3.9vw,44px)] leading-[1.06] font-medium tracking-[-0.035em] text-site-cream"
            />
            <p className="mt-5 max-w-[40ch] text-[16px] leading-[1.62] text-site-cream-soft">
              If you can name the person accountable for an agent but cannot
              point to the record that binds them to its authorised scope, that
              is the gap we are building against.
            </p>
          </div>

          <form action={formAction} className="relative z-[1] m-0">
            <div className="grid grid-cols-2 gap-4 max-[700px]:grid-cols-[minmax(0,1fr)] max-[700px]:gap-[14px]">
              <div>
                <label
                  className="block font-site-mono text-[10px] uppercase tracking-[0.14em] text-site-cream-dim"
                  htmlFor="access-name"
                >
                  Full name
                </label>
                <div className="mt-[13px] flex items-center gap-2 rounded-full border border-site-hair bg-site-cream/5 px-5 py-1 transition-[border-color,background-color] duration-200 ease-[ease] hover:border-site-cream/[0.26] focus-within:border-site-cream focus-within:bg-site-cream/10">
                  <input
                    id="access-name"
                    name="name"
                    type="text"
                    required
                    maxLength={200}
                    autoComplete="name"
                    defaultValue={failed ? state.name : ""}
                    placeholder="Ada Lovelace"
                    className="min-w-0 flex-1 border-0 bg-transparent py-[11px] font-site-mono text-[14px] text-site-cream outline-none placeholder:text-site-cream-dim"
                  />
                </div>
              </div>

              <div>
                <label
                  className="block font-site-mono text-[10px] uppercase tracking-[0.14em] text-site-cream-dim"
                  htmlFor="access-email"
                >
                  Work email
                </label>
                <div className="mt-[13px] flex items-center gap-2 rounded-full border border-site-hair bg-site-cream/5 px-5 py-1 transition-[border-color,background-color] duration-200 ease-[ease] hover:border-site-cream/[0.26] focus-within:border-site-cream focus-within:bg-site-cream/10">
                  <input
                    id="access-email"
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    defaultValue={failed ? state.email : ""}
                    placeholder="name@firm.co.uk"
                    className="min-w-0 flex-1 border-0 bg-transparent py-[11px] font-site-mono text-[14px] text-site-cream outline-none placeholder:text-site-cream-dim"
                  />
                </div>
              </div>
            </div>

            {/* Off-screen rather than hidden: a bot that reads computed styles
                skips `display: none`, and fills every field it can find. */}
            <label className="sr-only" htmlFor="access-company">
              Company (leave this field empty)
            </label>
            <input
              id="access-company"
              name="company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute left-[-9999px] h-px w-px opacity-0"
            />

            <button
              type="submit"
              disabled={pending}
              className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-full bg-site-accent px-[26px] py-[13px] text-[15px] font-medium tracking-[-0.012em] text-[#1b0e04] transition-colors duration-300 ease-site hover:bg-[#ff9552] disabled:opacity-70 max-[700px]:w-full"
            >
              {pending ? "Sending…" : "Book a demo"}
            </button>

            <p
              aria-live="polite"
              className="mt-4 flex max-w-[44ch] items-start gap-[9px] pl-0.5 text-[13.5px] leading-[1.6] text-site-cream-dim"
            >
              {sent ? (
                <>
                  <Check
                    className="mt-1 h-[13px] w-[13px] flex-none text-site-verified"
                    aria-hidden="true"
                  />
                  <span>
                    Thank you — that reached us. We reply with a couple of times
                    that work, usually within a few hours.
                  </span>
                </>
              ) : failed ? (
                <span className="text-site-rose">{state.message}</span>
              ) : (
                <>
                  <Check
                    className="mt-1 h-[13px] w-[13px] flex-none text-site-verified"
                    aria-hidden="true"
                  />
                  <span>
                    We reply with a couple of times that work, usually within a
                    few hours — or write to{" "}
                    <a
                      href={`mailto:${PARTNER_EMAIL}`}
                      className="text-site-cream-soft underline underline-offset-[3px] hover:text-site-accent"
                    >
                      {PARTNER_EMAIL}
                    </a>
                    .
                  </span>
                </>
              )}
            </p>

            <p className="mt-[26px] max-w-[46ch] border-t border-site-hair pt-[18px] font-site-mono text-[10.5px] leading-[1.7] text-site-cream-dim">
              Subra is not regulatory advice and is not endorsed by or
              affiliated with any regulator.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
