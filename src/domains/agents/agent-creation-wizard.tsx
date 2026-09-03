"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { useActionState, useState } from "react";
import type { ReactNode } from "react";

import { CopyableAin } from "@/domains/agents/copyable-ain";
import {
  ScopeConstraintsField,
  type ConstraintRow,
} from "@/domains/agents/scope-constraints-field";
import {
  patchAgentAction,
  registerAgentAction,
  submitAgentAction,
  type PatchAgentState,
  type RegisterAgentState,
  type SubmitAgentState,
} from "@/domains/agents/agent-actions";
import {
  ORGANISATION_SETTINGS,
  orgHref,
  WORKSPACE,
} from "@/domains/workspace/workspace-routes";
import { Callout } from "@/lib/ui/callout";
import { Button, ButtonLink } from "@/lib/ui/button";
import { Eyebrow } from "@/lib/ui/eyebrow";
import { SelectField } from "@/lib/ui/select-field";
import { TextField } from "@/lib/ui/text-field";

/**
 * The three states the registry actually moves an agent through.
 *
 * Not one form posted at the end: `POST` mints the AIN and opens a draft,
 * `PATCH` attaches scope and named accountability, and `submit` signs the
 * document and appends the genesis lifecycle events. Each step below is one of
 * those calls, so a draft that exists on the server is a draft the wizard can
 * show rather than a local object hoping to become real.
 *
 * Both forms are controlled because React resets a form once its action
 * resolves, so a refusal would hand back the reason with the fields already
 * wiped — six of them on the declaration step, including the SMCR reference.
 */

const RISK_LEVELS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

/** The panel every "you cannot do this yet" state shares. */
function Blocked({
  icon: Icon,
  eyebrow,
  title,
  children,
  action,
}: {
  icon: typeof Bot;
  eyebrow: string;
  title: string;
  children: ReactNode;
  action: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wash-blue text-cobalt">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-2">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">
            {title}
          </h2>
          <p className="text-xs leading-5 text-mist">{children}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">{action}</div>
    </section>
  );
}

