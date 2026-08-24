import { ArrowRight, Building2 } from "lucide-react";

import { PrimaryNextActions } from "@/domains/workspace/primary-next-actions";
import { WorkspaceShell } from "@/domains/workspace/workspace-shell";
import {
  getSelectedOrganisation,
  initialAccountWorkspaceState,
  type AccountWorkspaceState,
} from "@/domains/workspace/account-workspace";
import { menuItemsFor } from "@/domains/workspace/workspace-navigation";

// Where the tone lives. The union keeps the registry's own words so the meaning
// survives a filter; these soften them for a reader. The two that are not
// "pending" or "verified" are deliberately worded as opposites: one is a task,
// the other is finished. "Not approved" rather than "Rejected", because a
// refusal is not an accusation — and phrased as done, because that row cannot
// be repaired; the way forward is a fresh registration.
const organisationStatusLabel = {
  pending: "Verification pending",
  needs_attention: "More information needed",
  verified: "Verified",
  rejected: "Not approved",
} as const;

export function OrganisationsView({
  email,
  state = initialAccountWorkspaceState,
}: {
  email: string | null | undefined;
  state?: AccountWorkspaceState;
}) {
  const selectedOrganisation = getSelectedOrganisation(state);

  return (
    <WorkspaceShell
      assuranceStatus={state.individualAssurance.status}
      currentPath="/organisations"
      email={email}
      navigationItems={menuItemsFor(state.isOperator)}
      navigationLabel="Account sections"
      organisations={state.organisations}
      selectedOrganisationId={state.selectedOrganisationId}
      showOrganisationSwitcher
      signedInAs={selectedOrganisation?.name ?? "No organisation selected"}
      workspaceLabel="Organisations"
    >
      <div className="account-route-workspace">
        <aside>
          <PrimaryNextActions state={state} />
        </aside>

        <div className="account-route-main">
          {state.organisations.length > 0 ? (
            <section
              className="organisation-list"
              aria-labelledby="organisations-title"
            >
              <header>
                <div>
                  <p className="dashboard-eyebrow">Organisation workspace</p>
                  <h1 id="organisations-title">Your organisations</h1>
                </div>
                <a href="/organisations/new">
                  Create organisation
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </header>
              <ul>
                {state.organisations.map((organisation) => (
                  <li key={organisation.id}>
                    <span className="organisation-list-name">
                      {organisation.name}
                    </span>
                    <span className="organisation-list-meta">
                      {organisation.membershipRole === "owner"
                        ? "Owner"
                        : "Member"}
                      {" · "}
                      {organisationStatusLabel[organisation.verificationStatus]}
                    </span>
                    {/* The label alone says a decision was made; only the
                        reason says what to do about it. Rendering one without
                        the other is what makes a status feel like a dead end. */}
                    {organisation.reviewReason ? (
                      <span className="organisation-list-meta">
                        {organisation.reviewReason}
                      </span>
                    ) : null}
                    {organisation.id === state.selectedOrganisationId ? (
                      <span className="organisation-list-current">
                        Selected
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section
              className="organisation-empty-state"
              aria-labelledby="organisations-title"
            >
              <Building2 className="h-7 w-7" aria-hidden="true" />
              <p className="dashboard-eyebrow">Organisation workspace</p>
              <h1 id="organisations-title">No organisations yet</h1>
              <p>
                Start with the organisation details and authority evidence. The
                setup flow will take you directly to your first agent.
              </p>
              <a href="/organisations/new">
                Create first organisation
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </section>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
