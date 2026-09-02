import type { ReactNode } from "react";

import { Eyebrow } from "@/lib/ui/eyebrow";
import { cn } from "@/lib/utils";

/**
 * The title block at the top of a screen: kicker, heading, optional standfirst.
 *
 * Two sizes, both carried over from the stylesheet this replaces, where four
 * selectors shared one rule for a route heading and three shared another for a
 * wizard step. Keeping them here is what stops the fifth screen inventing a
 * fifth clamp.
 */

const SIZE = {
  page: "text-[clamp(1.65rem,2.5vw,2.2rem)] font-bold leading-[1.1] tracking-[-0.045em]",
  wizard:
    "text-[clamp(1.35rem,2.6vw,2rem)] font-bold leading-[1.1] tracking-[-0.04em]",
} as const;

export function PageHeading({
  eyebrow,
  id,
  size = "page",
  lede,
  className,
  children,
}: {
  eyebrow?: ReactNode;
  id?: string;
  size?: keyof typeof SIZE;
  lede?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h1 id={id} className={cn(SIZE[size], "text-ink")}>
        {children}
      </h1>
      {lede ? (
        <p className="mt-1 max-w-[39rem] text-xs leading-[1.65] text-mist">
          {lede}
        </p>
      ) : null}
    </div>
  );
}
