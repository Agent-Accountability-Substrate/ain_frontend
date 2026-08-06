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

import { WorkspaceShell } from "@/components/workspace-shell";
import { userMenuItems } from "@/lib/workspace-navigation";

const permanentAin =
  "did:ain:gb:01ARZ3NDEKTSV4RRFFQ69G5FAV:01BX5ZZKBKACTAV9WEVGEMMVRZ";

const verificationChecks = [
  "Identity record authentic",
  "Lifecycle status active",
  "Signing key acceptable",
  "Proposed action within declared scope",
] as const;

const agentRecordItems = [
  { label: "Agent Overview", href: "#overview", active: true },
  { label: "Identity and AIN Document", href: "#agent-map" },
  { label: "Authorised Scope", href: "#authorised-scope" },
  { label: "Accountable Owner", href: "#accountable-owner" },
  { label: "Version History", href: "#version-history" },
  { label: "Lifecycle History", href: "#lifecycle-history" },
  { label: "Action Receipts", href: "#action-receipts" },
  { label: "Evidence Packs", href: "#evidence-packs" },
  { label: "Public Resolver Link", href: "/#download" },
] as const;

export function AgentDemoView({
  email,
}: {
  email: string | null | undefined;
}) {
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
        <div className="dashboard-workspace">
          <aside
            id="overview"
            aria-labelledby="selected-agent-title"
            className="dashboard-left-rail"
          >
            <nav
              className="agent-context-navigation"
              aria-label="Agent record sections"
            >
              <p className="dashboard-eyebrow">Agent record</p>
              <ul>
                {agentRecordItems.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      aria-current={
                        "active" in item && item.active
                          ? "location"
                          : undefined
                      }
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="dashboard-agent-card">
              <div className="flex items-center justify-between gap-3">
                <p className="dashboard-eyebrow">Selected agent</p>
                <span className="dashboard-status-pill">
                  <span aria-hidden="true" />
                  Active
                </span>
              </div>

              <div className="mt-5 flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#091126] text-white">
                  <Bot className="h-6 w-6" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h1
                    id="selected-agent-title"
                    className="text-lg font-semibold leading-6 tracking-[-0.025em] text-[#091126]"
                  >
                    Payments Operations Agent
                  </h1>
                  <p className="mt-1 text-xs leading-5 text-[#667085]">
                    Owned by Payments Operations
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-[#E1E6EF] bg-[#F8FAFD] p-3">
                <p className="dashboard-field-label">Permanent AIN</p>
                <code
                  title={permanentAin}
                  className="mt-1.5 block overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[11px] font-semibold text-[#344054]"
                >
                  did:ain:gb:01ARZ3N…EMMVRZ
                </code>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3">
                <div id="accountable-owner">
                  <dt className="dashboard-field-label">Owner</dt>
                  <dd className="mt-1 text-xs font-semibold text-[#344054]">
                    Payments Operations
                  </dd>
                </div>
                <div id="version-history">
                  <dt className="dashboard-field-label">Version</dt>
                  <dd className="mt-1 text-xs font-semibold text-[#344054]">
                    v3
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex items-center justify-between border-t border-[#E4E8F0] pt-4">
                <div>
                  <p className="dashboard-field-label">Last verified</p>
                  <p className="mt-1 text-xs font-semibold text-[#344054]">
                    23 Jul 2026, 11:42 BST
                  </p>
                </div>
                <ShieldCheck
                  className="h-5 w-5 text-[#0F7A52]"
                  aria-hidden="true"
                />
              </div>
            </div>

            <article
              id="lifecycle-history"
              className="dashboard-rail-card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="dashboard-eyebrow">Lifecycle status</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-[#091126]">
                    Active
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF7F0] text-[#0F7A52]">
                  <FileCheck2 className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-[#667085]">
                Registration and accountable ownership are current.
              </p>
            </article>

            <article className="dashboard-rail-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="dashboard-eyebrow">Signing posture</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-[#091126]">
                    EdDSA
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF3FF] text-[#1D4ED8]">
                  <KeyRound className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                <span className="text-[#667085]">Key ID</span>
                <code className="font-mono font-semibold text-[#344054]">
                  key-demo-7F3A91C2
                </code>
              </div>
            </article>
          </aside>

          <section
            id="agent-map"
            aria-labelledby="console-title"
            className="dashboard-agent-map"
          >
            <div className="dashboard-map-header">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="dashboard-demo-pill">
                    Illustrative workspace data
                  </span>
                  <span className="text-[11px] font-semibold text-[#667085]">
                    Record state · 11:42 BST
                  </span>
                </div>
                <h2
                  id="console-title"
                  className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#091126]"
                >
                  Agent accountability console
                </h2>
                <p className="mt-1 text-sm text-[#667085]">
                  Identity, authority and evidence linked in one record view.
                </p>
              </div>
              <span className="hidden items-center gap-2 rounded-xl border border-[#D8DDE8] bg-white px-3 py-2 text-xs font-semibold text-[#344054] sm:flex">
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                Record view
              </span>
            </div>

            <div className="dashboard-topology">
              <span
                className="dashboard-topology-ring dashboard-topology-ring-one"
                aria-hidden="true"
              />
              <span
                className="dashboard-topology-ring dashboard-topology-ring-two"
                aria-hidden="true"
              />
              <span
                className="dashboard-topology-line dashboard-topology-line-left"
                aria-hidden="true"
              />
              <span
                className="dashboard-topology-line dashboard-topology-line-right"
                aria-hidden="true"
              />

              <div className="dashboard-signal dashboard-signal-identity">
                <span className="dashboard-signal-icon">
                  <Fingerprint className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p>Identity</p>
                  <strong>Authentic</strong>
                </div>
              </div>

              <div className="dashboard-signal dashboard-signal-owner">
                <span className="dashboard-signal-icon">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p>Accountability</p>
                  <strong>Owner bound</strong>
                </div>
              </div>

              <div className="dashboard-signal dashboard-signal-key">
                <span className="dashboard-signal-icon">
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p>Signing key</p>
                  <strong>Acceptable</strong>
                </div>
              </div>

              <div className="dashboard-signal dashboard-signal-scope">
                <span className="dashboard-signal-icon">
                  <Network className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p>Declared scope</p>
                  <strong>Action aligned</strong>
                </div>
              </div>

              <article className="dashboard-passport-hub">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                    <Bot className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="dashboard-hub-status">
                    <span aria-hidden="true" />
                    Active
                  </span>
                </div>
                <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9DB2DB]">
                  Registered agent
                </p>
                <h3 className="mt-2 text-xl font-semibold leading-6 tracking-[-0.03em] text-white">
                  Payments Operations Agent
                </h3>
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8FA8D5]">
                    Permanent AIN
                  </p>
                  <code className="mt-1.5 block overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[10px] font-semibold text-[#E6ECF8]">
                    01AR Z3ND EKTS V4RR
                  </code>
                </div>
              </article>
            </div>

            <div id="action-receipts" className="dashboard-receipt-rail">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF3FF] text-[#1D4ED8]">
                  <ReceiptText className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="dashboard-eyebrow">Receipt chain</p>
                  <p className="mt-1 truncate text-xs font-semibold text-[#344054]">
                    Latest linked action evidence
                  </p>
                </div>
              </div>
              <ol aria-label="Latest receipt sequences">
                {[41, 42, 43].map((sequence, index) => (
                  <li key={sequence}>
                    <span>{sequence}</span>
                    <div>
                      <p>Sequence {sequence}</p>
                      <strong>{index === 2 ? "Latest" : "Linked"}</strong>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <aside
            id="verification"
            aria-labelledby="verification-title"
            className="dashboard-verification-panel"
          >
            <header className="flex items-center justify-between gap-3 border-b border-[#E1E6EF] px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF0E9] text-[#B54708]">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="dashboard-eyebrow">Detailed verification</p>
                  <h2
                    id="verification-title"
                    className="mt-0.5 text-sm font-semibold text-[#091126]"
                  >
                    Proposed action assessment
                  </h2>
                </div>
              </div>
              <ChevronDown
                className="h-4 w-4 text-[#667085]"
                aria-hidden="true"
              />
            </header>

            <div className="p-5">
              <div className="rounded-2xl border border-[#E1E6EF] bg-[#F8FAFD] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="dashboard-field-label">Proposed action</p>
                  <span className="dashboard-status-pill">
                    <span aria-hidden="true" />
                    Within scope
                  </span>
                </div>
                <code className="mt-3 block font-mono text-sm font-semibold text-[#091126]">
                  payments.initiate
                </code>
                <p className="mt-2 text-xs leading-5 text-[#667085]">
                  Evaluated against document version v3.
                </p>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#526078]">
                    Record checks
                  </h3>
                  <span className="text-[11px] font-semibold text-[#0F7A52]">
                    Complete
                  </span>
                </div>
                <ul className="mt-3 space-y-2.5">
                  {verificationChecks.map((check) => (
                    <li
                      key={check}
                      className="flex items-start gap-3 rounded-xl border border-[#E5E9F1] bg-white px-3 py-3"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EAF7F0] text-[#0F7A52]">
                        <Check className="h-3 w-3" aria-hidden="true" />
                      </span>
                      <span className="text-xs font-semibold leading-5 text-[#344054]">
                        {check}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                id="authorised-scope"
                className="mt-6 border-t border-[#E1E6EF] pt-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#526078]">
                    Declared scope
                  </h3>
                  <span className="text-[11px] text-[#667085]">2 entries</span>
                </div>
                <ul className="mt-3 flex flex-wrap gap-2">
                  <li className="dashboard-scope-chip">payments.initiate</li>
                  <li className="dashboard-scope-chip">
                    customer_comms.send
                  </li>
                </ul>
              </div>

              <div
                id="evidence-packs"
                className="mt-6 rounded-2xl bg-[#091126] p-4 text-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ReceiptText
                      className="h-4 w-4 text-[#8FB1FF]"
                      aria-hidden="true"
                    />
                    <p className="text-xs font-semibold">Latest receipt</p>
                  </div>
                  <span className="text-[10px] font-semibold text-[#AFC0E2]">
                    Sequence 43
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                  <div>
                    <dt className="text-[9px] uppercase tracking-[0.16em] text-[#8FA8D5]">
                      Signature
                    </dt>
                    <dd className="mt-1 text-xs font-semibold">EdDSA</dd>
                  </div>
                  <div>
                    <dt className="text-[9px] uppercase tracking-[0.16em] text-[#8FA8D5]">
                      Document
                    </dt>
                    <dd className="mt-1 text-xs font-semibold">v3</dd>
                  </div>
                </dl>
              </div>
            </div>
          </aside>
        </div>

    </WorkspaceShell>
  );
}
