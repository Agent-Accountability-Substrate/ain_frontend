"use client";

import { useActionState } from "react";
import { UserPlus, UsersRound } from "lucide-react";

import { inviteMemberAction } from "@/domains/organisations/organisation-actions";
import type { InviteMemberState } from "@/domains/organisations/organisation-actions";
import { OrganisationMemberRow } from "@/domains/organisations/organisation-member-row";
import type { OrganisationMember } from "@/domains/workspace/account-workspace";
import { Button } from "@/lib/ui/button";
import { Callout } from "@/lib/ui/callout";
import { Card } from "@/lib/ui/card";
import { EmptyState } from "@/lib/ui/empty-state";
import { Eyebrow } from "@/lib/ui/eyebrow";
import { SelectField } from "@/lib/ui/select-field";
import { TextField } from "@/lib/ui/text-field";

/**
 * Who else can act for this organisation.
 *
 * Any address, deliberately: an auditor, an outside adviser or a contractor may
 * need to read a register without holding a company mailbox. The role is the
 * limit, not the domain.
 */

const ROLES = [
  { value: "org_admin", label: "Admin — register and manage agents" },
  {
    value: "compliance",
    label: "Compliance — read everything, change nothing",
  },
  { value: "auditor", label: "Auditor — read the record and its evidence" },
] as const;

export function OrganisationMembersView({
  members,
  membersUnavailable,
  organisationId,
}: {
  members: readonly OrganisationMember[];
  /** The registry cannot list members yet; the invite path is real. */
  membersUnavailable: boolean;
  organisationId: string;
}) {
  const [result, formAction, pending] = useActionState<
    InviteMemberState,
    FormData
  >(inviteMemberAction, { status: "idle" });

  return (
    <>
      <Card
        as="section"
        aria-labelledby="members-title"
        className="flex flex-col gap-4"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wash-blue text-cobalt">
            <UsersRound className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-0.5">
            <Eyebrow>People</Eyebrow>
            <h2 id="members-title" className="text-sm font-semibold text-ink">
              {members.length === 0
                ? "Members"
                : `${members.length} member${members.length === 1 ? "" : "s"}`}
            </h2>
          </div>
        </div>

        {membersUnavailable ? (
          <Callout tone="caution" title="We cannot show this list yet">
            This registry does not serve the member list. Anyone already invited
            still has access — they are just not listed here. You can carry on
            inviting below.
          </Callout>
        ) : null}

        {/* An unread list is not an empty one. "Only you can act for this
            organisation" is a claim about the tenant's membership, and the
            callout above has just said we cannot read it — so for any company
            with people in it that pairing states a falsehood as fact. */}
        {membersUnavailable ? null : members.length === 0 ? (
          <EmptyState icon={UsersRound}>
            Only you can act for this organisation. Anyone invited here can read
            its register; what else they can do depends on the role you give
            them.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {members.map((member) => (
              <OrganisationMemberRow
                key={member.id}
                member={member}
                organisationId={organisationId}
              />
            ))}
          </ul>
        )}
      </Card>

      <Card as="section" aria-labelledby="invite-title">
        <form action={formAction} className="flex flex-col gap-5">
          <input type="hidden" name="organisationId" value={organisationId} />
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wash-blue text-cobalt">
              <UserPlus className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-0.5">
              <Eyebrow>Invite</Eyebrow>
              <h2 id="invite-title" className="text-sm font-semibold text-ink">
                Give someone access
              </h2>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Email address"
              name="email"
              type="email"
              required
              placeholder="auditor@example.com"
              description="Any address. An auditor or adviser does not need a company mailbox."
              error={
                result.status === "error" ? result.errors["email"] : undefined
              }
            />
            <SelectField
              label="Role"
              name="role"
              items={ROLES}
              defaultValue="compliance"
              error={
                result.status === "error" ? result.errors["role"] : undefined
              }
            />
          </div>

          {result.status === "error" ? (
            <Callout tone="danger" alert>
              {result.message}
            </Callout>
          ) : result.status === "invited" ? (
            <Callout tone="info" alert>
              {result.email} can now act for this organisation.
            </Callout>
          ) : (
            <Callout>
              An invitation grants access to this organisation only. It carries
              no rights over any other organisation this account belongs to.
            </Callout>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Inviting…" : "Send invitation"}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
