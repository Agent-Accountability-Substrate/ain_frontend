/**
 * A scope change as the register records it: a new signed version, with the
 * one it replaces still in force until the new one is issued.
 *
 * The lines are the four-key scope object the payload contract fixes —
 * `action_classes`, `constraints`, `risk_level`, `regulatory_mappings`.
 *
 * A list, not a picture. The `+` and `-` columns are real characters, so the
 * diff survives being selected, translated or pasted into a questionnaire, and
 * colour stays redundant with them rather than carrying the meaning alone.
 */

const DIFF_LINES = [
  { kind: "context", text: '"action_classes": [' },
  { kind: "context", text: '  "customer_comms.send",' },
  { kind: "added", text: '  "payments.initiate"' },
  { kind: "context", text: "]," },
  { kind: "added", text: '"constraints": {' },
  { kind: "added", text: '  "payments.initiate": { "max_value_gbp": 5000 }' },
  { kind: "added", text: "}," },
  { kind: "removed", text: '"risk_level": "medium",' },
  { kind: "added", text: '"risk_level": "high",' },
  { kind: "context", text: '"regulatory_mappings": ["FCA CONC 7"]' },
] as const;

/**
 * On ink the page's ramp is: muted text `--sky-mid`, value text white, a
 * permitted thing filled `sky/15` and lettered `--sky`, and anything
 * superseded in `--destructive-soft`. The diff borrows all four rather than
 * inventing its own, which is why an added line is blue and not green — the
 * system reserves `success-*` and spends blue on "permitted".
 */
const LINE_STYLE = {
  context: { marker: "text-white/30", sign: " " },
  added: { marker: "text-sky", sign: "+" },
  removed: { marker: "text-destructive-soft", sign: "-" },
} as const;

const LINE_TONE = {
  context: "text-white/75",
  added: "bg-sky/[0.14] text-sky",
  removed: "bg-destructive-soft/10 text-destructive-soft",
} as const;

const SUMMARY = [
  { term: "risk class", value: "high", tone: "text-warm-700" },
  { term: "new powers", value: "1", tone: "text-ink" },
  { term: "effective", value: "issued_at", tone: "text-ink-muted" },
] as const;

// Deliberately still. The diff already proves the heading — a new version,
// not an edit — and the only thing motion added was a restatement of the
// caption's sentence about v8 remaining in force. A page carrying two looping
// figures does not need a third competing for the same attention.
export function LandingScopeDiff() {
  return (
    <figure className="mt-10 overflow-hidden rounded-sm border border-line">
      <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="bg-ink">
          {/* Names the artifact and the version it produces, so the panel reads
              as a diff against a record rather than a code sample. */}
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/55">
              Scope diff · v8 &rarr; v9
            </p>
            <p className="font-mono text-[11px] text-white/40">
              document_version 9
            </p>
          </div>

          <ol className="py-4">
            {DIFF_LINES.map((line) => {
              const style = LINE_STYLE[line.kind];

              return (
                <li
                  key={`${line.kind}-${line.text}`}
                  className={`grid grid-cols-[1.75rem_minmax(0,1fr)] items-baseline font-mono text-[12.5px] leading-[1.9] ${LINE_TONE[line.kind]}`}
                >
                  <span
                    className={`pl-5 tabular-nums ${style.marker}`}
                    aria-hidden={line.kind === "context"}
                  >
                    {style.sign}
                  </span>
                  {/* The gutter is its own column, so an unindented line never
                      butts against its own marker. */}
                  <span className="whitespace-pre-wrap break-words pl-1 pr-5">
                    {line.text}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="flex flex-col bg-panel px-6 py-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Accountability
          </p>
          <p className="mt-4 text-[15px] leading-[1.45] text-ink">
            Head of Collections
          </p>
          <p className="mt-1.5 font-mono text-[12px] leading-[1.5] text-steel">
            SMF24-000123 · collections operations
          </p>

          <dl className="mt-6 space-y-2.5 border-t border-line pt-4">
            {SUMMARY.map((item) => (
              <div key={item.term} className="flex justify-between gap-3">
                <dt className="font-mono text-[11.5px] leading-[1.5] text-steel">
                  {item.term}
                </dt>
                <dd
                  className={`font-mono text-[11.5px] font-medium leading-[1.5] ${item.tone}`}
                >
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 border-t border-line pt-4">
            <p className="font-mono text-[11.5px] font-medium uppercase tracking-[0.06em] text-secondary">
              Signed · v9 in force
            </p>
          </div>
        </div>
      </div>

      <figcaption className="border-t border-line bg-panel px-6 py-3 font-mono text-[11.5px] leading-[1.6] text-steel">
        Illustrative diff. Until v9 is signed and issued, v8 remains the scope
        in force.
      </figcaption>
    </figure>
  );
}
