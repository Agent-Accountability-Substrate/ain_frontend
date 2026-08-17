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

import { CopyableAin } from "@/components/copyable-ain";
import {
  patchAgentAction,
  registerAgentAction,
  submitAgentAction,
  type PatchAgentState,
  type RegisterAgentState,
  type SubmitAgentState,
} from "@/lib/agent-actions";

/**
 * The three states the registry actually moves an agent through.
 *
 * Not one form posted at the end: `POST` mints the AIN and opens a draft,
 * `PATCH` attaches scope and named accountability, and `submit` signs the
 * document and appends the genesis lifecycle events. Each step below is one of
 * those calls, so a draft that exists on the server is a draft the wizard can
 * show rather than a local object hoping to become real.
 */

const RISK_CLASSES = ["low", "medium", "high"] as const;

function Refusal({ message }: { message: string }) {
  return (
    <p className="wizard-form-note" role="alert">
      {message}
    </p>
  );
}

export function AgentCreationWizard({
  organisationId,
  organisationName,
  organisationVerified,
  onBack,
}: {
  /** `null` when no organisation is selected — the wizard then refuses to run. */
  organisationId: string | null;
  organisationName: string | null;
  organisationVerified: boolean;
  onBack?: () => void;
}) {
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

  // Both forms are controlled, and that is load-bearing rather than stylistic:
  // React resets an uncontrolled form once its action resolves, so a refusal
  // would hand back the reason with the fields already wiped. The declaration
  // step is six fields including the SMCR reference — retyping them to read an
  // error is not a reasonable thing to ask.
  const [identity, setIdentity] = useState({
    name: "",
    role: "",
    riskClass: "high",
  });
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
      <section className="wizard-form" aria-labelledby="agent-blocked-title">
        <div className="wizard-form-heading">
          <span className="wizard-form-icon">
            <Bot className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="dashboard-eyebrow">Agent workspace</p>
            <h2 id="agent-blocked-title">Choose an organisation to continue</h2>
            <p>
              Agent records belong to an organisation. Select one and this step
              will open.
            </p>
          </div>
        </div>
        <div className="wizard-form-actions">
          <a className="wizard-secondary-action" href="/organisations">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Choose organisation
          </a>
        </div>
      </section>
    );
  }

  // The registry refuses agents in an unverified organisation, so this says so
  // here rather than letting someone fill three steps and collect a 403.
  if (!organisationVerified) {
    return (
      <section className="wizard-form" aria-labelledby="agent-pending-title">
        <div className="wizard-form-heading">
          <span className="wizard-form-icon">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="dashboard-eyebrow">Awaiting verification</p>
            <h2 id="agent-pending-title">
              {organisationName} is not verified yet
            </h2>
            <p>
              Trust operations confirm the company registration and your
              authority to act for it before any agent can be registered. This
              step opens as soon as that is done.
            </p>
          </div>
        </div>
        <div className="wizard-form-actions">
          <a className="wizard-secondary-action" href="/organisations">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to organisations
          </a>
        </div>
      </section>
    );
  }

  if (issued.status === "done") {
    return (
      <section className="wizard-complete" aria-labelledby="agent-issued-title">
        <span className="wizard-complete-icon">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="dashboard-eyebrow">
          Issued · document v{issued.documentVersion}
        </p>
        <h2 id="agent-issued-title">The agent is registered and signed</h2>
        <p>
          Its AIN Document is signed and its lifecycle chain has begun. The
          identifier below is permanent: it is never reissued or recycled.
        </p>
        <CopyableAin value={issued.ain} />
        <div className="wizard-complete-actions">
          <a href="/dashboard">Return to overview</a>
          <a href={issued.resolverUrl}>Resolver URL</a>
        </div>
      </section>
    );
  }

  const ain = registered.status === "done" ? registered.ain : null;
  const declarationAttached = declared.status === "done";

  return (
    <div className="wizard-form">
      <div className="wizard-form-heading">
        <span className="wizard-form-icon">
          <Bot className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="dashboard-eyebrow">Agent workspace</p>
          <h2>Register an agent</h2>
          <p>
            Declare the accountable record inside{" "}
            <strong>{organisationName}</strong>.
          </p>
        </div>
      </div>

      <ol className="wizard-progress" aria-label="Agent registration steps">
        <li data-current={ain === null}>
          <span>1</span>
          Identity
        </li>
        <li data-current={ain !== null && !declarationAttached}>
          <span>2</span>
          Scope and accountability
        </li>
        <li data-current={declarationAttached}>
          <span>3</span>
          Sign and issue
        </li>
      </ol>

      {ain === null ? (
        <form action={registerAction}>
          <input type="hidden" name="organisationId" value={organisationId} />
          <div className="wizard-form-grid">
            <label>
              <span>Agent name</span>
              <input
                name="name"
                required
                placeholder="Payments Operations Agent"
                value={identity.name}
                onChange={(event) =>
                  setIdentity({ ...identity, name: event.target.value })
                }
              />
            </label>
            <label>
              <span>What it does</span>
              <input
                name="role"
                required
                placeholder="Initiates and reconciles supplier payments"
                value={identity.role}
                onChange={(event) =>
                  setIdentity({ ...identity, role: event.target.value })
                }
              />
            </label>
            <label>
              <span>Risk class</span>
              <select
                name="riskClass"
                value={identity.riskClass}
                onChange={(event) =>
                  setIdentity({ ...identity, riskClass: event.target.value })
                }
              >
                {RISK_CLASSES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {registered.status === "error" ? (
            <Refusal message={registered.message} />
          ) : (
            <div className="wizard-form-note">
              This mints a permanent identifier and opens a draft. Nothing is
              signed or published until the final step.
            </div>
          )}
          <div className="wizard-form-actions">
            {onBack ? (
              <button
                type="button"
                className="wizard-secondary-action"
                onClick={onBack}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </button>
            ) : (
              <a className="wizard-secondary-action" href="/organisations">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Choose organisation
              </a>
            )}
            <button
              type="submit"
              className="wizard-primary-action"
              disabled={registering}
            >
              {registering ? "Minting…" : "Mint identifier"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </form>
      ) : !declarationAttached ? (
        <form action={patchAction}>
          <input type="hidden" name="organisationId" value={organisationId} />
          <input type="hidden" name="ain" value={ain} />
          <CopyableAin value={ain} />
          <div className="wizard-form-grid">
            <label>
              <span>Authorised action classes</span>
              <textarea
                name="actionClasses"
                required
                rows={3}
                placeholder={"payments.initiate\ncustomer_comms.send"}
                value={declaration.actionClasses}
                onChange={(event) =>
                  setDeclaration({
                    ...declaration,
                    actionClasses: event.target.value,
                  })
                }
              />
              <small>
                One per line. Anything not declared is unauthorised — unknown
                never means allowed.
              </small>
            </label>
            <label>
              <span>Operational risk level</span>
              <select
                name="riskLevel"
                value={declaration.riskLevel}
                onChange={(event) =>
                  setDeclaration({
                    ...declaration,
                    riskLevel: event.target.value,
                  })
                }
              >
                {RISK_CLASSES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Regulatory mappings (optional)</span>
              <textarea
                name="regulatoryMappings"
                rows={2}
                placeholder="FCA CONC 7"
                value={declaration.regulatoryMappings}
                onChange={(event) =>
                  setDeclaration({
                    ...declaration,
                    regulatoryMappings: event.target.value,
                  })
                }
              />
            </label>
            <label>
              <span>Accountable role title</span>
              <input
                name="roleTitle"
                required
                placeholder="Head of Collections"
                value={declaration.roleTitle}
                onChange={(event) =>
                  setDeclaration({
                    ...declaration,
                    roleTitle: event.target.value,
                  })
                }
              />
            </label>
            <label>
              <span>Responsibility area</span>
              <input
                name="responsibilityArea"
                required
                placeholder="collections"
                value={declaration.responsibilityArea}
                onChange={(event) =>
                  setDeclaration({
                    ...declaration,
                    responsibilityArea: event.target.value,
                  })
                }
              />
            </label>
            <label>
              <span>SMCR reference</span>
              <input
                name="regulatoryIdentifier"
                required
                placeholder="SMF24-000123"
                value={declaration.regulatoryIdentifier}
                onChange={(event) =>
                  setDeclaration({
                    ...declaration,
                    regulatoryIdentifier: event.target.value,
                  })
                }
              />
              <small>
                The registration of the person accountable for this agent. It is
                bound into the signed document.
              </small>
            </label>
          </div>
          {declared.status === "error" ? (
            <Refusal message={declared.message} />
          ) : (
            <div className="wizard-form-note">
              A scope write states the whole scope: what is listed here replaces
              anything declared before, and nothing is inferred.
            </div>
          )}
          <div className="wizard-form-actions">
            <a className="wizard-secondary-action" href="/dashboard">
              Save draft and return
            </a>
            <button
              type="submit"
              className="wizard-primary-action"
              disabled={declaring}
            >
              {declaring ? "Attaching…" : "Attach declaration"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </form>
      ) : (
        <form action={submitAction}>
          <input type="hidden" name="organisationId" value={organisationId} />
          <input type="hidden" name="ain" value={ain} />
          <div className="wizard-form-heading">
            <span className="wizard-form-icon">
              <ScrollText className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2>Sign and issue</h2>
              <p>
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
          <div className="wizard-form-actions">
            <a className="wizard-secondary-action" href="/dashboard">
              Leave as draft
            </a>
            <button
              type="submit"
              className="wizard-primary-action"
              disabled={submitting}
            >
              {submitting ? "Signing…" : "Sign and issue"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
