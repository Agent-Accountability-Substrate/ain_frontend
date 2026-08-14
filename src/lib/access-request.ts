"use server";

import { Resend } from "resend";
import { z } from "zod";

import { logger } from "@/lib/logger";

/**
 * The private-preview access request: one work email, mailed to us.
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
  email: z.email().max(254),
  // Rendered off-screen and left empty by any human. A bot fills every field
  // it finds, so a non-empty value here is the cheapest signal available.
  company: z.literal(""),
});

export type AccessRequestState =
  | { status: "idle" }
  | { status: "sent" }
  | { status: "error"; message: string };

const GENERIC_ERROR =
  "That did not send. Email contact@subrahq.com and we will pick it up there.";

export async function requestAccessAction(
  _previous: AccessRequestState,
  formData: FormData,
): Promise<AccessRequestState> {
  const parsed = accessRequestSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    company: String(formData.get("company") ?? "").trim(),
  });

  if (!parsed.success) {
    // A filled honeypot is not a user error, so it never reaches the user as
    // one. It is reported as sent and dropped on the floor.
    if (String(formData.get("company") ?? "").trim() !== "") {
      logger.info("access_request.honeypot_tripped");
      return { status: "sent" };
    }
    return {
      status: "error",
      message: "Enter a work email address so we can reply.",
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ACCESS_REQUEST_TO;
  const from = process.env.ACCESS_REQUEST_FROM;

  if (!apiKey || !to || !from) {
    logger.error("access_request.not_configured", {
      missing: [
        apiKey ? undefined : "RESEND_API_KEY",
        to ? undefined : "ACCESS_REQUEST_TO",
        from ? undefined : "ACCESS_REQUEST_FROM",
      ].filter(Boolean),
    });
    return { status: "error", message: GENERIC_ERROR };
  }

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to: to.split(",").map((address) => address.trim()),
      replyTo: parsed.data.email,
      subject: "Access request — private preview",
      text: [
        `Work email: ${parsed.data.email}`,
        `Received: ${new Date().toISOString()}`,
      ].join("\n"),
    });

    if (error) {
      logger.error("access_request.send_failed", { reason: error.name });
      return { status: "error", message: GENERIC_ERROR };
    }
  } catch (cause) {
    logger.error("access_request.send_threw", {
      reason: cause instanceof Error ? cause.name : "unknown",
    });
    return { status: "error", message: GENERIC_ERROR };
  }

  logger.info("access_request.sent");
  return { status: "sent" };
}
