import {
  ArrowRight,
  Building2,
  CircleAlert,
  Clock3,
  Network,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { OrganisationRowMenu } from "@/domains/organisations/organisation-row-menu";
import { SettingsLayout } from "@/domains/workspace/settings-layout";
import {
  getAccountOverviewStats,
  type AccountWorkspaceState,
  type OrganisationSummary,
  type OrganisationVerificationStatus,
} from "@/domains/workspace/account-workspace";
import {
  NEW_ORGANISATION,
  ORGANISATION_SETTINGS,
} from "@/domains/workspace/workspace-routes";
import { ButtonLink } from "@/lib/ui/button";
import { Card } from "@/lib/ui/card";
import { EmptyState } from "@/lib/ui/empty-state";
import { MetricCard, type MetricVisual } from "@/lib/ui/metric-card";
import { StatusPill, type StatusTone } from "@/lib/ui/status-pill";

/**
 * Where the tone lives. The union keeps the registry's own words so the meaning
 * survives a filter; these soften them for a reader. The two that are not
 * "pending" or "verified" are deliberately worded as opposites: one is a task,
 * the other is finished. "Not approved" rather than "Rejected", because a
 * refusal is not an accusation — and phrased as done, because that row cannot
 * be repaired; the way forward is a fresh registration.
 */
const STATUS: Record<
  OrganisationVerificationStatus,
  { label: string; tone: StatusTone }
> = {
  pending: { label: "Verification pending", tone: "pending" },
  needs_attention: { label: "More information needed", tone: "attention" },
  verified: { label: "Verified", tone: "success" },
  rejected: { label: "Not approved", tone: "refused" },
};

/**
 * One company this account can act for.
 *
 * The ULID is on the row because it is the organisation's public name — the
 * middle segment of every AIN it mints — so it is what someone quotes in a
 * support thread or matches against a resolver URL, and hunting for it inside
 * the organisation is the wrong way round.
 *
 * The row itself does not navigate. Switching organisation is the switcher's
 * job, and a list that also switched would be a second one — quietly moving
 * the whole workspace under someone who clicked a settings row. What acts on
 * the row is the menu beside it.
 */
function OrganisationRow({
  email,
  organisation,
}: {
  email: string;
  organisation: OrganisationSummary;
}) {
  const status = STATUS[organisation.verificationStatus];

  return (
    <li className="flex items-start gap-3 rounded-2xl border border-line bg-panel px-4 py-3.5">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-sm font-semibold text-ink">
            {organisation.name}
          </span>
          <span className="text-[11px] font-medium text-mist">
            {organisation.membershipRole === "owner" ? "Owner" : "Member"}
          </span>
          <StatusPill tone={status.tone}>{status.label}</StatusPill>
        </div>

        <p className="select-all break-all font-mono text-[11px] leading-4 text-mist-light">
          {organisation.ulid}
        </p>

        {/* The label alone says a decision was made; only the reason says what
            to do about it. Rendering one without the other is what makes a
            status feel like a dead end. */}
        {organisation.reviewReason ? (
          <p className="text-[11px] leading-4 text-mist">
            {organisation.reviewReason}
          </p>
        ) : null}
      </div>

      <OrganisationRowMenu email={email} organisation={organisation} />
    </li>
  );
}

export function OrganisationsView({
  email,
  state,
}: {
  email: string | null | undefined;
  state: AccountWorkspaceState;
}) {
  const stats = getAccountOverviewStats(state);

  const metrics: {
    label: string;
    value: number | string;
    icon: LucideIcon;
    visual: MetricVisual;
  }[] = [
    {
      label: "Organisations owned",
      value: stats.organisationsOwned,
      icon: Building2,
      visual: "segments",
    },
    {
      label: "Organisations joined",
      value: stats.organisationsJoined,
      icon: UsersRound,
      visual: "gauge",
    },
    {
      label: "Pending verification",
      value: stats.organisationsPendingVerification,
      icon: Clock3,
      visual: "segments",
    },
    {
      label: "Requiring attention",
      value: stats.organisationsRequiringAttention,
      icon: CircleAlert,
      visual: "threshold",
    },
    {
      label: "Agents across organisations",
      value: stats.totalAccessibleAgents,
      icon: Network,
      visual: "gauge",
    },
  ];

  return (
    <SettingsLayout
      currentPath={ORGANISATION_SETTINGS}
      title="Organisations"
      lede="Every company this account can act for."
    >
      {state.organisations.length === 0 ? (
        <Card as="section" aria-labelledby="organisations-title">
          <h2
            id="organisations-title"
            className="text-sm font-semibold text-ink"
          >
            No organisations yet
          </h2>
          <EmptyState
            className="mt-5"
            icon={Building2}
            action={
              <ButtonLink variant="primary" href={NEW_ORGANISATION}>
                Create first organisation
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
            }
          >
            Start with the organisation details and authority evidence. The
            setup flow will take you directly to your first agent.
          </EmptyState>
        </Card>
      ) : (
        <Card as="section" aria-labelledby="organisations-title">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <h2
              id="organisations-title"
              className="text-sm font-semibold text-ink"
            >
              {state.organisations.length} organisation
              {state.organisations.length === 1 ? "" : "s"}
            </h2>
            <ButtonLink href={NEW_ORGANISATION}>
              Register a company
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </header>

          <section
            aria-label="Account metrics"
            className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {metrics.map((metric) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                icon={metric.icon}
                visual={metric.visual}
                empty={metric.value === 0}
              />
            ))}
          </section>

          <ul className="mt-5 flex flex-col gap-2.5">
            {state.organisations.map((row) => (
              <OrganisationRow
                key={row.id}
                email={email ?? ""}
                organisation={row}
              />
            ))}
          </ul>
        </Card>
      )}
    </SettingsLayout>
  );
}
