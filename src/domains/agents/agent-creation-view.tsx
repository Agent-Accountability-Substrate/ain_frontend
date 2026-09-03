import { AgentCreationWizard } from "@/domains/agents/agent-creation-wizard";
import {
  WorkspaceContent,
  WorkspacePane,
} from "@/domains/workspace/workspace-content";
import type { OrganisationSummary } from "@/domains/workspace/account-workspace";
import { Eyebrow } from "@/lib/ui/eyebrow";

export function AgentCreationView({
  draft,
  organisation,
  unresolvedDraft,
}: {
  /** A draft being continued, already resolved against this organisation. */
  draft?: { ain: string; name: string } | null;
  organisation: OrganisationSummary;
  /**
   * An identifier a resume link named that is not a draft of this
   * organisation. The wizard refuses to start afresh from it, because a fresh
   * start mints an identifier and the one named may already exist.
   */
  unresolvedDraft?: string | null;
}) {
  const verified = organisation.verificationStatus === "verified";
  const unresolved = unresolvedDraft !== null && unresolvedDraft !== undefined;

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
            {!verified
              ? "Verification pending"
              : unresolved
                ? "Cannot resume this draft"
                : draft
                  ? "Finish this agent"
                  : "Register an agent"}
          </h1>
          <p className="text-xs leading-5 text-mist">
            {!verified
              ? "Agents can be registered once we have verified this organisation."
              : unresolved
                ? "No draft with that identifier is waiting here, so nothing is minted from this address. A draft keeps its permanent identifier until it is finished."
                : draft
                  ? "This draft already holds a permanent identifier. What is left is its authorised scope, the person accountable for it, and the signature."
                  : "An agent's identifier is permanent, and its authorised scope is signed. Both are declared here."}
          </p>
        </WorkspacePane>

        <WorkspacePane className="max-lg:order-1">
          <AgentCreationWizard
            draft={draft}
            organisationId={organisation.id}
            organisationName={organisation.name}
            organisationUlid={organisation.ulid}
            organisationVerified={verified}
            unresolvedDraft={unresolvedDraft}
          />
        </WorkspacePane>
      </WorkspaceContent>
    </>
  );
}
