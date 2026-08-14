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
 */

export const alt =
  "AIN Registry by Subra — the accountability register for autonomous agents";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#091126",
        padding: "80px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div
          style={{
            width: "14px",
            height: "14px",
            backgroundColor: "#F97316",
          }}
        />
        <div
          style={{
            color: "rgba(255,255,255,0.62)",
            fontSize: "24px",
            letterSpacing: "4px",
          }}
        >
          ACCOUNTABILITY REGISTER
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "28px",
        }}
      >
        <div
          style={{
            color: "#FFFFFF",
            fontSize: "72px",
            lineHeight: 1.1,
            letterSpacing: "-2px",
            maxWidth: "900px",
          }}
        >
          The accountability register for autonomous agents.
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: "30px",
            lineHeight: 1.4,
            maxWidth: "860px",
          }}
        >
          Every action traced to the authority it relied on, and to the role
          that answers for it.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid rgba(255,255,255,0.18)",
          paddingTop: "28px",
          color: "rgba(255,255,255,0.55)",
          fontSize: "24px",
        }}
      >
        <div style={{ display: "flex" }}>AIN Registry · Subra</div>
        <div style={{ display: "flex" }}>Built for UK regulated firms</div>
      </div>
    </div>,
    size,
  );
}
