import { ArrowRight } from "lucide-react";

import { RevealHeading } from "@/domains/marketing/reveal";

const EVIDENCE_FLOW_STEPS = [
  {
    outcome: "Your existing identity system is trusted, not replaced",
    mechanism:
      "Accepts the identity already presented via ARIA, DID/VC, OAuth/OIDC or your enterprise IAM.",
    output: "Accepted identity reference",
  },
  {
    outcome: "The accountable person and their authority are attached",
    mechanism: "Resolves the organisation, named owner and declared scope.",
    output: "Bound authority context",
  },
  {
    outcome: "The action is recorded after it happens, not before",
    mechanism: "Captures the completed action and its stated intent.",
    output: "Action attestation",
  },
  {
    outcome:
      "The exact policy and model version in force is locked to the record",
    mechanism:
      "Binds the policy and model version snapshot at the time of action.",
    output: "Version snapshot",
  },
  {
    outcome: "The record is signed so tampering is detectable",
    mechanism: "Issues a signed, tamper-evident receipt.",
    output: "Signed receipt",
  },
  {
    outcome: "Anyone can check it later, independently",
    mechanism:
      "Receipts assemble into evidence packages, re-verifiable at any later point.",
    output: "Verifiable evidence package",
  },
] as const;

export function EvidenceFlow() {
  return (
    <section
      id="how-it-works"
      className="evidence-flow-section site-dots relative scroll-mt-24 overflow-clip bg-site-ink py-[clamp(72px,9vw,132px)] text-site-cream"
    >
      <div className="evidence-flow-orbit" aria-hidden="true">
        <span />
        <span />
        <i />
      </div>

      <div className="relative z-[1] mx-auto max-w-[1320px] px-[clamp(20px,3.05vw,44px)]">
        <div className="text-center">
          <div className="font-site-mono text-[11px] font-semibold uppercase tracking-[0.17em] text-site-accent">
            How Subra works
          </div>
          <RevealHeading
            lead="From external identity to"
            accent="independently verifiable evidence."
            className="mx-auto mt-6 max-w-[22ch] text-[clamp(34px,5vw,58px)] leading-[1.04] font-medium tracking-[-0.038em] text-site-cream"
          />
          <p className="mx-auto mt-6 max-w-[66ch] text-[17px] leading-[1.7] text-site-cream-soft">
            Subra doesn&apos;t replace the systems you already use to establish
            identity and authority. It sits alongside them, and turns each
            completed action into a signed record.
          </p>
        </div>

        <div className="evidence-flow-frame">
          <div className="evidence-flow-frame-labels" aria-hidden="true">
            <span>Existing systems</span>
            <span>Independent evidence</span>
          </div>

          <ol
            className="evidence-flow-sequence"
            aria-label="Six-step evidence flow"
          >
            {EVIDENCE_FLOW_STEPS.map((step, index) => (
              <li key={step.outcome} className="evidence-flow-step">
                <span className="evidence-flow-number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="evidence-flow-copy">
                  <h3>{step.outcome}</h3>
                  <p>
                    <span>Mechanism</span>
                    {step.mechanism}
                  </p>
                </div>

                <div className="evidence-flow-output">
                  <span>Output</span>
                  <strong>{step.output}</strong>
                </div>

                {index === 2 ? (
                  <aside className="evidence-flow-attestation">
                    <span>Post-action attestation</span>
                    <p>
                      This is post-action attestation. Subra records what
                      happened after it happened. It does not authorise or block
                      the action.
                    </p>
                  </aside>
                ) : null}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-9 text-center">
          <a
            href="#action-receipt"
            className="evidence-flow-cta inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 text-[14.5px] font-medium transition-colors duration-300"
          >
            See a sample action receipt
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