function Refusal({ message }: { message: string }) {
  return (
    <Callout tone="danger" alert>
      {message}
    </Callout>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <Callout>{children}</Callout>;
}

export function AgentCreationWizard({
  organisationId,
  organisationName,
  organisationUlid,
  organisationVerified,
  draft,
  unresolvedDraft,
  onBack,
}: {
  /** `null` when no organisation is selected — the wizard then refuses to run. */
  organisationId: string | null;
  organisationName: string | null;
  organisationUlid: string | null;
  organisationVerified: boolean;
  /**
   * A draft the registry already holds, resolved by the page.
   *
   * Present when the wizard was opened to continue one. Its AIN is permanent
   * and already minted, so the identity step is behind us — starting blank
   * would mint a second identifier for the same agent, and an AIN is never
   * recycled.
   */
  draft?: { ain: string; name: string } | null;
  /**
   * An identifier a resume link named that resolved to no draft here. The
   * wizard must not fall through to the identity step for it: that step mints
   * a permanent identifier, and the agent named may already hold one.
   */
  unresolvedDraft?: string | null;
  onBack?: () => void;
}) {
  // Every way out of the wizard leads back to the register it was opened
  // from: it is where a draft will be waiting and where the new agent lands.
  const registerHref = organisationUlid
    ? orgHref(organisationUlid, "agents")
    : WORKSPACE;
  const [registered, registerAction, registering] = useActionState<
    RegisterAgentState,
    FormData
  >(registerAgentAction, { status: "idle" });
  const [declared, patchAction, declaring] = useActionState<
    PatchAgentState,
    FormData
  >(patchAgentAction, { status: "idle" });
  const [issued, submitAction, submitting] = useActionState<
    SubmitAgentState,
    FormData
  >(submitAgentAction, { status: "idle" });
  const [identity, setIdentity] = useState({
    name: "",
    role: "",
    riskClass: "high",
  });
  const [constraints, setConstraints] = useState<readonly ConstraintRow[]>([]);
  const [declaration, setDeclaration] = useState({
    actionClasses: "",
    riskLevel: "high",
    regulatoryMappings: "",
    roleTitle: "",
    responsibilityArea: "",
    regulatoryIdentifier: "",
  });

  // An agent record is always owned by an organisation, so with none selected
  // there is no form to submit — rendering one would stage a record against an
  // organisation that does not exist.
  if (organisationId === null || organisationName === null) {
    return (
      <Blocked
        icon={Bot}
        eyebrow="Agent workspace"
        title="Choose an organisation to continue"
        action={
          <ButtonLink href={ORGANISATION_SETTINGS}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Choose organisation
          </ButtonLink>
        }
      >
        Agent records belong to an organisation. Select one and this step will
        open.
      </Blocked>
    );
  }

  // The registry refuses agents in an unverified organisation, so this says so
  // here rather than letting someone fill three steps and collect a 403.
  if (!organisationVerified) {
    return (
      <Blocked
        icon={ShieldCheck}
        eyebrow="Awaiting verification"
        title={`${organisationName} is not verified yet`}
        action={
          <ButtonLink href={registerHref}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to the register
          </ButtonLink>
        }
      >
        We confirm the company registration and your authority to act for it
        before any agent can be registered. This step opens as soon as that is
        done.
      </Blocked>
    );
  }

  // A resume link whose draft cannot be found says so and stops. The register
  // is where the draft is waiting if it exists; a fresh start is offered as a
  // separate, deliberate act rather than as the silent default.
  if (unresolvedDraft) {
    return (
      <Blocked
        icon={Bot}
        eyebrow="Draft not found"
        title="This draft could not be resumed"
        action={
          <>
            <ButtonLink href={registerHref}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Open the register
            </ButtonLink>
            <ButtonLink
              variant="secondary"
              href={
                organisationUlid
                  ? orgHref(organisationUlid, "agents/new")
                  : WORKSPACE
              }
            >
              Start a new agent
            </ButtonLink>
          </>
        }
      >
        No draft with the identifier{" "}
        <code className="break-all font-mono">{unresolvedDraft}</code> is
        waiting in {organisationName}. It may already be issued, in which case
        its scope changes by a new signed version rather than here. Nothing has
        been minted.
      </Blocked>
    );
  }

  if (issued.status === "done") {
    return (
      <section className="flex flex-col items-start gap-4 rounded-2xl border border-success-soft bg-success-wash/40 p-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-success-strong">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <Eyebrow>Issued · document v{issued.documentVersion}</Eyebrow>
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink">
          The agent is registered and signed
        </h2>
        <p className="text-xs leading-5 text-mist">
          Its AIN Document is signed and its lifecycle chain has begun. The
          identifier below is permanent: it is never reissued or recycled.
        </p>
        <CopyableAin value={issued.ain} />
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={registerHref}>Back to the register</ButtonLink>
          <ButtonLink variant="primary" href={issued.resolverUrl}>
            Resolver URL
          </ButtonLink>
        </div>
      </section>
    );
  }

  const identityErrors = registered.status === "error" ? registered.errors : {};
  const declarationErrors = declared.status === "error" ? declared.errors : {};
  // A resumed draft is already past step 1 — its identifier exists and is
  // permanent, so the wizard opens on the declaration rather than re-minting.
  const ain =
    draft?.ain ?? (registered.status === "done" ? registered.ain : null);
  const declarationAttached = declared.status === "done";
  // A bound must name a declared class, so the selector reads what has been
  // typed above rather than a list of its own.
  const declaredClasses = [
    ...new Set(
      declaration.actionClasses
        .split(/[,\n]/)
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  ].sort();
  const step = ain === null ? 1 : declarationAttached ? 3 : 2;

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wash-blue text-cobalt">
          <Bot className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-2">
          <Eyebrow>Agent workspace</Eyebrow>
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">
            Register an agent
          </h2>
          <p className="text-xs leading-5 text-mist">
            Declare the accountable record inside{" "}
            <strong>{organisationName}</strong>.
          </p>
        </div>
      </div>

      <ol
        className="grid gap-3 sm:grid-cols-3"
        aria-label="Agent registration steps"
      >
        {["Identity", "Scope and accountability", "Sign and issue"].map(
          (label, index) => (
            <li
              key={label}
              aria-current={step === index + 1 ? "step" : undefined}
              className={
                step === index + 1
                  ? "flex items-center gap-2 border-b-2 border-cobalt pb-2 text-xs font-semibold text-ink"
                  : "flex items-center gap-2 border-b-2 border-line pb-2 text-xs font-medium text-mist"
              }
            >
              <span
                className={
                  step === index + 1
                    ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cobalt text-[10px] font-semibold text-white"
                    : "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line-strong text-[10px] font-semibold text-mist"
                }
              >
                {index + 1}
              </span>
              {label}
            </li>
          ),
        )}
      </ol>

      {ain === null ? (
        <form action={registerAction} className="flex flex-col gap-5">
          <input type="hidden" name="organisationId" value={organisationId} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              className="sm:col-span-2"
              label="Agent name"
              name="name"
              value={identity.name}
              onChange={(event) =>
                setIdentity((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              required
              placeholder="Payments Operations Agent"
              error={identityErrors["name"]}
            />
            <TextField
              label="What it does"
              name="role"
              value={identity.role}
              onChange={(event) =>
                setIdentity((current) => ({
                  ...current,
                  role: event.target.value,
                }))
              }
              required
              placeholder="Initiates and reconciles supplier payments"
              error={identityErrors["role"]}
            />
            <SelectField
              label="Risk class"
              name="riskClass"
              items={RISK_LEVELS}
              value={identity.riskClass}
              onValueChange={(riskClass) =>
                setIdentity((current) => ({ ...current, riskClass }))
              }
              error={identityErrors["riskClass"]}
            />
          </div>
          {registered.status === "error" ? (
            <Refusal message={registered.message} />
          ) : (
            <Note>
              This mints a permanent identifier and opens a draft. Nothing is
              signed or published until the final step.
            </Note>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {onBack ? (
              <Button type="button" variant="secondary" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </Button>
            ) : (
              <ButtonLink href={ORGANISATION_SETTINGS}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Choose organisation
              </ButtonLink>
            )}
            <Button type="submit" disabled={registering}>
              {registering ? "Minting…" : "Mint identifier"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </form>
      ) : !declarationAttached ? (
        <form action={patchAction} className="flex flex-col gap-5">
          <input type="hidden" name="organisationId" value={organisationId} />
          <input type="hidden" name="ain" value={ain} />
          {draft ? (
            <Note>
              Continuing the draft <strong>{draft.name}</strong>. Its identifier
              below was minted when the draft was opened and is permanent — this
              declares scope and accountability against that identifier rather
              than creating a second one.
            </Note>
          ) : null}
          <CopyableAin value={ain} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              className="sm:col-span-2"
              label="Authorised action classes"
              name="actionClasses"
              value={declaration.actionClasses}
              onChange={(event) =>
                setDeclaration((current) => ({
                  ...current,
                  actionClasses: event.target.value,
                }))
              }
              multiline
              rows={3}
              required
              placeholder={"payments.initiate\ncustomer_comms.send"}
              description="One per line. Anything you do not list here is not authorised."
              error={declarationErrors["actionClasses"]}
            />
            <ScopeConstraintsField
              actionClasses={declaredClasses}
              rows={constraints}
              onChange={setConstraints}
              {...(declarationErrors["constraints"] !== undefined && {
                error: declarationErrors["constraints"],
              })}
            />
            <SelectField
              label="Operational risk level"
              name="riskLevel"
              items={RISK_LEVELS}
              value={declaration.riskLevel}
              onValueChange={(riskLevel) =>
                setDeclaration((current) => ({ ...current, riskLevel }))
              }
              error={declarationErrors["riskLevel"]}
            />
            <TextField
              label="Regulatory mappings (optional)"
              name="regulatoryMappings"
              value={declaration.regulatoryMappings}
              onChange={(event) =>
                setDeclaration((current) => ({
                  ...current,
                  regulatoryMappings: event.target.value,
                }))
              }
              multiline
              rows={2}
              placeholder="FCA CONC 7"
              error={declarationErrors["regulatoryMappings"]}
            />
            <TextField
              label="Accountable role title"
              name="roleTitle"
              value={declaration.roleTitle}
              onChange={(event) =>
                setDeclaration((current) => ({
                  ...current,
                  roleTitle: event.target.value,
                }))
              }
              required
              placeholder="Head of Collections"
              error={declarationErrors["roleTitle"]}
            />
            <TextField
              label="Responsibility area"
              name="responsibilityArea"
              value={declaration.responsibilityArea}
              onChange={(event) =>
                setDeclaration((current) => ({
                  ...current,
                  responsibilityArea: event.target.value,
                }))
              }
              required
              placeholder="collections"
              error={declarationErrors["responsibilityArea"]}
            />
            <TextField
              className="sm:col-span-2"
              label="SMCR reference"
              name="regulatoryIdentifier"
              value={declaration.regulatoryIdentifier}
              onChange={(event) =>
                setDeclaration((current) => ({
                  ...current,
                  regulatoryIdentifier: event.target.value,
                }))
              }
              required
              placeholder="SMF24-000123"
              description="The registration of the person accountable for this agent. It is bound into the signed document."
              error={declarationErrors["regulatoryIdentifier"]}
            />
          </div>
          {declared.status === "error" ? (
            <Refusal message={declared.message} />
          ) : (
            <Note>
              A scope write states the whole scope: what is listed here replaces
              anything declared before, and nothing is inferred.
            </Note>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ButtonLink href={registerHref}>Save draft and return</ButtonLink>
            <Button type="submit" disabled={declaring}>
              {declaring ? "Attaching…" : "Attach declaration"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </form>
      ) : (
        <form action={submitAction} className="flex flex-col gap-5">
          <input type="hidden" name="organisationId" value={organisationId} />
          <input type="hidden" name="ain" value={ain} />
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wash-blue text-cobalt">
              <ScrollText className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-semibold text-ink">
                Sign and issue
              </h2>
              <p className="text-xs leading-5 text-mist">
                This canonicalises the AIN Document, signs it, and begins the
                agent&apos;s lifecycle chain. The signature is permanent — a
                later change is a new version, never an edit.
              </p>
            </div>
          </div>
          <CopyableAin value={ain} />
          {issued.status === "error" ? (
            <Refusal message={issued.message} />
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ButtonLink href={registerHref}>Leave as draft</ButtonLink>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Signing…" : "Sign and issue"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
