import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { SiteWordmark } from "@/lib/brand/site-mark";
import { cn } from "@/lib/utils";

/**
 * The bar every page outside the landing page opens with: the wordmark going
 * home, and one link back to wherever the reader came from.
 *
 * Only the ground varies. The legal notices are paper and rule the bar off
 * from the text below; the blog opens on the dark stage the landing hero
 * shares. Type, size and spacing are the same on both, in the mono the rest of
 * the site's chrome uses.
 *
 * On ink, `text-site-cream` is load bearing: the wordmark's "AIN Registry"
 * label and its divider are `currentColor`, which `variant` does not touch,
 * and the blog's `<main>` sets `text-site-ink` — the stage's own background.
 * `relative z-[1]` likewise, since the stage is positioned.
 */
export function SiteBackHeader({
  tone = "paper",
  backHref,
  backLabel,
}: {
  tone?: "paper" | "ink";
  backHref: string;
  backLabel: string;
}) {
  const onInk = tone === "ink";

  return (
    <header
      className={
        onInk
          ? "relative z-[1] text-site-cream"
          : "border-b border-site-rule text-site-ink"
      }
    >
      <div
        className={cn(
          "mx-auto flex max-w-[1120px] items-center justify-between gap-6 px-[clamp(20px,4vw,48px)]",
          onInk ? "py-7" : "py-6",
        )}
      >
        <Link href="/" aria-label="Subra home">
          <SiteWordmark variant={onInk ? "white" : "official"} />
        </Link>
        <Link
          href={backHref}
          className={cn(
            "group inline-flex items-center gap-2 font-site-mono text-[11px] uppercase tracking-[0.13em] transition-colors duration-200 ease-site hover:text-site-accent",
            onInk ? "text-site-cream-soft" : "text-site-ink-soft",
          )}
        >
          <ArrowLeft
            aria-hidden="true"
            className="h-3.5 w-3.5 transition-transform duration-200 ease-site group-hover:-translate-x-0.5"
          />
          {backLabel}
        </Link>
      </div>
    </header>
  );
}
