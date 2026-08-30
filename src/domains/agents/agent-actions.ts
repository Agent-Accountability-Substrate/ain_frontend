"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logger } from "@/lib/logger";
import {
  NotAuthenticatedError,
  patchAgent,
  registerAgent,
  RegistryRefusedError,
  RegistryUnavailableError,
  submitAgent,
} from "@/lib/registry/registry-api";

/**
 * Registering an agent, in the three steps the registry actually performs.
 *
 * This is not one form posted at the end. `POST` mints the AIN and opens a
 * draft, `PATCH` attaches scope and named accountability, and `submit`
 * canonicalises the payload, signs it and appends the genesis lifecycle
 * events. Each is a state the registry records, so the wizard mirrors them
 * rather than collecting everything and hoping the last call succeeds — a
 * draft that exists is a draft you can come back to.
 *
 * The identifiers here are not incidental. `regulatoryIdentifier` is an SMCR
 * reference naming a real person, and it goes inside the signed bytes, so it
 * is never logged and never echoed anywhere but back to the person entering
 * it.
 */

const UNAVAILABLE =
  "The registry is not reachable right now. Try again shortly.";
const SIGNED_OUT = "Your session expired. Sign in again and continue.";

export type AgentStepState<T = object> =
  | { status: "idle" }
  | ({ status: "done" } & T)
  | {
      status: "error";
      message: string;
      errors: Partial<Record<string, string>>;
    };

export type RegisterAgentState = AgentStepState<{ ain: string }>;
export type PatchAgentState = AgentStepState;
export type SubmitAgentState = AgentStepState<{
  ain: string;
  resolverUrl: string;
  documentVersion: number;
}>;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** Comma- or newline-separated free text into a sorted, duplicate-free list. */
function list(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[,\n]/)
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  ].sort();
}

/**
 * Every step ends the same four ways, and each needs different handling: a
 * refusal is the caller's and is shown verbatim, an outage is ours and is not,
 * an expired session is neither, and anything else is a bug worth crashing on.
 */
function toErrorState(
  error: unknown,
  event: string,
): {
  status: "error";
  message: string;
  errors: Partial<Record<string, string>>;
} {
  if (error instanceof NotAuthenticatedError) {
    return { status: "error", message: SIGNED_OUT, errors: {} };
  }
  if (error instanceof RegistryRefusedError) {
    logger.warn(event, { status: error.status });
    return { status: "error", message: error.detail, errors: {} };
  }
  if (error instanceof RegistryUnavailableError) {
    logger.error(`${event}_unavailable`);
    // "issuance signing is not configured" and "storage is temporarily
    // unavailable" are both 503. Telling someone to retry the first is worse
    // than saying nothing, so the registry.s own words win when it gave any.
    return {
      status: "error",
      message: error.detail ?? UNAVAILABLE,
      errors: {},
    };
  }
  throw error;
}

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

const identitySchema = z.object({
  organisationId: z.uuid(),
  name: z.string().trim().min(1, "Name the agent").max(200),
  role: z.string().trim().min(1, "Describe what this agent does").max(200),
  riskClass: z.string().trim().min(1, "Choose a risk class").max(50),
});

/** Step 1 — `POST /orgs/{id}/agents`. Mints the AIN and opens a draft. */
export async function registerAgentAction(
  _previous: RegisterAgentState,
  formData: FormData,
): Promise<RegisterAgentState> {
  const parsed = identitySchema.safeParse({
    organisationId: text(formData, "organisationId"),
    name: text(formData, "name"),
    role: text(formData, "role"),
    riskClass: text(formData, "riskClass"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }

  try {
    const agent = await registerAgent(parsed.data.organisationId, parsed.data);
    logger.info("agent.registered");
    return { status: "done", ain: agent.ain };
  } catch (error) {
    return toErrorState(error, "agent.register_refused");
  }
}

const declarationSchema = z.object({
  organisationId: z.uuid(),
  ain: z.string().min(1),
  actionClasses: z
    .string()
    .transform(list)
    .refine(
      (entries) => entries.length > 0,
      "List at least one action this agent is authorised to take",
    ),
  riskLevel: z.string().trim().min(1, "Choose a risk level").max(50),
  regulatoryMappings: z.string().transform(list),
  roleTitle: z.string().trim().min(1, "Name the accountable role").max(200),
  responsibilityArea: z
    .string()
    .trim()
    .min(1, "Name the area they are accountable for")
    .max(200),
  regulatoryIdentifier: z
    .string()
    .trim()
    .min(1, "Enter the SMCR reference for the accountable person")
    .max(100),
});

/** Step 2 — `PATCH /orgs/{id}/agents/{ain}`. Scope and named accountability. */
export async function patchAgentAction(
  _previous: PatchAgentState,
  formData: FormData,
): Promise<PatchAgentState> {
  const parsed = declarationSchema.safeParse({
    organisationId: text(formData, "organisationId"),
    ain: text(formData, "ain"),
    actionClasses: text(formData, "actionClasses"),
    riskLevel: text(formData, "riskLevel"),
    regulatoryMappings: text(formData, "regulatoryMappings"),
    roleTitle: text(formData, "roleTitle"),
    responsibilityArea: text(formData, "responsibilityArea"),
    regulatoryIdentifier: text(formData, "regulatoryIdentifier"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }

  const { organisationId, ain, ...declaration } = parsed.data;
  try {
    await patchAgent(organisationId, ain, {
      scope: {
        actionClasses: declaration.actionClasses,
        // No per-class constraints from this form yet. The contract requires
        // every constraint key to name a declared action class, so an empty
        // object is the honest "none stated" — not a placeholder.
        constraints: {},
        riskLevel: declaration.riskLevel,
        regulatoryMappings: declaration.regulatoryMappings,
      },
      accountability: {
        roleTitle: declaration.roleTitle,
        responsibilityArea: declaration.responsibilityArea,
        regulatoryIdentifier: declaration.regulatoryIdentifier,
      },
    });
    logger.info("agent.declaration_attached");
    return { status: "done" };
  } catch (error) {
    return toErrorState(error, "agent.patch_refused");
  }
}

const submitSchema = z.object({
  organisationId: z.uuid(),
  ain: z.string().min(1),
});

/**
 * Step 3 — `POST /orgs/{id}/agents/{ain}/submit`. Signs and activates.
 *
 * The only step that needs custody provisioned. Without Vault the registry
 * refuses rather than issuing an agent under a development key, so a refusal
 * here is usually configuration rather than anything the person did wrong.
 */
export async function submitAgentAction(
  _previous: SubmitAgentState,
  formData: FormData,
): Promise<SubmitAgentState> {
  const parsed = submitSchema.safeParse({
    organisationId: text(formData, "organisationId"),
    ain: text(formData, "ain"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "This draft is no longer addressable. Start again.",
      errors: {},
    };
  }

  try {
    const issued = await submitAgent(
      parsed.data.organisationId,
      parsed.data.ain,
    );
    logger.info("agent.issued");
    revalidatePath("/o", "layout");
    revalidatePath("/organisations");
    return {
      status: "done",
      ain: issued.ain,
      resolverUrl: issued.resolver_url,
      documentVersion: issued.document_version,
    };
  } catch (error) {
    return toErrorState(error, "agent.submit_refused");
  }
}
