import {
  ArrowRight,
  Building2,
  Check,
  CircleDashed,
  FileCheck2,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  ScanFace,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { WorkspaceShell } from "@/components/workspace-shell";
import { initialIndividualAssurance } from "@/lib/identity-assurance";

const onboardingStages = [
  {
    label: "Identity verification",
    detail: "Confirm the organisation creator",
    state: "current",
  },
  {
    label: "Organisation verification",
    detail: "Check the UK legal entity",
    state: "locked",
  },
  {
    label: "Agent workspace",
    detail: "Create and manage registered agents",
    state: "locked",
  },
] as const;

const identityCheckSteps = [
  {
    icon: FileCheck2,
    title: "Government-issued photo ID",
    copy: "A selected UK identity provider will check that the document is authentic and belongs to you.",
  },
  {
    icon: ScanFace,
    title: "Secure likeness and liveness check",
    copy: "The provider will compare you with the identity evidence and test that a real person is present.",
  },
  {
    icon: ShieldCheck,
    title: "Minimal assurance result",
    copy: "AIN Registry will retain the outcome and audit reference, not document images, selfies, video or biometric templates.",
  },
] as const;

const unlockedCapabilities = [
  "Begin a UK organisation registration",
  "Submit organisation details for verification",
] as const;

const lockedCapabilities = [
  "Create or manage registered agents",
  "Mint permanent AINs or issue signing keys",
  "Publish resolver records, receipts or evidence packs",
] as const;

export function IdentityOnboardingView({
  email,
  name,
}: {
  email: string | null | undefined;
  name: string | null | undefined;
}) {
  const signedInName = name?.trim() || "Account holder";

  return (
    <WorkspaceShell
      email={email}
      footerAction={
        <a className="workspace-footer-skip" href="/dashboard">
          Skip for now
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      }
      notificationContext="onboarding"
      signedInAs={signedInName}
      workspaceLabel="Individual identity due-diligence onboarding"
    >
      <div className="identity-workspace">
        <aside
          className="identity-progress-panel"
          aria-labelledby="identity-progress-title"
        >
          <div className="identity-panel-heading">
            <span className="identity-panel-icon">
              <Fingerprint className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="dashboard-eyebrow">Account setup</p>
              <h2 id="identity-progress-title">Due-diligence stages</h2>
            </div>
          </div>

          <div className="identity-status-card">
            <div>
              <p className="dashboard-field-label">Current status</p>
              <p className="identity-status-value">Not started</p>
            </div>
            <span className="identity-status-mark" aria-hidden="true">
              <CircleDashed className="h-4 w-4" />
            </span>
          </div>

          <ol className="identity-stage-list">
            {onboardingStages.map((stage, index) => (
              <li
                key={stage.label}
                className={
                  stage.state === "current"
                    ? "identity-stage-current"
                    : "identity-stage-locked"
                }
              >
                <span className="identity-stage-number">
                  {stage.state === "locked" ? (
                    <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </span>
                <div>
                  <strong>{stage.label}</strong>
                  <p>{stage.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </aside>

        <section
          id="identity-verification"
          className="identity-verification-main"
          aria-labelledby="identity-verification-title"
        >
          <header className="identity-verification-hero">
            <div className="identity-boundary-note">
              <UserCheck className="h-5 w-5" aria-hidden="true" />
              <div>
                <strong>Identity is one part of the decision</strong>
                <p>
                  Passing this check will not verify a company or prove that you
                  are authorised to represent it. Those checks happen
                  separately.
                </p>
              </div>
            </div>
            <p className="identity-kicker">Individual identity due diligence</p>
            <h2
              id="identity-verification-title"
              className="font-bold text-2xl  my-2"
            >
              Verify the person behind the organisation
            </h2>
            <p className="identity-hero-copy">
              Signing in confirms access to this account. Before an organisation
              can be registered, a separate identity check will establish that
              its creator is who they claim to be.
            </p>
          </header>

          <div className="identity-method-section">
            <div className="identity-section-heading">
              <div>
                <p className="dashboard-eyebrow">Expected method</p>
                <h2>What the check will involve</h2>
              </div>
              <span>GPG45-aligned target</span>
            </div>

            <ol className="identity-check-list">
              {identityCheckSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li key={step.title}>
                    <span className="identity-check-icon">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <span className="identity-check-index">
                        Step {index + 1}
                      </span>
                      <h3>{step.title}</h3>
                      <p>{step.copy}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="identity-actions">
            <div>
              <button
                type="button"
                disabled
                aria-describedby="identity-provider-status"
              >
                Begin identity check
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <p id="identity-provider-status" role="status">
                Verification provider not connected yet. No identity information
                will be collected or sent.
              </p>
            </div>
          </div>
        </section>

        <aside
          className="identity-guidance-panel"
          aria-label="Verification guidance"
        >
          <section>
            <div className="identity-guidance-heading">
              <span className="identity-guidance-icon identity-guidance-icon-blue">
                <KeyRound className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="dashboard-eyebrow">After identity verification</p>
                <h2>What this unlocks</h2>
              </div>
            </div>
            <ul className="identity-guidance-list">
              {unlockedCapabilities.map((capability) => (
                <li key={capability}>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  {capability}
                </li>
              ))}
            </ul>
          </section>

          <section className="identity-guidance-section">
            <div className="identity-guidance-heading">
              <span className="identity-guidance-icon identity-guidance-icon-navy">
                <Building2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="dashboard-eyebrow">Separate due diligence</p>
                <h2>What remains locked</h2>
              </div>
            </div>
            <ul className="identity-locked-list">
              {lockedCapabilities.map((capability) => (
                <li key={capability}>
                  <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
                  {capability}
                </li>
              ))}
            </ul>
          </section>

          <section className="identity-privacy-card">
            <div className="identity-guidance-heading">
              <span className="identity-guidance-icon identity-guidance-icon-green">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="dashboard-eyebrow">Privacy by design</p>
                <h2>Minimal data retained</h2>
              </div>
            </div>
            <p>
              The future provider will handle identity evidence in its hosted
              service. AIN Registry will keep only the assurance outcome,
              timestamps and an opaque audit reference.
            </p>
          </section>

          <section className="identity-review-note">
            <span className="identity-guidance-icon identity-guidance-icon-orange">
              <UserCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2>Assisted review will be available</h2>
              <p>
                Provider failure will lead to retry or manual review, not a
                permanent denial.
              </p>
            </div>
          </section>

          <span className="sr-only">
            Assurance state: {initialIndividualAssurance.status}
          </span>
        </aside>
      </div>
    </WorkspaceShell>
  );
}
