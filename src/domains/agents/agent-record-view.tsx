import {
  ArrowUpRight,
  CircleAlert,
  Fingerprint,
  KeyRound,
  Link2,
  ScrollText,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AgentLifecycleMenu } from "@/domains/agents/agent-lifecycle-menu";
import { CopyableAin } from "@/domains/agents/copyable-ain";
import {
  availableTransitions,
  chainIsContiguous,
  LIFECYCLE_LABELS,
  type AgentRecord,
} from "@/domains/agents/agent-record";
import {
  WorkspaceContent,
  WorkspacePane,
} from "@/domains/workspace/workspace-content";
import type { OrganisationSummary } from "@/domains/workspace/account-workspace";
import { agentDraftHref, orgHref } from "@/domains/workspace/workspace-routes";
import { ButtonLink } from "@/lib/ui/button";
import { Callout, type CalloutTone } from "@/lib/ui/callout";
import { Card } from "@/lib/ui/card";
import { EmptyState } from "@/lib/ui/empty-state";
import { Eyebrow } from "@/lib/ui/eyebrow";
import { PageHeading } from "@/lib/ui/page-heading";
import { StatusPill, type StatusTone } from "@/lib/ui/status-pill";

/**
 * What the registry holds about one agent.
 *
 * The register answers "which agents exist"; this answers the question the
 * product is sold on — *what was this agent authorised to do, who answers for
 * it, and what has happened to it*. Every value here is read from the signed
 * document or the ledger beside it; nothing is computed for display.
 *
 * Read-only, and necessarily so. Scope and accountability change by supersede
 * — a new signed document version — not by editing this page, and the only
 * writes an agent accepts after issuance are the two lifecycle transitions in
 * the menu.
 */

const TONE: Record<string, StatusTone> = {
  active: "success",
  draft: "pending",
  suspended: "attention",
  revoked: "refused",
};

/**
 * What the status means for the agent's authority, said plainly — and in the
 * tone it deserves. A withdrawn agent rendered in the neutral note tone reads
 * as background information about a working one.
 */
const STATUS_DETAIL: Record<string, { detail: string; tone?: CalloutTone }> = {
  draft: {
    detail:
      "Nothing is signed or published yet. This agent has an identifier and no authority.",
  },
  active: {
    detail: "The signed document below is what any action is judged against.",
  },
  suspended: {
    detail:
      "Authority is withdrawn. The resolver no longer serves this agent, and there is no reinstatement in this release.",
    tone: "caution",
  },
  revoked: {
    detail:
      "Authority is permanently withdrawn. This is terminal — the identifier is never reissued or recycled.",
    tone: "danger",
  },
};

