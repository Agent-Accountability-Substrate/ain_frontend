import {
  ArrowRight,
  Building2,
  CircleAlert,
  CircleDashed,
  ShieldCheck,
} from "lucide-react";

import { AgentRegister } from "@/domains/agents/agent-register";
import { PrimaryNextActions } from "@/domains/workspace/primary-next-actions";
import {
  WorkspaceContent,
  WorkspacePane,
} from "@/domains/workspace/workspace-content";
import {
  isSetupComplete,
  type AccountWorkspaceState,
  type OrganisationSummary,
} from "@/domains/workspace/account-workspace";
import { orgHref } from "@/domains/workspace/workspace-routes";
import { ButtonLink } from "@/lib/ui/button";
import { Callout } from "@/lib/ui/callout";
import { Card } from "@/lib/ui/card";
import { Eyebrow } from "@/lib/ui/eyebrow";
import { PageHeading } from "@/lib/ui/page-heading";
import { StatusPill, type StatusTone } from "@/lib/ui/status-pill";
import { cn } from "@/lib/utils";

/**
 * Home: what needs attention, and the shape of the estate behind it.
 *
 * Not a duplicate of the register — Agents is that. This is the screen a
 * compliance lead opens to find out whether anything has moved.
 */

const STATUS: Record<
  OrganisationSummary["verificationStatus"],
  { label: string; tone: StatusTone }
> = {
  pending: { label: "Verification pending", tone: "pending" },
  needs_attention: { label: "More information needed", tone: "attention" },
  verified: { label: "Verified", tone: "success" },
  rejected: { label: "Not approved", tone: "refused" },
};

export function OrganisationHomeView({
  organisation,
  state,
}: {
  organisation: OrganisationSummary;
  state: AccountWorkspaceState;
}) {
  const status = STATUS[organisation.verificationStatus];
  const agents = state.agents.filter(
    (agent) => agent.organisationId === organisation.id,
  );
  const verified = organisation.verificationStatus === "verified";
  const inactive = agents.filter((agent) => agent.status !== "active");
  const settled = isSetupComplete(state);
  // The callout and the checklist's "We check the company" step carry the same
  // sentence while a plain review runs, so both together state one fact twice.
  // A `reviewReason` is never a restatement: the checklist step says only that
  // somebody has asked for something, never what — and a refusal is not in the
  // checklist at all, which can show the next step locked but cannot say the
  // registration was decided against.
  const restatedByChecklist =
    !settled &&
    organisation.verificationStatus === "pending" &&
    organisation.reviewReason === undefined;

  return (
    <>
      <WorkspaceContent
        columns="single"
        className={settled ? undefined : "xl:grid-cols-[minmax(0,1fr)_19rem]"}
      >
        <WorkspacePane className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <PageHeading eyebrow="Organisation">
              {organisation.name}
            </PageHeading>
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
          </div>

          {verified || restatedByChecklist ? null : (
            <Callout
              tone={
                organisation.verificationStatus === "rejected"
                  ? "danger"
                  : "caution"
              }
              icon={Building2}
              title={
                organisation.verificationStatus === "rejected"
                  ? "This registration was not approved"
                  : "Agents cannot be registered yet"
              }
            >
              {organisation.reviewReason ??
                "We are confirming the company and your authority to act for it."}
            </Callout>
          )}

          <section
            aria-label="Standing"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <Card className="flex items-start gap-3">
              {/* Three tones, not two. An estate with nothing in it is neither
                  clear nor flagged, and a green tick against "No agents
                  registered" reads as a pass for a state that is simply
                  empty. */}
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  agents.length === 0
                    ? "bg-band text-mist"
                    : inactive.length > 0
                      ? "bg-warm-wash text-warm-700"
                      : "bg-success-wash text-success-strong",
                )}
              >
                {agents.length === 0 ? (
                  <CircleDashed className="h-4 w-4" aria-hidden="true" />
                ) : inactive.length > 0 ? (
                  <CircleAlert className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                )}
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <Eyebrow>Needs attention</Eyebrow>
                <p className="text-sm font-semibold text-ink">
                  {agents.length === 0
                    ? "Nothing to review yet"
                    : inactive.length === 0
                      ? `All ${agents.length} active`
                      : `${inactive.length} of ${agents.length} not active`}
                </p>
              </div>
            </Card>

            <Card className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wash-blue text-cobalt">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <Eyebrow>Accountable record</Eyebrow>
                <p className="text-sm font-semibold text-ink">
                  {agents.length === 0
                    ? "Nothing signed yet"
                    : `${agents.length} signed record${agents.length === 1 ? "" : "s"}`}
                </p>
                {verified ? (
                  <ButtonLink
                    variant="ghost"
                    href={orgHref(organisation.ulid, "agents/new")}
                    className="mt-1 self-start px-0"
                  >
                    Register an agent
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </ButtonLink>
                ) : null}
              </div>
            </Card>
          </section>

          {/* A window on the register, not the register: five rows and a way
            through to the rest of it. */}
          <AgentRegister
            agents={agents}
            organisations={[organisation]}
            href={orgHref(organisation.ulid, "agents")}
            limit={5}
          />
        </WorkspacePane>

        {settled ? null : (
          <WorkspacePane as="aside" className="max-xl:order-2">
            <PrimaryNextActions state={state} />
          </WorkspacePane>
        )}
      </WorkspaceContent>
    </>
  );
}
