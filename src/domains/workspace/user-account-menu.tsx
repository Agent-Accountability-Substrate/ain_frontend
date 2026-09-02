"use client";

import { ChevronDown, LockKeyhole, LogOut, UserRound } from "lucide-react";

import { signOutAction } from "@/domains/auth/auth-actions";
import { Menu, MenuGroup, MenuItem, MenuSeparator } from "@/lib/ui/menu";

/**
 * The account menu.
 *
 * The trigger's accessible name is the account's email plus its role. The
 * previous markup used a static "Open account menu" label, which *replaced* the
 * visible email rather than containing it — a Label in Name failure
 * (WCAG 2.5.3) — and told a screen-reader user the menu was closed while it was
 * open, because the label never changed. Base UI keeps the open state on the
 * trigger's `aria-expanded`, so the name no longer has to carry it.
 *
 * Sign-out is a real `menuitem` that submits a form, so it is reachable by
 * keyboard from inside the menu. The previous markup put a plain button inside
 * a `<details>` that arrow keys could not enter.
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
        {/* Genuinely disabled, and announced as such. `aria-disabled` on a
          role-less <div> — the previous markup — is dropped by assistive
          technology entirely, so this read as an ordinary item that did
          nothing when activated. */}
        <MenuItem disabled className="items-start">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-line-soft text-mist">
            <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="font-semibold">
              Profile &amp; account management
            </span>
            <span className="text-[11px] text-mist-light">
              Available when account settings are connected
            </span>
          </span>
          <LockKeyhole
            className="ml-auto h-3.5 w-3.5 shrink-0 text-mist-light"
            aria-hidden="true"
          />
        </MenuItem>
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
