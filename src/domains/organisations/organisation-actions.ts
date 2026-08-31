"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { JURISDICTION_CODES } from "@/domains/organisations/jurisdictions";
import { logger } from "@/lib/logger";
import { registryErrorReporter } from "@/lib/registry/action-errors";
import {
  createOrganisation,
  inviteMember,
  listMembers,
  NotAuthenticatedError,
  RegistryRefusedError,
  RegistryUnavailableError,
  removeMember,
} from "@/lib/registry/registry-api";

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
  | { status: "created"; organisationId: string; organisationUlid: string }
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

const toErrorState = registryErrorReporter({
  signedOut: SIGNED_OUT,
  unavailable: UNAVAILABLE,
  unavailableEvent: "organisation.registry_unavailable",
});

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
    revalidatePath("/o", "layout");
    return {
      status: "created",
      organisationId: created.organisation_id,
      organisationUlid: created.org_ulid,
    };
  } catch (error) {
    // The registry's own wording is written to be shown: "company already
    // registered", "your verified email is not a usable address". A 409 is
    // attached to the number, since that is the field at fault.
    return toErrorState(
      error,
      "organisation.registration_refused",
      (refusal) =>
        refusal.status === 409 ? { registrationNumber: refusal.detail } : {},
    );
  }
}

const inviteMemberSchema = z.object({
  organisationId: z.uuid(),
  email: z.email("Enter the address the invitation should go to."),
  role: z.enum(["org_admin", "compliance", "auditor"]),
});

export type InviteMemberState =
  | { status: "idle" }
  | { status: "invited"; email: string }
  | {
      status: "error";
      message: string;
      errors: Partial<Record<string, string>>;
    };

/**
 * Give someone access to one organisation.
 *
 * The role travels with the invitation rather than being edited afterwards:
 * the registry has no route to change one, so choosing wrong is currently
 * fixed by removing and re-inviting.
 */
export async function inviteMemberAction(
  _previous: InviteMemberState,
  formData: FormData,
): Promise<InviteMemberState> {
  const parsed = inviteMemberSchema.safeParse({
    organisationId: formData.get("organisationId"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      errors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0] ?? ""),
          issue.message,
        ]),
      ),
    };
  }

  try {
    await inviteMember(
      parsed.data.organisationId,
      parsed.data.email,
      parsed.data.role,
    );
  } catch (error) {
    return toErrorState(error, "organisation.invite_refused");
  }

  revalidatePath("/o", "layout");
  return { status: "invited", email: parsed.data.email };
}

export type LeaveOrganisationState =
  | { status: "idle" }
  | { status: "left" }
  | { status: "error"; message: string };

const UNLISTABLE =
  "We cannot look up your membership of this organisation right now, so we " +
  "cannot end it from here. An owner or admin can remove you from the " +
  "members list.";

const NOT_A_MEMBER =
  "You do not appear to be a member of this organisation any more.";

/**
 * Give up your own access to a company.
 *
 * The registry ends a membership by id, and there is no `/me` alias, so the
 * caller's own row is looked up first. That read is what makes this work at
 * all: the previous version posted to a route the registry does not serve, so
 * the confirm dialog could only ever answer "not supported".
 *
 * Not offered to an owner. An organisation's owner is a column on the row
 * rather than a role, so an owner walking out would leave a registered company
 * with signed records and nobody who can act for it. The registry refuses it
 * too — this is the same rule, said before the click rather than after.
 */
export async function leaveOrganisationAction(
  _previous: LeaveOrganisationState,
  formData: FormData,
): Promise<LeaveOrganisationState> {
  const organisationId = z.uuid().safeParse(formData.get("organisationId"));
  const email = z.email().safeParse(formData.get("email"));
  if (!organisationId.success || !email.success) {
    return { status: "error", message: "That organisation is not recognised." };
  }

  try {
    const members = await listMembers(organisationId.data);
    if (members === null) {
      return { status: "error", message: UNLISTABLE };
    }
    // Matched on the address the session carries, which is the same verified
    // address the registry binds a membership by.
    const own = members.find(
      (member) => member.email.toLowerCase() === email.data.toLowerCase(),
    );
    if (own === undefined) {
      return { status: "error", message: NOT_A_MEMBER };
    }
    await removeMember(organisationId.data, own.id);
  } catch (error) {
    // This state carries no field errors, so only the message crosses over.
    const { message } = toErrorState(error, "organisation.leave_refused");
    return { status: "error", message };
  }

  logger.info("organisation.left");
  revalidatePath("/o", "layout");
  return { status: "left" };
}

export type RemoveMemberState =
  | { status: "idle" }
  | { status: "removed"; email: string }
  | { status: "error"; message: string };

/**
 * Take someone's access away.
 *
 * The same transition as leaving — `status` becomes `removed`, the row stays,
 * because a membership that authorised an action has to remain evidenceable.
 * The registry refuses to remove the last admin, since no route grants the
 * role back from outside and an organisation without one could never be
 * administered again; that refusal reads back verbatim.
 */
export async function removeMemberAction(
  _previous: RemoveMemberState,
  formData: FormData,
): Promise<RemoveMemberState> {
  const parsed = z
    .object({
      organisationId: z.uuid(),
      memberId: z.uuid(),
      email: z.email(),
    })
    .safeParse({
      organisationId: formData.get("organisationId"),
      memberId: formData.get("memberId"),
      email: formData.get("email"),
    });
  if (!parsed.success) {
    return { status: "error", message: "That member is not recognised." };
  }

  try {
    await removeMember(parsed.data.organisationId, parsed.data.memberId);
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return { status: "error", message: SIGNED_OUT };
    }
    if (error instanceof RegistryRefusedError) {
      return { status: "error", message: error.detail };
    }
    if (error instanceof RegistryUnavailableError) {
      logger.error("organisation.registry_unavailable");
      return { status: "error", message: error.detail ?? UNAVAILABLE };
    }
    throw error;
  }

  // The address is not logged: it identifies a real person, and that a removal
  // happened is the part worth recording here.
  logger.info("organisation.member_removed");
  revalidatePath("/o", "layout");
  return { status: "removed", email: parsed.data.email };
}
