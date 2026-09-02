import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { LockKeyhole, Settings } from "lucide-react";

import { NotificationsMenu } from "@/domains/workspace/notifications-menu";
import { OrganisationSwitcher } from "@/domains/organisations/organisation-switcher";
import { SubraLogo } from "@/domains/workspace/subra-logo";
import { UserAccountMenu } from "@/domains/workspace/user-account-menu";
import type { OrganisationSummary } from "@/domains/workspace/account-workspace";
import type { IndividualAssuranceStatus } from "@/domains/identity/identity-assurance";
import type { UserMenuItem } from "@/domains/workspace/workspace-navigation";
import { cn } from "@/lib/utils";

/**
 * The authenticated chrome: command bar, navigation, content, footer.
 *
 * Above 1280×720 the shell is a fixed-height app frame and each pane scrolls
 * inside it (`app-shell:` variant); below that it is an ordinary scrolling
 * document. Height is part of that query deliberately — a wide but short
 * viewport must keep the document scroll or the panes collapse.
 */

export type WorkspaceNavigationItem = {
  label: string;
  href: string;
  active?: boolean;
  locked?: boolean;
  requiresVerifiedAccount?: boolean;
};

const NAV_ITEM =
  "shrink-0 rounded-[0.65rem] px-3 py-2 text-[0.72rem] font-semibold leading-none transition-colors duration-(--dur-hover)";

type WorkspaceShellProps = {
  assuranceStatus?: IndividualAssuranceStatus;
  children: ReactNode;
  currentPath?: string;
  email: string | null | undefined;
  enforceOrganisationVerification?: boolean;
  footerAction?: ReactNode;
  navigationItems?: readonly (WorkspaceNavigationItem | UserMenuItem)[];
  navigationLabel?: string;
  notificationContext?: "onboarding" | "workspace";
  organisations?: readonly Pick<OrganisationSummary, "id" | "name">[];
  selectedOrganisationId?: string | null;
  showOrganisationSwitcher?: boolean;
  signedInAs: string;
  workspaceLabel: string;
};

