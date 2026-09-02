"use client";

import { ChevronDown, LogOut, ShieldCheck } from "lucide-react";

import { signOutAction } from "@/domains/auth/auth-actions";
import { ACCOUNT_SETTINGS } from "@/domains/workspace/workspace-routes";
import {
  Menu,
  MenuGroup,
  MenuItem,
  MenuLinkItem,
  MenuSeparator,
} from "@/lib/ui/menu";

/**
 * The account menu.
 *
 * The trigger's accessible name contains the visible email rather than
 * replacing it, so Label in Name (WCAG 2.5.3) holds. Base UI keeps the open
 * state on `aria-expanded`, so the name does not have to carry it.
 *
 * Sign-out is a real `menuitem` that submits a form, so it is reachable by
 * keyboard from inside the menu.
 */
export function UserAccountMenu({
  email,
}: {
  email: string | null | undefined;
}) {
  const accountEmail = email ?? "unknown";
  const initial =
    accountEmail === "unknown" ? "A" : accountEmail.charAt(0).toUpperCase();

  return (
    <Menu
      triggerLabel={`${accountEmail}, account menu`}
      triggerClassName="flex items-center gap-2 rounded-full border border-line-strong bg-white py-1 pl-1 pr-3 text-xs font-medium text-ink-soft hover:border-ink/20 data-[popup-open]:border-ink/30"
      trigger={
        <>
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-wash-blue text-[11px] font-semibold text-cobalt"
          >
            {initial}
          </span>
          {/* Visible above `sm`, where there is room for it. The name comes from
              `triggerLabel` rather than from a second, screen-reader-only copy
              of the address: two nodes would put the name at the mercy of a
              stylesheet, and read it twice anywhere CSS had not loaded. */}
          <span className="hidden max-w-40 truncate sm:inline">
            {accountEmail}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-mist" aria-hidden="true" />
        </>
      }
    >
      <MenuGroup label="Account">
        {/* The account's own settings, addressed without a tenant because no
            organisation owns them. */}
        <MenuLinkItem href={ACCOUNT_SETTINGS}>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-wash-blue text-cobalt">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="font-semibold">Account &amp; security</span>
        </MenuLinkItem>
      </MenuGroup>

      <MenuSeparator />

      <form action={signOutAction}>
        {/* `nativeButton` tells Base UI the rendered element really is a
            <button>, so it stops adding the role and aria-disabled it would
            otherwise need to fake one. Submitting the form is why it has to be
            a real button. */}
        <MenuItem nativeButton render={<button type="submit" />}>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-line-soft text-ink-soft">
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          Sign out
        </MenuItem>
      </form>
    </Menu>
  );
}
