import { Building2, Clock } from "lucide-react";

import { ReviewDecisionForm } from "@/components/review-decision-form";
import { WorkspaceShell } from "@/components/workspace-shell";
import type { RegistrationCheck, ReviewItem } from "@/lib/registry-api";
import { menuItemsFor } from "@/lib/workspace-navigation";

/**
 * The trust-operations console (architecture.md M12).
 *
 * A queue, one company at a time, and a decision. Deliberately not a table of
 * every organisation: an operator is answering one question — may this company
 * issue agents — and the screen shows what that question turns on and nothing
 * else. Members, agents and audit history stay behind their own reads.
 */

const QUEUE_STATUS_LABEL = {
  pending: "Not yet reviewed",
  needs_attention: "Waiting on the applicant",
} as const;

function Comparison({ check }: { check: RegistrationCheck }) {
  if (check.register === null) {
    return (
      <div className="wizard-form-note" role="alert">
        <strong>Companies House has no company with this number.</strong> That
        is a finding in itself — the number is well-formed, and nothing is
        registered under it.
      </div>
    );
  }
  return (
    <div className="wizard-review">
      <div>
        <span>Name claimed</span>
        <strong>{check.claimed_name}</strong>
      </div>
      <div>
        <span>Name on the register</span>
        <strong>{check.register.company_name}</strong>
      </div>
      <div>
        <span>Address claimed</span>
        <strong>{check.claimed_address}</strong>
      </div>
      <div>
        <span>Registered office</span>
        <strong>{check.register.registered_office_address ?? "—"}</strong>
      </div>
      <div>
        <span>Status on the register</span>
        <strong>{check.register.company_status}</strong>
      </div>
      <div>
        <span>Incorporated</span>
        <strong>{check.register.date_of_creation ?? "—"}</strong>
      </div>
      {/* Stated as an observation, never as a verdict. Two genuinely different
          companies can normalise to the same name, and the register cannot say
          whether this person may act for either of them. */}
      <div className="wizard-form-note">
        {check.name_matches
          ? "The names match once case, punctuation and Ltd/Limited are folded."
          : "The names do not match after folding case, punctuation and Ltd/Limited."}{" "}
        Neither this nor the register can tell you whether the applicant may act
        for the company — that part is yours.
      </div>
    </div>
  );
}

export function OperationsView({
  email,
  queue,
  selected,
  check,
  checkUnavailable,
}: {
  email: string | null | undefined;
  queue: readonly ReviewItem[];
  selected: ReviewItem | null;
  check: RegistrationCheck | null;
  /** Why the register could not be consulted, when it could not be. */
  checkUnavailable: string | null;
}) {
  return (
    <WorkspaceShell
      currentPath="/operations"
      email={email}
      navigationItems={menuItemsFor(true)}
      navigationLabel="Account sections"
      signedInAs="Trust operations"
      workspaceLabel="Trust operations"
    >
      <div className="account-wizard-workspace">
        <aside className="account-wizard-side">
          <p className="dashboard-eyebrow">Review queue</p>
          <h1>
            {queue.length === 0
              ? "Nothing waiting"
              : `${queue.length} awaiting a decision`}
          </h1>
          {queue.length === 0 ? (
            <p className="wizard-side-copy">
              Every registration has been decided. New ones appear here as they
              arrive.
            </p>
          ) : (
            <ul className="organisation-list">
              {queue.map((item) => (
                <li key={item.organisation_id}>
                  <a href={`/operations?org=${item.organisation_id}`}>
                    <span className="organisation-list-name">
                      <Building2 className="h-4 w-4" aria-hidden="true" />
                      {item.name}
                    </span>
                    <span className="organisation-list-meta">
                      {item.registration_number}
                      {" · "}
                      {QUEUE_STATUS_LABEL[item.verification_status]}
                    </span>
                    {item.organisation_id === selected?.organisation_id ? (
                      <span className="organisation-list-current">Open</span>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="account-wizard-main">
          {selected === null ? (
            <section className="wizard-form">
              <div className="wizard-form-heading">
                <span className="wizard-form-icon">
                  <Clock className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="dashboard-eyebrow">Trust operations</p>
                  <h2>Choose a company to review</h2>
                  <p>
                    Each one is a registration waiting on a decision. Nothing is
                    issued anywhere until you make it.
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <>
              <section className="wizard-form">
                <div className="wizard-form-heading">
                  <span className="wizard-form-icon">
                    <Building2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="dashboard-eyebrow">
                      {selected.jurisdiction.toUpperCase()} ·{" "}
                      {selected.registration_number}
                    </p>
                    <h2>{selected.name}</h2>
                    {selected.review_reason ? (
                      <p>
                        Previously asked for:{" "}
                        <strong>{selected.review_reason}</strong>
                      </p>
                    ) : null}
                  </div>
                </div>
                {selected.web_url ? (
                  <p className="wizard-form-note">
                    Claimed website: <code>{selected.web_url}</code> — worth
                    opening, and worth nothing on its own.
                  </p>
                ) : null}
                {checkUnavailable !== null ? (
                  <div className="wizard-form-note" role="alert">
                    {checkUnavailable} Look the number up by hand before
                    deciding — the register not answering says nothing about the
                    company.
                  </div>
                ) : check !== null ? (
                  <Comparison check={check} />
                ) : null}
              </section>

              <ReviewDecisionForm
                organisationId={selected.organisation_id}
                organisationName={selected.name}
              />
            </>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
