import { FileCheck2, FileWarning } from "lucide-react";
import Link from "next/link";

import { CopyableAin } from "@/domains/agents/copyable-ain";
import { EvidencePackRequestForm } from "@/domains/agents/evidence-pack-request-form";
import { EvidencePackWatch } from "@/domains/agents/evidence-pack-watch";
import {
  inFlightIds,
  isInFlight,
  packPeriod,
  PACK_STATUS_LABELS,
  utcMoment,
  type EvidencePack,
  type EvidencePackPage,
} from "@/domains/agents/evidence-pack";
import type { AgentRecord } from "@/domains/agents/agent-record";
import {
  WorkspaceContent,
  WorkspacePane,
} from "@/domains/workspace/workspace-content";
import type { OrganisationSummary } from "@/domains/workspace/account-workspace";
import {
  agentEvidenceHref,
  agentHref,
  evidencePackHref,
} from "@/domains/workspace/workspace-routes";
import { ButtonLink } from "@/lib/ui/button";
import { Callout } from "@/lib/ui/callout";
import { Card } from "@/lib/ui/card";
import { EmptyState } from "@/lib/ui/empty-state";
import { Eyebrow } from "@/lib/ui/eyebrow";
import { PageHeading } from "@/lib/ui/page-heading";
import { StatusPill, type StatusTone } from "@/lib/ui/status-pill";

/**
 * One page of the evidence packages requested for one agent.
 *
 * In-flight and failed packages are listed with the finished ones, because a
 * reader has to be able to tell a request still running, or one that failed,
 * from one that was never made. Nothing is hidden once it has been asked for.
 *
 * A page, because the registry keeps every package ever requested. The cursor
 * is forward-only, so the pager goes deeper or back to the newest — there is
 * no page-before token, and inventing one out of what is on screen would be
 * this layer guessing at an ordering the listing does not promise.
 *
 * No download link appears here. Each row leads to the package, and only that
 * read mints links — asking for the one you want is a narrower exposure than
 * being handed a credential for every package this organisation ever requested.
 */

const TONE: Record<EvidencePack["status"], StatusTone> = {
  queued: "pending",
  generating: "pending",
  completed: "success",
  failed: "refused",
};

/**
 * A draft has no signed document, no chain and no receipts, so a package over it
 * could only ever be empty — and an empty one has to keep meaning "this agent
 * did nothing in this period" rather than "this agent never existed". The
 * registry refuses it; saying so before the form is submitted is the difference
 * between an explanation and a rejection.
 */
function Unissued({
  organisation,
  agent,
}: {
  organisation: OrganisationSummary;
  agent: AgentRecord;
}) {
  return (
    <Card as="section" className="flex flex-col gap-3">
      <Eyebrow>Nothing to evidence yet</Eyebrow>
      <p className="text-sm font-semibold text-ink">
        This agent has not been issued
      </p>
      <p className="text-[11px] leading-4 text-mist">
        A draft has no signed document, no lifecycle chain and no receipts, so a
        package over it would be empty — and an empty package has to keep
        meaning that the agent did nothing in the period.
      </p>
      <ButtonLink
        variant="secondary"
        href={agentHref(organisation.ulid, agent.ain)}
        className="w-fit"
      >
        Back to the record
      </ButtonLink>
    </Card>
  );
}

