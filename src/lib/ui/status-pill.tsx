import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A status, rendered as a status.
 *
 * The tones are named for what they mean rather than for their colour, so a
 * screen cannot accidentally render "rejected" in the success tone by picking a
 * palette entry; and the meaning survives a repaint.
 */
const TONES = {
  neutral: "border-line-strong bg-band text-ink-soft",
  pending: "border-line-strong bg-wash-blue text-cobalt",
  success: "border-success-soft bg-success-wash text-success-strong",
  attention: "border-warm-600/30 bg-warm-wash text-warm-700",
  refused: "border-line-strong bg-line-soft text-mist",
} as const;

export type StatusTone = keyof typeof TONES;

export function StatusPill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
