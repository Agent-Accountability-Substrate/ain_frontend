import { AgentCreationWizard } from "@/domains/agents/agent-creation-wizard";
import {
  WorkspaceContent,
  WorkspacePane,
} from "@/domains/workspace/workspace-content";
import type { OrganisationSummary } from "@/domains/workspace/account-workspace";
import { Eyebrow } from "@/lib/ui/eyebrow";

export function AgentCreationView({
  draft,
  issuedAgent,
  organisation,
  unresolvedDraft,
}: {
  /** A draft being continued, already resolved against this organisation. */
  draft?: { ain: string; name: string } | null;
  /**
   * An agent a resume link named that is past its draft. It holds a signed
   * document, so the form has nothing to add: the wizard points at its record.
   */
  issuedAgent?: { ain: string; name: string; status: string } | null;
  organisation: OrganisationSummary;
  /**
   * An identifier a resume link named that resolves to nothing in this
   * organisation. The wizard refuses to start afresh from it, because a fresh
   * start mints an identifier and the one named may exist elsewhere.
   */
  unresolvedDraft?: string | null;
}) {
  const verified = organisation.verificationStatus === "verified";
  const unresolved = unresolvedDraft !== null && unresolvedDraft !== undefined;
  const issued = issuedAgent !== null && issuedAgent !== undefined;

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
              : issued
                ? "This agent is already registered"
                : unresolved
                  ? "Cannot resume this draft"
                  : draft
                    ? "Finish this agent"
                    : "Register an agent"}
          </h1>
          <p className="text-xs leading-5 text-mist">
            {!verified
              ? "Agents can be registered once we have verified this organisation."
              : issued
                ? "It holds a signed document, so its scope changes by a new signed version from its record, not here. Nothing is minted from this address."
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
            issuedAgent={issuedAgent}
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
