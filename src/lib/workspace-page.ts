import "server-only";

import { redirect } from "next/navigation";

import type { AccountWorkspaceState } from "@/lib/account-workspace";
import { logger } from "@/lib/logger";
import {
  loadAccountWorkspace,
  NotAuthenticatedError,
  RegistryUnavailableError,
} from "@/lib/registry-api";

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
      state: await loadAccountWorkspace(selectedOrganisationId),
    };
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      // The session cookie outlives the access token, so this is an ordinary
      // state rather than an error: signed in, but no longer holding anything
      // the registry will accept. Re-authenticating is the whole fix, and it
      // returns the person to the page they asked for.
      logger.info("workspace.reauthentication_required");
      redirect("/api/auth/signin");
    }
    if (error instanceof RegistryUnavailableError) {
      logger.error("workspace.registry_unavailable");
      // `detail` is present when the registry named an unconfigured subsystem
      // — "issuance signing is not configured" and the like. That is worth
      // showing an operator; anything else gets wording that does not promise
      // a retry will help.
      return { status: "unavailable", detail: error.detail ?? GENERIC };
    }
    throw error;
  }
}
