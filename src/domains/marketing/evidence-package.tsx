import { ArrowRight } from "lucide-react";

import { EvidencePackageArtifact } from "@/domains/marketing/evidence-package-artifact";
import { RevealHeading } from "@/domains/marketing/reveal";

export function EvidencePackage() {
  return (
    <section
      id="evidence-package"
      className="evidence-package-section site-dots relative scroll-mt-24 overflow-hidden bg-site-ink pt-[clamp(76px,9vw,132px)] pb-[clamp(38px,4vw,58px)] text-site-cream"
    >
      <div className="evidence-package-orbit" aria-hidden="true">
        <span />
        <span />
      </div>

      <div className="relative z-[1] mx-auto max-w-[1320px] px-[clamp(20px,3.05vw,44px)]">
        <div className="evidence-package-intro">
          <div>
            <p className="font-site-mono text-[11px] font-semibold uppercase tracking-[0.17em] text-site-accent">
              Evidence packages
            </p>
            <RevealHeading
              lead="The evidence an auditor asks for,"
              accent="assembled around the action."
              className="mt-5 max-w-[19ch] text-[clamp(36px,4.8vw,58px)] leading-[1.04] font-medium tracking-[-0.04em] text-site-cream"
            />
          </div>

          <div className="evidence-package-intro-copy">
            <p>
              A package brings the identity, accountability, scope, receipts,
              versions and verification results for a given period into one
              signed manifest. It is reviewable on its own, without needing
              access to Subra.
            </p>
            <a href="#request">
              Request private preview
              <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="evidence-package-reveal">
          <EvidencePackageArtifact />
        </div>
      </div>
    </section>
  );
}
