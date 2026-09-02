"use client";

import { useState, type CSSProperties } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  FilePenLine,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { RevealHeading } from "@/domains/marketing/reveal";
import { cn } from "@/lib/utils";

const RECEIPTS = [
  {
    sequence: "01",
    label: "Identity accepted",
    detail: "External identity attached",
    time: "09:14:02",
  },
  {
    sequence: "02",
    label: "Payment submitted",
    detail: "Amount: £24,800",
    alteredDetail: "Amount changed: £84,200",
    time: "09:14:08",
  },
  {
    sequence: "03",
    label: "Receipt issued",
    detail: "Action evidence signed",
    time: "09:14:09",
  },
  {
    sequence: "04",
    label: "Package assembled",
    detail: "Receipt included in review",
    time: "16:30:00",
  },
] as const;

const CALCULATION_STEPS = [
  {
    term: "Canonicalisation",
    explanation:
      "The same fields are always placed in the same order and format, so the same record always produces the same result.",
  },
  {
    term: "Hashing",
    explanation:
      "Each formatted record is converted into a unique digital fingerprint and includes the fingerprint of the record before it.",
  },
  {
    term: "Signatures",
    explanation:
      "The fingerprint is signed by Subra. An independent verifier can check who signed it and whether it has changed.",
  },
] as const;

export function IntegrityChain() {
  const [altered, setAltered] = useState(false);

  return (
    <section
      id="integrity"
      className="integrity-section site-dots relative scroll-mt-24 overflow-hidden bg-site-paper pt-[clamp(64px,7vw,104px)] pb-[clamp(76px,9vw,132px)] text-site-ink"
    >
      <div className="integrity-orbit" aria-hidden="true">
        <span />
        <span />
      </div>

      <div className="relative z-[1] mx-auto max-w-[1320px] px-[clamp(20px,3.05vw,44px)]">
        <div className="integrity-intro">
          <div>
            <p className="font-site-mono text-[11px] font-semibold uppercase tracking-[0.17em] text-site-accent">
              Integrity
            </p>
            <RevealHeading
              lead="Evidence should remain verifiable"
              accent="after the originating system is unavailable."
              className="mt-5 max-w-[20ch] text-[clamp(36px,4.8vw,58px)] leading-[1.04] font-medium tracking-[-0.04em] text-site-ink"
            />
          </div>

          <div className="integrity-intro-copy">
            <p>
              A record you can argue with is not evidence. Each receipt is
              linked to the one before it. Changing any field breaks the chain,
              visibly.
            </p>
            <div className="integrity-intro-actions">
              <a href="#request">
                Request private preview
                <ArrowRight aria-hidden="true" />
              </a>
              <a href="#security">Read the security overview</a>
            </div>
          </div>
        </div>

        <div className={cn("integrity-console", altered && "is-altered")}>
          <header className="integrity-console-header">
            <div className="integrity-console-title">
              <span className="integrity-console-seal" aria-hidden="true">
                {altered ? <TriangleAlert /> : <ShieldCheck />}
              </span>
              <div>
                <p>Independent chain check</p>
                <strong>Payments operations · 24 July 2026</strong>
              </div>
            </div>

            <div
              className="integrity-console-state"
              data-testid="integrity-state"
              aria-live="polite"
            >
              <span aria-hidden="true">{altered ? "!" : "✓"}</span>
              <div>
                <strong>{altered ? "Integrity failure" : "Verified"}</strong>
                <small>
                  {altered
                    ? "chain broken from record 2 onward"
                    : "4 of 4 records intact"}
                </small>
              </div>
            </div>
          </header>

          <div
            className="integrity-chain"
            role="list"
            aria-label="Receipt chain"
          >
            {RECEIPTS.map((receipt, index) => {
              const broken = altered && index >= 1;
              const changed = altered && index === 1;

              return (
                <div
                  key={receipt.sequence}
                  role="listitem"
                  className={cn(
                    "integrity-record",
                    broken && "is-broken",
                    changed && "is-changed",
                  )}
                  style={{ "--integrity-order": index } as CSSProperties}
                >
                  <div className="integrity-record-marker" aria-hidden="true">
                    {broken ? <TriangleAlert /> : <Check />}
                  </div>
                  <div className="integrity-record-number">
                    <span>Record</span>
                    <strong>{receipt.sequence}</strong>
                  </div>
                  <div className="integrity-record-copy">
                    <strong>{receipt.label}</strong>
                    <span>
                      {changed && "alteredDetail" in receipt
                        ? receipt.alteredDetail
                        : receipt.detail}
                    </span>
                  </div>
                  <time dateTime={`2026-07-24T${receipt.time}Z`}>
                    {receipt.time} UTC
                  </time>
                  <div className="integrity-record-verdict">
                    {changed
                      ? "Field changed"
                      : broken
                        ? "Chain broken"
                        : "Intact"}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="integrity-console-action">
            <div>
              <p>
                {altered
                  ? "The stored story no longer adds up."
                  : "Test the evidence yourself."}
              </p>
              <span>
                {altered
                  ? "Record 2 has a new value. Its fingerprint and every link after it now fail verification."
                  : "Change the payment amount in record 2 and watch the verifier recalculate the chain."}
              </span>
            </div>
            <button type="button" onClick={() => setAltered((value) => !value)}>
              {altered ? (
                <RotateCcw aria-hidden="true" />
              ) : (
                <FilePenLine aria-hidden="true" />
              )}
              {altered ? "Restore original field" : "Change one field"}
            </button>
          </div>
        </div>

        <details className="integrity-calculation">
          <summary>
            <span>
              <small>Progressive disclosure</small>
              <strong>How this is calculated</strong>
            </span>
            <ChevronDown aria-hidden="true" />
          </summary>
          <div className="integrity-calculation-grid">
            {CALCULATION_STEPS.map((step, index) => (
              <div key={step.term}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step.term}</strong>
                <p>{step.explanation}</p>
              </div>
            ))}
          </div>
        </details>

        <p className="integrity-microcopy">
          Verification recalculates the record. Nothing is simply trusted from
          storage.
        </p>
      </div>
    </section>
  );
}
