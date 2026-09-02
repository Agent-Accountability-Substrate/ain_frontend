import {
  Bot,
  Check,
  ChevronDown,
  FileCheck2,
  Fingerprint,
  KeyRound,
  LayoutDashboard,
  Network,
  ReceiptText,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  WorkspaceContent,
  WorkspacePane,
  WorkspaceShell,
} from "@/domains/workspace/workspace-shell";
import { userMenuItems } from "@/domains/workspace/workspace-navigation";
import { Eyebrow } from "@/lib/ui/eyebrow";
import { StatusPill } from "@/lib/ui/status-pill";
import { cn } from "@/lib/utils";

/**
 * An illustrative agent record.
 *
 * Every value on this screen is a literal. It represents no organisation and no
 * agent, which the page says twice — in the pill above the heading and on the
 * card that links here. It exists to show the shape of a record the product
 * cannot yet render for real, and it should be deleted the day it can.
 */

const PERMANENT_AIN =
  "did:ain:gb:01ARZ3NDEKTSV4RRFFQ69G5FAV:01BX5ZZKBKACTAV9WEVGEMMVRZ";

const VERIFICATION_CHECKS = [
  "Identity record authentic",
  "Lifecycle status active",
  "Signing key acceptable",
  "Proposed action within declared scope",
] as const;

const RECORD_SECTIONS = [
  { label: "Agent Overview", href: "#overview", active: true },
  { label: "Identity and AIN Document", href: "#agent-map" },
  { label: "Authorised Scope", href: "#authorised-scope" },
  { label: "Accountable Owner", href: "#accountable-owner" },
  { label: "Version History", href: "#version-history" },
  { label: "Lifecycle History", href: "#lifecycle-history" },
  { label: "Action Receipts", href: "#action-receipts" },
  { label: "Evidence Packs", href: "#evidence-packs" },
] as const;

/** The four claims arranged around the passport. */
const SIGNALS = [
  {
    icon: Fingerprint,
    label: "Identity",
    value: "Authentic",
    at: "left-[4%] top-[10%]",
  },
  {
    icon: UserRound,
    label: "Accountability",
    value: "Owner bound",
    at: "right-[4%] top-[10%]",
  },
  {
    icon: KeyRound,
    label: "Signing key",
    value: "Acceptable",
    at: "bottom-[10%] left-[4%]",
  },
  {
    icon: Network,
    label: "Declared scope",
    value: "Action aligned",
    at: "bottom-[10%] right-[4%]",
  },
] as const;

const FIELD_LABEL =
  "m-0 text-xs font-bold uppercase leading-[1.4] tracking-[0.14em] text-mist";

function RailCard({
  icon: Icon,
  eyebrow,
  value,
  tone,
  children,
  id,
}: {
  icon: LucideIcon;
  eyebrow: string;
  value: string;
  tone: "green" | "blue";
  children?: React.ReactNode;
  id?: string;
}) {
  return (
    <article
      id={id}
      className="rounded-2xl border border-[#dfe4ec] bg-white/95 p-4 shadow-[0_18px_44px_-38px_rgba(9,17,38,0.6)]"
    >
      <div className="flex items-center justify-between">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-md",
            tone === "green"
              ? "bg-success-wash text-success-strong"
              : "bg-wash-blue text-cobalt",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      {children}
    </article>
  );
}

