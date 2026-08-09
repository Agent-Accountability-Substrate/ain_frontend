"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CopyFeedback = "idle" | "copied" | "error";

const FEEDBACK_LABELS: Record<CopyFeedback, string> = {
  idle: "Copy",
  copied: "Copied",
  error: "Copy failed",
};

export function CopyableAin({ value }: { value: string }) {
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
        aria-label="Copy permanent AIN"
        onClick={copyAin}
        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#D8DDE8] bg-white px-3 py-2 text-xs font-semibold text-[#091126] transition hover:border-[#4D6FAD] hover:text-[#4D6FAD] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#091126]"
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
