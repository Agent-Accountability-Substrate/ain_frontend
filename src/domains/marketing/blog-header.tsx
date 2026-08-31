import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { SiteWordmark } from "@/lib/brand/site-mark";

/**
 * The bar at the top of the index and of a post.
 *
 * Sits on the dark block both pages open with, so it is cream on ink like the
 * footer rather than ink on paper like the landing nav. `variant="white"`
 * carries the wordmark across; the mark's square is `currentColor` and inverts
 * with it.
 */
export function BlogHeader({
  backHref,
  backLabel,
}: {
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="relative z-[1] mx-auto flex max-w-[1120px] items-center justify-between gap-6 px-[clamp(20px,4vw,48px)] py-7">
      <Link href="/" aria-label="Subra home">
        <SiteWordmark variant="white" />
      </Link>
      <Link
        href={backHref}
        className="group inline-flex items-center gap-2 font-site-mono text-[11px] uppercase tracking-[0.13em] text-site-cream-soft transition-colors duration-200 hover:text-site-accent"
      >
        <ArrowLeft
          aria-hidden="true"
          className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
        />
        {backLabel}
      </Link>
    </div>
  );
}
