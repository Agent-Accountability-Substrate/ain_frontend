import Link from "next/link";
import { ArrowRight, Bot, ChevronRight } from "lucide-react";

import type {
  OrganisationSummary,
  WorkspaceAgent,
} from "@/domains/workspace/account-workspace";
import {
  agentDraftHref,
  agentHref,
} from "@/domains/workspace/workspace-routes";
import { Card } from "@/lib/ui/card";
import { EmptyState } from "@/lib/ui/empty-state";
import { Eyebrow } from "@/lib/ui/eyebrow";
import { StatusPill } from "@/lib/ui/status-pill";

/**
 * The agents this account can reach.
 *
 * The rows arrive with the workspace state — the dashboard already fetches
 * every organisation's register to produce the count on the metric tile — so
 * this renders what was fetched rather than asking for it again.
 */

/** Whatever the registry says, shown as it says it, tinted where we know it. */
const TONE: Record<string, "success" | "pending" | "attention" | "refused"> = {
  active: "success",
  draft: "pending",
  suspended: "attention",
  revoked: "refused",
};

export function AgentRegister({
  agents,
  organisations,
  href,
  limit,
}: {
  agents: readonly WorkspaceAgent[];
  /**
   * `ulid` is what a row links by: the record's address is the organisation's
   * public identifier, like every other workspace screen.
   */
  organisations: readonly Pick<OrganisationSummary, "id" | "name" | "ulid">[];
  /** Where the full register lives, when this is a summary of it. */
  href?: string;
  limit?: number;
}) {
  const organisationName = new Map(organisations.map((o) => [o.id, o.name]));
  const organisationUlid = new Map(organisations.map((o) => [o.id, o.ulid]));
  // One organisation means the column would repeat one value on every row.
  const showOrganisation = organisations.length > 1;
  const shown = limit === undefined ? agents : agents.slice(0, limit);

  return (
    <Card as="section" aria-labelledby="agent-register-title">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Eyebrow>Registered agents</Eyebrow>
          <h2
            id="agent-register-title"
            className="text-lg font-semibold tracking-[-0.02em] text-ink"
          >
            {agents.length === 0
              ? "No agents yet"
              : `${agents.length} agent${agents.length === 1 ? "" : "s"}`}
          </h2>
        </div>
        {href && agents.length > 0 ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-cobalt hover:underline"
          >
            {shown.length < agents.length ? "See all" : "Open register"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      {agents.length === 0 ? (
        <EmptyState className="mt-5" icon={Bot}>
          An agent registered here gets a permanent identifier and a signed
          document naming who is accountable for it.
        </EmptyState>
      ) : (
        <ul className="mt-5 flex flex-col gap-2.5">
          {shown.map((agent) => {
            const ulid = organisationUlid.get(agent.organisationId);
            const isDraft = agent.status === "draft";
            return (
              <li
                key={agent.ain}
                className="flex flex-col gap-2 rounded-2xl border border-line bg-panel px-4 py-3.5 transition-colors duration-(--dur-hover) focus-within:border-line-strong hover:border-line-strong"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  {/* The name is the link, and the row is not: a whole-row
                      anchor would swallow the AIN below it, which is the one
                      thing on the row somebody needs to select and copy. */}
                  {ulid ? (
                    <Link
                      href={agentHref(ulid, agent.ain)}
                      className="rounded text-sm font-semibold text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                      {agent.name}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-ink">
                      {agent.name}
                    </span>
                  )}
                  {showOrganisation ? (
                    <span className="text-[11px] font-medium text-mist">
                      {organisationName.get(agent.organisationId) ?? "—"}
                    </span>
                  ) : null}
                  <StatusPill tone={TONE[agent.status] ?? "neutral"}>
                    {agent.status}
                  </StatusPill>
                  <span className="ml-auto text-[11px] font-medium text-mist">
                    {agent.riskClass} risk
                  </span>
                </div>
                <p className="text-[11px] leading-4 text-mist">{agent.role}</p>
                {/* `select-all` because the whole string is the only useful
                    selection, and `break-all` because 62 characters wrap. */}
                <code className="select-all break-all font-mono text-[11px] leading-4 text-ink-soft">
                  {agent.ain}
                </code>
                {/* A draft holds a permanent identifier and no signed
                    document. Its only useful next step is finishing it, and
                    without this the row is a dead end that invites minting a
                    second identifier for the same agent. */}
                {isDraft && ulid ? (
                  <Link
                    href={agentDraftHref(ulid, agent.ain)}
                    className="inline-flex w-fit items-center gap-1 rounded text-[11px] font-semibold text-cobalt hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    Continue this draft
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
