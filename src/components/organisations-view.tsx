import { ArrowRight, Building2 } from "lucide-react";

import { PrimaryNextActions } from "@/components/primary-next-actions";
import { WorkspaceShell } from "@/components/workspace-shell";
import {
  getSelectedOrganisation,
  initialAccountWorkspaceState,
  type AccountWorkspaceState,
} from "@/lib/account-workspace";
import { userMenuItems } from "@/lib/workspace-navigation";

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
      navigationItems={userMenuItems}
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

        <main className="account-route-main">
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
        </main>
      </div>
    </WorkspaceShell>
  );
}
