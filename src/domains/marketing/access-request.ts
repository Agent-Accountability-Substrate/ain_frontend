"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
import { z } from "zod";

import { PARTNER_EMAIL } from "@/domains/marketing/landing-content";
import { logger } from "@/lib/logger";
import { overLimit } from "@/lib/rate-limit";

/**
 * The private-preview access request, mailed to the preview team.
 *
 * Configuration is read per request rather than validated at boot in
 * `server-env.ts`. Those keys fail the process closed when absent, which is
 * right for auth and wrong here — an unset key would take the whole marketing
 * site down, login included, because a contact form was not configured yet.
 *
 * The address is never logged. `logger.ts` forbids PII in fields and this is
 * the one path on the site that handles any, so every line below records that
 * something happened and nothing about who.
 *
 * A tripped honeypot reports success: telling a bot it was caught is free
 * information for whoever tunes it next.
 */

const accessRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "This field is required.")
    .max(200, "Keep this under 200 characters."),
  email: z
    .string()
    .trim()
    .min(1, "This field is required.")
    .max(254, "Enter a valid work email address.")
    .pipe(z.email("Enter a valid work email address.")),
  organisation: z
    .string()
    .trim()
    .min(1, "This field is required.")
    .max(200, "Keep this under 200 characters."),
  role: z
    .string()
    .trim()
    .min(1, "This field is required.")
    .max(200, "Keep this under 200 characters."),
  workflow: z.string().trim().max(1000, "Keep this under 1,000 characters."),
  // Rendered off-screen and left empty by any human. A bot fills every field
  // it finds, so a non-empty value here is the cheapest signal available.
  website: z.literal(""),
});

type AccessRequestValues = {
  name: string;
  email: string;
  organisation: string;
  role: string;
  workflow: string;
};

export type AccessRequestField = keyof AccessRequestValues;
export type AccessRequestFieldErrors = Partial<
  Record<AccessRequestField, string>
>;

export type AccessRequestState =
  | { status: "idle" }
  | { status: "sent" }
  | {
      status: "error";
      message: string;
      values: AccessRequestValues;
      fieldErrors?: AccessRequestFieldErrors;
    };

const GENERIC_ERROR = `We couldn't submit your request. Please try again, or email ${PARTNER_EMAIL} directly.`;

const THROTTLE_WINDOW_MS = 10 * 60 * 1000;
/** Valid submissions, per caller, per window. Malformed ones never get here. */
const PER_CALLER = 5;
/**
 * A ceiling for everyone together. The per-caller budget is keyed on a header
 * the caller controls, so on its own it is defeated by rotating that header;
 * this is the limit that actually bounds the send quota and the sending
 * domain's reputation, which is what a burst puts at risk.
 */
const PER_WINDOW = 60;

/** The forwarded client address, or null when there is no proxy to trust. */
async function callerAddress(): Promise<string | null> {
  try {
    const forwarded = (await headers()).get("x-forwarded-for");
    return forwarded?.split(",")[0]?.trim() || null;
  } catch {
    // Outside a request scope. Fall back to the shared ceiling rather than
    // bucketing every caller together, which would throttle the whole form.
    return null;
  }
}

export async function requestAccessAction(
  _previous: AccessRequestState,
  formData: FormData,
): Promise<AccessRequestState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const values: AccessRequestValues = {
    name,
    email,
    organisation: String(formData.get("organisation") ?? "").trim(),
    role: String(formData.get("role") ?? "").trim(),
    workflow: String(formData.get("workflow") ?? "").trim(),
  };
  const parsed = accessRequestSchema.safeParse({
    ...values,
    website: String(formData.get("website") ?? "").trim(),
  });

  if (!parsed.success) {
    // A filled honeypot is not a user error, so it never reaches the user as
    // one. It is reported as sent and dropped on the floor.
    if (String(formData.get("website") ?? "").trim() !== "") {
      logger.info("access_request.honeypot_tripped");
      return { status: "sent" };
    }
    const flattened = parsed.error.flatten().fieldErrors;
    const fieldErrors = Object.fromEntries(
      Object.entries(flattened)
        .filter(([field]) => field !== "website")
        .map(([field, messages]) => [field, messages?.[0]]),
    ) as AccessRequestFieldErrors;
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      values,
      fieldErrors,
    };
  }

  // The action is public and unauthenticated, so this is the only thing
  // between a script and the send quota. A tripped limit reports the generic
  // failure, which already names a mailbox, so a real visitor caught by it
  // still has a way to reach us.
  const caller = await callerAddress();
  if (
    (caller !== null &&
      overLimit(`caller:${caller}`, PER_CALLER, THROTTLE_WINDOW_MS)) ||
    overLimit("all", PER_WINDOW, THROTTLE_WINDOW_MS)
  ) {
    logger.warn("access_request.rate_limited", { scoped: caller !== null });
    return { status: "error", message: GENERIC_ERROR, values };
  }

  const apiKey = process.env.RESEND_API_KEY;
  // Split here rather than at the call: a trailing comma leaves an empty
  // recipient that Resend rejects the whole message for, and " " or "," are
  // truthy, so a separator on its own would otherwise pass as configured and
  // then fail every send.
  const to = (process.env.ACCESS_REQUEST_TO ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
  const from = process.env.ACCESS_REQUEST_FROM;

  if (!apiKey || to.length === 0 || !from) {
    logger.error("access_request.not_configured", {
      missing: [
        apiKey ? undefined : "RESEND_API_KEY",
        to.length ? undefined : "ACCESS_REQUEST_TO",
        from ? undefined : "ACCESS_REQUEST_FROM",
      ].filter(Boolean),
    });
    return { status: "error", message: GENERIC_ERROR, values };
  }

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to,
      replyTo: parsed.data.email,
      subject: "Access request — private preview",
      text: [
        `Name: ${parsed.data.name}`,
        `Work email: ${parsed.data.email}`,
        `Organisation: ${parsed.data.organisation}`,
        `Role: ${parsed.data.role}`,
        `Agent workflow: ${parsed.data.workflow || "Not provided"}`,
        `Received: ${new Date().toISOString()}`,
      ].join("\n"),
    });

    if (error) {
      logger.error("access_request.send_failed", { reason: error.name });
      return { status: "error", message: GENERIC_ERROR, values };
    }
  } catch (cause) {
    logger.error("access_request.send_threw", {
      reason: cause instanceof Error ? cause.name : "unknown",
    });
    return { status: "error", message: GENERIC_ERROR, values };
  }

  logger.info("access_request.sent");
  return { status: "sent" };
}
