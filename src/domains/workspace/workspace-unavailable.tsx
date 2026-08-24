import { CloudOff } from "lucide-react";

import { WorkspaceShell } from "@/domains/workspace/workspace-shell";
import { initialAccountWorkspaceState } from "@/domains/workspace/account-workspace";
import { userMenuItems } from "@/domains/workspace/workspace-navigation";

/**
 * The workspace, with the registry not answering.
 *
 * Rendered inside the normal shell on purpose. The failure is real but it is
 * not the end of the session: navigation, sign-out and the account menu all
 * still work, and a page that loses them turns a passing outage into a dead
 * end. Nothing here invents data — the counts and lists are simply absent,
 * which is the honest thing to show when we could not read them.
 */
export function WorkspaceUnavailable({
  currentPath,
  detail,
  email,
  workspaceLabel,
}: {
  currentPath: string;
  detail: string;
  email: string | null | undefined;
  workspaceLabel: string;
}) {
  return (
    <WorkspaceShell
      currentPath={currentPath}
      email={email}
      navigationItems={userMenuItems}
      navigationLabel="Account sections"
      organisations={initialAccountWorkspaceState.organisations}
      selectedOrganisationId={null}
      signedInAs="No organisation selected"
      workspaceLabel={workspaceLabel}
    >
      <div className="account-route-workspace">
        {/* Spans both columns: the workspace grid is a 17rem sidebar plus
            content, and there is no sidebar to render here — whatever would
            have filled it is the very thing we could not read. */}
        <section
          className="wizard-form col-span-full"
          aria-labelledby="registry-down-title"
        >
          <div className="wizard-form-heading">
            <span className="wizard-form-icon">
              <CloudOff className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="dashboard-eyebrow">Registry unavailable</p>
              <h1 id="registry-down-title">We could not load your workspace</h1>
              <p role="alert">{detail}</p>
            </div>
          </div>
          <div className="wizard-form-actions">
            {/* A plain link rather than a router refresh: this page was
                server-rendered from a failed read, so the only thing that
                helps is asking the server again. */}
            <a className="wizard-primary-action" href={currentPath}>
              Try again
            </a>
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}
