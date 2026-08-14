"use client";

import { useFigureFrames } from "@/hooks/use-figure-frames";
import { beat, show } from "@/lib/figure-motion";

// The chain belongs to the lifecycle ledger: each event carries the hash of
// the one before it, so the sequence is tamper-evident and not just each row.
// AIN Document versions are linked by a supersede pointer and each carries its
// own hash, which is a different mechanism and is not what this draws. Genesis
// has no predecessor and hashes against a versioned marker instead.
// `fails` is what the row reads once seq 2 has been recomputed: the edited
// entry is altered, and everything chained after it stops verifying. Genesis
// sits above the edit and is unaffected.
const CHAIN = [
  {
    event: "1 · registered",
    hash: "sha256:3c81a4…9de2",
    prev: "genesis · AIN-LIFECYCLE-GENESIS-v1",
    signed: "2026-05-07",
    fails: null,
  },
  {
    event: "2 · approved",
    hash: "sha256:7b02f5…41ac",
    prev: "← prev 3c81a4…9de2",
    signed: "2026-05-24",
    fails: "Altered",
  },
  {
    event: "3 · updated",
    hash: "sha256:d914e0…6f37",
    prev: "← prev 7b02f5…41ac",
    signed: "2026-06-11",
    fails: "Broken",
  },
  {
    event: "4 · updated",
    hash: "sha256:9f41c2…7ab0",
    prev: "← prev d914e0…6f37",
    signed: "2026-07-16",
    fails: "Broken",
  },
] as const;

function VerifiedTick({ fails }: { fails: string | null }) {
  return (
    <span className="grid font-mono text-[10.5px] uppercase tracking-[0.1em]">
      <span
        data-chain-state="ok"
        className="col-start-1 row-start-1 inline-flex items-center gap-1.5 text-success-soft"
      >
        Verified
      </span>

      {/* The failure state is a moment in the loop, not the record's
          condition, so it stays out of the accessibility tree and starts
          hidden. */}
      {fails ? (
        <span
          aria-hidden="true"
          data-chain-state="fail"
          className="col-start-1 row-start-1 inline-flex items-center gap-1.5 text-destructive-soft opacity-0"
        >
          {fails}
        </span>
      ) : null}
    </span>
  );
}

