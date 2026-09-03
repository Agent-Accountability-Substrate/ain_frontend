"use client";

import { useActionState, useState } from "react";

import {
  removeMemberAction,
  type RemoveMemberState,
} from "@/domains/organisations/organisation-actions";
import type { OrganisationMember } from "@/domains/workspace/account-workspace";
import { ConfirmDialog } from "@/lib/ui/alert-dialog";
import { Button } from "@/lib/ui/button";
import { StatusPill, type StatusTone } from "@/lib/ui/status-pill";

/**
 * One person who can act for this organisation.
 *
 * The status is on the row because "invited" and "has access" are different
 * facts and an address alone cannot tell them apart: an invitation binds on
 * the invitee's first verified login, and until then it grants nothing.
 *
 * Removing asks first. It is not destructive in the database — the row stays
 * and its status becomes `removed`, because a membership that authorised an
 * action has to remain evidenceable — but it is immediate and it is somebody's
 * access, so it gets a confirmation like any other irreversible-feeling act.
 */

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  org_admin: "Admin",
  compliance: "Compliance",
  auditor: "Auditor",
};

const STATUS: Record<string, { label: string; tone: StatusTone }> = {
  active: { label: "Active", tone: "success" },
  pending: { label: "Invited", tone: "pending" },
  removed: { label: "Removed", tone: "refused" },
};

export function OrganisationMemberRow({
  member,
  organisationId,
}: {
  member: OrganisationMember;
  organisationId: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [result, formAction, pending] = useActionState<
    RemoveMemberState,
    FormData
  >(removeMemberAction, { status: "idle" });

  // A removal revalidates the list beneath, so the row is on its way out and
  // the dialog should not still be over it. A refusal keeps it open, because
  // the registry's reason is inside it.
  const open = confirming && result.status !== "removed";
  const status = STATUS[member.status] ?? {
    label: member.status,
    tone: "neutral" as const,
  };

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-line bg-panel px-4 py-3.5">
      <span className="text-sm font-semibold text-ink">{member.email}</span>
      <StatusPill tone={member.role === "owner" ? "success" : "neutral"}>
        {ROLE_LABEL[member.role] ?? member.role}
      </StatusPill>
      <StatusPill tone={status.tone}>{status.label}</StatusPill>

      {/* The owner is a column on the organisation rather than a role, so an
          organisation without one could never be administered again. The
          registry refuses it too; this is the same rule, said first. */}
      {member.role === "owner" ? null : (
        <Button
          type="button"
          variant="ghost"
          onClick={() => setConfirming(true)}
          className="ml-auto px-0 text-mist hover:text-destructive"
        >
          Remove
        </Button>
      )}

      <ConfirmDialog
        open={open}
        onOpenChange={setConfirming}
        title={`Remove ${member.email}?`}
        description="They lose access to this organisation's register, its agents and its evidence on their next request. The membership itself is kept, marked removed, so anything it authorised stays evidenceable."
        confirmLabel="Remove"
        destructive
        pending={pending}
        action={formAction}
      >
        <input
          type="hidden"
          name="organisationId"
          value={organisationId}
          readOnly
        />
        <input type="hidden" name="memberId" value={member.id} readOnly />
        <input type="hidden" name="email" value={member.email} readOnly />
        {result.status === "error" ? (
          <p role="alert" className="text-[11px] leading-4 text-destructive">
            {result.message}
          </p>
        ) : null}
      </ConfirmDialog>
    </li>
  );
}
