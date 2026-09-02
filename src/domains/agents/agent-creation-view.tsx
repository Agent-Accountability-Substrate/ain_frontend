"use client";

import { AgentCreationWizard } from "@/domains/agents/agent-creation-wizard";
import {
  WorkspaceContent,
  WorkspacePane,
  WorkspaceShell,
} from "@/domains/workspace/workspace-shell";
import {
  getSelectedOrganisation,
  initialAccountWorkspaceState,
  type AccountWorkspaceState,
} from "@/domains/workspace/account-workspace";
import { menuItemsFor } from "@/domains/workspace/workspace-navigation";
import { ButtonLink } from "@/lib/ui/button";
import { Eyebrow } from "@/lib/ui/eyebrow";

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
      <WorkspaceContent>
        {/* Side rail sits left on a wide screen and below the wizard when
            stacked — the guidance is context, and the form is the task. */}
        <WorkspacePane
          as="aside"
          className="flex flex-col gap-3 max-lg:order-2"
        >
          <Eyebrow>Agent workspace</Eyebrow>
          <h1 className="text-lg font-semibold tracking-[-0.02em] text-ink">
            {organisation
              ? verified
                ? "Declare an accountable agent"
                : "Verification pending"
              : "Select an organisation first"}
          </h1>
          <p className="text-xs leading-5 text-mist">
            {organisation
              ? verified
                ? "An agent's identifier is permanent, and its authorised scope is signed. Both are declared here."
                : "Agents can be registered once trust operations verify this organisation."
              : "Agent records belong to an organisation. Choose one before preparing the record."}
          </p>
          {organisation ? null : (
            <ButtonLink
              variant="primary"
              href="/organisations"
              className="self-start"
            >
              Choose organisation
            </ButtonLink>
          )}
        </WorkspacePane>

        <WorkspacePane className="max-lg:order-1">
          <AgentCreationWizard
            organisationId={organisation?.id ?? null}
            organisationName={organisation?.name ?? null}
            organisationVerified={verified}
          />
        </WorkspacePane>
      </WorkspaceContent>
    </WorkspaceShell>
  );
}
