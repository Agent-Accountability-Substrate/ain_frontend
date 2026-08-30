import { Building2, Fingerprint, Globe, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { SettingsLayout } from "@/domains/workspace/settings-layout";
import type { OrganisationSummary } from "@/domains/workspace/account-workspace";
import { orgHref } from "@/domains/workspace/workspace-routes";
import { Callout } from "@/lib/ui/callout";
import { Card } from "@/lib/ui/card";
import { Eyebrow } from "@/lib/ui/eyebrow";
import { StatusPill, type StatusTone } from "@/lib/ui/status-pill";

/**
 * One organisation's settings: what the registry holds about it.
 *
 * Read-only, because it is. These are the details a decision was made against,
 * so changing them afterwards would invalidate that decision; a correction is a
 * fresh registration.
 */

const STATUS: Record<
  OrganisationSummary["verificationStatus"],
  { label: string; tone: StatusTone; detail: string }
> = {
  pending: {
    label: "Verification pending",
    tone: "pending",
    detail: "We have not reviewed this registration yet.",
  },
  needs_attention: {
    label: "More information needed",
    tone: "attention",
    detail: "A reviewer has asked for something before they can decide.",
  },
  verified: {
    label: "Verified",
    tone: "success",
    detail:
      "The company and your authority to act for it have been confirmed. Agents registered here carry this organisation in their identifier.",
  },
  rejected: {
    label: "Not approved",
    tone: "refused",
    detail:
      "This registration is closed. The company number is free again, so the way forward is a fresh registration.",
  },
};

function Detail({
  icon: Icon,
  label,
  children,
  mono = false,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wash-blue text-cobalt">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <Eyebrow>{label}</Eyebrow>
        <p
          className={
            mono
              ? "select-all break-all font-mono text-[11px] leading-5 text-ink-soft"
              : "text-sm font-semibold text-ink"
          }
        >
          {children}
        </p>
      </div>
    </div>
  );
}

export function OrganisationSettingsView({
  organisation,
}: {
  organisation: OrganisationSummary;
}) {
  const status = STATUS[organisation.verificationStatus];

  return (
    <SettingsLayout
      currentPath={orgHref(organisation.ulid, "settings/registration")}
      title="Registration"
      lede="What the registry holds about this company, and where it stands."
    >
      <Card
        as="section"
        aria-labelledby="verification-title"
        className="flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <Eyebrow>Verification</Eyebrow>
            <h2
              id="verification-title"
              className="text-sm font-semibold text-ink"
            >
              {status.label}
            </h2>
          </div>
          <StatusPill tone={status.tone}>{status.label}</StatusPill>
        </div>
        <p className="text-xs leading-5 text-mist">{status.detail}</p>
        {organisation.reviewReason ? (
          <Callout
            tone={
              organisation.verificationStatus === "rejected"
                ? "danger"
                : "caution"
            }
            title="What the reviewer wrote"
          >
            {organisation.reviewReason}
          </Callout>
        ) : null}
      </Card>

      <Card
        as="section"
        aria-labelledby="registration-title"
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1">
          <Eyebrow>Registration</Eyebrow>
          <h2
            id="registration-title"
            className="text-sm font-semibold text-ink"
          >
            What the registry holds
          </h2>
          <p className="mt-1 text-xs leading-5 text-mist">
            A decision is made against these details, so changing them
            afterwards would invalidate it. A correction is a fresh registration
            rather than an edit.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Detail icon={Building2} label="Legal name">
            {organisation.name}
          </Detail>
          <Detail icon={ShieldCheck} label="Your membership">
            {organisation.membershipRole === "owner" ? "Owner" : "Member"}
          </Detail>
          <Detail icon={Fingerprint} label="Organisation identifier" mono>
            {organisation.ulid}
          </Detail>
          <Detail icon={Globe} label="Appears in every AIN as" mono>
            did:ain:gb:{organisation.ulid}:…
          </Detail>
        </div>
      </Card>
    </SettingsLayout>
  );
}
