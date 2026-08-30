"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Settings } from "lucide-react";

import { NotificationsMenu } from "@/domains/workspace/notifications-menu";
import { OrganisationSwitcher } from "@/domains/organisations/organisation-switcher";
import { SubraLogo } from "@/domains/workspace/subra-logo";
import { UserAccountMenu } from "@/domains/workspace/user-account-menu";
import type { OrganisationSummary } from "@/domains/workspace/account-workspace";
import type { IndividualAssuranceStatus } from "@/domains/identity/identity-assurance";
import { menuItemsFor } from "@/domains/workspace/workspace-navigation";
import {
  isOrganisationUlid,
  SETTINGS,
} from "@/domains/workspace/workspace-routes";
import { cn } from "@/lib/utils";

/**
 * The authenticated chrome, rendered once by the layout above every screen —
 * so the bar and the rail are mounted once and survive a navigation beneath
 * them.
 *
 * Which organisation it shows, and which section is current, both come from
 * the path rather than from props: a layout is not re-rendered per route and
 * so cannot be told.
 *
 * The frame is the viewport at every size — the document never scrolls, and
 * the two regions that can outgrow it scroll inside it. `100dvh` rather than
 * `100vh` because a phone's address bar shrinks the viewport as you scroll.
 */

const NAV_ITEM =
  "flex items-center gap-2 rounded-[0.65rem] px-3 py-2 text-[0.78rem] font-semibold leading-none transition-colors duration-(--dur-hover)";

/** `/o/<ulid>/…` → the ULID. Anything else — `/settings`, `/o/new` — is null. */
function organisationInPath(pathname: string): string | null {
  const segments = pathname.split("/");
  return segments[1] === "o" &&
    segments[2] !== undefined &&
    isOrganisationUlid(segments[2])
    ? segments[2]
    : null;
}

export function WorkspaceShell({
  assuranceStatus = "not_started",
  children,
  email,
  isOperator = false,
  organisations = [],
  selectedOrganisationId = null,
}: {
  assuranceStatus?: IndividualAssuranceStatus;
  children: ReactNode;
  email: string | null | undefined;
  isOperator?: boolean;
  organisations?: readonly OrganisationSummary[];
  /**
   * What the loader resolved — the last switch, or the only membership there
   * is. Used only where the address names no organisation; there it is the
   * same answer the screen inside the frame arrived at.
   */
  selectedOrganisationId?: string | null;
}) {
  const pathname = usePathname();
  const named = organisationInPath(pathname);
  const selected =
    (named === null
      ? null
      : (organisations.find((entry) => entry.ulid === named) ?? null)) ??
    organisations.find((entry) => entry.id === selectedOrganisationId) ??
    organisations[0] ??
    null;

  const navigationItems = menuItemsFor(isOperator, selected?.ulid ?? null);
  const hasNavigation = navigationItems.length > 0;

  return (
    <main className="relative isolate flex h-[100dvh] flex-col overflow-hidden bg-[#f3f6fa]">
      <header className="relative z-20 flex h-16 shrink-0 items-center gap-4 border-b border-[rgba(207,214,225,0.82)] bg-[rgba(247,249,252,0.88)] px-4 backdrop-blur-[18px]">
        {/* The organisation rather than a product wordmark: someone signed in
            already knows whose product it is, but not at a glance which tenant
            they are acting for. */}
        <div className="flex min-w-0 shrink items-center">
          {selected ? (
            <OrganisationSwitcher
              organisations={organisations}
              selectedOrganisationId={selected.id}
            />
          ) : (
            <SubraLogo className="w-24 sm:w-28" />
          )}
        </div>

        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2">
          <NotificationsMenu assuranceStatus={assuranceStatus} />
          <Link
            href={SETTINGS}
            aria-label="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-white text-ink-muted transition-colors duration-(--dur-hover) hover:border-ink/20 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
          </Link>
          <UserAccountMenu email={email} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden handheld:flex-col">
        {hasNavigation ? (
          <nav
            aria-label="Workspace navigation"
            className={cn(
              "flex w-56 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-[rgba(207,214,225,0.82)] bg-[rgba(247,249,252,0.5)] px-3 py-4",
              // Below the rail's width it becomes a scrolling strip under the
              // bar, which is the one place a row of sections still fits.
              "handheld:w-full handheld:flex-row handheld:gap-1 handheld:overflow-x-auto handheld:overflow-y-hidden handheld:border-b handheld:border-r-0 handheld:px-3 handheld:py-2.5 handheld:[scrollbar-width:none]",
            )}
          >
            {navigationItems.map((item) => {
              const active = item.href === pathname;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    NAV_ITEM,
                    "shrink-0",
                    active
                      ? "bg-ink text-white shadow-[0_8px_18px_-12px_rgba(9,17,38,0.8)]"
                      : "text-mist hover:bg-band hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : null}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </main>
  );
}
