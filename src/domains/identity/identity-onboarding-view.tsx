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
import type { LucideIcon } from "lucide-react";

import {
  WorkspaceContent,
  WorkspacePane,
  WorkspaceShell,
} from "@/domains/workspace/workspace-shell";
import { initialIndividualAssurance } from "@/domains/identity/identity-assurance";
import { Card } from "@/lib/ui/card";
import { Callout } from "@/lib/ui/callout";
import { Eyebrow } from "@/lib/ui/eyebrow";
import { PageHeading } from "@/lib/ui/page-heading";
import { cn } from "@/lib/utils";

const STAGES = [
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

const CHECK_STEPS = [
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

const UNLOCKED = [
  "Begin a UK organisation registration",
  "Submit organisation details for verification",
] as const;

const LOCKED = [
  "Create or manage registered agents",
  "Mint permanent AINs or issue signing keys",
  "Publish resolver records, receipts or evidence packs",
] as const;

function GuidanceCard({
  icon: Icon,
  tone,
  eyebrow,
  title,
  children,
}: {
  icon: LucideIcon;
  tone: "blue" | "navy" | "green" | "warm";
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  const tones = {
    blue: "bg-wash-blue text-cobalt",
    navy: "bg-ink text-white",
    green: "bg-success-wash text-success-strong",
    warm: "bg-warm-wash text-warm-700",
  } as const;

  return (
    <Card as="section" className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            tones[tone],
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-0.5">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
        </div>
      </div>
      {children}
    </Card>
  );
}

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
        <a
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold text-secondary hover:bg-band"
        >
          Skip for now
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      }
      notificationContext="onboarding"
      signedInAs={signedInName}
      workspaceLabel="Individual identity due-diligence onboarding"
    >
      <WorkspaceContent columns="overview">
        <WorkspacePane
          as="aside"
          aria-labelledby="identity-progress-title"
          className="max-xl:order-2"
        >
          <Card>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wash-blue text-cobalt">
                <Fingerprint className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-0.5">
                <Eyebrow>Account setup</Eyebrow>
                <h2
                  id="identity-progress-title"
                  className="text-sm font-semibold text-ink"
                >
                  Due-diligence stages
                </h2>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-line bg-band px-3.5 py-3">
              <div className="flex flex-col gap-0.5">
                <Eyebrow>Current status</Eyebrow>
                <p className="text-sm font-semibold text-ink">Not started</p>
              </div>
              <span aria-hidden="true" className="text-mist">
                <CircleDashed className="h-4 w-4" />
              </span>
            </div>

            <ol className="mt-4 flex flex-col gap-3">
              {STAGES.map((stage, index) => (
                <li key={stage.label} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                      stage.state === "current"
                        ? "border-ink bg-ink text-white"
                        : "border-line-strong bg-white text-mist-light",
                    )}
                  >
                    {stage.state === "locked" ? (
                      <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <strong className="text-xs font-semibold text-ink">
                      {stage.label}
                    </strong>
                    <p className="text-[11px] leading-4 text-mist">
                      {stage.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </WorkspacePane>

        <WorkspacePane
          as="section"
          className="flex flex-col gap-4 max-xl:order-1"
        >
          <Card
            as="section"
            aria-labelledby="identity-verification-title"
            className="flex flex-col gap-4"
          >
            {/* Amber, not blue. This is the caveat that stops someone reading a
                passed identity check as a verified company, which is exactly the
                confusion the product exists to prevent. */}
            <Callout
              tone="caution"
              icon={UserCheck}
              title="Identity is one part of the decision"
              className="px-4 py-3.5"
            >
              Passing this check will not verify a company or prove that you are
              authorised to represent it. Those checks happen separately.
            </Callout>

            <PageHeading
              eyebrow="Individual identity due diligence"
              id="identity-verification-title"
              lede="Signing in confirms access to this account. Before an organisation can be registered, a separate identity check will establish that its creator is who they claim to be."
            >
              Verify the person behind the organisation
            </PageHeading>
          </Card>

          <Card className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <Eyebrow>Expected method</Eyebrow>
                <h2 className="text-sm font-semibold text-ink">
                  What the check will involve
                </h2>
              </div>
              <span className="rounded-full border border-line-strong bg-band px-2.5 py-1 text-[11px] font-semibold text-ink-muted">
                GPG45-aligned target
              </span>
            </div>

            <ol className="flex flex-col gap-3">
              {CHECK_STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li
                    key={step.title}
                    className="flex items-start gap-3 rounded-xl border border-line bg-panel px-3.5 py-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wash-blue text-cobalt">
                      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-mist-light">
                        Step {index + 1}
                      </span>
                      <h3 className="text-xs font-semibold text-ink">
                        {step.title}
                      </h3>
                      <p className="text-[11px] leading-4 text-mist">
                        {step.copy}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled
                aria-describedby="identity-provider-status"
                className="inline-flex w-fit cursor-not-allowed items-center gap-2 rounded-lg border border-line-strong bg-line-soft px-4 py-2.5 text-xs font-semibold text-mist"
              >
                Begin identity check
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <p
                id="identity-provider-status"
                role="status"
                className="text-[11px] text-mist"
              >
                Verification provider not connected yet. No identity information
                will be collected or sent.
              </p>
            </div>
          </Card>
        </WorkspacePane>

        <WorkspacePane
          as="aside"
          aria-label="Verification guidance"
          className="flex flex-col gap-3.5 max-xl:order-3 max-xl:grid max-xl:grid-cols-2 max-lg:grid-cols-1"
        >
          <GuidanceCard
            icon={KeyRound}
            tone="blue"
            eyebrow="After identity verification"
            title="What this unlocks"
          >
            <ul className="flex flex-col gap-2">
              {UNLOCKED.map((capability) => (
                <li
                  key={capability}
                  className="flex items-start gap-2 text-[11px] leading-4 text-ink-soft"
                >
                  <Check
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-strong"
                    aria-hidden="true"
                  />
                  {capability}
                </li>
              ))}
            </ul>
          </GuidanceCard>

          <GuidanceCard
            icon={Building2}
            tone="navy"
            eyebrow="Separate due diligence"
            title="What remains locked"
          >
            <ul className="flex flex-col gap-2">
              {LOCKED.map((capability) => (
                <li
                  key={capability}
                  className="flex items-start gap-2 text-[11px] leading-4 text-mist"
                >
                  <LockKeyhole
                    className="mt-0.5 h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  {capability}
                </li>
              ))}
            </ul>
          </GuidanceCard>

          <GuidanceCard
            icon={ShieldCheck}
            tone="green"
            eyebrow="Privacy by design"
            title="Minimal data retained"
          >
            <p className="text-[11px] leading-4 text-mist">
              The future provider will handle identity evidence in its hosted
              service. AIN Registry will keep only the assurance outcome,
              timestamps and an opaque audit reference.
            </p>
          </GuidanceCard>

          <GuidanceCard
            icon={UserCheck}
            tone="warm"
            eyebrow=""
            title="Assisted review will be available"
          >
            <p className="text-[11px] leading-4 text-mist">
              Provider failure will lead to retry or manual review, not a
              permanent denial.
            </p>
          </GuidanceCard>

          <span className="sr-only">
            Assurance state: {initialIndividualAssurance.status}
          </span>
        </WorkspacePane>
      </WorkspaceContent>
    </WorkspaceShell>
  );
}
