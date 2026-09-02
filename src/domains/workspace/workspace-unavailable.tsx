import { CloudOff } from "lucide-react";

import {
  WorkspaceContent,
  WorkspaceShell,
} from "@/domains/workspace/workspace-shell";
import { initialAccountWorkspaceState } from "@/domains/workspace/account-workspace";
import { userMenuItems } from "@/domains/workspace/workspace-navigation";
import { ButtonLink } from "@/lib/ui/button";
import { Eyebrow } from "@/lib/ui/eyebrow";

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
      <WorkspaceContent columns="single">
        <section
          aria-labelledby="registry-down-title"
          className="mx-auto flex w-[min(100%,42rem)] flex-col gap-5 rounded-2xl border border-line bg-white p-6"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-line-soft text-ink-muted">
              <CloudOff className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-2">
              <Eyebrow>Registry unavailable</Eyebrow>
              <h1
                id="registry-down-title"
                className="text-lg font-semibold tracking-[-0.02em] text-ink"
              >
                We could not load your workspace
              </h1>
              <p role="alert" className="text-xs leading-5 text-mist">
                {detail}
              </p>
            </div>
          </div>
          <div className="flex">
            {/* A plain link rather than a router refresh: this page was
                server-rendered from a failed read, so the only thing that
                helps is asking the server again. */}
            <ButtonLink variant="primary" href={currentPath}>
              Try again
            </ButtonLink>
          </div>
        </section>
      </WorkspaceContent>
    </WorkspaceShell>
  );
}
