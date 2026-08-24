import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/domains/marketing/reveal";

/** The one conversion point between the hero and the closing ask. */
export function CtaBand() {
  return (
    <section className="border-t border-site-rule">
      <Reveal className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-[clamp(22px,3vw,40px)] px-[clamp(20px,3.05vw,44px)] py-[clamp(30px,4vw,48px)]">
        <p className="m-0 max-w-[42ch] text-[17px] leading-[1.55] text-site-ink">
          Thirty minutes is usually enough to see where your agents sit against
          this.
        </p>
        <div className="flex items-center gap-[clamp(18px,2vw,26px)]">
          <a
            href="#request"
            className="inline-flex items-center justify-center rounded-full bg-site-ink px-[26px] py-[13px] text-[15px] font-medium tracking-[-0.012em] text-site-paper transition-colors duration-300 ease-site hover:bg-black"
          >
            Book a demo
          </a>
          <Link
            href="/signin"
            className="inline-flex items-center gap-[9px] text-[15px] text-site-ink-soft hover:text-site-accent"
          >
            Sign in
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
