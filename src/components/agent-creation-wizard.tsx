"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { type FormEvent, useState } from "react";

export function AgentCreationWizard({
  organisationName,
  onBack,
}: {
  /** `null` when no organisation is selected — the wizard then refuses to run. */
  organisationName: string | null;
  onBack?: () => void;
}) {
  const [agentName, setAgentName] = useState("");
  const [owner, setOwner] = useState("");
  const [scope, setScope] = useState("payments.initiate");
  const [signature] = useState("EdDSA");
  const [complete, setComplete] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setComplete(true);
  }

  // An agent record is always owned by an organisation, so with none selected
  // there is no form to submit — rendering one would stage a record against an
  // organisation that does not exist.
  if (organisationName === null) {
    return (
      <section className="wizard-form" aria-labelledby="agent-blocked-title">
        <div className="wizard-form-heading">
          <span className="wizard-form-icon">
            <Bot className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="dashboard-eyebrow">Step 3 · Agent workspace</p>
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

  if (complete) {
    return (
      <section
        className="wizard-complete"
        aria-labelledby="agent-created-title"
      >
        <span className="wizard-complete-icon">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="dashboard-eyebrow">Agent setup ready</p>
        <h2 id="agent-created-title">Your first agent is ready to review</h2>
        <p>
          The agent draft for <strong>{organisationName}</strong> is staged in
          this session. Connect the organisation API to persist registration,
          issue keys, and publish its AIN.
        </p>
        <div className="wizard-complete-actions">
          <a href="/dashboard">Return to overview</a>
          <a href="/dashboard/agent-demo">View illustrative demo</a>
        </div>
      </section>
    );
  }

  return (
    <form className="wizard-form" onSubmit={handleSubmit}>
      <div className="wizard-form-heading">
        <span className="wizard-form-icon">
          <Bot className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="dashboard-eyebrow">Step 3 · Agent workspace</p>
          <h2>Create your first agent</h2>
          <p>
            Define the initial accountable record inside{" "}
            <strong>{organisationName}</strong>.
          </p>
        </div>
      </div>

      <div className="wizard-form-grid">
        <label>
          <span>Agent name</span>
          <input
            required
            value={agentName}
            onChange={(event) => setAgentName(event.target.value)}
            placeholder="Payments Operations Agent"
          />
        </label>
        <label>
          <span>Accountable owner</span>
          <input
            required
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="Payments Operations"
          />
        </label>
        <label>
          <span>Initial authorised scope</span>
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value)}
          >
            <option value="payments.initiate">payments.initiate</option>
            <option value="customer_comms.send">customer_comms.send</option>
          </select>
        </label>
        <label>
          <span>Signing method</span>
          <span className="wizard-static-field">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            {signature}
          </span>
        </label>
      </div>

      <div className="wizard-form-note">
        This first pass collects the declaration only. No key material, customer
        data, or live agent action is created by this screen.
      </div>

      <div className="wizard-form-actions">
        {onBack ? (
          <button
            type="button"
            className="wizard-secondary-action"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to organisation
          </button>
        ) : (
          <a className="wizard-secondary-action" href="/organisations">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Choose organisation
          </a>
        )}
        <button type="submit" className="wizard-primary-action">
          Prepare agent record
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
