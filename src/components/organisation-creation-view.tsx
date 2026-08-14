"use client";

import { ArrowRight, Building2, ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";

import { AgentCreationWizard } from "@/components/agent-creation-wizard";
import { PrimaryNextActions } from "@/components/primary-next-actions";
import { WorkspaceShell } from "@/components/workspace-shell";
import {
  initialAccountWorkspaceState,
  type AccountWorkspaceState,
  type OrganisationSummary,
} from "@/lib/account-workspace";
import { userMenuItems } from "@/lib/workspace-navigation";

export function OrganisationCreationView({
  email,
  state = initialAccountWorkspaceState,
}: {
  email: string | null | undefined;
  state?: AccountWorkspaceState;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [organisationName, setOrganisationName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [country, setCountry] = useState("United Kingdom");
  const [authority, setAuthority] = useState("Director or equivalent");
  const [authorityConfirmed, setAuthorityConfirmed] = useState(false);
  const [createdOrganisation, setCreatedOrganisation] =
    useState<OrganisationSummary | null>(null);

  // One derived state for every child: the shell footer and the sidebar
  // checklist both read from this, so they cannot disagree about whether the
  // organisation exists.
  const workspaceState: AccountWorkspaceState = createdOrganisation
    ? {
        ...state,
        organisations: [createdOrganisation],
        selectedOrganisationId: createdOrganisation.id,
      }
    : state;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    if (!authorityConfirmed) return;

    setCreatedOrganisation({
      id: "draft-organisation",
      name: organisationName.trim(),
      membershipRole: "owner",
      verificationStatus: "pending",
    });
  }

  return (
    <WorkspaceShell
      currentPath="/organisations"
      email={email}
      navigationItems={userMenuItems}
      navigationLabel="Account sections"
      organisations={workspaceState.organisations}
      selectedOrganisationId={workspaceState.selectedOrganisationId}
      showOrganisationSwitcher
      signedInAs={createdOrganisation?.name ?? "No organisation selected"}
      workspaceLabel="Create organisation"
    >
      <div className="account-wizard-workspace">
        <aside className="account-wizard-side">
          <PrimaryNextActions state={workspaceState} />
          <div className="wizard-side-note">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <p>
              Individual assurance, organisation legitimacy, and authority are
              separate checks.
            </p>
          </div>
        </aside>

        <div className="account-wizard-main">
          {createdOrganisation ? (
            <AgentCreationWizard
              organisationName={createdOrganisation.name}
              onBack={() => setCreatedOrganisation(null)}
            />
          ) : (
            <form className="wizard-form" onSubmit={handleSubmit}>
              <div className="wizard-form-heading">
                <span className="wizard-form-icon">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="dashboard-eyebrow">
                    Step {step} of 2 · Organisation setup
                  </p>
                  <h1>Create your first organisation</h1>
                  <p>
                    Register the legal entity that will own and operate your
                    accountable agents.
                  </p>
                </div>
              </div>

              <ol className="wizard-progress" aria-label="Organisation setup steps">
                <li data-current={step === 1}>
                  <span>1</span>
                  Organisation details
                </li>
                <li data-current={step === 2}>
                  <span>2</span>
                  Authority and review
                </li>
              </ol>

              {step === 1 ? (
                <div className="wizard-form-grid">
                  <label>
                    <span>Legal organisation name</span>
                    <input
                      required
                      value={organisationName}
                      onChange={(event) => setOrganisationName(event.target.value)}
                      placeholder="Example Holdings Ltd"
                    />
                  </label>
                  <label>
                    <span>Companies House number</span>
                    <input
                      required
                      value={registrationNumber}
                      onChange={(event) =>
                        setRegistrationNumber(event.target.value.toUpperCase())
                      }
                      placeholder="01234567"
                      inputMode="text"
                    />
                  </label>
                  <label>
                    <span>Registration jurisdiction</span>
                    <select value={country} onChange={(event) => setCountry(event.target.value)}>
                      <option>United Kingdom</option>
                    </select>
                  </label>
                </div>
              ) : (
                <div className="wizard-review">
                  <div>
                    <span>Organisation</span>
                    <strong>{organisationName}</strong>
                  </div>
                  <div>
                    <span>Companies House number</span>
                    <strong>{registrationNumber}</strong>
                  </div>
                  <div>
                    <span>Jurisdiction</span>
                    <strong>{country}</strong>
                  </div>
                  <label className="wizard-checkbox">
                    <input
                      type="checkbox"
                      required
                      checked={authorityConfirmed}
                      onChange={(event) => setAuthorityConfirmed(event.target.checked)}
                    />
                    <span>
                      I confirm I am authorised to submit this organisation for
                      verification.
                    </span>
                  </label>
                  <label>
                    <span>Your relationship to the organisation</span>
                    <select value={authority} onChange={(event) => setAuthority(event.target.value)}>
                      <option>Director or equivalent</option>
                      <option>Authorised company representative</option>
                      <option>Professional adviser with authority</option>
                    </select>
                  </label>
                </div>
              )}

              <div className="wizard-form-note">
                This prototype stages the flow locally. A future API will
                validate Companies House details, evidence authority, and
                persist the organisation record.
              </div>

              <div className="wizard-form-actions">
                {step === 2 ? (
                  <button
                    type="button"
                    className="wizard-secondary-action"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                ) : (
                  <a className="wizard-secondary-action" href="/dashboard">
                    Save and return
                  </a>
                )}
                <button type="submit" className="wizard-primary-action">
                  {step === 1 ? "Continue to authority" : "Complete organisation setup"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
