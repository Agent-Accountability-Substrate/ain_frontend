"use server";

import { z } from "zod";

import { logger } from "@/lib/logger";
import {
  NotAuthenticatedError,
  recordVerification,
  RegistryRefusedError,
  RegistryUnavailableError,
} from "@/lib/registry/registry-api";

/**
 * Recording what trust operations decided about a company.
 *
 * The most consequential write in the product: `verified` is what lets an
 * organisation issue agents at all, and `rejected` is terminal — it frees the
 * registration number, so the way forward for that company is a fresh
 * registration rather than an appeal. Neither is undoable through any route.
 *
 * Nothing about the company is logged. The reason is the operator's own words
 * about a real business and is stored for its members to read; it has no
 * business also being in an application log.
 */

const decisionSchema = z
  .object({
    organisationId: z.uuid(),
    outcome: z.enum(["verified", "needs_attention", "rejected"]),
    reviewReason: z.string().trim().max(2000).optional(),
  })
  .superRefine((decision, ctx) => {
    // Mirrors the registry, which refuses both shapes. Catching them here makes
    // it a message beside the field rather than a round trip that returns 422.
    if (decision.outcome === "verified" && decision.reviewReason) {
      ctx.addIssue({
        code: "custom",
        path: ["reviewReason"],
        message:
          "An approval carries no reason — clear it, or change the outcome",
      });
      return;
    }
    if (decision.outcome !== "verified" && !decision.reviewReason) {
      ctx.addIssue({
        code: "custom",
        path: ["reviewReason"],
        message:
          decision.outcome === "rejected"
            ? "Say why. A refusal frees the company number, and the holder can only judge whether to re-register if they know what went wrong"
            : "Say what is needed, or the holder has no way to act on this",
      });
    }
  });

export type DecisionState =
  | { status: "idle" }
  | { status: "recorded"; outcome: string }
  | {
      status: "error";
      message: string;
      errors: Partial<Record<string, string>>;
    };

const UNAVAILABLE =
  "The registry is not reachable right now. Nothing was recorded.";
const SIGNED_OUT = "Your session expired. Sign in again and re-record this.";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function recordDecisionAction(
  _previous: DecisionState,
  formData: FormData,
): Promise<DecisionState> {
  const reviewReason = text(formData, "reviewReason").trim();
  const parsed = decisionSchema.safeParse({
    organisationId: text(formData, "organisationId"),
    outcome: text(formData, "outcome"),
    reviewReason: reviewReason || undefined,
  });
  if (!parsed.success) {
    const errors: Partial<Record<string, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in errors)) {
        errors[field] = issue.message;
      }
    }
    return { status: "error", message: "Check the decision.", errors };
  }

  try {
    await recordVerification(
      parsed.data.organisationId,
      parsed.data.outcome,
      parsed.data.reviewReason ?? null,
    );
    logger.info("operations.decision_recorded", {
      outcome: parsed.data.outcome,
    });
    // No revalidation here at all, and the omission is the fix.
    //
    // Every page this action touches is `force-dynamic`, so none of them has a
    // cached payload to invalidate — the calls could only ever have had one
    // observable effect. `revalidatePath` in Next 16.3 does not scope anything
    // to the path it is given: it sets a single `store.pathWasRevalidated`
    // flag, carrying its own `// TODO: only revalidate if the path matches`.
    // That flag makes the client discard its router cache and refetch the
    // *current* route.
    //
    // Refetching /operations drops the just-decided organisation out of the
    // review queue, and `selected` derives from the queue — so the pane swaps
    // from the decision form to "Choose a company to review", unmounting the
    // subtree and discarding the `useActionState` result before the operator
    // can read what was recorded. `verified` and `rejected` both leave the
    // queue, so two of the three outcomes silently showed nothing on the most
    // consequential write in the product. Naming only the other two paths does
    // not help, because the flag is global.
    //
    // The confirmation panel links back to the queue, and that navigation
    // fetches it fresh — which is all a `force-dynamic` page ever needed.
    return { status: "recorded", outcome: parsed.data.outcome };
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return { status: "error", message: SIGNED_OUT, errors: {} };
    }
    if (error instanceof RegistryRefusedError) {
      logger.warn("operations.decision_refused", { status: error.status });
      // 409 is the one worth reading closely: somebody else decided this while
      // the operator had it open, and the registry refused to overwrite them.
      return { status: "error", message: error.detail, errors: {} };
    }
    if (error instanceof RegistryUnavailableError) {
      logger.error("operations.registry_unavailable");
      return {
        status: "error",
        message: error.detail ?? UNAVAILABLE,
        errors: {},
      };
    }
    throw error;
  }
}
