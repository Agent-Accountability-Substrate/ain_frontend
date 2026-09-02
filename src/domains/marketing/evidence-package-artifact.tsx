"use client";

import { useState } from "react";
import { Check, FileCheck2 } from "lucide-react";

const PACKAGE_CONTENTS = [
  "Identity evidence",
  "Accountability record",
  "Scope in force",
  "Relevant action receipts",
  "Policy and model versions",
  "Lifecycle history",
  "Chain and signature verification results",
  "Signed package manifest",
] as const;

const SUMMARY_FACTS = [
  { label: "Review period", value: "01 to 31 July 2026" },
  { label: "Action receipts", value: "42 consequential actions" },
  { label: "Accountability", value: "3 named operational owners" },
  { label: "Verification", value: "All included signatures verified" },
] as const;

const MANIFEST_FIELDS = [
  { label: "package_id", value: "pkg:payments-ops:2026-07" },
  { label: "period_start", value: "2026-07-01T00:00:00Z" },
  { label: "period_end", value: "2026-07-31T23:59:59Z" },
  { label: "receipt_count", value: "42" },
  { label: "identity_refs", value: "3" },
  { label: "policy_versions", value: "payments-v11, payments-v12" },
  { label: "model_versions", value: "intent-2026.06, intent-2026.07" },
  { label: "chain_verification", value: "verified" },
  { label: "manifest_signature", value: "valid · Ed25519" },
  {
    label: "manifest_digest",
    value: "sha256:42f7d9a1c2b6e5408fe31a7d51c9b28e",
  },
] as const;

type PackageView = "summary" | "manifest";

export function EvidencePackageArtifact() {
  const [view, setView] = useState<PackageView>("summary");

  return (
    <div className="evidence-package-artifact">
      <aside className="evidence-package-spine" aria-label="Package identity">
        <div className="evidence-package-seal" aria-hidden="true">
          <FileCheck2 />
        </div>
        <p>Evidence package</p>
        <strong>EP 2026.07</strong>
        <span>Signed manifest</span>
      </aside>

      <aside className="evidence-package-index">
        <div className="evidence-package-index-heading">
          <span>Package contents</span>
          <strong>08 records</strong>
        </div>
        <ol aria-label="Evidence package contents">
          {PACKAGE_CONTENTS.map((item, index) => (
            <li key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item}</strong>
              <Check aria-hidden="true" />
            </li>
          ))}
        </ol>
      </aside>

      <div className="evidence-package-view">
        <header>
          <div>
            <p>Payments operations</p>
            <h3>July 2026 evidence review</h3>
          </div>
          <span>
            <Check aria-hidden="true" /> Verified package
          </span>
        </header>

        <div
          className="evidence-package-tabs"
          role="tablist"
          aria-label="Evidence package views"
        >
          <button
            type="button"
            role="tab"
            id="package-tab-summary"
            aria-controls="package-panel-summary"
            aria-selected={view === "summary"}
            onClick={() => setView("summary")}
          >
            Compliance summary
          </button>
          <button
            type="button"
            role="tab"
            id="package-tab-manifest"
            aria-controls="package-panel-manifest"
            aria-selected={view === "manifest"}
            onClick={() => setView("manifest")}
          >
            Technical manifest
          </button>
        </div>

        {view === "summary" ? (
          <div
            id="package-panel-summary"
            role="tabpanel"
            aria-labelledby="package-tab-summary"
            className="evidence-package-panel evidence-package-summary"
          >
            <div className="evidence-package-summary-lead">
              <span>Review outcome</span>
              <strong>Evidence assembled and independently checkable</strong>
              <p>
                The package connects the accountable context and versions in
                force to every included action receipt for the selected period.
              </p>
            </div>

            <dl>
              {SUMMARY_FACTS.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <div
            id="package-panel-manifest"
            role="tabpanel"
            aria-labelledby="package-tab-manifest"
            className="evidence-package-panel evidence-package-manifest"
          >
            <div className="evidence-package-manifest-heading">
              <span>manifest.json</span>
              <strong>Full field set</strong>
            </div>
            <dl>
              {MANIFEST_FIELDS.map((field) => (
                <div key={field.label}>
                  <dt>{field.label}</dt>
                  <dd>{field.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <footer>
          Package narrative is templated, not AI-generated. No model is used to
          decide what a record means.
        </footer>
      </div>
    </div>
  );
}