export function WorkspaceShell({
  assuranceStatus = "not_started",
  children,
  currentPath,
  email,
  enforceOrganisationVerification = false,
  footerAction,
  navigationItems = [],
  navigationLabel,
  notificationContext = "workspace",
  organisations = [],
  selectedOrganisationId = null,
  showOrganisationSwitcher = false,
  signedInAs,
  workspaceLabel,
}: WorkspaceShellProps) {
  const hasNavigation = navigationItems.length > 0;

  return (
    <main className="workspace-canvas min-h-screen px-[clamp(0.5rem,0.85vw,0.75rem)] py-[clamp(0.5rem,1.7vw,1.5rem)] handheld:p-0">
      <section
        aria-label={workspaceLabel}
        className={cn(
          "workspace-shell-surface relative isolate mx-auto flex w-[98%] flex-col overflow-hidden rounded-[clamp(1.25rem,2vw,2rem)] border border-[rgba(139,151,170,0.32)] bg-[#f3f6fa]",
          "min-h-[calc(100vh-clamp(1rem,3.4vw,3rem))]",
          // Fixed frame on a large screen; the panes below take the scroll.
          "app-shell:h-[calc(100vh-clamp(1rem,3.4vw,3rem))] app-shell:min-h-0",
          "handheld:min-h-screen handheld:rounded-none handheld:border-x-0",
        )}
      >
        <header
          className={cn(
            "relative z-20 grid min-h-18 items-center gap-4 border-b border-[rgba(207,214,225,0.82)] bg-[rgba(247,249,252,0.88)] px-2.5 py-3 backdrop-blur-[18px]",
            hasNavigation
              ? "grid-cols-[auto_minmax(0,1fr)_auto]"
              : "grid-cols-[minmax(0,1fr)_auto]",
            "bar-stacked:min-h-16 bar-stacked:grid-cols-[1fr_auto] bar-stacked:px-4 bar-stacked:py-2.5",
          )}
        >
          <a
            href="/dashboard"
            aria-label="Subra AIN Registry home"
            className="flex shrink-0 items-center gap-3 rounded-lg font-semibold text-ink bar-stacked:col-start-1 bar-stacked:row-start-1"
          >
            <SubraLogo className="w-24 sm:w-28" />
            <span className="hidden border-l border-line-strong pl-3 text-[10px] uppercase tracking-[0.14em] text-ink-muted xl:inline">
              AIN Registry
            </span>
          </a>

          {hasNavigation ? (
            <nav
              aria-label={navigationLabel ?? "Workspace navigation"}
              className="flex w-fit min-w-0 max-w-full items-center gap-0.5 justify-self-center overflow-x-auto rounded-[0.85rem] border border-line bg-white/80 p-1 shadow-[0_8px_24px_-22px_rgba(9,17,38,0.7)] [scrollbar-width:none] [overscroll-behavior-inline:contain] bar-stacked:col-span-full bar-stacked:row-start-2 bar-stacked:w-full bar-stacked:justify-self-stretch"
            >
              {navigationItems.map((item) => {
                const locked =
                  ("locked" in item && item.locked) ||
                  (enforceOrganisationVerification &&
                    item.requiresVerifiedAccount === true &&
                    assuranceStatus !== "verified");
                const active =
                  ("active" in item ? item.active : undefined) ??
                  (item.href === currentPath ||
                    (currentPath === "/dashboard/agent-demo" &&
                      item.href === "/dashboard"));

                return locked ? (
                  <span
                    key={item.label}
                    aria-disabled="true"
                    className={cn(
                      NAV_ITEM,
                      "flex items-center gap-1.5 text-mist-light",
                    )}
                  >
                    <LockKeyhole className="h-3 w-3" aria-hidden="true" />
                    {item.label}
                  </span>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      NAV_ITEM,
                      active
                        ? "bg-ink text-white shadow-[0_8px_18px_-12px_rgba(9,17,38,0.8)]"
                        : "text-mist hover:bg-band hover:text-ink",
                    )}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>
          ) : null}

          <div className="flex min-w-0 shrink-0 items-center justify-end gap-2 bar-stacked:col-start-2 bar-stacked:row-start-1">
            <NotificationsMenu context={notificationContext} />
            <span
              aria-hidden="true"
              className="hidden h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-white text-ink-muted sm:flex"
            >
              <Settings className="h-4 w-4" />
            </span>
            <UserAccountMenu email={email} />
          </div>
        </header>

        {children}

        <footer className="flex min-h-14 items-center justify-between gap-4 border-t border-[rgba(207,214,225,0.82)] bg-[rgba(247,249,252,0.86)] px-2.5 py-2">
          <div className="flex min-w-0 items-center text-[11px] text-mist">
            {showOrganisationSwitcher ? (
              <OrganisationSwitcher
                organisations={organisations}
                selectedOrganisationId={selectedOrganisationId}
              />
            ) : (
              <p>
                Signed in as{" "}
                <span className="font-semibold text-ink-soft">
                  {signedInAs}
                </span>
              </p>
            )}
          </div>
          {footerAction}
        </footer>
      </section>
    </main>
  );
}

/**
 * The content region inside the shell.
 *
 * Owns the one thing every screen shares and nothing else: the grid, and the
 * pane-scrolling behaviour that pairs with the shell's fixed frame. `columns`
 * is the only knob because the four historical layouts differed in exactly
 * that.
 */
export function WorkspaceContent({
  columns = "sidebar",
  className,
  children,
}: {
  columns?: "sidebar" | "overview" | "single";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid flex-1 gap-3.5 px-2.5 pb-4 pt-4 handheld:px-2 handheld:py-3",
        // `min-h-0` is load-bearing: a flex item keeps `min-height:auto` and
        // refuses to shrink, so the shell's `overflow:hidden` could never
        // constrain it and the panes would never scroll.
        "min-h-0 app-shell:overflow-hidden",
        columns === "overview" &&
          "grid-cols-[minmax(0,1fr)] items-start gap-10 xl:grid-cols-[17rem_minmax(30rem,1fr)_21rem]",
        columns === "sidebar" &&
          "grid-cols-[minmax(0,1fr)] items-start lg:grid-cols-[15.5rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)]",
        columns === "single" && "grid-cols-[minmax(0,1fr)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * A pane that scrolls inside the fixed frame rather than growing it.
 *
 * The remaining props pass through to the element, so a pane can carry the
 * `id` an in-page anchor targets and the `aria-labelledby` that names it —
 * without the shell having to know which sections a screen links between.
 */
export function WorkspacePane({
  as: Tag = "div",
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"div"> & {
  as?: "div" | "aside" | "section";
}) {
  return (
    <Tag
      {...props}
      className={cn(
        "min-h-0 app-shell:max-h-full app-shell:overflow-y-auto app-shell:[overscroll-behavior:contain]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
