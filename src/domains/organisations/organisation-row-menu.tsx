"use client";

import { useActionState, useState } from "react";
import { MoreHorizontal } from "lucide-react";

import {
  leaveOrganisationAction,
  type LeaveOrganisationState,
} from "@/domains/organisations/organisation-actions";
import type { OrganisationSummary } from "@/domains/workspace/account-workspace";
import { orgHref } from "@/domains/workspace/workspace-routes";
import { ConfirmDialog } from "@/lib/ui/alert-dialog";
import { Menu, MenuItem, MenuLinkItem, MenuSeparator } from "@/lib/ui/menu";

/**
 * What you can do with one organisation, without opening it.
 *
 * The row itself goes into the organisation; this holds the two things that
 * are about the row rather than in it — where its settings are, and the way
 * out. Leaving is destructive and irreversible from this side, so it asks.
 */
export function OrganisationRowMenu({
  email,
  organisation,
}: {
  /**
   * The signed-in address. The registry ends a membership by id and has no
   * `/me` alias, so the action looks the caller's own row up by the address
   * their session carries — the same verified address a membership binds by.
   */
  email: string;
  organisation: OrganisationSummary;
}) {
  const [confirming, setConfirming] = useState(false);
  const [result, formAction, pending] = useActionState<
    LeaveOrganisationState,
    FormData
  >(leaveOrganisationAction, { status: "idle" });

  // Derived rather than closed by an effect: a successful leave revalidates
  // this list, so the row is on its way out and the dialog should not still be
  // over it. A refusal keeps it open, because the message is inside it.
  const open = confirming && result.status !== "left";

  return (
    <>
      <Menu
        triggerLabel={`Actions for ${organisation.name}`}
        triggerClassName="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent text-mist hover:border-line-strong hover:bg-white hover:text-ink data-[popup-open]:border-line-strong data-[popup-open]:bg-white"
        trigger={<MoreHorizontal className="h-4 w-4" aria-hidden="true" />}
      >
        <MenuLinkItem
          href={orgHref(organisation.ulid, "settings/registration")}
        >
          Organisation settings
        </MenuLinkItem>
        <MenuLinkItem href={orgHref(organisation.ulid, "settings/members")}>
          Members
        </MenuLinkItem>
        {organisation.membershipRole === "owner" ? null : (
          <>
            <MenuSeparator />
            <MenuItem
              nativeButton
              render={<button type="button" />}
              onClick={() => setConfirming(true)}
              className="text-destructive data-[highlighted]:bg-destructive/8 data-[highlighted]:text-destructive"
            >
              Leave organisation
            </MenuItem>
          </>
        )}
      </Menu>

      <ConfirmDialog
        open={open}
        onOpenChange={setConfirming}
        title={`Leave ${organisation.name}?`}
        description="You will lose access to its register, its agents and its evidence. An owner or admin can invite you back."
        confirmLabel="Leave"
        destructive
        pending={pending}
        action={formAction}
      >
        <input
          type="hidden"
          name="organisationId"
          value={organisation.id}
          readOnly
        />
        <input type="hidden" name="email" value={email} readOnly />
        {result.status === "error" ? (
          <p role="alert" className="text-[11px] leading-4 text-destructive">
            {result.message}
          </p>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
