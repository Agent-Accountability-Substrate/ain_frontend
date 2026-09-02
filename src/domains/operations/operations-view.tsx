import { Building2, Clock } from "lucide-react";

import { ReviewDecisionForm } from "@/domains/operations/review-decision-form";
import {
  WorkspaceContent,
  WorkspacePane,
  WorkspaceShell,
} from "@/domains/workspace/workspace-shell";
import type {
  RegistrationCheck,
  ReviewItem,
} from "@/lib/registry/registry-api";
import { menuItemsFor } from "@/domains/workspace/workspace-navigation";
import { Callout } from "@/lib/ui/callout";
import { Card } from "@/lib/ui/card";
import { Eyebrow } from "@/lib/ui/eyebrow";
import { StatusPill } from "@/lib/ui/status-pill";

/**
 * The trust-operations console (architecture.md M12).
 *
 * A queue, one company at a time, and a decision. Deliberately not a table of
 * every organisation: an operator is answering one question — may this company
 * issue agents — and the screen shows what that question turns on and nothing
 * else. Members, agents and audit history stay behind their own reads.
 */

const QUEUE_STATUS = {
  pending: { label: "Not yet reviewed", tone: "pending" },
  needs_attention: { label: "Waiting on the applicant", tone: "attention" },
} as const;

/** One claimed value beside what the register holds. */
function Comparison({ check }: { check: RegistrationCheck }) {
  if (check.register === null) {
    return (
      <Callout tone="caution" alert>
        <strong className="font-semibold">
          Companies House has no company with this number.
        </strong>{" "}
        That is a finding in itself — the number is well-formed, and nothing is
        registered under it.
      </Callout>
    );
  }

  const rows = [
    ["Name claimed", check.claimed_name],
    ["Name on the register", check.register.company_name],
    ["Address claimed", check.claimed_address],
    ["Registered office", check.register.registered_office_address ?? "—"],
    ["Status on the register", check.register.company_status],
    ["Incorporated", check.register.date_of_creation ?? "—"],
  ] as const;

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid gap-3 sm:grid-cols-2">
        {rows.map(([term, value]) => (
          <div
            key={term}
            className="flex flex-col gap-1 rounded-xl border border-line bg-band px-3.5 py-3"
          >
            <dt className="text-[11px] text-ink-muted">{term}</dt>
            <dd className="text-xs font-semibold text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      {/* Stated as an observation, never as a verdict. Two genuinely different
          companies can normalise to the same name, and the register cannot say
          whether this person may act for either of them. */}
      <p className="rounded-xl border border-frost bg-wash-blue p-3 text-[11px] leading-5 text-ink-muted">
        {check.name_matches
          ? "The names match once case, punctuation and Ltd/Limited are folded."
          : "The names do not match after folding case, punctuation and Ltd/Limited."}{" "}
        Neither this nor the register can tell you whether the applicant may act
        for the company — that part is yours.
      </p>
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
      <WorkspaceContent>
        <WorkspacePane
          as="aside"
          className="flex flex-col gap-3 max-lg:order-2"
        >
          <Eyebrow>Review queue</Eyebrow>
          <h1 className="text-lg font-semibold tracking-[-0.02em] text-ink">
            {queue.length === 0
              ? "Nothing waiting"
              : `${queue.length} awaiting a decision`}
          </h1>
          {queue.length === 0 ? (
            <p className="text-xs leading-5 text-mist">
              Every registration has been decided. New ones appear here as they
              arrive.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {queue.map((item) => {
                const status = QUEUE_STATUS[item.verification_status];
                const open = item.organisation_id === selected?.organisation_id;
                return (
                  <li key={item.organisation_id}>
                    <a
                      href={`/operations?org=${item.organisation_id}`}
                      aria-current={open ? "true" : undefined}
                      className={
                        open
                          ? "flex flex-col gap-2 rounded-2xl border border-ink bg-white px-3.5 py-3"
                          : "flex flex-col gap-2 rounded-2xl border border-line bg-panel px-3.5 py-3 hover:border-line-strong"
                      }
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                        <Building2
                          className="h-4 w-4 shrink-0 text-mist"
                          aria-hidden="true"
                        />
                        {item.name}
                      </span>
                      <span className="flex flex-wrap items-center gap-2">
                        <code className="font-mono text-[11px] text-mist">
                          {item.registration_number}
                        </code>
                        <StatusPill tone={status.tone}>
                          {status.label}
                        </StatusPill>
                        {open ? (
                          <StatusPill tone="neutral" className="ml-auto">
                            Open
                          </StatusPill>
                        ) : null}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </WorkspacePane>

        <WorkspacePane className="flex flex-col gap-3.5 max-lg:order-1">
          {selected === null ? (
            <Card as="section" className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wash-blue text-cobalt">
                <Clock className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-2">
                <Eyebrow>Trust operations</Eyebrow>
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">
                  Choose a company to review
                </h2>
                <p className="text-xs leading-5 text-mist">
                  Each one is a registration waiting on a decision. Nothing is
                  issued anywhere until you make it.
                </p>
              </div>
            </Card>
          ) : (
            <>
              <Card as="section" className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wash-blue text-cobalt">
                    <Building2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="flex flex-col gap-1">
                    <Eyebrow>
                      {selected.jurisdiction.toUpperCase()} ·{" "}
                      {selected.registration_number}
                    </Eyebrow>
                    <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink">
                      {selected.name}
                    </h2>
                    {selected.review_reason ? (
                      <p className="text-xs leading-5 text-mist">
                        Previously asked for:{" "}
                        <strong className="font-semibold text-ink-soft">
                          {selected.review_reason}
                        </strong>
                      </p>
                    ) : null}
                  </div>
                </div>

                {selected.web_url ? (
                  <Callout>
                    Claimed website:{" "}
                    <code className="font-mono text-ink-soft">
                      {selected.web_url}
                    </code>{" "}
                    — worth opening, and worth nothing on its own.
                  </Callout>
                ) : null}

                {checkUnavailable !== null ? (
                  <Callout tone="caution" alert>
                    {checkUnavailable} Look the number up by hand before
                    deciding — the register not answering says nothing about the
                    company.
                  </Callout>
                ) : check !== null ? (
                  <Comparison check={check} />
                ) : null}
              </Card>

              <ReviewDecisionForm
                organisationId={selected.organisation_id}
                organisationName={selected.name}
              />
            </>
          )}
        </WorkspacePane>
      </WorkspaceContent>
    </WorkspaceShell>
  );
}
