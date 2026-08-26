import { cn } from "@/lib/utils";

/**
 * The two figures a registry card wears.
 *
 * Beside `site-mark` for the same reason it is there: the landing deck and the
 * sign-up panel both print a card, and `auth/` cannot import out of the
 * marketing surface. Pasted into both, a change to the glyph reaches one card
 * and quietly leaves the other on the old drawing.
 */

/** The AIN Registry glyph on a card's masthead. */
export function FingerprintGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="block h-3.5 w-3.5"
    >
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
      <path d="M2 12a10 10 0 0 1 18-6" />
      <path d="M2 16h.01" />
      <path d="M21.8 16c.2-2 .131-5.354 0-6" />
      <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
      <path d="M8.65 22c.21-.66.45-1.32.57-2" />
      <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
    </svg>
  );
}

/**
 * The hero's orbit figure, at card scale.
 *
 * `nodes` is the one difference between the two cards that wear it: the deck
 * pulses three of them around the rings, and the sign-up panel does not,
 * because a form is not the place for something moving at the edge of vision.
 * `className` is merged last, so a caller can restack it — the sign-up card
 * sits it a layer lower and takes it out of the pointer's way.
 */
export function CardOrbit({
  className,
  nodes = true,
}: {
  className?: string;
  nodes?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute top-[15%] right-[-11.25%] z-[2] block aspect-square w-[62.5%] opacity-90",
        className,
      )}
    >
      <span className="pass-orbit-ring animate-site-orbit absolute inset-0 rounded-full" />
      <span className="pass-orbit-ring animate-site-orbit-mid absolute inset-[16.7%] rounded-full border-dashed" />
      <span className="pass-orbit-core absolute inset-[35%] flex items-center justify-center rounded-full">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-[44%] w-[44%] text-white/90"
        >
          <path d="M12 8V4H8" />
          <rect width="16" height="12" x="4" y="8" rx="2" />
          <path d="M2 14h2" />
          <path d="M20 14h2" />
          <path d="M15 13v2" />
          <path d="M9 13v2" />
        </svg>
      </span>
      {nodes ? (
        <>
          <span className="animate-site-node absolute top-[13%] left-[26%] h-1.5 w-1.5 rounded-full bg-[var(--pa-soft)] shadow-[0_0_0_5px_color-mix(in_srgb,var(--pa)_11%,transparent),0_0_18px_var(--pa)]" />
          <span className="animate-site-node absolute top-[55%] left-[7%] h-1.5 w-1.5 rounded-full bg-[var(--pa-soft)] shadow-[0_0_0_5px_color-mix(in_srgb,var(--pa)_11%,transparent),0_0_18px_var(--pa)] [animation-delay:700ms]" />
          <span className="animate-site-node absolute right-[12%] bottom-[17%] h-1.5 w-1.5 rounded-full bg-[var(--pa-soft)] shadow-[0_0_0_5px_color-mix(in_srgb,var(--pa)_11%,transparent),0_0_18px_var(--pa)] [animation-delay:1.4s]" />
        </>
      ) : null}
    </span>
  );
}
