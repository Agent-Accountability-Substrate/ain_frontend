import { ArrowRight } from "lucide-react";

import { AgentRegister } from "@/domains/agents/agent-register";
import {
  WorkspaceContent,
  WorkspacePane,
} from "@/domains/workspace/workspace-content";
import type {
  AccountWorkspaceState,
  OrganisationSummary,
} from "@/domains/workspace/account-workspace";
import { orgHref } from "@/domains/workspace/workspace-routes";
import { ButtonLink } from "@/lib/ui/button";
import { Callout } from "@/lib/ui/callout";
import { PageHeading } from "@/lib/ui/page-heading";

/** The whole register, which Home only shows the head of. */
export function AgentRegisterView({
  organisation,
  state,
}: {
  organisation: OrganisationSummary;
  state: AccountWorkspaceState;
}) {
  const agents = state.agents.filter(
    (agent) => agent.organisationId === organisation.id,
  );
  const verified = organisation.verificationStatus === "verified";

  return (
    <>
      <WorkspaceContent columns="single">
        <WorkspacePane className="mx-auto flex w-[min(100%,64rem)] flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <PageHeading
              eyebrow={organisation.name}
              lede="Every agent registered by this organisation, with the permanent identifier each one was minted with."
            >
              Agents
            </PageHeading>
            {verified ? (
              <ButtonLink
                variant="primary"
                href={orgHref(organisation.ulid, "agents/new")}
              >
                Register an agent
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
            ) : null}
          </div>

          {verified ? null : (
            <Callout
              tone="caution"
              title="This organisation is not verified yet"
            >
              Agents can be registered once we have confirmed the company and
              your authority to act for it.
            </Callout>
          )}

          <AgentRegister agents={agents} organisations={[organisation]} />
        </WorkspacePane>
      </WorkspaceContent>
    </>
  );
}
