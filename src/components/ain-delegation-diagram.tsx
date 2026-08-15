"use client";

/**
 * What the register binds, what it only points at, and what it does not
 * connect at all.
 *
 * The three relationships on screen are the three the schema actually has.
 * An accountable role is bound into the signed document, so that edge is
 * drawn solid. An external identity is a `{ref_type, ref_value}` entry on the
 * document — a pointer at something the firm owns — so that edge is dashed and
 * labelled as a reference. A second agent is registered in its own right and
 * **nothing links it to the first**: there is no parent, child or delegation
 * relationship anywhere in the schema, so it gets no edge. The missing line is
 * the point.
 *
 * Revocation is a status on a record, which is why it happens *to* the
 * referenced identity rather than travelling down the edge to it.
 */

import { useFigureFrames } from "@/hooks/use-figure-frames";
import { beat, ease, ramp, show } from "@/lib/figure-motion";

const CARD_R = 2;

const G = {
  person: { x: 0, y: 176, w: 250, h: 90 },
  record: { x: 396, y: 88, w: 348, h: 262 },
  related: { x: 892, w: 260, h: 108, ys: [76, 252] },
  signedNode: { x: 688, y: 83, size: 10 },
} as const;

const PERSON_MID = G.person.y + G.person.h / 2;
const REFERENCE_MID = G.related.ys[1]! + G.related.h / 2;
const REFERENCE_MID_X = (G.record.x + G.record.w + G.related.x) / 2;

// architecture.md:147 verbatim, with its constraint nested under the class it
// bounds — max_value_gbp is a limit on a permitted action, not a prohibition,
// so it is indented and neutral rather than a red peer.
const SCOPE = [
  { label: "customer_comms.send", kind: "action" },
  { label: "payments.initiate", kind: "action" },
  { label: "max_value_gbp 5000", kind: "constraint" },
] as const;

const RELATED = [
  {
    id: "did:ain:gb:…:01C4TR9M",
    eyebrow: "OWN RECORD",
    note: "own AIN · own signed scope",
    bars: 2,
    referenced: false,
  },
  {
    id: "spiffe://…/ledger-api",
    eyebrow: "REFERENCED",
    note: "revoked 09:41:22Z",
    bars: 1,
    referenced: true,
  },
] as const;

/**
 * An edge and the three things layered over it: the accent overlay that stays
 * lit once the relationship is made, the segment that runs along it, and the
 * head at that segment's front. The base line is always present — only the
 * overlay and the packet are timed.
 */
function Edge({
  name,
  x0,
  x1,
  y,
  dashed = false,
}: {
  name: string;
  x0: number;
  x1: number;
  y: number;
  dashed?: boolean;
}) {
  const d = `M${x0} ${y} L${x1} ${y}`;
  return (
    <g data-dl-edge={name} data-dl-x0={x0} data-dl-x1={x1} data-dl-y={y}>
      {/* The line is there from the first frame. What travels along it is the
          packet; what remains afterwards is the accent overlay. */}
      <path
        data-dl-base
        d={d}
        stroke="var(--dl-edge)"
        strokeWidth="1.25"
        strokeDasharray={dashed ? "4 5" : undefined}
        fill="none"
      />
      <path
        data-dl-settled
        d={d}
        opacity="0"
        stroke="var(--dl-accent)"
        strokeWidth="1.4"
        fill="none"
      />
      <path
        data-dl-lead
        opacity="0"
        stroke="var(--dl-accent)"
        strokeWidth="1.6"
        fill="none"
      />
      <rect
        data-dl-head
        opacity="0"
        y={y - 3}
        width="6"
        height="6"
        fill="var(--dl-accent)"
      />
    </g>
  );
}

