import { Fingerprint, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  WorkspaceContent,
  WorkspacePane,
  WorkspaceShell,
} from "@/domains/workspace/workspace-shell";
import {
  getSelectedOrganisation,
  initialAccountWorkspaceState,
  type AccountWorkspaceState,
} from "@/domains/workspace/account-workspace";
import { menuItemsFor } from "@/domains/workspace/workspace-navigation";
import { Card } from "@/lib/ui/card";
import { Eyebrow } from "@/lib/ui/eyebrow";
import { PageHeading } from "@/lib/ui/page-heading";
import { cn } from "@/lib/utils";

function assuranceLabel(
  status: AccountWorkspaceState["individualAssurance"]["status"],
) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function SettingCard({
  icon: Icon,
  tone = "blue",
  eyebrow,
  title,
  titleId,
  children,
}: {
  icon: LucideIcon;
  tone?: "blue" | "green";
  eyebrow: string;
  title: string;
  titleId: string;
  children: string;
}) {
  return (
    <Card
      as="section"
      aria-labelledby={titleId}
      className="flex items-start gap-4"
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          tone === "green"
            ? "bg-success-wash text-success-strong"
            : "bg-wash-blue text-cobalt",
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 id={titleId} className="text-sm font-semibold text-ink">
          {title}
        </h2>
        <p className="text-[11px] leading-4 text-mist">{children}</p>
      </div>
    </Card>
  );
}

export function AccountSecurityView({
  email,
  name,
  state = initialAccountWorkspaceState,
}: {
  email: string | null | undefined;
  name: string | null | undefined;
  state?: AccountWorkspaceState;
}) {
  const selectedOrganisation = getSelectedOrganisation(state);
  const accountName = name?.trim() || "Account holder";
  const accountEmail = email ?? "Not available";

  return (
    <WorkspaceShell
      assuranceStatus={state.individualAssurance.status}
      currentPath="/account"
      email={email}
      navigationItems={menuItemsFor(state.isOperator)}
      navigationLabel="Account sections"
      organisations={state.organisations}
      selectedOrganisationId={state.selectedOrganisationId}
      showOrganisationSwitcher
      signedInAs={selectedOrganisation?.name ?? "No organisation selected"}
      workspaceLabel="Account and security"
    >
      <WorkspaceContent columns="single">
        <WorkspacePane className="mx-auto flex w-[min(100%,64rem)] flex-col gap-5">
          <PageHeading
            eyebrow="Personal account"
            lede="Authentication details and identity assurance are shown separately."
          >
            Account &amp; Security
          </PageHeading>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <SettingCard
              icon={UserRound}
              eyebrow="Profile"
              title={accountName}
              titleId="profile-title"
            >
              {accountEmail}
            </SettingCard>
            <SettingCard
              icon={KeyRound}
              eyebrow="Authentication"
              title="Managed by Auth0"
              titleId="authentication-title"
            >
              Signing in confirms account access, not personal identity.
            </SettingCard>
            <SettingCard
              icon={Fingerprint}
              tone="green"
              eyebrow="Individual assurance"
              title={assuranceLabel(state.individualAssurance.status)}
              titleId="assurance-title"
            >
              Email and provider sign-in status are never treated as identity
              assurance.
            </SettingCard>
            <SettingCard
              icon={ShieldCheck}
              tone="green"
              eyebrow="Session security"
              title="Protected workspace session"
              titleId="session-title"
            >
              Use the account menu to sign out of this browser session.
            </SettingCard>
          </div>
        </WorkspacePane>
      </WorkspaceContent>
    </WorkspaceShell>
  );
}
