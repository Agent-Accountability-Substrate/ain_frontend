"use client";

import { useState } from "react";

// Values are the AIN Document payload: the identifier, the four-key scope
// object, the accountability triple, the Ed25519 signature and the version.
// Accountability binds a role title, its responsibility area and its
// regulatory identifier — there is no person-name field in the contract, and
// binding the role is what lets a successor inherit it with an effective date.
// It carries the warm accent because it is the one field here a machine
// cannot check.
const ENTRY_ROWS = [
  {
    id: "identifier",
    label: "Identifier",
    render: () => (
      <>
        <span className="break-all text-ink">
          did:ain:gb:01ARZ3NDEKTSV4RRFFQ69G5FAV:01BX5ZZKBKACTAV9WEVGEMMVRZ
        </span>
        <span className="text-steel"> · permanent</span>
      </>
    ),
  },
  {
    id: "actionClasses",
    label: "Action classes",
    render: () => (
      <span className="flex flex-col gap-1">
        <span className="text-cobalt">
          customer_comms.send, payments.initiate
        </span>
        <span className="text-steel">
          constraint: max_value_gbp 5000 · risk high
        </span>
      </span>
    ),
  },
  {
    id: "accountability",
    label: "Accountability",
    render: () => (
      <span className="flex flex-col gap-1">
        <span className="text-warm-700">Head of Collections</span>
        <span className="text-steel">
          SMF24-000123 · collections operations
        </span>
      </span>
    ),
  },
  {
    id: "signed",
    label: "Signed",
    render: () => (
      <span className="flex flex-col gap-1">
        <span className="text-ink">2026-07-16T12:00:00Z</span>
        <span className="text-steel">ed25519:9f41c2…7ab0</span>
      </span>
    ),
  },
  {
    id: "documentVersion",
    label: "Document",
    render: () => (
      <>
        <span className="text-ink">version 9</span>
        <span className="text-steel"> · prior versions retained</span>
      </>
    ),
  },
] as const;

type RowId = (typeof ENTRY_ROWS)[number]["id"];

const CONCEPTS: {
  step: string;
  title: string;
  body: string;
  rows: RowId[];
}[] = [
  {
    step: "01",
    title: "Identifier",
    body: "Permanent. It survives redeploys, model swaps, renames and re-platforming, so the history stays attached to one thing.",
    rows: ["identifier"],
  },
  {
    step: "02",
    title: "Authorised scope",
    body: "A signed statement of the action classes an agent may perform, and the constraints on each. Anything not declared is not authorised.",
    rows: ["actionClasses"],
  },
  {
    step: "03",
    title: "Accountability",
    body: "A role title with a regulatory identifier and effective dates, not a team or a mailbox. Every change to scope is a new signed version, and the one it replaces stays on the record.",
    rows: ["accountability"],
  },
  {
    step: "04",
    title: "Evidence",
    body: "Every prior state is retained and timestamped, and any date can be reconstructed as a dated pack for the board, audit or the regulator.",
    rows: ["signed", "documentVersion"],
  },
];

// A field lights its whole concept group, not just itself, so pointing at
// "Signed" shows that Evidence rests on the signature and the retained
// versions together.
const CONCEPT_GROUP = new Map<RowId, readonly RowId[]>(
  CONCEPTS.flatMap((concept) =>
    concept.rows.map((row) => [row, concept.rows] as const),
  ),
);

export function LandingRegisterEntry() {
  // Emphasis only: every row is legible whatever is hovered, so a reader who
  // never points at anything loses nothing.
  //
  // The link runs both ways — a concept lights its fields, and a field lights
  // the concept that explains it. Both write the same state, and a concept is
  // active whenever any of its rows is lit, so neither direction is special.
  const [lit, setLit] = useState<readonly RowId[]>([]);

  return (
    <section id="record" className="border-t border-line bg-band">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-32 lg:px-8">
        <p className="font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-secondary">
          The record
        </p>

        <h2 className="mt-6 max-w-[30ch] text-balance text-[32px] font-normal leading-[1.06] tracking-[-0.03em] text-ink sm:text-[42px] lg:text-[52px]">
          Four fields, held permanently.
        </h2>

        <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <ol>
            {CONCEPTS.map((concept) => {
              const active = concept.rows.some((row) => lit.includes(row));
              return (
                <li
                  key={concept.step}
                  tabIndex={0}
                  onMouseEnter={() => setLit(concept.rows)}
                  onMouseLeave={() => setLit([])}
                  onFocus={() => setLit(concept.rows)}
                  onBlur={() => setLit([])}
                  className={`grid grid-cols-[2.25rem_minmax(0,1fr)] items-baseline gap-x-2 border-t border-line py-5 outline-none transition-colors duration-[150ms] first:border-t-0 first:pt-0 focus-visible:ring-2 focus-visible:ring-secondary ${
                    active ? "bg-wash-blue/60" : ""
                  }`}
                >
                  <span
                    className={`font-mono text-[12px] tabular-nums transition-colors ${
                      active ? "text-cobalt" : "text-mist-light"
                    }`}
                  >
                    {concept.step}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[17px] font-medium leading-snug tracking-[-0.01em] text-ink">
                      {concept.title}
                    </h3>
                    <p className="mt-1.5 max-w-[52ch] text-[15px] leading-6 text-slate-700">
                      {concept.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          <figure className="h-fit overflow-hidden rounded-sm border border-line bg-white shadow-[0_1px_2px_rgba(9,17,38,0.04),0_24px_48px_-32px_rgba(50,50,93,0.22)]">
            <div className="flex items-center justify-between gap-4 border-b border-line bg-panel px-5 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                Register entry
              </p>
              <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-secondary">
                <span aria-hidden="true" className="register-pulse" />
                In force
              </p>
            </div>

            <dl>
              {ENTRY_ROWS.map((row) => {
                const active = lit.includes(row.id);
                return (
                  <div
                    key={row.id}
                    // Pointer only. The concept list is already focusable and
                    // lights these rows, so a second set of tab stops over the
                    // same relationship would add stops without adding facts.
                    onMouseEnter={() => setLit(CONCEPT_GROUP.get(row.id) ?? [])}
                    onMouseLeave={() => setLit([])}
                    className={`grid cursor-default grid-cols-[7.5rem_minmax(0,1fr)] items-baseline gap-4 border-t border-line-soft px-5 py-3.5 transition-colors duration-[150ms] first:border-t-0 ${
                      active ? "bg-wash-blue" : ""
                    }`}
                  >
                    <dt
                      className={`font-mono text-[10.5px] uppercase tracking-[0.1em] transition-colors ${
                        active ? "text-cobalt" : "text-steel"
                      }`}
                    >
                      {row.label}
                    </dt>
                    <dd className="min-w-0 font-mono text-[12.5px] leading-5">
                      {row.render()}
                    </dd>
                  </div>
                );
              })}
            </dl>

            <figcaption className="border-t border-line bg-panel px-5 py-3 text-[12px] leading-5 text-steel">
              Illustrative entry. Field names shown as they appear in the
              register.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
