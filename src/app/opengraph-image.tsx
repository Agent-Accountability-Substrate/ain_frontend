import { ImageResponse } from "next/og";

/**
 * The share card, generated rather than shipped as a binary.
 *
 * `layout.tsx` declares `summary_large_image`, which is a promise that there
 * is a large image to show; without one, X falls back to a bare text card and
 * the first thing a regulated-firm buyer sees of the register is a blank.
 *
 * File-based, so Next resolves it against `metadataBase` and fills in both the
 * Open Graph and Twitter image tags — there is nothing to keep in step by hand
 * in the metadata block.
 *
 * Rendered by Satori, which supports a useful subset of CSS: flex, borders,
 * and background gradients, but no transforms, animations or pseudo-elements.
 * The hero's orbit figure is therefore rebuilt from concentric bordered
 * circles rather than reused from the page.
 */

const INK = "#15161A";
const CREAM = "#F3F0EA";
const ACCENT = "#F0803C";

export const alt =
  "Subra AIN Registry — the accountability register for autonomous agents";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

function ring(inset: number, colour: string, dashed = false) {
  return {
    position: "absolute" as const,
    top: inset,
    left: inset,
    right: inset,
    bottom: inset,
    borderRadius: 9999,
    border: `1px ${dashed ? "dashed" : "solid"} ${colour}`,
  };
}

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: INK,
        padding: "72px 80px",
        position: "relative",
      }}
    >
      {/* The orbit figure, bled off the right edge as it is on the page. */}
      <div
        style={{
          position: "absolute",
          display: "flex",
          top: 96,
          right: -150,
          width: 520,
          height: 520,
        }}
      >
        <div style={ring(0, "rgba(240,128,60,0.55)")} />
        <div style={ring(66, "rgba(243,240,234,0.20)", true)} />
        <div style={ring(146, "rgba(243,240,234,0.13)")} />
        <div
          style={{
            position: "absolute",
            top: 182,
            left: 182,
            width: 156,
            height: 156,
            borderRadius: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage: `linear-gradient(145deg, ${ACCENT}, #4A2C13 55%, #140F09)`,
          }}
        >
          <svg
            width="68"
            height="68"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
          </svg>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <svg width="44" height="44" viewBox="0 0 24 24">
          <path
            fill={CREAM}
            fillRule="evenodd"
            d="M6.4 1.6H17.6A4.8 4.8 0 0 1 22.4 6.4V17.6A4.8 4.8 0 0 1 17.6 22.4H6.4A4.8 4.8 0 0 1 1.6 17.6V6.4A4.8 4.8 0 0 1 6.4 1.6ZM7 6.4H17V8.6H7ZM7 10.9H17V13.1H7Z"
          />
          <rect x="7" y="15.4" width="5.6" height="2.2" fill={ACCENT} />
        </svg>
        <div style={{ display: "flex", color: CREAM, fontSize: 40 }}>Subra</div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          maxWidth: 760,
          fontSize: 76,
          lineHeight: 1.08,
          letterSpacing: "-3px",
          color: CREAM,
        }}
      >
        <div style={{ display: "flex" }}>The accountability register for</div>
        <div style={{ display: "flex", color: ACCENT }}>autonomous agents.</div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "40px",
          color: "rgba(243,240,234,0.42)",
          fontSize: 21,
          letterSpacing: "2px",
        }}
      >
        <div style={{ display: "flex" }}>SIGNED · VERSIONED</div>
        <div style={{ display: "flex" }}>UK / EU RESIDENCY</div>
        <div style={{ display: "flex" }}>NEVER IN THE RUNTIME PATH</div>
      </div>
    </div>,
    size,
  );
}
