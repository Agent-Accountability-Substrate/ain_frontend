import {
  Download,
  FileJson,
  FileText,
  Fingerprint,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { CopyableAin } from "@/domains/agents/copyable-ain";
import { EvidencePackWatch } from "@/domains/agents/evidence-pack-watch";
import {
  isInFlight,
  packPeriod,
  PACK_STATUS_VIEW,
  utcMoment,
  type EvidencePackDetail,
} from "@/domains/agents/evidence-pack";
import type { AgentRecord } from "@/domains/agents/agent-record";
import {
  WorkspaceContent,
  WorkspacePane,
} from "@/domains/workspace/workspace-content";
import type { OrganisationSummary } from "@/domains/workspace/account-workspace";
import { agentEvidenceHref } from "@/domains/workspace/workspace-routes";
import { ButtonLink } from "@/lib/ui/button";
import { Callout } from "@/lib/ui/callout";
import { Card } from "@/lib/ui/card";
import { Eyebrow } from "@/lib/ui/eyebrow";
import { PageHeading } from "@/lib/ui/page-heading";
import { StatusPill } from "@/lib/ui/status-pill";

/**
 * One evidence package, and the two files it produced.
 *
 * The JSON bundle is the evidence: the signature covers it, and it carries every
 * record whole with its own signature so a reviewer verifies the issuer's bytes
 * without reaching this registry at all. The PDF is a rendering of the same
 * records — it prints the digest, the signature and the key id so a reader knows
 * what to go and check, and it is not itself the thing they check.
 *
 * Both links are minted for this render and expire. The signature inside a
 * presigned URL *is* the credential, so the page says how long they last rather
 * than presenting them as addresses that keep working, and nothing here stores
 * or logs one.
 */

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wash-blue text-cobalt">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <Eyebrow>{label}</Eyebrow>
        <div className="select-all break-all font-mono text-[11px] leading-5 text-ink-soft">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * One file, offered as a link out to the store that holds it.
 *
 * A plain anchor, not the router's `Link`. This points at object storage rather
 * than at a route, so there is no client navigation to preserve — and a URL
 * carrying its own credential is not something to hand to a router that
 * prefetches and caches. Saving rather than navigating is the store's doing:
 * the registry signs an attachment disposition under this same filename into
 * each link, because a browser honours `download` only on a same-origin URL
 * and these are not. The attribute stays as the name for the same-origin
 * case, and `noreferrer` keeps this workspace's address — which names the
 * organisation and the agent — out of the request that fetches it.
 */
function FileLink({
  href,
  icon: Icon,
  title,
  detail,
  filename,
  primary,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  detail: string;
  filename: string;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      download={filename}
      rel="noreferrer"
      className={
        primary
          ? "flex items-start gap-3 rounded-xl border border-cobalt bg-wash-blue px-4 py-3.5"
          : "flex items-start gap-3 rounded-xl border border-line bg-panel px-4 py-3.5"
      }
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-cobalt">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          {title}
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <span className="text-[11px] leading-4 text-mist">{detail}</span>
      </span>
    </a>
  );
}

/** Minutes, for an expiry the registry gives in seconds. */
function expiry(seconds: number): string {
  if (seconds < 120) return `${seconds} seconds`;
  return `${Math.round(seconds / 60)} minutes`;
}

export function EvidencePackView({
  agent,
  organisation,
  pack,
}: {
  agent: AgentRecord;
  organisation: OrganisationSummary;
  pack: EvidencePackDetail;
}) {
  const inFlight = isInFlight(pack);

  return (
    <WorkspaceContent columns="single">
      <WorkspacePane className="mx-auto flex w-[min(100%,64rem)] flex-col gap-5">
        <ButtonLink
          variant="ghost"
          href={agentEvidenceHref(organisation.ulid, agent.ain)}
          className="w-fit px-0"
        >
          ← Evidence packages
        </ButtonLink>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <PageHeading eyebrow={agent.name} lede={packPeriod(pack)}>
            Evidence package
          </PageHeading>
          <StatusPill tone={PACK_STATUS_VIEW[pack.status].tone}>
            {PACK_STATUS_VIEW[pack.status].label}
          </StatusPill>
        </div>

        <CopyableAin value={agent.ain} />

        <Card as="section" className="flex flex-col gap-3">
          <Eyebrow>Requested</Eyebrow>
          <p className="text-sm text-ink">{utcMoment(pack.createdAt)}</p>
          <EvidencePackWatch watching={inFlight ? [pack.packId] : []} />
          {inFlight ? (
            <Callout icon={ShieldCheck}>
              The registry is reading this period&rsquo;s records, verifying the
              chains and the signatures in them, and signing the result. Nothing
              is downloadable until it has.
            </Callout>
          ) : null}
          {pack.status === "failed" ? (
            <Callout tone="danger" alert>
              This package could not be assembled. Nothing has been lost — the
              records it would have covered are untouched, and asking again for
              the same period starts a fresh attempt.
            </Callout>
          ) : null}
        </Card>

        {pack.status === "completed" ? (
          <>
            <Card
              as="section"
              aria-labelledby="files-title"
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <Eyebrow>Download</Eyebrow>
                <h2 id="files-title" className="text-sm font-semibold text-ink">
                  Two files, and only one of them is the evidence
                </h2>
              </div>

              {pack.downloadUrl && pack.pdfDownloadUrl ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FileLink
                      primary
                      href={pack.downloadUrl}
                      icon={FileJson}
                      title="Signed bundle (JSON)"
                      detail="What the signature covers, and what a verifier checks."
                      filename={`evidence-package-${pack.packId}.json`}
                    />
                    <FileLink
                      href={pack.pdfDownloadUrl}
                      icon={FileText}
                      title="Rendering (PDF)"
                      detail="The same records, for a person to read."
                      filename={`evidence-package-${pack.packId}.pdf`}
                    />
                  </div>
                  {/* The expiry is the only thing between a link that leaks and
                      the package behind it, so it is said plainly rather than
                      discovered when a shared link stops working. */}
                  <p className="text-[11px] leading-4 text-mist">
                    {pack.downloadExpiresIn === undefined
                      ? "These links are short-lived. Reload this page for fresh ones."
                      : `These links were made for this page and stop working in about ${expiry(pack.downloadExpiresIn)}. Reload the page for fresh ones. Send the file, never the link — the link is the credential.`}
                  </p>
                </>
              ) : (
                <Callout tone="caution">
                  This deployment&rsquo;s registry cannot hand out files. The
                  package exists and is signed — the digest and signature below
                  are its record — but downloading it needs object-storage
                  access this environment has not been given.
                </Callout>
              )}
            </Card>

            <Card
              as="section"
              aria-labelledby="manifest-title"
              className="flex flex-col gap-5"
            >
              <div className="flex flex-col gap-1">
                <Eyebrow>Manifest</Eyebrow>
                <h2
                  id="manifest-title"
                  className="text-sm font-semibold text-ink"
                >
                  How to check this package without trusting this screen
                </h2>
                <p className="mt-1 text-[11px] leading-4 text-mist">
                  Recompute the bundle&rsquo;s canonical hash and compare it
                  with the content hash, then verify the export signature
                  against the published key for this key id. Every record inside
                  carries its own signature and verifies on its own.
                </p>
              </div>
              <div className="grid gap-5">
                {pack.contentHash ? (
                  <Field
                    icon={Fingerprint}
                    label="Content hash (SHA-256 of the canonical bundle)"
                  >
                    {pack.contentHash}
                  </Field>
                ) : null}
                {pack.exportSignature ? (
                  <Field
                    icon={ShieldCheck}
                    label="Export signature (detached JWS)"
                  >
                    {pack.exportSignature}
                  </Field>
                ) : null}
                {pack.kid ? (
                  <Field icon={KeyRound} label="Signed with key">
                    {pack.kid}
                  </Field>
                ) : null}
              </div>
            </Card>
          </>
        ) : null}
      </WorkspacePane>
    </WorkspaceContent>
  );
}
