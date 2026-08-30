"use client";

import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import type { OrganisationSummary } from "@/domains/workspace/account-workspace";
import {
  isOrganisationUlid,
  NEW_ORGANISATION,
  ORGANISATION_SETTINGS,
  rememberOrganisation,
} from "@/domains/workspace/workspace-routes";
import { Menu, MenuGroup, MenuLinkItem, MenuSeparator } from "@/lib/ui/menu";

/**
 * Which organisation the workspace is acting for, and how to get anywhere else.
 *
 * A menu of links rather than a select, because the choice is a navigation:
 * it belongs in the history, opens in a new tab, and commits once on
 * activation rather than on every arrow keypress.
 *
 * Switching keeps you on the screen you were on. Standing on an agent register
 * and picking another organisation shows that organisation's agent register,
 * rather than dropping you back at a dashboard to navigate again.
 *
 * On a screen that belongs to nobody in particular — the account's settings,
 * registering a company — there is no equivalent screen to switch to, so it
 * stays put rather than throwing you out into the other organisation.
 */
export function OrganisationSwitcher({
  organisations,
  selectedOrganisationId,
}: {
  organisations: readonly Pick<OrganisationSummary, "id" | "ulid" | "name">[];
  selectedOrganisationId: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const selected =
    organisations.find(
      (organisation) => organisation.id === selectedOrganisationId,
    ) ?? null;

  /**
   * The same screen, in another organisation.
   *
   * Only the tenant segment moves: `/o/<a>/agents` becomes `/o/<b>/agents`,
   * and the agent register stays the agent register. A screen that is not
   * scoped to an organisation at all — the account's own settings, or
   * registering a company — is left exactly where it is. Rewriting one of
   * those into `/o/<b>` would answer "show me this in the other company" by
   * closing the page instead, which is not the question the control asks.
   */
  function sameScreenIn(ulid: string): string {
    const segments = pathname.split("/");
    // ["", "o", "<ulid>", ...the rest]
    if (
      segments[1] === "o" &&
      segments[2] !== undefined &&
      isOrganisationUlid(segments[2])
    ) {
      segments[2] = ulid;
      return segments.join("/");
    }
    return pathname;
  }

  return (
    <Menu
      align="start"
      triggerLabel={`${selected?.name ?? "No organisation selected"}, switch organisation`}
      triggerClassName="flex min-w-0 items-center gap-2 rounded-[0.7rem] border border-transparent px-2 py-1.5 text-left hover:border-line-strong hover:bg-white data-[popup-open]:border-line-strong data-[popup-open]:bg-white"
      trigger={
        <>
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink text-white"
          >
            <Building2 className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0 truncate text-[0.8rem] font-semibold text-ink">
            {selected?.name ?? "No organisation selected"}
          </span>
          <ChevronsUpDown
            className="h-3.5 w-3.5 shrink-0 text-mist"
            aria-hidden="true"
          />
        </>
      }
    >
      <MenuGroup
        label={organisations.length === 1 ? "Organisation" : "Organisations"}
      >
        {organisations.map((organisation) => (
          <MenuLinkItem
            key={organisation.id}
            href={sameScreenIn(organisation.ulid)}
            onClick={(event) => {
              rememberOrganisation(organisation.ulid);
              // On a screen whose address carries no organisation the link
              // goes nowhere new, and navigating would restore the same cached
              // render. There, the refresh *is* the navigation.
              if (sameScreenIn(organisation.ulid) === pathname) {
                event.preventDefault();
                router.refresh();
              }
            }}
            aria-current={
              organisation.id === selectedOrganisationId ? "true" : undefined
            }
          >
            <span className="min-w-0 flex-1 truncate">{organisation.name}</span>
            {organisation.id === selectedOrganisationId ? (
              <Check
                className="h-3.5 w-3.5 shrink-0 text-cobalt"
                aria-hidden="true"
              />
            ) : null}
          </MenuLinkItem>
        ))}
      </MenuGroup>
      <MenuSeparator />
      <MenuLinkItem href={ORGANISATION_SETTINGS}>
        Manage organisations
      </MenuLinkItem>
      <MenuLinkItem href={NEW_ORGANISATION}>
        <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Register a company
      </MenuLinkItem>
    </Menu>
  );
}
