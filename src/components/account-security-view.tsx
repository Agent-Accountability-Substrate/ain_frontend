import { Fingerprint, KeyRound, ShieldCheck, UserRound } from "lucide-react";

import { WorkspaceShell } from "@/components/workspace-shell";
import {
  getSelectedOrganisation,
  initialAccountWorkspaceState,
  type AccountWorkspaceState,
} from "@/lib/account-workspace";
import { menuItemsFor } from "@/lib/workspace-navigation";

function assuranceLabel(
  status: AccountWorkspaceState["individualAssurance"]["status"],
) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
      <div className="account-settings-workspace">
        <header>
          <p className="dashboard-eyebrow">Personal account</p>
          <h1>Account &amp; Security</h1>
          <p>
            Authentication details and identity assurance are shown separately.
          </p>
        </header>

        <div className="account-settings-grid">
          <section aria-labelledby="profile-title">
            <span className="account-settings-icon">
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="dashboard-eyebrow">Profile</p>
              <h2 id="profile-title">{accountName}</h2>
              <p>{accountEmail}</p>
            </div>
          </section>

          <section aria-labelledby="authentication-title">
            <span className="account-settings-icon">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="dashboard-eyebrow">Authentication</p>
              <h2 id="authentication-title">Managed by Auth0</h2>
              <p>Signing in confirms account access, not personal identity.</p>
            </div>
          </section>

          <section aria-labelledby="assurance-title">
            <span className="account-settings-icon account-settings-icon-green">
              <Fingerprint className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="dashboard-eyebrow">Individual assurance</p>
              <h2 id="assurance-title">
                {assuranceLabel(state.individualAssurance.status)}
              </h2>
              <p>
                Email and provider sign-in status are never treated as identity
                assurance.
              </p>
            </div>
          </section>

          <section aria-labelledby="session-title">
            <span className="account-settings-icon account-settings-icon-green">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="dashboard-eyebrow">Session security</p>
              <h2 id="session-title">Protected workspace session</h2>
              <p>Use the account menu to sign out of this browser session.</p>
            </div>
          </section>
        </div>
      </div>
    </WorkspaceShell>
  );
}
