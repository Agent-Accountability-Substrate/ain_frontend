import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * One number, its label, and a decoration that says whether there is data.
 *
 * The three decorations are `aria-hidden` and carry no meaning of their own —
 * the value beside them is the content. They exist so an empty workspace reads
 * as "nothing yet" rather than as a broken chart.
 */

export type MetricVisual = "segments" | "threshold" | "gauge";

export function MetricCard({
  label,
  value,
  icon: Icon,
  visual,
  empty,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  visual: MetricVisual;
  /** Drives the decoration only; the value is rendered either way. */
  empty: boolean;
}) {
  const state = empty ? "empty" : "active";

  return (
    <article className="flex flex-col rounded-[0.9rem] border border-line bg-panel/95 px-4 pb-3 pt-3.5 shadow-[0_16px_36px_-34px_rgba(9,17,38,0.6)]">
      <div className="flex min-w-0 items-start justify-between gap-2.5">
        <p className="m-0 max-w-56 text-[0.66rem] font-bold leading-[1.45] text-ink">
          {label}
        </p>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.55rem] bg-line-soft text-ink-muted">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-3.5 grid grid-cols-[minmax(4.5rem,auto)_minmax(5rem,1fr)] items-end gap-2.5">
        <strong
          // The line height belongs *after* the font size in each branch.
          // tailwind-merge treats an arbitrary `text-[…]` as conflicting with
          // `leading-*`, so a leading class ahead of it is dropped — and
          // Tailwind v4 emits no line-height of its own for an arbitrary font
          // size, leaving the number at Preflight's 1.5 and half a row taller
          // than the `items-end` grid it sits in. The string branch escaped it
          // only by restating its own leading last.
          className={cn(
            "tracking-[-0.045em] text-ink",
            typeof value === "string"
              ? "max-w-28 text-[clamp(1.15rem,1.6vw,1.45rem)] font-semibold leading-[1.05]"
              : "text-[clamp(1.75rem,2.2vw,2.2rem)] font-medium leading-none",
          )}
        >
          {value}
        </strong>

        <div
          aria-hidden="true"
          data-state={state}
          className="group relative flex h-12 min-w-0 items-end justify-end text-[#315ee8]"
        >
          {visual === "segments" ? (
            <span className="grid w-full grid-cols-6 gap-0.5 pb-2.5">
              {Array.from({ length: 6 }, (_, segment) => (
                <i
                  key={segment}
                  className={cn(
                    "metric-segment",
                    segment === 0 && "group-data-[state=active]:bg-[#315ee8]",
                  )}
                />
              ))}
            </span>
          ) : null}

          {visual === "threshold" ? (
            <>
              <span className="metric-track relative mb-2.5 h-2 w-full overflow-hidden rounded-[2px]">
                <i className="block h-full w-0 bg-[linear-gradient(90deg,#2148cf,#5276ec)] group-data-[state=active]:w-[28%]" />
              </span>
              <span className="absolute bottom-1.5 left-0 h-0 w-0 border-x-[3px] border-t-[5px] border-x-transparent border-t-[#2148cf] group-data-[state=active]:left-[28%]" />
            </>
          ) : null}

          {visual === "gauge" ? (
            <>
              <span className="metric-gauge absolute bottom-2.5 right-1 h-9 w-[4.6rem] overflow-hidden group-data-[state=active]:metric-gauge-needle" />
              <span className="metric-gauge-axis absolute bottom-2 right-0 h-px w-20 bg-[#b9c1cf]" />
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
