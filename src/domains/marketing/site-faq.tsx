"use client";

import { Accordion } from "@base-ui/react/accordion";
import { ArrowUpRight } from "lucide-react";

import { RevealHeading } from "@/domains/marketing/reveal";
import { FAQ_ENTRIES } from "@/domains/marketing/landing-content";

/**
 * Questions from compliance, risk and engineering teams.
 *
 * Base UI's accordion gives the one-open-at-a-time behaviour, the measured
 * height to animate against, and the `aria-controls`/`aria-expanded` wiring
 * without any of it being hand-rolled.
 * `hiddenUntilFound` is what keeps a closed answer in the document rather than
 * unmounted, which is the whole reason the native `<details>` this replaces was
 * worth replacing carefully: the answers are the page's substance, so a crawler,
 * a printed copy and find-in-page all need them present, open or not.
 * The plus turns into a minus by scaling the vertical stroke to nothing, so
 * there is one icon rather than two swapped.
 */
export function SiteFaq() {
  return (
    <section
      id="questions"
      className="scroll-mt-24 border-t border-site-rule py-[clamp(64px,8.2vw,118px)]"
    >
      <div className="mx-auto max-w-[1320px] px-[clamp(20px,3.05vw,44px)]">
        <div className="grid gap-20 [grid-template-columns:minmax(0,0.72fr)_minmax(0,1.28fr)] max-[1000px]:grid-cols-[minmax(0,1fr)] max-[1000px]:gap-[30px]">
          <div>
            <div className="mb-[26px] font-site-mono text-[10.5px] uppercase tracking-[0.16em] text-site-muted select-none">
              Frequently asked
            </div>
            <RevealHeading
              lead="Questions we get from compliance, risk and engineering teams."
              className="max-w-[15ch] text-[clamp(30px,4.6vw,50px)] leading-[1.06] font-medium tracking-[-0.035em] text-site-ink"
            />
          </div>

          <Accordion.Root
            // The first answer is open on arrival, so the section reads as
            // answers rather than as closed rows a visitor has to guess at.
            defaultValue={[FAQ_ENTRIES[0]?.question]}
            // Renders every panel and hides the closed ones with
            // `hidden="until-found"`, which `globals.css` already assumes.
            hiddenUntilFound
            className="border-t border-site-rule"
          >
            {FAQ_ENTRIES.map((entry) => (
              <Accordion.Item
                key={entry.question}
                value={entry.question}
                className="border-b border-site-rule"
              >
                <Accordion.Header className="m-0">
                  <Accordion.Trigger className="group flex w-full cursor-pointer items-baseline justify-between gap-[30px] bg-transparent py-[26px] text-left text-[19px] tracking-[-0.02em] text-site-ink select-none max-[700px]:gap-[18px] max-[700px]:text-[17px]">
                    {entry.question}
                    <span
                      aria-hidden="true"
                      className="relative mt-1.5 h-[13px] w-[13px] flex-none"
                    >
                      <span className="absolute top-1.5 left-0 h-px w-[13px] bg-site-muted" />
                      <span className="absolute top-0 left-1.5 h-[13px] w-px bg-site-muted transition-transform duration-300 ease-site group-data-[panel-open]:scale-y-0" />
                    </span>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel className="site-faq-panel">
                  <p className="m-0 max-w-[62ch] pb-7 text-[16px] leading-[1.7] text-site-ink-soft">
                    {entry.answer}
                  </p>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>

        <div className="mt-[clamp(38px,5vw,64px)] flex justify-end border-t border-site-rule pt-7 max-[1000px]:justify-start">
          <a
            href="#request"
            className="group inline-flex items-center gap-3 text-[15px] font-medium text-site-ink underline decoration-site-rule underline-offset-[6px] transition-colors hover:text-site-accent focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-site-accent"
          >
            Request private preview
            <ArrowUpRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-300 ease-site group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              strokeWidth={1.7}
            />
          </a>
        </div>
      </div>
    </section>
  );
}
