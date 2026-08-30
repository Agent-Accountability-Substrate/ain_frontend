import type { ReactNode } from "react";

import { SettingsLayout } from "@/domains/workspace/settings-layout";
import type { AccountWorkspaceState } from "@/domains/workspace/account-workspace";
import {
  assuranceProfileLabel,
  isEmailOnlyAssurance,
  type IndividualAssuranceStatus,
} from "@/domains/identity/identity-assurance";
import {
  ACCOUNT_SETTINGS,
  IDENTITY_ONBOARDING,
} from "@/domains/workspace/workspace-routes";
import { ButtonLink } from "@/lib/ui/button";
import { Card } from "@/lib/ui/card";
import { StatusPill, type StatusTone } from "@/lib/ui/status-pill";

/**
 * The account's own settings: what the account says about you, and where the
 * identity check stands.
 */

const ASSURANCE: Record<
  IndividualAssuranceStatus,
  { label: string; tone: StatusTone; action?: string }
> = {
  not_started: {
    label: "Not started",
    tone: "pending",
    action: "Start identity check",
  },
  pending: { label: "In progress", tone: "pending", action: "Continue" },
  needs_review: { label: "Being reviewed", tone: "attention" },
  verified: { label: "Verified", tone: "success" },
  failed: {
    label: "Could not be completed",
    tone: "refused",
    action: "Try again",
  },
  expired: { label: "Expired", tone: "attention", action: "Verify again" },
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-line py-3 first:border-t-0 first:pt-0">
      <dt className="text-[11px] font-semibold text-mist">{label}</dt>
      <dd className="min-w-0 text-sm text-ink">{children}</dd>
    </div>
  );
}

export function AccountSecurityView({
  email,
  name,
  state,
}: {
  email: string | null | undefined;
  name: string | null | undefined;
  state: AccountWorkspaceState;
}) {
  const assurance = ASSURANCE[state.individualAssurance.status];
  const { checkedAt, expiresAt, assuranceProfile, providerReference } =
    state.individualAssurance;
  const level = assuranceProfileLabel(assuranceProfile);
  const emailOnly = isEmailOnlyAssurance(state.individualAssurance);
  const date = (value: string) =>
    new Date(value).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const record: [string, string][] = [
    ...(checkedAt
      ? ([["Checked", date(checkedAt)]] as [string, string][])
      : []),
    ...(expiresAt
      ? ([["Expires", date(expiresAt)]] as [string, string][])
      : []),
    ...(assuranceProfile !== undefined && level === null
      ? ([["Profile", assuranceProfile]] as [string, string][])
      : []),
    ...(providerReference
      ? ([["Reference", providerReference]] as [string, string][])
      : []),
  ];

  return (
    <SettingsLayout
      currentPath={ACCOUNT_SETTINGS}
      title="Account & security"
      lede="This account, whichever company you are acting for."
    >
      <Card as="section" aria-labelledby="details-title">
        <h2 id="details-title" className="text-sm font-semibold text-ink">
          Your details
        </h2>
        <dl className="mt-4 flex flex-col">
          <Row label="Name">{name?.trim() || "Not set"}</Row>
          <Row label="Email">{email ?? "Not available"}</Row>
          <Row label="Password">
            {/* Credentials are held by the identity provider, so there is
                nothing here to change. */}
            <span className="text-mist">Changed when you sign in</span>
          </Row>
        </dl>
      </Card>

      <Card as="section" aria-labelledby="identity-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id="identity-title" className="text-sm font-semibold text-ink">
              Identity check
            </h2>
            {assurance.action ? (
              <p className="text-[11px] leading-4 text-mist">
                A one-off check, so we know who is registering the company.
              </p>
            ) : null}
          </div>
          {/* Status and level in one phrase. Either alone misleads: "Verified"
              on its own reads as a document check, and a level on its own does
              not say whether it holds. */}
          <StatusPill tone={assurance.tone}>
            {level === null ? assurance.label : `${assurance.label} · ${level}`}
          </StatusPill>
        </div>

        {/* Without this, an account confirmed by an email round-trip carries a
            green pill and nothing says that is all it is. */}
        {emailOnly ? (
          <p className="mt-3 text-[11px] leading-4 text-mist">
            So far we have only confirmed your email address. A full identity
            check will replace this — nothing is needed from you until then.
          </p>
        ) : null}

        {state.individualAssurance.reviewReason ? (
          <p className="mt-3 text-[11px] leading-4 text-mist">
            {state.individualAssurance.reviewReason}
          </p>
        ) : null}

        {/* A check that has passed stops being a task and becomes something
            you may need to quote. Nothing here is document data — the outcome,
            the dates and an opaque reference are all it holds. */}
        {record.length > 0 ? (
          <dl className="mt-4 flex flex-col">
            {record.map(([label, value]) => (
              <Row key={label} label={label}>
                {label === "Reference" ? (
                  <span className="select-all break-all font-mono text-[11px]">
                    {value}
                  </span>
                ) : (
                  value
                )}
              </Row>
            ))}
          </dl>
        ) : null}

        {/* A provider that cannot place someone is the case the onboarding
            screen already promises a human for. */}
        {state.individualAssurance.status === "failed" ? (
          <p className="mt-3 text-[11px] leading-4 text-mist">
            If it fails again, we review it by hand rather than turning you
            away.
          </p>
        ) : null}

        {assurance.action ? (
          <div className="mt-4">
            <ButtonLink variant="primary" href={IDENTITY_ONBOARDING}>
              {assurance.action}
            </ButtonLink>
          </div>
        ) : emailOnly ? (
          <div className="mt-4">
            <ButtonLink variant="secondary" href={IDENTITY_ONBOARDING}>
              What the full check involves
            </ButtonLink>
          </div>
        ) : null}
      </Card>
    </SettingsLayout>
  );
}
