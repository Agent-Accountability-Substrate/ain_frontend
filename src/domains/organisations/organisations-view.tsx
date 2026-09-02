import { ArrowRight, Building2 } from "lucide-react";

import { PrimaryNextActions } from "@/domains/workspace/primary-next-actions";
import {
  WorkspaceContent,
  WorkspacePane,
  WorkspaceShell,
} from "@/domains/workspace/workspace-shell";
import {
  getSelectedOrganisation,
  initialAccountWorkspaceState,
  type AccountWorkspaceState,
  type OrganisationVerificationStatus,
} from "@/domains/workspace/account-workspace";
import { menuItemsFor } from "@/domains/workspace/workspace-navigation";
import { ButtonLink } from "@/lib/ui/button";
import { Card } from "@/lib/ui/card";
import { EmptyState } from "@/lib/ui/empty-state";
import { PageHeading } from "@/lib/ui/page-heading";
import { StatusPill, type StatusTone } from "@/lib/ui/status-pill";

/**
 * Where the tone lives. The union keeps the registry's own words so the meaning
 * survives a filter; these soften them for a reader. The two that are not
 * "pending" or "verified" are deliberately worded as opposites: one is a task,
 * the other is finished. "Not approved" rather than "Rejected", because a
 * refusal is not an accusation — and phrased as done, because that row cannot
 * be repaired; the way forward is a fresh registration.
 */
const STATUS: Record<
  OrganisationVerificationStatus,
  { label: string; tone: StatusTone }
> = {
  pending: { label: "Verification pending", tone: "pending" },
  needs_attention: { label: "More information needed", tone: "attention" },
  verified: { label: "Verified", tone: "success" },
  rejected: { label: "Not approved", tone: "refused" },
};

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
      <WorkspaceContent>
        <WorkspacePane as="aside">
          <PrimaryNextActions state={state} />
        </WorkspacePane>

        <WorkspacePane>
          {state.organisations.length > 0 ? (
            <Card as="section" aria-labelledby="organisations-title">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <PageHeading
                  eyebrow="Organisation workspace"
                  id="organisations-title"
                >
                  Your organisations
                </PageHeading>
                <ButtonLink href="/organisations/new">
                  Create organisation
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
              </header>

              <ul className="mt-5 flex flex-col gap-2.5">
                {state.organisations.map((organisation) => (
                  <li
                    key={organisation.id}
                    className="flex flex-col gap-2 rounded-2xl border border-line bg-panel px-4 py-3.5"
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span className="text-sm font-semibold text-ink">
                        {organisation.name}
                      </span>
                      <span className="text-[11px] font-medium text-mist">
                        {organisation.membershipRole === "owner"
                          ? "Owner"
                          : "Member"}
                      </span>
                      <StatusPill
                        tone={STATUS[organisation.verificationStatus].tone}
                      >
                        {STATUS[organisation.verificationStatus].label}
                      </StatusPill>
                      {organisation.id === state.selectedOrganisationId ? (
                        <StatusPill tone="neutral" className="ml-auto">
                          Selected
                        </StatusPill>
                      ) : null}
                    </div>
                    {/* The label alone says a decision was made; only the
                        reason says what to do about it. Rendering one without
                        the other is what makes a status feel like a dead end. */}
                    {organisation.reviewReason ? (
                      <p className="text-[11px] leading-4 text-mist">
                        {organisation.reviewReason}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          ) : (
            <Card as="section" aria-labelledby="organisations-title">
              <PageHeading
                eyebrow="Organisation workspace"
                id="organisations-title"
              >
                No organisations yet
              </PageHeading>
              <EmptyState
                className="mt-5"
                icon={Building2}
                action={
                  <ButtonLink variant="primary" href="/organisations/new">
                    Create first organisation
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </ButtonLink>
                }
              >
                Start with the organisation details and authority evidence. The
                setup flow will take you directly to your first agent.
              </EmptyState>
            </Card>
          )}
        </WorkspacePane>
      </WorkspaceContent>
    </WorkspaceShell>
  );
}
