import type { ReactNode } from "react";
import { LockKeyhole, Settings } from "lucide-react";

import { NotificationsMenu } from "@/domains/workspace/notifications-menu";
import { OrganisationSwitcher } from "@/domains/organisations/organisation-switcher";
import { SubraLogo } from "@/domains/workspace/subra-logo";
import { UserAccountMenu } from "@/domains/workspace/user-account-menu";
import type { OrganisationSummary } from "@/domains/workspace/account-workspace";
import type { IndividualAssuranceStatus } from "@/domains/identity/identity-assurance";
import type { UserMenuItem } from "@/domains/workspace/workspace-navigation";

export type WorkspaceNavigationItem = {
  label: string;
  href: string;
  active?: boolean;
  locked?: boolean;
  requiresVerifiedAccount?: boolean;
};

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
    <main className="dashboard-canvas">
      <section className="dashboard-shell" aria-label={workspaceLabel}>
        <header
          className={
            hasNavigation
              ? "dashboard-command-bar"
              : "dashboard-command-bar dashboard-command-bar-contextual"
          }
        >
          <a
            href="/dashboard"
            aria-label="Subra AIN Registry home"
            className="flex shrink-0 items-center gap-3 rounded-lg font-semibold text-ink"
          >
            <SubraLogo className="w-24 sm:w-28" />
            <span className="hidden border-l border-line-strong pl-3 text-[10px] uppercase tracking-[0.14em] text-ink-muted xl:inline">
              AIN Registry
            </span>
          </a>

          {hasNavigation ? (
            <nav
              aria-label={navigationLabel ?? "Workspace navigation"}
              className="dashboard-navigation"
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
                    className="dashboard-navigation-locked"
                    aria-disabled="true"
                  >
                    <LockKeyhole className="h-3 w-3" aria-hidden="true" />
                    {item.label}
                  </span>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "dashboard-navigation-active"
                        : "dashboard-navigation-link"
                    }
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>
          ) : null}

          <div className="dashboard-command-actions">
            <NotificationsMenu context={notificationContext} />
            <span
              className="hidden h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-white text-ink-muted sm:flex"
              aria-hidden="true"
            >
              <Settings className="h-4 w-4" />
            </span>
            <UserAccountMenu email={email} />
          </div>
        </header>

        {children}

        <footer className="dashboard-footer">
          <div className="workspace-footer-context">
            {showOrganisationSwitcher ? (
              <OrganisationSwitcher
                organisations={organisations}
                selectedOrganisationId={selectedOrganisationId}
              />
            ) : (
              <p>
                Signed in as <span>{signedInAs}</span>
              </p>
            )}
          </div>
          {footerAction}
        </footer>
      </section>
    </main>
  );
}
