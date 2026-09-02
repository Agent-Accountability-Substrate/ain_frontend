import {
  Activity,
  ArrowRight,
  Building2,
  CircleAlert,
  Clock3,
  Network,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { PrimaryNextActions } from "@/domains/workspace/primary-next-actions";
import {
  WorkspaceContent,
  WorkspacePane,
  WorkspaceShell,
} from "@/domains/workspace/workspace-shell";
import {
  getAccountOverviewStats,
  getSelectedOrganisation,
  initialAccountWorkspaceState,
  type AccountWorkspaceState,
} from "@/domains/workspace/account-workspace";
import { menuItemsFor } from "@/domains/workspace/workspace-navigation";
import { Card } from "@/lib/ui/card";
import { EmptyState } from "@/lib/ui/empty-state";
import { Eyebrow } from "@/lib/ui/eyebrow";
import { PageHeading } from "@/lib/ui/page-heading";
import { MetricCard, type MetricVisual } from "@/lib/ui/metric-card";

/** Sentence case from the registry's snake_case status vocabulary. */
function formatStatus(
  status: AccountWorkspaceState["individualAssurance"]["status"],
) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function DashboardView({
  email,
  state = initialAccountWorkspaceState,
}: {
  email: string | null | undefined;
  state?: AccountWorkspaceState;
}) {
  const stats = getAccountOverviewStats(state);
  const selectedOrganisation = getSelectedOrganisation(state);

  const metrics: ReadonlyArray<{
    label: string;
    value: string | number;
    icon: typeof ShieldCheck;
    visual: MetricVisual;
  }> = [
    {
      label: "Account verification status",
      value: formatStatus(stats.verificationStatus),
      icon: ShieldCheck,
      visual: "segments",
    },
    {
      label: "Number of organisations owned",
      value: stats.organisationsOwned,
      icon: Building2,
      visual: "threshold",
    },
    {
      label: "Number of organisations joined",
      value: stats.organisationsJoined,
      icon: UsersRound,
      visual: "gauge",
    },
    {
      label: "Organisations pending verification",
      value: stats.organisationsPendingVerification,
      icon: Clock3,
      visual: "segments",
    },
    {
      label: "Organisations requiring attention",
      value: stats.organisationsRequiringAttention,
      icon: CircleAlert,
      visual: "threshold",
    },
    {
      label: "Total accessible agents across organisations",
      value: stats.totalAccessibleAgents,
      icon: Network,
      visual: "gauge",
    },
  ];

  return (
    <WorkspaceShell
      assuranceStatus={state.individualAssurance.status}
      currentPath="/dashboard"
      email={email}
      navigationItems={menuItemsFor(state.isOperator)}
      navigationLabel="Account sections"
      organisations={state.organisations}
      selectedOrganisationId={state.selectedOrganisationId}
      showOrganisationSwitcher
      signedInAs={selectedOrganisation?.name ?? "No organisation selected"}
      workspaceLabel="Account overview"
    >
      <WorkspaceContent columns="overview">
        {/* Stacked, the metrics lead: the checklist is guidance and the
            support rail is secondary, so both fall below. */}
        <WorkspacePane as="aside" className="max-xl:order-2">
          <PrimaryNextActions state={state} />
        </WorkspacePane>

        <WorkspacePane className="flex flex-col gap-5 max-xl:order-1">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <PageHeading
              eyebrow="Account workspace"
              lede="Account assurance and organisation access in one place."
            >
              Overview
            </PageHeading>
            {/* Unconditional, exactly as before. It is wrong — it shows beside a
                non-zero agent count — but it is a content defect on the deferred
                journey-findings list, and silently fixing it inside a restyle
                would hide it in a diff nobody is reading for that. */}
            <span className="shrink-0 rounded-full border border-line-strong bg-band px-2.5 py-1.5 text-[0.6875rem] font-bold text-mist">
              No live records
            </span>
          </header>

          <section
            aria-label="Account metrics"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {metrics.map((metric) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                icon={metric.icon}
                visual={metric.visual}
                empty={
                  typeof metric.value === "number"
                    ? metric.value === 0
                    : stats.verificationStatus !== "verified"
                }
              />
            ))}
          </section>
        </WorkspacePane>

        <WorkspacePane
          as="aside"
          className="flex flex-col gap-3.5 max-xl:order-3 max-xl:grid max-xl:grid-cols-2 max-lg:grid-cols-1"
        >
          <Card
            as="section"
            aria-labelledby="recent-organisation-activity-title"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wash-blue text-cobalt">
                <Activity className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-0.5">
                <Eyebrow>Organisation updates</Eyebrow>
                <h2
                  id="recent-organisation-activity-title"
                  className="text-sm font-semibold text-ink"
                >
                  Recent organisation activity
                </h2>
              </div>
            </div>

            {state.recentActivity.length === 0 ? (
              <EmptyState
                className="mt-4"
                icon={Building2}
                title="No organisation activity yet"
              >
                Activity will appear after an organisation is created or joined.
              </EmptyState>
            ) : (
              <ol className="mt-4 flex flex-col gap-3">
                {state.recentActivity.map((activity) => (
                  <li key={activity.id} className="flex flex-col gap-1">
                    <p className="text-xs text-ink-soft">{activity.summary}</p>
                    <time
                      dateTime={activity.occurredAt}
                      className="text-[11px] text-mist-light"
                    >
                      {activity.occurredAt}
                    </time>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card as="section" className="bg-wash-blue/70">
            <Eyebrow>Illustrative product view</Eyebrow>
            <h2 className="mt-1 text-sm font-semibold text-ink">
              Explore an agent accountability record
            </h2>
            <p className="mt-2 text-[11px] leading-4 text-mist">
              This separate demo does not represent an organisation or agent
              accessible by this account.
            </p>
            <a
              href="/dashboard/agent-demo"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-cobalt hover:underline"
            >
              Open illustrative agent demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </Card>
        </WorkspacePane>
      </WorkspaceContent>
    </WorkspaceShell>
  );
}
