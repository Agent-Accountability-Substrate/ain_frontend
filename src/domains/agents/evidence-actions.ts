"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  PACK_TYPE,
  PACK_VERSION,
  periodEnd,
  periodStart,
} from "@/domains/agents/evidence-pack";
import { logger } from "@/lib/logger";
import { registryErrorReporter } from "@/lib/registry/action-errors";
import { requestEvidencePack } from "@/lib/registry/registry-api";

/**
 * Asking the registry for an evidence package.
 *
 * One write, and deliberately a cheap one: the registry records the request and
 * answers 202, and a worker assembles the package away from this call. So there
 * is nothing to wait for here and nothing to show but the request having landed
 * — the screen it returns to lists the package and follows it to completion.
 *
 * Nothing about the package itself is logged. What it contains is one
 * organisation's record of what its agent did, and the identifiers naming that
 * are exactly what an application log should not accumulate.
 */

const UNAVAILABLE =
  "The registry is not reachable right now. Try again shortly.";
const SIGNED_OUT = "Your session expired. Sign in again and continue.";

const toErrorState = registryErrorReporter({
  signedOut: SIGNED_OUT,
  unavailable: UNAVAILABLE,
  unavailableEvent: "evidence_pack.registry_unavailable",
});

export type RequestPackState =
  | { status: "idle" }
  | { status: "done"; packId: string }
  | {
      status: "error";
      message: string;
      errors: Partial<Record<string, string>>;
    };

/**
 * A calendar day, which is what a date input produces.
 *
 * Validated as a date rather than trusted: the value becomes an instant this
 * layer appends a zone to, and `2026-07-32` would otherwise reach the registry
 * as a well-formed timestamp naming a day that does not exist.
 */
const DAY = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), {
    message: "Choose a real date",
  });

const periodSchema = z
  .object({
    organisationId: z.uuid(),
    ain: z.string().min(1),
    from: DAY,
    to: DAY,
  })
  .refine((period) => period.from <= period.to, {
    message: "The period must not end before it starts",
    path: ["to"],
  });

function fieldErrors(error: z.ZodError): Partial<Record<string, string>> {
  const errors: Partial<Record<string, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function requestEvidencePackAction(
  _previous: RequestPackState,
  formData: FormData,
): Promise<RequestPackState> {
  const parsed = periodSchema.safeParse({
    organisationId: text(formData, "organisationId"),
    ain: text(formData, "ain"),
    from: text(formData, "from"),
    to: text(formData, "to"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the period and try again.",
      errors: fieldErrors(parsed.error),
    };
  }

  const { organisationId, ain, from, to } = parsed.data;
  try {
    const pack = await requestEvidencePack(organisationId, ain, {
      packType: PACK_TYPE,
      packVersion: PACK_VERSION,
      // Whole days at both ends, in UTC, matching what the form says the
      // period means. The registry demands an offset precisely so this is a
      // decision somebody made rather than a zone it inferred.
      rangeStart: periodStart(from),
      rangeEnd: periodEnd(to),
    });
    // The identifier only; never the period, the agent or the organisation.
    logger.info("evidence_pack.requested", { status: pack.status });
    revalidatePath("/o/[org]/agents/[ain]/evidence-packs", "page");
    return { status: "done", packId: pack.packId };
  } catch (error) {
    return toErrorState(error, "evidence_pack.refused", (refusal) =>
      // A 409 is either "this agent has never been issued" or "one for this
      // period is already running". Both are about the period being asked
      // for, so the message belongs beside the dates rather than in a banner
      // that leaves a reader hunting for which field to change.
      refusal.status === 409 ? { to: refusal.detail } : {},
    );
  }
}