export function EvidencePackListView({
  agent,
  organisation,
  listing,
  cursor,
}: {
  agent: AgentRecord;
  organisation: OrganisationSummary;
  listing: EvidencePackPage;
  /** The position this page was read from; absent on the newest page. */
  cursor?: string;
}) {
  const isDraft = agent.status === "draft";
  const { packs, nextCursor } = listing;
  const paged = cursor !== undefined;

  return (
    <WorkspaceContent columns="single">
      <WorkspacePane className="mx-auto flex w-[min(100%,64rem)] flex-col gap-5">
        <ButtonLink
          variant="ghost"
          href={agentHref(organisation.ulid, agent.ain)}
          className="w-fit px-0"
        >
          ← {agent.name}
        </ButtonLink>

        <PageHeading eyebrow={organisation.name} lede={agent.role}>
          Evidence packages
        </PageHeading>

        <CopyableAin value={agent.ain} />

        {isDraft ? (
          <Unissued organisation={organisation} agent={agent} />
        ) : (
          <EvidencePackRequestForm
            organisationId={organisation.id}
            ain={agent.ain}
            {...(paged && {
              newestHref: agentEvidenceHref(organisation.ulid, agent.ain),
            })}
          />
        )}

        <Card
          as="section"
          aria-labelledby="packages-title"
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <Eyebrow>Requested</Eyebrow>
            <h2 id="packages-title" className="text-sm font-semibold text-ink">
              Every package asked for, and what became of it
            </h2>
            {/* Only what is on this page. The listing is newest-first, so
                work in flight is on the first page — a reader deep in the
                history is not looking at it, and polling on their behalf
                would spend a tenant's requests on a screen nobody is
                reading. */}
            <EvidencePackWatch watching={inFlightIds(packs)} />
          </div>

          {packs.length === 0 ? (
            <EmptyState icon={FileCheck2}>
              {paged
                ? "Nothing further back than this."
                : isDraft
                  ? "No packages, and none can be assembled until this agent is issued."
                  : "No packages yet. Ask for one above."}
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-2">
              {packs.map((pack) => (
                <li key={pack.packId}>
                  {/* `next/link`, not a bare anchor: an anchor throws the
                      document away and rebuilds the shell with it, which is
                      the whole reason the shell lives in a layout. */}
                  <Link
                    href={evidencePackHref(
                      organisation.ulid,
                      agent.ain,
                      pack.packId,
                    )}
                    className="flex flex-col gap-1.5 rounded-xl border border-line bg-panel px-3.5 py-3 hover:border-frost"
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-sm font-semibold text-ink">
                        {packPeriod(pack)}
                      </span>
                      <StatusPill tone={TONE[pack.status]}>
                        {PACK_STATUS_LABELS[pack.status]}
                      </StatusPill>
                      <time
                        dateTime={pack.createdAt}
                        className="ml-auto text-[11px] text-mist"
                      >
                        Requested {utcMoment(pack.createdAt)}
                      </time>
                    </div>
                    {/* The digest, once there is one. It is what a reader
                        checks the bundle against, so it is on the row rather
                        than a page deeper. */}
                    {pack.contentHash ? (
                      <code className="select-all break-all font-mono text-[10px] leading-4 text-mist-light">
                        {pack.contentHash}
                      </code>
                    ) : (
                      <span className="text-[11px] leading-4 text-mist-light">
                        {isInFlight(pack)
                          ? "Nothing signed yet — the registry is still assembling it."
                          : "This package was not assembled. Ask again for the same period."}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {packs.some((pack) => pack.status === "failed") ? (
            <Callout tone="caution" icon={FileWarning}>
              A package that could not be assembled is kept, not hidden: a
              request that failed has to be tellable from one nobody made.
              Asking again for the same period starts a fresh attempt.
            </Callout>
          ) : null}

          {/* Forward, or back to the top. The registry issues no cursor for
              the page before, so a "previous" link would have to be built
              from what happens to be on screen — which stops being true the
              moment a package is requested while a reader is deep in the
              history. */}
          {nextCursor !== undefined || paged ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
              {nextCursor === undefined ? null : (
                <ButtonLink
                  variant="secondary"
                  href={agentEvidenceHref(
                    organisation.ulid,
                    agent.ain,
                    nextCursor,
                  )}
                >
                  Older packages
                </ButtonLink>
              )}
              {paged ? (
                <ButtonLink
                  variant="ghost"
                  href={agentEvidenceHref(organisation.ulid, agent.ain)}
                  className="ml-auto"
                >
                  Back to newest
                </ButtonLink>
              ) : null}
            </div>
          ) : null}
        </Card>
      </WorkspacePane>
    </WorkspaceContent>
  );
}
