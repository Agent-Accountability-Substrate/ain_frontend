import { Check, ChevronDown, ReceiptText } from "lucide-react";

import { Reveal, RevealHeading } from "@/domains/marketing/reveal";

const RECEIPT_CONTEXT = [
  {
    label: "External identity reference",
    value: "Payments Operations Agent",
    detail: "OIDC workload identity · subject payops-agent-042",
  },
  {
    label: "Organisation",
    value: "Example Payments Ltd",
    detail: "Organisation of record",
  },
  {
    label: "Accountable owner",
    value: "Payments Operations Lead",
    detail: "Named operational role",
  },
  {
    label: "Declared authority",
    value: "Supplier payments up to £25,000",
    detail: "Dual approval required",
  },
  {
    label: "Policy version",
    value: "Supplier Payments Policy · v12",
    detail: "Version in force at occurrence",
  },
  {
    label: "Model version",
    value: "Payments Intent Model · 2026.07",
    detail: "Version reported by the agent system",
  },
] as const;

const RECEIPT_TIMES = [
  { label: "Occurred", value: "24 Jul 2026 · 12:34:08.142 UTC" },
  { label: "Recorded", value: "24 Jul 2026 · 12:34:08.526 UTC" },
] as const;

const TECHNICAL_FIELDS = [
  {
    label: "Previous receipt hash",
    value:
      "sha256:5bc14f79d31e472bc71af26c3c8a75f3bff847e2d494597aa4fd41c690b2e118",
  },
  {
    label: "Receipt hash",
    value:
      "sha256:8d42e58e93bf0c87c9909f7988d2e01c6ce2d7d5bc0a2d87cb2b0f617a8d09c4",
  },
  {
    label: "Signer key",
    value: "kid:subra-example-receipts-2026-07",
  },
] as const;

export function ActionReceipt() {
  return (
    <section
      id="action-receipt"
      className="action-receipt-section relative scroll-mt-24 overflow-hidden py-[clamp(72px,9vw,128px)]"
    >
      <div className="relative z-[1] mx-auto max-w-[1320px] px-[clamp(20px,3.05vw,44px)]">
        <div className="text-center">
          <p className="font-site-mono text-[11px] font-semibold uppercase tracking-[0.17em] text-site-accent-strong">
            The action receipt
          </p>
          <RevealHeading
            lead="One action."
            accent="One evidence record."
            className="mx-auto mt-5 max-w-[18ch] text-[clamp(36px,5vw,58px)] leading-[1.04] font-medium tracking-[-0.04em] text-site-ink"
          />
          <p className="mx-auto mt-6 max-w-[58ch] text-[16.5px] leading-[1.7] text-site-ink-soft">
            Every action produces a receipt like this. Human-readable first,
            with the underlying cryptography available one layer down for anyone
            who needs to check it.
          </p>
        </div>

        <Reveal className="action-receipt-reveal">
          <article
            className="action-receipt-card"
            aria-label="Supplier payment action receipt"
          >
            <header className="action-receipt-masthead">
              <div className="action-receipt-brand">
                <span aria-hidden="true">
                  <ReceiptText />
                </span>
                <div>
                  <p>Subra</p>
                  <strong>Action receipt</strong>
                </div>
              </div>

              <div className="action-receipt-state">
                <strong>
                  <Check aria-hidden="true" /> Signed record
                </strong>
              </div>
            </header>

            <div className="action-receipt-body">
              <div className="action-receipt-primary">
                <p className="action-receipt-kicker">Completed action</p>
                <h3>Supplier payment initiated</h3>
                <p className="action-receipt-intent">
                  <span>Stated intent</span>
                  Settle approved invoice INV-2048 for £18,450.00
                </p>

                <dl className="action-receipt-context">
                  {RECEIPT_CONTEXT.map((field) => (
                    <div key={field.label}>
                      <dt>{field.label}</dt>
                      <dd>
                        <strong>{field.value}</strong>
                        <span>{field.detail}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <aside
                className="action-receipt-classification"
                aria-label="Scope evidence classification"
              >
                <p>Scope result</p>
                <div className="action-receipt-current-scope">
                  <span>This receipt</span>
                  <strong>
                    <Check aria-hidden="true" /> Inside declared scope
                  </strong>
                  <p>
                    £18,450 is within the declared £25,000 authority and dual
                    approval is recorded.
                  </p>
                </div>

                <div className="action-receipt-scope-key">
                  <p>Evidence classifications</p>
                  <div data-classification="inside">
                    <span aria-hidden="true" />
                    Inside declared scope
                  </div>
                  <div data-classification="outside">
                    <span aria-hidden="true" />
                    Outside declared scope
                  </div>
                </div>

                <p className="action-receipt-boundary">
                  Scope result is a classification of the evidence, not an
                  access-control decision made by Subra.
                </p>

                <dl className="action-receipt-times">
                  {RECEIPT_TIMES.map((time) => (
                    <div key={time.label}>
                      <dt>{time.label}</dt>
                      <dd>{time.value}</dd>
                    </div>
                  ))}
                </dl>
              </aside>
            </div>

            <details className="action-receipt-technical">
              <summary>
                <span>
                  Technical proof
                  <small>Hashes, signing key and signature state</small>
                </span>
                <ChevronDown aria-hidden="true" />
              </summary>

              <div className="action-receipt-technical-grid">
                {TECHNICAL_FIELDS.map((field) => (
                  <div key={field.label}>
                    <span>{field.label}</span>
                    <code>{field.value}</code>
                  </div>
                ))}
                <div>
                  <span>Signature state</span>
                  <strong>
                    <Check aria-hidden="true" /> Signature valid
                  </strong>
                  <small>Ed25519 · key active at recorded time</small>
                </div>
              </div>
            </details>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
