"use client";

import { WorkspaceShell } from "@/components/workspace-shell";
import { AgentCreationWizard } from "@/components/agent-creation-wizard";
import { userMenuItems } from "@/lib/workspace-navigation";

export function AgentCreationView({
  email,
}: {
  email: string | null | undefined;
}) {
  return (
    <WorkspaceShell
      currentPath="/agents/new"
      email={email}
      navigationItems={userMenuItems}
      navigationLabel="Account sections"
      showOrganisationSwitcher
      signedInAs="No organisation selected"
      workspaceLabel="Create agent"
    >
      <div className="account-wizard-workspace">
        <aside className="account-wizard-side">
          <p className="dashboard-eyebrow">Agent workspace</p>
          <h1>Select an organisation first</h1>
          <p className="wizard-side-copy">
            Agent records belong to an organisation. Complete organisation setup
            or choose an existing organisation before preparing the record.
          </p>
          <a className="wizard-primary-action" href="/organisations">
            Choose organisation
          </a>
        </aside>
        <div className="account-wizard-main">
          <AgentCreationWizard organisationName={null} />
        </div>
      </div>
    </WorkspaceShell>
  );
}
