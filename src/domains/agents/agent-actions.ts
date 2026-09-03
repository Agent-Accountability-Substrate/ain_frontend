"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AGENT_TRANSITIONS } from "@/domains/agents/agent-record";
import { ORGANISATION_SETTINGS } from "@/domains/workspace/workspace-routes";
import { logger } from "@/lib/logger";
import { registryErrorReporter } from "@/lib/registry/action-errors";
import {
  patchAgent,
  registerAgent,
  submitAgent,
  transitionAgent,
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

const toErrorState = registryErrorReporter({
  signedOut: SIGNED_OUT,
  unavailable: UNAVAILABLE,
  unavailableEvent: "agent.registry_unavailable",
});

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

/**
 * The value types the scope vocabulary can compare, and the parser for each.
 *
 * Typing is not cosmetic. The evaluator refuses a declared bound of the wrong
 * type — deliberately, and it treats booleans and numbers as different kinds
 * even though `isinstance(True, int)` is true in Python, so `true` must never
 * slip under a positive ceiling. A form that posted every value as a string
 * would declare bounds the evaluator then denies at admission, which is the
 * worst possible time to find out.
 */
const CONSTRAINT_TYPES = [
  "number",
  "string",
  "boolean",
  "string_list",
] as const;

export type ConstraintType = (typeof CONSTRAINT_TYPES)[number];

const constraintTypeSchema = z.enum(CONSTRAINT_TYPES);

function parseConstraintValue(
  type: ConstraintType,
  raw: string,
): { ok: true; value: unknown } | { ok: false; message: string } {
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: false, message: "Give the bound a value" };
  if (type === "number") {
    const value = Number(trimmed);
    return Number.isFinite(value)
      ? { ok: true, value }
      : { ok: false, message: "A number bound needs a number" };
  }
  if (type === "boolean") {
    if (trimmed === "true") return { ok: true, value: true };
    if (trimmed === "false") return { ok: true, value: false };
    return { ok: false, message: "A boolean bound is true or false" };
  }
  if (type === "string_list") {
    const entries = [
      ...new Set(
        trimmed
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
      ),
    ].sort();
    return entries.length > 0
      ? { ok: true, value: entries }
      : { ok: false, message: "List at least one value" };
  }
  return { ok: true, value: trimmed };
}

/**
 * Per-action-class bounds, read from the repeated rows of the declaration form.
 *
 * Contract v1 requires every constraint key to name a declared action class,
 * so a row naming a class that is not in the scope is refused here rather than
 * sent for the registry to reject.
 */
function collectConstraints(
  formData: FormData,
  declared: readonly string[],
):
  | { ok: true; constraints: Record<string, Record<string, unknown>> }
  | { ok: false; message: string } {
  const classes = formData.getAll("constraintClass").map(String);
  const keys = formData.getAll("constraintKey").map(String);
  const types = formData.getAll("constraintType").map(String);
  const values = formData.getAll("constraintValue").map(String);

  const constraints: Record<string, Record<string, unknown>> = {};
  for (const [index, actionClass] of classes.entries()) {
    const key = (keys[index] ?? "").trim();
    // A blank row is one somebody added and did not fill in, not an error.
    if (actionClass.trim() === "" && key === "") continue;
    if (!declared.includes(actionClass)) {
      return {
        ok: false,
        message: `A bound names "${actionClass}", which is not one of the authorised action classes`,
      };
    }
    if (key === "") {
      return { ok: false, message: `Name the bound on ${actionClass}` };
    }
    const type = constraintTypeSchema.safeParse(types[index] ?? "string");
    if (!type.success) {
      return { ok: false, message: `${key} has no value type` };
    }
    const parsed = parseConstraintValue(type.data, values[index] ?? "");
    if (!parsed.ok) {
      return { ok: false, message: `${key}: ${parsed.message}` };
    }
    constraints[actionClass] = {
      ...constraints[actionClass],
      [key]: parsed.value,
    };
  }
  return { ok: true, constraints };
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
  const collected = collectConstraints(formData, declaration.actionClasses);
  if (!collected.ok) {
    return {
      status: "error",
      message: collected.message,
      errors: { constraints: collected.message },
    };
  }

  try {
    await patchAgent(organisationId, ain, {
      scope: {
        actionClasses: declaration.actionClasses,
        // Bounds the caller stated, per declared class. An empty object is the
        // honest "none stated" — an unbounded scope, which is a real thing to
        // declare and not a placeholder.
        constraints: collected.constraints,
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
    // `/organisations` is not a route — the list lives under `/settings`, and
    // every workspace screen sits beneath the `/o` layout this already covers.
    revalidatePath("/o", "layout");
    revalidatePath(ORGANISATION_SETTINGS);
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

const transitionSchema = z.object({
  organisationId: z.uuid(),
  ain: z.string().min(1),
  transition: z.enum(AGENT_TRANSITIONS),
  reason: z
    .string()
    .trim()
    .min(1, "Say why. It is recorded for this organisation to read")
    .max(1000),
});

/**
 * `agentStatus` rather than `status`, which the step state already uses for
 * its own discriminant. Two meanings of one key in one object is how a
 * `"done"` result ends up reading as an agent that is done.
 */
export type TransitionAgentState = AgentStepState<{
  agentStatus: string;
  eventType: string;
  seq: number;
}>;

/**
 * `POST /orgs/{id}/agents/{ain}/suspend` or `/revoke` — withdraw authority.
 *
 * The registry decides whether a transition is legal from the agent's current
 * status; the menu only offers ones it would accept, so a refusal here usually
 * means somebody else moved the agent first. That reads back verbatim rather
 * than as "something went wrong".
 *
 * The reason is never logged. It is an operator's words about a real agent in
 * a real firm, it is stored for that organisation's members to read, and it
 * has no business also sitting in an application log.
 */
export async function transitionAgentAction(
  _previous: TransitionAgentState,
  formData: FormData,
): Promise<TransitionAgentState> {
  const parsed = transitionSchema.safeParse({
    organisationId: text(formData, "organisationId"),
    ain: text(formData, "ain"),
    transition: text(formData, "transition"),
    reason: text(formData, "reason"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }

  try {
    const recorded = await transitionAgent(
      parsed.data.organisationId,
      parsed.data.ain,
      parsed.data.transition,
      parsed.data.reason,
    );
    logger.info("agent.transitioned", { transition: parsed.data.transition });
    // The register, the record and the organisation's own counts all read this
    // agent's status, and they sit under different routes.
    revalidatePath("/o", "layout");
    return {
      status: "done",
      agentStatus: recorded.status,
      eventType: recorded.event_type,
      seq: recorded.seq,
    };
  } catch (error) {
    return toErrorState(error, "agent.transition_refused");
  }
}
