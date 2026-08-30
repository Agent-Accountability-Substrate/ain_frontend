"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type CopyFeedback = "idle" | "copied" | "error";

const FEEDBACK_LABELS: Record<CopyFeedback, string> = {
  idle: "Copy",
  copied: "Copied",
  error: "Copy failed",
};

/**
 * The copy control on its own: the button, and the live region that says what
 * it did.
 *
 * Separate from `CopyableAin` because the public passport card prints the
 * identifier itself — truncated for the eye, in full for a screen reader — and
 * wants only the button beside it. Handing it the composed control instead put
 * the AIN on the card twice, once wrapped over three lines.
 */
export function CopyAinButton({
  value,
  label = "Copy permanent AIN",
}: {
  value: string;
  /** Accessible name for the copy button. Defaults to the passport wording. */
  label?: string;
}) {
  const [feedback, setFeedback] = useState<CopyFeedback>("idle");
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(resetTimer.current);
    },
    [],
  );

  function showFeedback(nextFeedback: Exclude<CopyFeedback, "idle">): void {
    window.clearTimeout(resetTimer.current);
    setFeedback(nextFeedback);
    resetTimer.current = window.setTimeout(() => {
      setFeedback("idle");
    }, 2_000);
  }

  async function copyAin(): Promise<void> {
    if (typeof navigator.clipboard?.writeText !== "function") {
      showFeedback("error");
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      showFeedback("copied");
    } catch {
      showFeedback("error");
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={label}
        onClick={copyAin}
        className="inline-flex shrink-0 items-center gap-2 rounded-sm border border-line-strong bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-secondary hover:text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        {feedback === "copied" ? (
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {FEEDBACK_LABELS[feedback]}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {feedback === "idle" ? "" : FEEDBACK_LABELS[feedback]}
      </span>
    </>
  );
}

/**
 * An AIN a reader can take: the identifier, framed, with the copy control.
 */
export function CopyableAin({
  value,
  label,
  className,
}: {
  value: string;
  /** Accessible name for the copy button. Defaults to the passport wording. */
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-wrap items-center gap-2 rounded-lg border border-line-strong bg-band px-3 py-2",
        className,
      )}
    >
      {/* The identifier itself, not just a button that promises it. It is
          `select-all` because the one thing anyone does with an AIN by hand is
          take the whole string — a partial selection is never useful, and
          `break-all` on 62 characters makes a half-highlight easy. */}
      <code className="min-w-0 flex-1 select-all break-all font-mono text-[11px] font-semibold leading-5 text-ink">
        {value}
      </code>
      <CopyAinButton value={value} label={label} />
    </div>
  );
}
