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

import { PrimaryNextActions } from "@/components/primary-next-actions";
import { WorkspaceShell } from "@/components/workspace-shell";
import {
  getAccountOverviewStats,
  getSelectedOrganisation,
  initialAccountWorkspaceState,
  type AccountWorkspaceState,
} from "@/lib/account-workspace";
import { userMenuItems } from "@/lib/workspace-navigation";

const metricIcons = [
  ShieldCheck,
  Building2,
  UsersRound,
  Clock3,
  CircleAlert,
  Network,
] as const;

const metricVisualisations = [
  "segments",
  "threshold",
  "gauge",
  "segments",
  "threshold",
  "gauge",
] as const;

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
  const signedInAs = selectedOrganisation?.name ?? "No organisation selected";
  const metrics = [
    {
      label: "Account verification status",
      value: formatStatus(stats.verificationStatus),
      context: "Required before organisation creation",
      href: "/onboarding/identity",
    },
    {
      label: "Number of organisations owned",
      value: stats.organisationsOwned,
    },
    {
      label: "Number of organisations joined",
      value: stats.organisationsJoined,
    },
    {
      label: "Organisations pending verification",
      value: stats.organisationsPendingVerification,
    },
    {
      label: "Organisations requiring attention",
      value: stats.organisationsRequiringAttention,
    },
    {
      label: "Total accessible agents across organisations",
      value: stats.totalAccessibleAgents,
    },
  ] as const;

  return (
    <WorkspaceShell
      assuranceStatus={state.individualAssurance.status}
      currentPath="/dashboard"
      email={email}
      navigationItems={userMenuItems}
      navigationLabel="Account sections"
      organisations={state.organisations}
      selectedOrganisationId={state.selectedOrganisationId}
      showOrganisationSwitcher
      signedInAs={signedInAs}
      workspaceLabel="Account overview"
    >
      <div className="account-overview-workspace">
        <aside className="account-overview-side">
          <PrimaryNextActions state={state} />
        </aside>

        <main className="account-overview-main">
          <header className="account-overview-heading">
            <div>
              <p className="dashboard-eyebrow">Account workspace</p>
              <h1>Overview</h1>
              <p>Account assurance and organisation access in one place.</p>
            </div>
            <span className="account-zero-state-label">No live records</span>
          </header>

          <section className="account-metric-grid" aria-label="Account metrics">
            {metrics.map((metric, index) => {
              const Icon = metricIcons[index]!;
              const visualisation = metricVisualisations[index]!;
              const isEmpty =
                typeof metric.value === "number"
                  ? metric.value === 0
                  : stats.verificationStatus !== "verified";

              return (
                <article key={metric.label} className="account-metric-card">
                  <div className="account-metric-heading">
                    <p>{metric.label}</p>
                    <span>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="account-metric-body">
                    <strong
                      className={
                        typeof metric.value === "string"
                          ? "account-metric-text-value"
                          : undefined
                      }
                    >
                      {metric.value}
                    </strong>
                    <div
                      aria-hidden="true"
                      className={`account-metric-visual account-metric-visual-${visualisation}`}
                      data-state={isEmpty ? "empty" : "active"}
                    >
                      {visualisation === "segments" ? (
                        <span className="account-metric-segments">
                          {Array.from({ length: 6 }, (_, segment) => (
                            <i key={segment} />
                          ))}
                        </span>
                      ) : null}
                      {visualisation === "threshold" ? (
                        <>
                          <span className="account-metric-threshold-track">
                            <i />
                          </span>
                          <span className="account-metric-threshold-marker" />
                        </>
                      ) : null}
                      {visualisation === "gauge" ? (
                        <>
                          <span className="account-metric-gauge-arc" />
                          <span className="account-metric-gauge-line" />
                        </>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </main>

        <aside className="account-overview-support">
          <section
            className="account-activity-card"
            aria-labelledby="recent-organisation-activity-title"
          >
            <div className="account-support-heading">
              <span>
                <Activity className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="dashboard-eyebrow">Organisation updates</p>
                <h2 id="recent-organisation-activity-title">
                  Recent organisation activity
                </h2>
              </div>
            </div>

            {state.recentActivity.length === 0 ? (
              <div className="account-empty-state">
                <Building2 className="h-5 w-5" aria-hidden="true" />
                <h3>No organisation activity yet</h3>
                <p>
                  Activity will appear after an organisation is created or
                  joined.
                </p>
              </div>
            ) : (
              <ol>
                {state.recentActivity.map((activity) => (
                  <li key={activity.id}>
                    <p>{activity.summary}</p>
                    <time dateTime={activity.occurredAt}>
                      {activity.occurredAt}
                    </time>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="account-demo-card">
            <p className="dashboard-eyebrow">Illustrative product view</p>
            <h2>Explore an agent accountability record</h2>
            <p>
              This separate demo does not represent an organisation or agent
              accessible by this account.
            </p>
            <a href="/dashboard/agent-demo">
              Open illustrative agent demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </section>
        </aside>
      </div>
    </WorkspaceShell>
  );
}
