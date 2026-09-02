import "server-only";

import { logger } from "@/lib/logger";
import {
  NotAuthenticatedError,
  RegistryRefusedError,
  RegistryUnavailableError,
} from "@/lib/registry/registry-api";

/**
 * The one place a registry failure becomes something a form can render.
 *
 * Every write in the product ends the same four ways, and each needs different
 * handling: a refusal is the caller's and is shown verbatim, an outage is ours
 * and is not, an expired session is neither, and anything else is a bug worth
 * crashing on. That ladder used to be retyped in each domain's actions module,
 * which is how `inviteMemberAction` came to handle only one of the four and
 * blow the members screen into the error boundary on the other three.
 *
 * The wording differs per domain — "resubmit" belongs on a form, "re-record
 * this" on a decision — so the copy is the caller's and the ladder is not.
 */

export type ActionErrorState = {
  status: "error";
  message: string;
  errors: Partial<Record<string, string>>;
};

export type RegistryErrorCopy = {
  /** Shown when the caller's session has expired. */
  signedOut: string;
  /**
   * Shown when the registry is unreachable and gave no words of its own.
   * "issuance signing is not configured" and "storage is temporarily
   * unavailable" are both 503, and telling someone to retry the first is worse
   * than saying nothing — so the registry's own detail wins whenever there is
   * one.
   */
  unavailable: string;
  /** Logged when the registry is unreachable, e.g. `agent.registry_unavailable`. */
  unavailableEvent: string;
};

/**
 * Bind one domain's copy to the shared ladder. The returned function takes the
 * event to log if the registry refuses, so each call site still names the step
 * it was performing, and optionally a mapper that attaches the refusal to the
 * field at fault — a 409 on a company number belongs beside the number, not in
 * a banner above the form.
 */
export function registryErrorReporter(copy: RegistryErrorCopy) {
  return function toErrorState(
    error: unknown,
    refusedEvent: string,
    fields?: (refusal: RegistryRefusedError) => Partial<Record<string, string>>,
  ): ActionErrorState {
    if (error instanceof NotAuthenticatedError) {
      return { status: "error", message: copy.signedOut, errors: {} };
    }
    if (error instanceof RegistryRefusedError) {
      logger.warn(refusedEvent, { status: error.status });
      return {
        status: "error",
        message: error.detail,
        errors: fields?.(error) ?? {},
      };
    }
    if (error instanceof RegistryUnavailableError) {
      logger.error(copy.unavailableEvent);
      return {
        status: "error",
        message: error.detail ?? copy.unavailable,
        errors: {},
      };
    }
    throw error;
  };
}