export function AinDelegationDiagram({
  inverted = false,
}: {
  inverted?: boolean;
}) {
  // Beats are the reference's own, converted through `beat()`: a 9-unit cycle
  // is 15 real seconds. Every card, label and line is present from the first
  // frame and stays — what moves is the authority crossing to the record, the
  // classes filling, the reference being taken up, and its withdrawal.
  const ref = useFigureFrames<HTMLElement>(beat(9), beat(6.5), (t, root) => {
    const q = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
    const all = <T extends Element>(sel: string) =>
      Array.from(root.querySelectorAll<T>(sel));

    /**
     * Runs the packet along an edge that is already drawn. Below 1 a short
     * accent segment trails a square head; at 1 the accent overlay stays lit,
     * which is how a made relationship reads as made.
     */
    const runEdge = (name: string, p: number, dead = false) => {
      const edge = q<SVGGElement>(`[data-dl-edge="${name}"]`);
      const at = (f: number) => {
        const x0 = Number(edge.dataset["dlX0"]);
        return x0 + (Number(edge.dataset["dlX1"]) - x0) * f;
      };
      const y = Number(edge.dataset["dlY"]);
      const running = p > 0 && p < 1 && !dead;

      show(edge.querySelector("[data-dl-settled]")!, p >= 1 && !dead);
      show(edge.querySelector("[data-dl-lead]")!, running);
      show(edge.querySelector("[data-dl-head]")!, running);

      if (running) {
        edge
          .querySelector("[data-dl-lead]")!
          .setAttribute(
            "d",
            `M${at(Math.max(0, p - 0.18))} ${y} L${at(p)} ${y}`,
          );
        edge
          .querySelector("[data-dl-head]")!
          .setAttribute("x", String(at(p) - 3));
      }
    };

    runEdge("bind", ease(ramp(t, beat(0.55), beat(1.15))));

    // The stamp fades over its own beat rather than snapping on.
    q<SVGGElement>("[data-dl-signed]").style.opacity = String(
      ease(ramp(t, beat(1.2), beat(1.34))),
    );

    /** Fills a rect inside its outline, the way the reference does: the width
     *  grows, so the container reads as filling rather than the bar growing. */
    const fill = (el: SVGRectElement, p: number) =>
      el.setAttribute("width", String(Number(el.dataset["dlW"]) * p));

    all<SVGRectElement>("[data-dl-scope-fill]").forEach((el, i) => {
      fill(el, ease(ramp(t, beat(1.5 + i * 0.22), beat(2.2 + i * 0.22))));
    });

    const revoked = ease(ramp(t, beat(4.6), beat(4.86)));

    all<SVGRectElement>("[data-dl-bar-fill]").forEach((el) => {
      const start = Number(el.dataset["dlAt"]);
      const filled = ease(ramp(t, beat(start), beat(start + 0.24)));
      const drained = el.hasAttribute("data-dl-revocable-bar") ? revoked : 0;
      fill(el, filled * (1 - drained));
    });

    runEdge("reference", ease(ramp(t, beat(2.85), beat(3.35))), t > beat(4.6));
    show(q("[data-dl-reference-label]"), t <= beat(4.6));

    // Withdrawal marks the edge it belongs to and stamps the record.
    show(q("[data-dl-withdrawn]"), t > beat(4.6), revoked);
    q<SVGGElement>("[data-dl-revocable]").style.opacity = String(
      1 - revoked * 0.45,
    );
    show(q("[data-dl-revoked-note]"), t > beat(4.75));
  });

  return (
    <figure
      ref={ref}
      className={`ain-delegation-diagram mt-14 ${
        inverted ? "ain-delegation-diagram--inverted" : ""
      }`}
    >
      {/* Inset past the geometry on every side: flush to 0 and 1152 the outer
          cards lost half their stroke. */}
      <svg
        viewBox="-14 -10 1180 440"
        className="h-auto w-full"
        role="img"
        aria-label="The Head of Collections, SMF24-000123, is bound into one agent record. The record carries a permanent AIN at version 9, an authorised scope of customer_comms.send and payments.initiate with a max_value_gbp constraint of 5000, and an in-force date; versions 7 and 8 are retained behind it. It references an external identity the firm owns, shown revoked. A second agent is registered in its own right, with no line to the first: the register holds no relationship between them."
      >
        {/* ── Accountability ─────────────────────────────────────────────── */}
        <g data-dl-person>
          <text x={G.person.x} y={G.person.y - 16} className="dl-eyebrow">
            ACCOUNTABILITY
          </text>
          <rect
            x={G.person.x}
            y={G.person.y}
            width={G.person.w}
            height={G.person.h}
            rx={CARD_R}
            fill="var(--dl-card-fill)"
            stroke="var(--dl-card-stroke)"
          />
          <text
            x={G.person.x + 22}
            y={G.person.y + 36}
            className="dl-micro-accent"
          >
            SMF24-000123
          </text>
          <text x={G.person.x + 22} y={G.person.y + 66} className="dl-name">
            Head of Collections
          </text>
        </g>

        {/* The role is a field inside the signed payload, not a signer. */}
        <Edge
          name="bind"
          x0={G.person.x + G.person.w}
          x1={G.record.x}
          y={PERSON_MID}
        />
        <text
          x={(G.person.x + G.person.w + G.record.x) / 2}
          y={PERSON_MID - 12}
          textAnchor="middle"
          className="dl-micro"
        >
          bound into
        </text>

        {/* ── The record, with its superseded versions behind it ──────────── */}
        <g data-dl-record>
          <text x={G.record.x} y={G.record.y - 16} className="dl-eyebrow">
            AGENT RECORD
          </text>
          {[18, 9].map((offset) => (
            <rect
              key={offset}
              x={G.record.x + offset}
              y={G.record.y + offset}
              width={G.record.w}
              height={G.record.h}
              rx={CARD_R}
              fill="var(--dl-card-fill)"
              stroke="var(--dl-ghost)"
            />
          ))}
          <rect
            x={G.record.x}
            y={G.record.y}
            width={G.record.w}
            height={G.record.h}
            rx={CARD_R}
            fill="var(--dl-card-fill)"
            stroke="var(--dl-card-stroke)"
          />

          <text x={G.record.x + 24} y={G.record.y + 44} className="dl-value">
            did:ain:gb:01ARZ3…:01BX5Z…
          </text>
          <text
            x={G.record.x + G.record.w - 24}
            y={G.record.y + 44}
            textAnchor="end"
            className="dl-micro"
          >
            v9
          </text>
          <line
            x1={G.record.x + 24}
            y1={G.record.y + 62}
            x2={G.record.x + G.record.w - 24}
            y2={G.record.y + 62}
            stroke="var(--dl-rule)"
          />

          {SCOPE.map((entry, index) => {
            const y = G.record.y + 82 + index * 40;
            const indent = entry.kind === "constraint" ? 18 : 0;
            return (
              <g key={entry.label}>
                {/* Declared, then authorised: the outline states the class,
                    the fill says it is in force. */}
                <rect
                  x={G.record.x + 24 + indent}
                  y={y}
                  width={G.record.w - 48 - indent}
                  height={32}
                  rx={CARD_R}
                  fill="none"
                  stroke="var(--dl-ghost)"
                />
                <rect
                  data-dl-scope-fill
                  data-dl-w={G.record.w - 50 - indent}
                  x={G.record.x + 25 + indent}
                  y={y + 1}
                  width={0}
                  height={30}
                  fill={
                    entry.kind === "constraint"
                      ? "var(--dl-constraint-fill)"
                      : "var(--dl-allow-fill)"
                  }
                />
                <text
                  x={G.record.x + 38 + indent}
                  y={y + 21}
                  className="dl-chip"
                  fill={
                    entry.kind === "constraint"
                      ? "var(--dl-constraint-text)"
                      : "var(--dl-allow-text)"
                  }
                >
                  {entry.label}
                </text>
              </g>
            );
          })}

          <text
            x={G.record.x + 24}
            y={G.record.y + G.record.h - 20}
            className="dl-micro"
          >
            in force 2026-07-16T12:00:00Z
          </text>
          <text
            x={G.record.x + 24}
            y={G.record.y + G.record.h + 52}
            className="dl-micro"
          >
            v7 · v8 retained
          </text>

          {/* One signer: the registry issuer, via detached JWS. */}
          <g data-dl-signed opacity="0">
            <text
              x={G.signedNode.x + G.signedNode.size / 2}
              y={G.record.y - 16}
              textAnchor="middle"
              className="dl-micro-accent"
            >
              signed
            </text>
            <rect
              x={G.signedNode.x}
              y={G.signedNode.y}
              width={G.signedNode.size}
              height={G.signedNode.size}
              fill="var(--dl-node)"
            />
          </g>
        </g>

        {/* ── The reference out. Only the external identity gets an edge: the
             second agent is registered independently and the register holds no
             relationship to it. ─────────────────────────────────────────── */}
        <Edge
          name="reference"
          x0={G.record.x + G.record.w}
          x1={G.related.x}
          y={REFERENCE_MID}
          dashed
        />
        {/* The reference is withdrawn on the record, so the mark sits on the
            line rather than travelling down it. */}
        <g data-dl-withdrawn opacity="0">
          <g stroke="var(--dl-revoked)" strokeWidth="1.6" strokeLinecap="round">
            <line
              x1={REFERENCE_MID_X - 6}
              y1={REFERENCE_MID - 6}
              x2={REFERENCE_MID_X + 6}
              y2={REFERENCE_MID + 6}
            />
            <line
              x1={REFERENCE_MID_X + 6}
              y1={REFERENCE_MID - 6}
              x2={REFERENCE_MID_X - 6}
              y2={REFERENCE_MID + 6}
            />
          </g>
        </g>
        <text
          data-dl-reference-label
          x={(G.record.x + G.record.w + G.related.x) / 2}
          y={REFERENCE_MID - 12}
          textAnchor="middle"
          className="dl-micro"
        >
          references
        </text>

        {RELATED.map((node, index) => {
          const y = G.related.ys[index]!;
          return (
            <g key={node.id} data-dl-related>
              <text x={G.related.x} y={y - 18} className="dl-eyebrow">
                {node.eyebrow}
              </text>
              <g {...(node.referenced ? { "data-dl-revocable": "" } : {})}>
                <rect
                  x={G.related.x}
                  y={y}
                  width={G.related.w}
                  height={G.related.h}
                  rx={CARD_R}
                  fill="var(--dl-card-fill)"
                  stroke="var(--dl-card-stroke)"
                />
                <text x={G.related.x + 22} y={y + 34} className="dl-value">
                  {node.id}
                </text>
                {/* Redacted bars, not invented scopes: what another record
                    holds is its own. */}
                {Array.from({ length: node.bars }, (_, bar) => (
                  <g key={bar}>
                    <rect
                      x={G.related.x + 22}
                      y={y + 50 + bar * 16}
                      width={G.related.w - 44 - bar * 56}
                      height={9}
                      rx={CARD_R}
                      fill="none"
                      stroke="var(--dl-ghost)"
                    />
                    <rect
                      data-dl-bar-fill
                      data-dl-at={(node.referenced ? 3.5 : 3.3) + bar * 0.12}
                      data-dl-w={G.related.w - 46 - bar * 56}
                      {...(node.referenced
                        ? { "data-dl-revocable-bar": "" }
                        : {})}
                      x={G.related.x + 23}
                      y={y + 51 + bar * 16}
                      width={0}
                      height={7}
                      fill="var(--dl-allow-fill)"
                    />
                  </g>
                ))}
                {node.referenced ? (
                  <text
                    data-dl-revoked-note
                    opacity="0"
                    x={G.related.x + 22}
                    y={y + G.related.h - 18}
                    className="dl-micro-revoked"
                  >
                    {node.note}
                  </text>
                ) : (
                  <text
                    x={G.related.x + 22}
                    y={y + G.related.h - 18}
                    className="dl-micro"
                  >
                    {node.note}
                  </text>
                )}
              </g>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
