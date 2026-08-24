"use client";

import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useActionState, useState } from "react";

import {
  recordDecisionAction,
  type DecisionState,
} from "@/domains/operations/operations-actions";

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
    hint: "The company is real, the number matches, and this person may act for it. The organisation can register agents from this point.",
  },
  {
    value: "needs_attention",
    label: "Ask for more",
    action: "Send this back for more",
    recorded: "waiting on more information",
    hint: "Keeps the registration live and its claim on the company number. The holder sees what you write here.",
  },
  {
    value: "rejected",
    label: "Refuse",
    action: "Refuse this company",
    recorded: "not approved",
    hint: "Final. Frees the company number, so the way forward is a fresh registration — say what was wrong.",
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
  const chosen = OUTCOMES.find((entry) => entry.value === outcome);
  const errors = result.status === "error" ? result.errors : {};

  if (result.status === "recorded") {
    return (
      <section className="wizard-complete" aria-labelledby="decision-recorded">
        <span className="wizard-complete-icon">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 id="decision-recorded">Recorded</h2>
        <p>
          {organisationName} is now{" "}
          <strong>
            {OUTCOMES.find((entry) => entry.value === result.outcome)
              ?.recorded ?? result.outcome}
          </strong>
          . Its members see this, and the reason with it.
        </p>
        <div className="wizard-complete-actions">
          <a href="/operations">Back to the review queue</a>
        </div>
      </section>
    );
  }

  return (
    <form className="wizard-form" action={formAction}>
      <input type="hidden" name="organisationId" value={organisationId} />
      <div className="wizard-form-heading">
        <span className="wizard-form-icon">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="dashboard-eyebrow">Record a decision</p>
          <h2>What did you find?</h2>
        </div>
      </div>

      <fieldset className="wizard-form-grid">
        <legend className="sr-only">Review outcome</legend>
        {OUTCOMES.map((entry) => (
          <label key={entry.value} className="wizard-checkbox">
            <input
              type="radio"
              name="outcome"
              value={entry.value}
              checked={outcome === entry.value}
              onChange={(event) => setOutcome(event.target.value)}
            />
            <span>
              <strong>{entry.label}</strong>
              <br />
              {entry.hint}
            </span>
          </label>
        ))}
      </fieldset>

      {/* Wrapped in the form grid: a bare <label> inside .wizard-form gets no
          layout at all, and the label, textarea and helper text pile on top of
          one another. Full width, because a reason is prose. */}
      {outcome === "verified" ? null : (
        <div className="wizard-form-grid">
          <label className="col-span-full">
            <span>
              {outcome === "rejected"
                ? "Why this was refused"
                : "What the holder needs to send"}
            </span>
            <textarea
              name="reviewReason"
              rows={3}
              required
              placeholder={
                outcome === "rejected"
                  ? "The company number belongs to a dissolved entity."
                  : "Send a director's proof of address dated within the last three months."
              }
            />
            <small>
              Written to the organisation&apos;s own members, in your words.
            </small>
            {errors["reviewReason"] ? (
              <small role="alert">{errors["reviewReason"]}</small>
            ) : null}
          </label>
        </div>
      )}

      {result.status === "error" ? (
        <p className="wizard-form-note" role="alert">
          {result.message}
        </p>
      ) : (
        <div className="wizard-form-note">
          No outcome here can be taken back through any route. A refusal is
          final, and an approval is what lets this organisation issue agents.
        </div>
      )}

      <div className="wizard-form-actions">
        <a className="wizard-secondary-action" href="/operations">
          Back to the queue
        </a>
        <button
          type="submit"
          className="wizard-primary-action"
          disabled={pending}
        >
          {pending ? "Recording…" : (chosen?.action ?? "Record the decision")}
        </button>
      </div>
    </form>
  );
}
