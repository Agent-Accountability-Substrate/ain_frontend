import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

/**
 * The small tracked-out label above a heading.
 *
 * Fifteen hand-written copies of the same `<p className="dashboard-eyebrow">`
 * existed before this; it is the most repeated presentational element in the
 * workspace, which is exactly the threshold at which a component is cheaper
 * than the repetition.
 */
export function Eyebrow({
  className,
  ...props
}: ComponentPropsWithoutRef<"p">) {
  return (
    <p
      className={cn(
        "text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted",
        className,
      )}
      {...props}
    />
  );
}
