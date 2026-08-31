import { ShieldCheck } from "lucide-react";

import { CompatibilityEntry } from "@/domains/marketing/compatibility-entry";
import { RevealHeading } from "@/domains/marketing/reveal";

const IDENTITY_SYSTEMS = [
  "ARIA",
  "DID / VC",
  "OAuth / OIDC",
  "Enterprise IAM",
] as const;

const EVIDENCE_BINDINGS = [
  "Identity evidence",
  "Accountable context",
  "Action record",
] as const;

const EVIDENCE_CONSUMERS = [
  "Audit teams",
  "Risk owners",
  "Regulatory review",
] as const;

const COMPATIBILITY_BOUNDARIES = [
  "Does not replace your IAM",
  "Does not orchestrate agents",
  "Does not become a runtime gateway",
] as const;

export function CompatibilityRail() {
  return (
    <CompatibilityEntry>
      <div className="mx-auto max-w-[1320px] px-[clamp(20px,3.05vw,44px)]">
        <div className="compatibility-intro">
          <div>
            <p className="font-site-mono text-[11px] font-semibold uppercase tracking-[0.17em] text-site-accent-strong">
              Compatibility
            </p>
            <RevealHeading
              lead="Keep the identity and control systems"
              accent="you already trust."
              className="mt-5 max-w-[17ch] text-[clamp(34px,4.5vw,56px)] leading-[1.05] font-medium tracking-[-0.038em] text-site-ink"
            />
          </div>

          <p className="compatibility-supporting">
            ARIA, DID/VC, OAuth/OIDC and enterprise identity systems establish
            how an agent presents itself. Subra sits alongside that layer. It
            doesn&apos;t compete with it, replace it, or ask you to adopt
            something new in its place.
          </p>
        </div>

        <div
          className="compatibility-rail"
          role="group"
          aria-label="Compatibility without competition"
        >
          <div className="compatibility-stage compatibility-stage-input">
            <p>External identity and control</p>
            <ul aria-label="Existing identity systems">
              {IDENTITY_SYSTEMS.map((system) => (
                <li key={system} className="flex items-center">
                  {system}
                </li>
              ))}
            </ul>
          </div>

          <div className="compatibility-connector" aria-hidden="true">
            <span />
          </div>

          <div className="compatibility-core">
            <div className="compatibility-core-mark" aria-hidden="true">
              <ShieldCheck />
            </div>
            <p>Subra</p>
            <h3>Evidence layer</h3>
            <ul aria-label="Evidence connected by Subra">
              {EVIDENCE_BINDINGS.map((binding) => (
                <li key={binding}>{binding}</li>
              ))}
            </ul>
          </div>

          <div className="compatibility-connector" aria-hidden="true">
            <span />
          </div>

          <div className="compatibility-stage compatibility-stage-output">
            <p>Independent use</p>
            <ul aria-label="Evidence consumers">
              {EVIDENCE_CONSUMERS.map((consumer) => (
                <li key={consumer} className="flex items-center">
                  {consumer}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ul
          className="compatibility-boundaries"
          aria-label="Subra compatibility boundaries"
        >
          {COMPATIBILITY_BOUNDARIES.map((boundary) => (
            <li key={boundary}>
              <span aria-hidden="true">✓</span>
              {boundary}
            </li>
          ))}
        </ul>
      </div>
    </CompatibilityEntry>
  );
}