function LifecycleChainFigure() {
  // The reference's 8-unit cycle, which is 13.3 real seconds. The ledger is
  // always on screen and always readable — a table that assembles itself reads
  // as a loading state rather than a record. Only the verdict moves: a long
  // hold, the edit at 1.9 units, then one row every 0.5 units. That long first
  // gap is what gives a reader time to read ALTERED before the break travels.
  // Verdicts snap rather than fade; a ledger reporting a fault does not ease
  // into it.
  const ref = useFigureFrames<HTMLElement>(beat(8), beat(4), (t, root) => {
    const rows = root.querySelectorAll("tbody tr");

    const broken =
      t > beat(1.9)
        ? Math.min(3, 1 + Math.floor((t - beat(1.9)) / beat(0.5)))
        : -1;

    rows.forEach((row, i) => {
      const bad = broken >= 1 && i >= 1 && i <= broken;
      const ok = row.querySelector('[data-chain-state="ok"]');
      const fail = row.querySelector('[data-chain-state="fail"]');
      const hash = row.querySelector("[data-chain-hash]");
      if (ok) show(ok, !bad);
      if (fail) show(fail, bad);
      if (hash) {
        (hash as HTMLElement).style.color = bad
          ? "var(--destructive-soft)"
          : "";
      }
    });

    // The readout names what the rows are doing, and counts the damage as it
    // spreads rather than only at the end.
    const verdict = root.querySelector<HTMLElement>("[data-chain-verdict]");
    if (verdict) {
      const downstream = Math.max(0, broken - 1);
      verdict.textContent =
        broken < 1
          ? "Chain intact"
          : downstream === 0
            ? "Entry 2 hash no longer matches"
            : `Entry 2 hash no longer matches · ${downstream} ${
                downstream === 1 ? "entry" : "entries"
              } after it fail verification`;
      verdict.style.color = broken < 1 ? "" : "var(--destructive-soft)";
    }
  });

  return (
    <figure ref={ref} className="landing-figure mt-14 border-t border-white/20">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              {["Event", "Event hash", "Signed", "Chain"].map((head) => (
                <th
                  key={head}
                  scope="col"
                  className={`whitespace-nowrap border-b border-white/15 py-3 font-mono text-[10.5px] font-medium uppercase tracking-[0.13em] text-white/55 ${
                    head === "Chain" ? "text-right" : "pr-8"
                  }`}
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CHAIN.map((entry) => (
              <tr key={entry.event} className="border-b border-white/10">
                <td className="whitespace-nowrap py-3.5 pr-8 align-top font-mono text-[12.5px] text-sky">
                  {entry.event}
                </td>
                {/* The hash and what it was computed from share a cell: the
                    claim is that this one follows from that one, and a column
                    boundary between them breaks exactly that adjacency. */}
                <td className="whitespace-nowrap py-3.5 pr-8 align-top font-mono text-[12.5px]">
                  {/* Explicitly white: the figure sits on ink, and inheriting
                      --foreground here paints the hash navy on navy. */}
                  <span
                    data-chain-hash={entry.fails ? "" : undefined}
                    className="text-white"
                  >
                    {entry.hash}
                  </span>
                  <span className="mt-1 block text-[12px] text-white/40">
                    {entry.prev}
                  </span>
                </td>
                <td className="whitespace-nowrap py-3.5 pr-8 align-top font-mono text-[12.5px] text-white/50">
                  {entry.signed}
                </td>
                {/* Right-aligned so the verdicts form one edge — when three of
                    four flip it reads as a column failing, not four cells
                    changing on their own. */}
                <td className="whitespace-nowrap py-3.5 text-right align-top">
                  <VerifiedTick fails={entry.fails} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.13em] text-white/55">
          If entry 2 is edited
        </p>
        {/* Names what the cascade above is showing. Without it a reader
              watches rows turn red and has to infer why. */}
        <p
          data-chain-verdict
          className="mt-3 font-mono text-[12.5px] leading-[1.6] text-white/70"
        >
          Chain intact
        </p>
      </div>
    </figure>
  );
}

export function LandingIntegrity() {
  return (
    <section id="integrity" className="bg-ink">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-32 lg:px-8">
        <p className="font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-sky">
          Integrity
        </p>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-end lg:gap-16">
          <h2 className="max-w-[24ch] text-balance text-[32px] font-normal leading-[1.08] tracking-[-0.03em] text-white sm:text-[42px] lg:text-[46px]">
            A record you can argue with is not evidence.
          </h2>
          <p className="max-w-[46ch] text-base leading-[1.55] text-white/70">
            Every state change is canonicalised, hashed and signed into an
            append-only ledger, and each entry carries the hash of the one
            before it.
          </p>
        </div>

        {/*
          TODO(valentin/innocent): the objection that actually kills this
          deal, and it is answered nowhere on the site.

          From the adversarial buyer pass: "You want me to rely, in a
          regulatory examination, on signed records issued by a two-person
          company. Signatures are only worth the custody of the key and the
          survival of the authority. If you fold, do my attestations remain
          verifiable, or do they become unverifiable blobs?"

          For a product whose value IS cryptographic verifiability, vendor
          mortality attacks the core claim rather than merely continuity.
          It needs a real answer before it can be written down — external
          anchoring, RFC 3161 timestamping, whether identifiers resolve
          through a standard or only through us, whether anyone
          countersigns. Deliberately not drafted here, because inventing it
          would be worse than the silence.
        */}

        <LifecycleChainFigure />
      </div>
    </section>
  );
}