function Field({
  icon: Icon,
  label,
  children,
  mono = false,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wash-blue text-cobalt">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <Eyebrow>{label}</Eyebrow>
        <div
          className={
            mono
              ? "select-all break-all font-mono text-[11px] leading-5 text-ink-soft"
              : "text-sm font-semibold text-ink"
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * A constraint value, rendered as the JSON it is.
 *
 * The vocabulary — not this layer — decides whether `max_value_gbp` is a
 * ceiling, so the pair is shown rather than described. Writing "at most 5000"
 * here would be this screen inventing an operator the document does not carry.
 */
function constraintValue(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

export function AgentRecordView({
  agent,
  organisation,
}: {
  agent: AgentRecord;
  organisation: OrganisationSummary;
}) {
  const status = STATUS_DETAIL[agent.status];
  const transitions = availableTransitions(agent.status);
  const contiguous = chainIsContiguous(agent.lifecycle);
  const isDraft = agent.status === "draft";

  return (
    <WorkspaceContent columns="single">
      <WorkspacePane className="mx-auto flex w-[min(100%,64rem)] flex-col gap-5">
        <ButtonLink
          variant="ghost"
          href={orgHref(organisation.ulid, "agents")}
          className="w-fit px-0"
        >
          ← Agents
        </ButtonLink>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <PageHeading eyebrow={organisation.name} lede={agent.role}>
            {agent.name}
          </PageHeading>
          <div className="flex items-center gap-2">
            <StatusPill tone={TONE[agent.status] ?? "neutral"}>
              {agent.status}
            </StatusPill>
            {transitions.length > 0 ? (
              <AgentLifecycleMenu
                agentName={agent.name}
                ain={agent.ain}
                organisationId={organisation.id}
                transitions={transitions}
              />
            ) : null}
          </div>
        </div>

        <Callout
          {...(status?.tone !== undefined && { tone: status.tone })}
          icon={ScrollText}
        >
          {status?.detail ??
            "The registry reports a status this release does not describe."}
        </Callout>

        {/* A draft's only useful next step is finishing it, and the wizard is
            the one place that can. Without this the draft is a dead row
            holding a permanent identifier. */}
        {isDraft ? (
          <Card as="section" className="flex flex-wrap items-center gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <Eyebrow>Unfinished</Eyebrow>
              <p className="text-sm font-semibold text-ink">
                This draft has an identifier but no signed document
              </p>
              <p className="text-[11px] leading-4 text-mist">
                Its AIN is already permanent. Continuing declares the scope and
                the accountable owner against that identifier rather than
                minting a second one.
              </p>
            </div>
            <ButtonLink
              variant="primary"
              href={agentDraftHref(organisation.ulid, agent.ain)}
              className="ml-auto"
            >
              Continue this draft
            </ButtonLink>
          </Card>
        ) : null}

        <Card
          as="section"
          aria-labelledby="identity-title"
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1">
            <Eyebrow>Identity</Eyebrow>
            <h2 id="identity-title" className="text-sm font-semibold text-ink">
              The permanent record
            </h2>
          </div>
          <CopyableAin value={agent.ain} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field icon={CircleAlert} label="Risk class">
              {agent.riskClass}
            </Field>
            {agent.document ? (
              <>
                <Field icon={ScrollText} label="Document version">
                  v{agent.document.documentVersion}
                </Field>
                <Field icon={Fingerprint} label="Document hash" mono>
                  {agent.document.documentHash}
                </Field>
                <Field icon={KeyRound} label="Signed with key" mono>
                  {agent.document.kid}
                </Field>
              </>
            ) : null}
          </div>
          {agent.resolverUrl ? (
            <ButtonLink
              variant="secondary"
              href={agent.resolverUrl}
              className="w-fit"
            >
              Resolver record
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </ButtonLink>
          ) : null}
        </Card>

        <Card
          as="section"
          aria-labelledby="scope-title"
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1">
            <Eyebrow>Authorised scope</Eyebrow>
            <h2 id="scope-title" className="text-sm font-semibold text-ink">
              What this agent may do
            </h2>
            <p className="mt-1 text-[11px] leading-4 text-mist">
              Anything not listed is not authorised. Changing this is a new
              signed document version, never an edit to the one below.
            </p>
          </div>

          {agent.scope ? (
            <>
              <ul className="flex flex-wrap gap-2">
                {agent.scope.actionClasses.map((actionClass) => (
                  <li
                    key={actionClass}
                    className="rounded-lg border border-frost bg-wash-blue px-2.5 py-1.5 font-mono text-[11px] font-semibold text-cobalt"
                  >
                    {actionClass}
                  </li>
                ))}
              </ul>

              {Object.keys(agent.scope.constraints).length > 0 ? (
                <div className="flex flex-col gap-2">
                  <Eyebrow>Constraints</Eyebrow>
                  <ul className="flex flex-col gap-2">
                    {Object.entries(agent.scope.constraints).map(
                      ([actionClass, bounds]) => (
                        <li
                          key={actionClass}
                          className="rounded-xl border border-line bg-panel px-3.5 py-3"
                        >
                          <code className="font-mono text-[11px] font-semibold text-ink-soft">
                            {actionClass}
                          </code>
                          <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
                            {Object.entries(bounds).map(([key, value]) => (
                              <div
                                key={key}
                                className="flex items-baseline gap-2"
                              >
                                <dt className="font-mono text-[11px] text-mist">
                                  {key}
                                </dt>
                                <dd className="font-mono text-[11px] font-semibold text-ink">
                                  {constraintValue(value)}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              ) : null}

              <div className="grid gap-5 sm:grid-cols-2">
                <Field icon={CircleAlert} label="Operational risk level">
                  {agent.scope.riskLevel}
                </Field>
                {agent.scope.regulatoryMappings.length > 0 ? (
                  <Field icon={ScrollText} label="Regulatory mappings">
                    {agent.scope.regulatoryMappings.join(", ")}
                  </Field>
                ) : null}
              </div>
            </>
          ) : (
            <EmptyState icon={ScrollText}>
              No scope has been declared. Until one is, this agent is authorised
              to do nothing.
            </EmptyState>
          )}
        </Card>

        <Card
          as="section"
          aria-labelledby="accountability-title"
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1">
            <Eyebrow>Named accountability</Eyebrow>
            <h2
              id="accountability-title"
              className="text-sm font-semibold text-ink"
            >
              Who answers for this agent
            </h2>
          </div>
          {agent.accountability ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field icon={UserRound} label="Accountable role">
                {agent.accountability.roleTitle}
              </Field>
              <Field icon={UserRound} label="Responsibility area">
                {agent.accountability.responsibilityArea}
              </Field>
              <Field icon={Fingerprint} label="Regulatory reference" mono>
                {agent.accountability.regulatoryIdentifier}
              </Field>
            </div>
          ) : (
            <EmptyState icon={UserRound}>
              No accountable owner is bound yet.
            </EmptyState>
          )}
        </Card>

        {agent.externalIdentities.length > 0 ? (
          <Card
            as="section"
            aria-labelledby="refs-title"
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <Eyebrow>External identities</Eyebrow>
              <h2 id="refs-title" className="text-sm font-semibold text-ink">
                Where else this agent is known
              </h2>
            </div>
            <ul className="flex flex-col gap-2">
              {agent.externalIdentities.map((reference) => (
                <li
                  key={`${reference.refType}:${reference.refValue}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-line bg-panel px-3.5 py-3"
                >
                  <Link2
                    className="h-3.5 w-3.5 shrink-0 text-mist"
                    aria-hidden="true"
                  />
                  <span className="text-[11px] font-semibold text-ink">
                    {reference.refType}
                  </span>
                  <code className="select-all break-all font-mono text-[11px] text-ink-soft">
                    {reference.refValue}
                  </code>
                  {/* Stored as a link, not proof. Saying so is the difference
                      between a reference and a claim. */}
                  <StatusPill
                    tone={reference.verified ? "success" : "neutral"}
                    className="ml-auto"
                  >
                    {reference.verified ? "Verified" : "Recorded, not verified"}
                  </StatusPill>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <Card
          as="section"
          aria-labelledby="lifecycle-title"
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <Eyebrow>Lifecycle</Eyebrow>
            <h2 id="lifecycle-title" className="text-sm font-semibold text-ink">
              Everything that has happened to this agent
            </h2>
            <p className="mt-1 text-[11px] leading-4 text-mist">
              Append-only and hash-chained: each entry names the one before it,
              so a silent edit in the middle breaks the chain.
            </p>
          </div>

          {agent.lifecycle.length === 0 ? (
            <EmptyState icon={ScrollText}>
              The chain opens when the document is signed.
            </EmptyState>
          ) : (
            <>
              {/* The links are checked, not assumed. A break is the one thing
                  this ledger exists to make visible, so it is stated rather
                  than rendered over with a tidy timeline. */}
              {contiguous ? null : (
                <Callout
                  tone="danger"
                  alert
                  title="This chain does not link up"
                >
                  An entry is missing, out of order, or does not name its
                  predecessor. Treat the history below as unreliable and raise
                  it — a chain that fails to link is exactly what the ledger is
                  designed to reveal.
                </Callout>
              )}
              <ol className="flex flex-col gap-2">
                {agent.lifecycle.map((event) => (
                  <li
                    key={event.seq}
                    className="flex flex-col gap-1.5 rounded-xl border border-line bg-panel px-3.5 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-frost bg-wash-blue text-[11px] font-bold text-cobalt">
                        {event.seq}
                      </span>
                      <span className="text-sm font-semibold text-ink">
                        {LIFECYCLE_LABELS[event.eventType] ?? event.eventType}
                      </span>
                      <time
                        dateTime={event.occurredAt}
                        className="ml-auto text-[11px] text-mist"
                      >
                        {new Date(event.occurredAt).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    <code className="select-all break-all font-mono text-[10px] leading-4 text-mist-light">
                      {event.eventHash}
                    </code>
                  </li>
                ))}
              </ol>
            </>
          )}
        </Card>
      </WorkspacePane>
    </WorkspaceContent>
  );
}
