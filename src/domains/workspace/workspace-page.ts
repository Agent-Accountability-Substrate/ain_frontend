import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { AccountWorkspaceState } from "@/domains/workspace/account-workspace";
import { logger } from "@/lib/logger";
import { ORGANISATION_PREFERENCE } from "@/domains/workspace/workspace-routes";
import {
  loadAccountWorkspace,
  NotAuthenticatedError,
  RegistryUnavailableError,
} from "@/lib/registry/registry-api";

/**
 * Loading the workspace, with the two expected failures handled here.
 *
 * They are handled *here* rather than in an `error.tsx` boundary because a
 * boundary cannot tell them apart. Next redacts Server Component error
 * messages in production and hands the boundary a digest instead, so by the
 * time an error reaches one, "your session expired" and "the registry is down"
 * are indistinguishable — and both would render the same dead end with no
 * navigation. Catching them at the page keeps the information that makes the
 * difference actionable.
 *
 * `error.tsx` still exists, as the backstop for what is genuinely unexpected.
 */

export type WorkspaceLoad =
  | { status: "ready"; state: AccountWorkspaceState }
  | { status: "unavailable"; detail: string };

const GENERIC =
  "The registry is not answering right now. Nothing is lost — this page will work again once it is back.";

export async function loadWorkspace(
  selectedOrganisationId: string | null = null,
): Promise<WorkspaceLoad> {
  try {
    return {
      status: "ready",
      state: await loadAccountWorkspace(
        selectedOrganisationId,
        // Only consulted when the address named nothing, which is the only
        // time there is a question to answer. Reading it here rather than in
        // the layout is what keeps the frame and the screen inside it showing
        // the same organisation.
        selectedOrganisationId === null
          ? ((await cookies()).get(ORGANISATION_PREFERENCE)?.value ?? null)
          : null,
      ),
    };
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      // The session cookie outlives the access token, so this is an ordinary
      // state rather than an error. Re-authenticating is the whole fix, and it
      // returns the person to the page they asked for.
      logger.info("workspace.reauthentication_required");
      redirect("/api/auth/signin");
    }
    if (error instanceof RegistryUnavailableError) {
      // The registry's own `detail` names a subsystem — "issuance signing is
      // not configured" and the like. That belongs in the log, not on the
      // screen of somebody who cannot act on it and did not cause it.
      logger.error("workspace.registry_unavailable", {
        ...(error.detail !== undefined && { detail: error.detail }),
      });
      return { status: "unavailable", detail: GENERIC };
    }
    throw error;
  }
}