export function AgentDemoView({ email }: { email: string | null | undefined }) {
  return (
    <WorkspaceShell
      assuranceStatus="not_started"
      currentPath="/dashboard/agent-demo"
      email={email}
      navigationItems={userMenuItems}
      navigationLabel="Account sections"
      organisations={[
        { id: "illustrative-workspace", name: "Illustrative workspace" },
      ]}
      selectedOrganisationId="illustrative-workspace"
      showOrganisationSwitcher
      signedInAs="Illustrative workspace"
      workspaceLabel="Illustrative agent accountability dashboard"
    >
      <WorkspaceContent
        columns="single"
        className="items-stretch xl:grid-cols-[17.5rem_minmax(28rem,1fr)_22rem]"
      >
        <WorkspacePane
          as="aside"
          id="overview"
          aria-labelledby="selected-agent-title"
          className="flex min-w-0 flex-col gap-3 max-lg:grid max-lg:grid-cols-2 max-sm:flex"
        >
          <nav
            aria-label="Agent record sections"
            className="rounded-[1.2rem] border border-[#dfe4ec] bg-white/95 p-3.5 shadow-[0_18px_44px_-38px_rgba(9,17,38,0.6)] max-lg:col-span-full"
          >
            <Eyebrow>Agent record</Eyebrow>
            <ul className="mt-2.5 flex flex-col gap-0.5">
              {RECORD_SECTIONS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    aria-current={
                      "active" in item && item.active ? "location" : undefined
                    }
                    className="block rounded-[0.58rem] px-2 py-2 text-[0.72rem] font-semibold leading-[1.35] text-mist hover:bg-wash-blue hover:text-cobalt aria-[current]:bg-wash-blue aria-[current]:text-cobalt"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="rounded-[1.25rem] border border-[#dfe4ec] bg-white/95 p-4.5 shadow-[0_18px_44px_-38px_rgba(9,17,38,0.6)] max-lg:col-span-full">
            <div className="flex items-center justify-between gap-3">
              <Eyebrow>Selected agent</Eyebrow>
              <StatusPill tone="success">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-current"
                />
                Active
              </StatusPill>
            </div>

            <div className="mt-5 flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ink text-white">
                <Bot className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h1
                  id="selected-agent-title"
                  className="text-lg font-semibold leading-6 tracking-[-0.025em] text-ink"
                >
                  Payments Operations Agent
                </h1>
                <p className="mt-1 text-xs leading-5 text-mist">
                  Owned by Payments Operations
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-md border border-line bg-band p-3">
              <p className={FIELD_LABEL}>Permanent AIN</p>
              <code
                title={PERMANENT_AIN}
                className="mt-1.5 block overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[11px] font-semibold text-ink-soft"
              >
                did:ain:gb:01ARZ3N…EMMVRZ
              </code>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3">
              <div id="accountable-owner">
                <dt className={FIELD_LABEL}>Owner</dt>
                <dd className="mt-1 text-xs font-semibold text-ink-soft">
                  Payments Operations
                </dd>
              </div>
              <div id="version-history">
                <dt className={FIELD_LABEL}>Version</dt>
                <dd className="mt-1 text-xs font-semibold text-ink-soft">v3</dd>
              </div>
            </dl>

            <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
              <div>
                <p className={FIELD_LABEL}>Last verified</p>
                <p className="mt-1 text-xs font-semibold text-ink-soft">
                  23 Jul 2026, 11:42 BST
                </p>
              </div>
              <ShieldCheck
                className="h-5 w-5 text-success-strong"
                aria-hidden="true"
              />
            </div>
          </div>

          <RailCard
            id="lifecycle-history"
            icon={FileCheck2}
            eyebrow="Lifecycle status"
            value="Active"
            tone="green"
          >
            <p className="mt-3 text-xs leading-5 text-mist">
              Registration and accountable ownership are current.
            </p>
          </RailCard>

          <RailCard
            icon={KeyRound}
            eyebrow="Signing posture"
            value="EdDSA"
            tone="blue"
          >
            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
              <span className="text-mist">Key ID</span>
              <code className="font-mono font-semibold text-ink-soft">
                key-demo-7F3A91C2
              </code>
            </div>
          </RailCard>
        </WorkspacePane>

        <WorkspacePane
          as="section"
          id="agent-map"
          aria-labelledby="console-title"
          className="min-w-0 overflow-hidden rounded-[1.35rem] border border-[#dfe4ec] bg-white/95 shadow-[0_18px_44px_-38px_rgba(9,17,38,0.6)]"
        >
          <div className="flex items-start justify-between gap-4 px-5 pt-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-frost bg-wash-blue px-2.5 py-1.5 text-[11px] font-extrabold leading-none tracking-[0.03em] text-cobalt">
                  Illustrative workspace data
                </span>
                <span className="text-[11px] font-semibold text-mist">
                  Record state · 11:42 BST
                </span>
              </div>
              <h2
                id="console-title"
                className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-ink"
              >
                Agent accountability console
              </h2>
              <p className="mt-1 text-sm text-mist">
                Identity, authority and evidence linked in one record view.
              </p>
            </div>
            <span className="hidden items-center gap-2 rounded-md border border-line-strong bg-white px-3 py-2 text-xs font-semibold text-ink-soft sm:flex">
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              Record view
            </span>
          </div>

          <div className="topology-field relative mx-3 mt-2 min-h-[34rem] overflow-hidden rounded-[1.2rem] max-sm:m-3 max-sm:flex max-sm:min-h-auto max-sm:flex-col max-sm:gap-[0.65rem] max-sm:p-3">
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 aspect-square w-[min(64%,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(77,111,173,0.18)] max-sm:hidden"
            />
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 aspect-square w-[min(88%,33rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[rgba(77,111,173,0.18)] max-sm:hidden"
            />
            <span
              aria-hidden="true"
              className="absolute left-[13%] top-1/2 z-[1] h-px w-[28%] rotate-12 bg-[linear-gradient(90deg,transparent,rgba(77,111,173,0.48),transparent)] max-sm:hidden"
            />
            <span
              aria-hidden="true"
              className="absolute right-[13%] top-1/2 z-[1] h-px w-[28%] -rotate-12 bg-[linear-gradient(90deg,transparent,rgba(77,111,173,0.48),transparent)] max-sm:hidden"
            />

            {SIGNALS.map((signal) => {
              const Icon = signal.icon;
              return (
                <div
                  key={signal.label}
                  className={cn(
                    "absolute z-[6] flex w-39 items-center gap-2.5 rounded-[0.95rem] border border-[#dbe2ed] bg-white/90 p-2.5 shadow-[0_18px_36px_-28px_rgba(9,17,38,0.6)] backdrop-blur-[10px]",
                    "max-sm:relative max-sm:inset-auto max-sm:w-full max-sm:backdrop-blur-none",
                    signal.at,
                  )}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.65rem] bg-wash-blue text-cobalt">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="m-0 text-[0.55rem] font-bold uppercase leading-[1.25] tracking-[0.08em] text-mist">
                      {signal.label}
                    </p>
                    <strong className="mt-0.5 block text-[0.68rem] font-bold leading-[1.25] text-ink">
                      {signal.value}
                    </strong>
                  </div>
                </div>
              );
            })}

            <article className="passport-hub absolute left-1/2 top-1/2 z-[5] min-h-70 w-[min(14.5rem,54%)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[1.45rem] border border-white/15 p-4.5 max-sm:relative max-sm:inset-auto max-sm:order-first max-sm:min-h-66 max-sm:w-full max-sm:translate-x-0 max-sm:translate-y-0">
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-white">
                  <Bot className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(116,214,162,0.32)] bg-[rgba(15,122,82,0.16)] px-2 py-1.5 text-[11px] font-extrabold leading-none text-[#8be4b3]">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-current"
                  />
                  Active
                </span>
              </div>
              <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-mid">
                Registered agent
              </p>
              <h3 className="mt-2 text-xl font-semibold leading-6 tracking-[-0.03em] text-white">
                Payments Operations Agent
              </h3>
              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-sky-mid">
                  Permanent AIN
                </p>
                <code className="mt-1.5 block overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[10px] font-semibold text-line">
                  01AR Z3ND EKTS V4RR
                </code>
              </div>
            </article>
          </div>

          <div
            id="action-receipts"
            className="mx-[1.35rem] mb-5 flex items-center justify-between gap-4 border-t border-line pt-4 max-sm:mx-4 max-sm:mb-[1.1rem] max-sm:flex-col max-sm:items-start"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-wash-blue text-cobalt">
                <ReceiptText className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <Eyebrow>Receipt chain</Eyebrow>
                <p className="mt-1 truncate text-xs font-semibold text-ink-soft">
                  Latest linked action evidence
                </p>
              </div>
            </div>
            <ol
              aria-label="Latest receipt sequences"
              className="flex shrink-0 items-center max-sm:w-full max-sm:justify-between"
            >
              {[41, 42, 43].map((sequence, index) => (
                <li
                  key={sequence}
                  className="relative flex min-w-26 items-center gap-2 after:mx-1.5 after:h-px after:w-5 after:bg-[#cfd6e2] last:after:hidden max-sm:min-w-0 max-sm:after:hidden"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-frost bg-wash-blue text-[11px] font-extrabold text-cobalt">
                    {sequence}
                  </span>
                  <div className="max-sm:sr-only">
                    <p className="m-0 text-xs font-bold leading-[1.2] text-ink-soft">
                      Sequence {sequence}
                    </p>
                    <strong className="mt-0.5 block text-xs font-semibold leading-[1.2] text-mist">
                      {index === 2 ? "Latest" : "Linked"}
                    </strong>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </WorkspacePane>

        <WorkspacePane
          as="aside"
          id="verification"
          aria-labelledby="verification-title"
          className="min-w-0 overflow-hidden rounded-[1.25rem] border border-[#dfe4ec] bg-white/95 shadow-[0_18px_44px_-38px_rgba(9,17,38,0.6)]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warm-wash text-warm-700">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <Eyebrow>Detailed verification</Eyebrow>
                <h2
                  id="verification-title"
                  className="mt-0.5 text-sm font-semibold text-ink"
                >
                  Proposed action assessment
                </h2>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-mist" aria-hidden="true" />
          </header>

          <div className="p-5">
            <div className="rounded-lg border border-line bg-band p-4">
              <div className="flex items-center justify-between gap-3">
                <p className={FIELD_LABEL}>Proposed action</p>
                <StatusPill tone="success">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-current"
                  />
                  Within scope
                </StatusPill>
              </div>
              <code className="mt-3 block font-mono text-sm font-semibold text-ink">
                payments.initiate
              </code>
              <p className="mt-2 text-xs leading-5 text-mist">
                Evaluated against document version v3.
              </p>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
                  Record checks
                </h3>
                <span className="text-[11px] font-semibold text-success-strong">
                  Complete
                </span>
              </div>
              <ul className="mt-3 space-y-2.5">
                {VERIFICATION_CHECKS.map((check) => (
                  <li
                    key={check}
                    className="flex items-start gap-3 rounded-md border border-line bg-white px-3 py-3"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-wash text-success-strong">
                      <Check className="h-3 w-3" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-semibold leading-5 text-ink-soft">
                      {check}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              id="authorised-scope"
              className="mt-6 border-t border-line pt-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
                  Declared scope
                </h3>
                <span className="text-[11px] text-mist">2 entries</span>
              </div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {["payments.initiate", "customer_comms.send"].map((entry) => (
                  <li
                    key={entry}
                    className="rounded-[0.55rem] border border-frost bg-[#f6f8fc] px-2 py-1.5 font-mono text-[0.61rem] font-bold text-cobalt"
                  >
                    {entry}
                  </li>
                ))}
              </ul>
            </div>

            <div
              id="evidence-packs"
              className="mt-6 rounded-lg bg-ink p-4 text-white"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ReceiptText
                    className="h-4 w-4 text-azure"
                    aria-hidden="true"
                  />
                  <p className="text-xs font-semibold">Latest receipt</p>
                </div>
                <span className="text-[10px] font-semibold text-sky-soft">
                  Sequence 43
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                <div>
                  <dt className="text-[9px] uppercase tracking-[0.16em] text-sky-mid">
                    Signature
                  </dt>
                  <dd className="mt-1 text-xs font-semibold">EdDSA</dd>
                </div>
                <div>
                  <dt className="text-[9px] uppercase tracking-[0.16em] text-sky-mid">
                    Document
                  </dt>
                  <dd className="mt-1 text-xs font-semibold">v3</dd>
                </div>
              </dl>
            </div>
          </div>
        </WorkspacePane>
      </WorkspaceContent>
    </WorkspaceShell>
  );
}
