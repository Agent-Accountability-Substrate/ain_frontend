"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { JURISDICTION_CODES } from "@/lib/jurisdictions";
import { logger } from "@/lib/logger";
import {
  createOrganisation,
  NotAuthenticatedError,
  RegistryRefusedError,
  RegistryUnavailableError,
} from "@/lib/registry-api";

/**
 * Registering a company, from the browser to the registry.
 *
 * The validation below is a courtesy, not a control. The registry validates
 * everything again and is the only thing that decides — but a shape error
 * caught here becomes a message beside the field instead of a round trip that
 * comes back as an opaque 422.
 *
 * Nothing is logged about *what* was submitted. A registration names a real
 * company and a real address, and the useful signal is that an attempt
 * happened and how it ended.
 */

const newOrganisationSchema = z.object({
  name: z.string().trim().min(1, "Enter the legal organisation name").max(200),
  // Eight characters: eight digits, or two letters then six (SC/NI/OC and
  // friends). Shape only -- whether the company exists, and whether you may
  // speak for it, is trust-ops' job with the register.
  registrationNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^(?:[A-Z]{2}[0-9]{6}|[0-9]{8})$/,
      "A company number is 8 digits, or 2 letters followed by 6 digits",
    ),
  jurisdiction: z.enum(JURISDICTION_CODES as unknown as [string, ...string[]]),
  address: z
    .string()
    .trim()
    .min(1, "Enter the registered office address")
    .max(500),
  webUrl: z.string().trim().max(2048).optional(),
});

export type CreateOrganisationState =
  | { status: "idle" }
  | { status: "created"; organisationId: string }
  // `errors` is keyed by field name so each message renders beside the field
  // it belongs to rather than as one banner. Unlike the access-request form,
  // nothing carries the submission back: this form is controlled, so React
  // keeps what was typed across a failed action on its own.
  | {
      status: "error";
      message: string;
      errors: Partial<Record<string, string>>;
    };

const UNAVAILABLE =
  "The registry is not reachable right now. Nothing was submitted — try again shortly.";
const SIGNED_OUT = "Your session expired. Sign in again and resubmit.";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createOrganisationAction(
  _previous: CreateOrganisationState,
  formData: FormData,
): Promise<CreateOrganisationState> {
  const webUrl = text(formData, "webUrl");
  const parsed = newOrganisationSchema.safeParse({
    name: text(formData, "name"),
    registrationNumber: text(formData, "registrationNumber"),
    jurisdiction: text(formData, "jurisdiction"),
    address: text(formData, "address"),
    webUrl: webUrl || undefined,
  });
  if (!parsed.success) {
    const errors: Partial<Record<string, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in errors)) {
        errors[field] = issue.message;
      }
    }
    return {
      status: "error",
      message: "Check the highlighted fields.",
      errors,
    };
  }

  try {
    const created = await createOrganisation(parsed.data);
    logger.info("organisation.registered");
    // The organisations list is server-rendered from the registry, so without
    // this the new organisation is missing from the page the user lands on.
    revalidatePath("/organisations");
    revalidatePath("/dashboard");
    return { status: "created", organisationId: created.organisation_id };
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return { status: "error", message: SIGNED_OUT, errors: {} };
    }
    if (error instanceof RegistryRefusedError) {
      logger.warn("organisation.registration_refused", {
        status: error.status,
      });
      // The registry's own wording, which is written to be shown: "company
      // already registered", "your verified email is not a usable address".
      // A 409 is attached to the number, since that is the field at fault.
      return {
        status: "error",
        message: error.detail,
        errors:
          error.status === 409 ? { registrationNumber: error.detail } : {},
      };
    }
    if (error instanceof RegistryUnavailableError) {
      logger.error("organisation.registry_unavailable");
      // A 503 naming an unconfigured subsystem is more use than "try again",
      // which for that case is advice that can never work.
      return {
        status: "error",
        message: error.detail ?? UNAVAILABLE,
        errors: {},
      };
    }
    throw error;
  }
}
