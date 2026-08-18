"use client";

import { AgentCreationWizard } from "@/components/agent-creation-wizard";
import { WorkspaceShell } from "@/components/workspace-shell";
import {
  getSelectedOrganisation,
  initialAccountWorkspaceState,
  type AccountWorkspaceState,
} from "@/lib/account-workspace";
import { menuItemsFor } from "@/lib/workspace-navigation";

export function AgentCreationView({
  email,
  state = initialAccountWorkspaceState,
}: {
  email: string | null | undefined;
  state?: AccountWorkspaceState;
}) {
  const organisation = getSelectedOrganisation(state);
  const verified = organisation?.verificationStatus === "verified";

  return (
    <WorkspaceShell
      currentPath="/agents/new"
      email={email}
      navigationItems={menuItemsFor(state.isOperator)}
      navigationLabel="Account sections"
      organisations={state.organisations}
      selectedOrganisationId={state.selectedOrganisationId}
      showOrganisationSwitcher
      signedInAs={organisation?.name ?? "No organisation selected"}
      workspaceLabel="Create agent"
    >
      <div className="account-wizard-workspace">
        <aside className="account-wizard-side">
          <p className="dashboard-eyebrow">Agent workspace</p>
          <h1>
            {organisation
              ? verified
                ? "Declare an accountable agent"
                : "Verification pending"
              : "Select an organisation first"}
          </h1>
          <p className="wizard-side-copy">
            {organisation
              ? verified
                ? "An agent's identifier is permanent, and its authorised scope is signed. Both are declared here."
                : "Agents can be registered once trust operations verify this organisation."
              : "Agent records belong to an organisation. Choose one before preparing the record."}
          </p>
          {organisation ? null : (
            <a className="wizard-primary-action" href="/organisations">
              Choose organisation
            </a>
          )}
        </aside>
        <div className="account-wizard-main">
          <AgentCreationWizard
            organisationId={organisation?.id ?? null}
            organisationName={organisation?.name ?? null}
            organisationVerified={verified}
          />
        </div>
      </div>
    </WorkspaceShell>
  );
}
