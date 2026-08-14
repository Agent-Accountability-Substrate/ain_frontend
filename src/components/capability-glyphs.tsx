/** The three step glyphs on "How it works", drawn on one 48px grid. */

const S = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export type GlyphProps = { dashed?: boolean };
const outline = (dashed?: boolean) =>
  dashed ? { ...S, strokeDasharray: "3 3" } : S;

function Frame({
  children,
  size = 48,
}: {
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

/** Issued once, never reused: one record holds an identifier; a second is struck through. */
export function GlyphPermanentIdentifier({ dashed }: GlyphProps) {
  return (
    <Frame>
      <rect x="6" y="8" width="20" height="26" rx="3" {...outline(dashed)} />
      <circle cx="16" cy="21" r="2.5" fill="currentColor" />
      <circle cx="34" cy="34" r="5" {...S} />
      <line x1="30" y1="38" x2="38" y2="30" {...S} />
    </Frame>
  );
}

/** Three records stacked: the same depth motif as the register node. */
export function GlyphEveryVersion({ dashed }: GlyphProps) {
  return (
    <Frame>
      <rect x="6" y="6" width="22" height="28" rx="3" {...outline(dashed)} />
      <rect x="11" y="11" width="22" height="28" rx="3" {...outline(dashed)} />
      <rect x="16" y="16" width="22" height="28" rx="3" {...outline(dashed)} />
    </Frame>
  );
}

/** Three separate boxes, each with its own tick; they never arrive merged. */
export function GlyphScopeChecks({ dashed }: GlyphProps) {
  return (
    <Frame>
      <rect x="5" y="6" width="14" height="12" rx="2.5" {...outline(dashed)} />
      <path d="M8.5 12 L11 14.5 L15.5 9.5" {...S} />
      <rect x="5" y="21" width="14" height="12" rx="2.5" {...outline(dashed)} />
      <path d="M8.5 27 L11 29.5 L15.5 24.5" {...S} />
      <rect x="5" y="36" width="14" height="12" rx="2.5" {...outline(dashed)} />
      <path d="M8.5 42 L11 44.5 L15.5 39.5" {...S} />
      <line x1="25" y1="12" x2="43" y2="12" {...S} />
      <line x1="25" y1="27" x2="40" y2="27" {...S} />
      <line x1="25" y1="42" x2="44" y2="42" {...S} />
    </Frame>
  );
}
