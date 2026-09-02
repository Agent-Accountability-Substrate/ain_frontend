"use client";

import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useActionState, useState } from "react";

import {
  recordDecisionAction,
  type DecisionState,
} from "@/domains/operations/operations-actions";
import { Callout } from "@/lib/ui/callout";
import { Button, ButtonLink } from "@/lib/ui/button";
import { Eyebrow } from "@/lib/ui/eyebrow";
import { RadioField } from "@/lib/ui/radio-field";
import { TextField } from "@/lib/ui/text-field";

/**
 * Recording a review outcome.
 *
 * The outcome is chosen before the reason is asked for, because which reason is
 * wanted depends on it: `needs_attention` asks what the holder must send,
 * `rejected` asks what was wrong, and `verified` asks for nothing. A single
 * "notes" box under three buttons would collect the same text for three
 * different questions.
 *
 * `rejected` is deliberately the least reachable of the three. It is terminal
 * and it frees the company number, so the way forward afterwards is a fresh
 * registration rather than an appeal — that is worth a moment's friction, not a
 * button of equal weight beside "verify".
 *
 * Each option's guidance is a `<RadioField>` description rather than part of
 * the label, so the option announces as "Refuse" rather than as "Refuse" plus
 * the whole paragraph beneath it. The guidance still reaches assistive
 * technology through `aria-describedby`.
 */

const OUTCOMES = [
  {
    value: "verified",
    label: "Verify",
    // The button's own wording, because "${label} this company" reads fine for
    // two of the three and not at all for "Ask for more".
    action: "Verify this company",
    // How the outcome reads back afterwards. The enum value is the registry's
    // word, not a sentence to put in front of a person.
    recorded: "verified",
    description:
      "The company is real, the number matches, and this person may act for it. The organisation can register agents from this point.",
  },
  {
    value: "needs_attention",
    label: "Ask for more",
    action: "Send this back for more",
    recorded: "waiting on more information",
    description:
      "Keeps the registration live and its claim on the company number. The holder sees what you write here.",
  },
  {
    value: "rejected",
    label: "Refuse",
    action: "Refuse this company",
    recorded: "not approved",
    description:
      "Final. Frees the company number, so the way forward is a fresh registration — say what was wrong.",
  },
] as const;

const INITIAL: DecisionState = { status: "idle" };

export function ReviewDecisionForm({
  organisationId,
  organisationName,
}: {
  organisationId: string;
  organisationName: string;
}) {
  const [result, formAction, pending] = useActionState(
    recordDecisionAction,
    INITIAL,
  );
  const [outcome, setOutcome] = useState<string>("verified");
  // Controlled, like both organisation forms and for the same reason: React
  // resets a form once its action resolves, so a refusal would hand the reason
  // back with the box already wiped. `outcome` survived that because it is
  // state; this did not. It is the one irreversible write in the product, and
  // a 409 from a concurrent decision is the case that hits it.
  const [reason, setReason] = useState("");
  const chosen = OUTCOMES.find((entry) => entry.value === outcome);
  const errors = result.status === "error" ? result.errors : {};

  if (result.status === "recorded") {
    return (
      <section className="flex flex-col items-start gap-4 rounded-2xl border border-success-soft bg-success-wash/40 p-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-success-strong">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">
          Recorded
        </h2>
        <p className="text-xs leading-5 text-mist">
          {organisationName} is now{" "}
          <strong className="text-ink">
            {OUTCOMES.find((entry) => entry.value === result.outcome)
              ?.recorded ?? result.outcome}
          </strong>
          . Its members see this, and the reason with it.
        </p>
        <ButtonLink href="/operations">Back to the review queue</ButtonLink>
      </section>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-6"
    >
      <input type="hidden" name="organisationId" value={organisationId} />

      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warm-wash text-warm-700">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-2">
          <Eyebrow>Record a decision</Eyebrow>
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">
            What did you find?
          </h2>
        </div>
      </div>

      <RadioField
        name="outcome"
        legend="Review outcome"
        options={OUTCOMES}
        value={outcome}
        onValueChange={setOutcome}
      />

      {outcome === "verified" ? null : (
        <TextField
          label={
            outcome === "rejected"
              ? "Why this was refused"
              : "What the holder needs to send"
          }
          name="reviewReason"
          multiline
          rows={3}
          required
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={
            outcome === "rejected"
              ? "The company number belongs to a dissolved entity."
              : "Send a director's proof of address dated within the last three months."
          }
          description="Written to the organisation's own members, in your words."
          error={errors["reviewReason"]}
        />
      )}

      {result.status === "error" ? (
        <Callout tone="danger" alert>
          {result.message}
        </Callout>
      ) : (
        <Callout>
          No outcome here can be taken back through any route. A refusal is
          final, and an approval is what lets this organisation issue agents.
        </Callout>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ButtonLink href="/operations">Back to the queue</ButtonLink>
        <Button type="submit" disabled={pending}>
          {pending ? "Recording…" : (chosen?.action ?? "Record the decision")}
        </Button>
      </div>
    </form>
  );
}
