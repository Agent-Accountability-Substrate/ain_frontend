import { AgentCreationWizard } from "@/domains/agents/agent-creation-wizard";
import {
  WorkspaceContent,
  WorkspacePane,
} from "@/domains/workspace/workspace-content";
import type { OrganisationSummary } from "@/domains/workspace/account-workspace";
import { Eyebrow } from "@/lib/ui/eyebrow";

export function AgentCreationView({
  organisation,
}: {
  organisation: OrganisationSummary;
}) {
  const verified = organisation.verificationStatus === "verified";

  return (
    <>
      <WorkspaceContent>
        {/* Side rail sits left on a wide screen and below the wizard when
          stacked — the guidance is context, and the form is the task. */}
        <WorkspacePane
          as="aside"
          className="flex flex-col gap-3 max-lg:order-2"
        >
          <Eyebrow>{organisation.name}</Eyebrow>
          <h1 className="text-lg font-semibold tracking-[-0.02em] text-ink">
            {verified ? "Register an agent" : "Verification pending"}
          </h1>
          <p className="text-xs leading-5 text-mist">
            {verified
              ? "An agent's identifier is permanent, and its authorised scope is signed. Both are declared here."
              : "Agents can be registered once we have verified this organisation."}
          </p>
        </WorkspacePane>

        <WorkspacePane className="max-lg:order-1">
          <AgentCreationWizard
            organisationId={organisation.id}
            organisationName={organisation.name}
            organisationUlid={organisation.ulid}
            organisationVerified={verified}
          />
        </WorkspacePane>
      </WorkspaceContent>
    </>
  );
}
