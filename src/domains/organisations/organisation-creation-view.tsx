"use client";

import { ArrowRight, Building2, ShieldCheck } from "lucide-react";
import { useActionState, useState } from "react";

import { PrimaryNextActions } from "@/domains/workspace/primary-next-actions";
import { WorkspaceShell } from "@/domains/workspace/workspace-shell";
import {
  initialAccountWorkspaceState,
  type AccountWorkspaceState,
} from "@/domains/workspace/account-workspace";
import { JURISDICTIONS } from "@/domains/organisations/jurisdictions";
import {
  createOrganisationAction,
  type CreateOrganisationState,
} from "@/domains/organisations/organisation-actions";
import { menuItemsFor } from "@/domains/workspace/workspace-navigation";

const INITIAL: CreateOrganisationState = { status: "idle" };

export function OrganisationCreationView({
  email,
  state = initialAccountWorkspaceState,
}: {
  email: string | null | undefined;
  state?: AccountWorkspaceState;
}) {
  const [result, formAction, pending] = useActionState(
    createOrganisationAction,
    INITIAL,
  );
  const [step, setStep] = useState<1 | 2>(1);
  // Controlled, so a rejected submission keeps what was typed without the
  // action having to carry every value back to the client.
  const [name, setName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  // Widened from the literal union: the select's value is whatever the DOM
  // reports, and the action re-validates it against the same list anyway.
  const [jurisdiction, setJurisdiction] = useState<string>(
    JURISDICTIONS[0].code,
  );
  const [address, setAddress] = useState("");
  const [webUrl, setWebUrl] = useState("");
  const [authorityConfirmed, setAuthorityConfirmed] = useState(false);

  const errors = result.status === "error" ? result.errors : {};
  const created = result.status === "created";
  // Step 1's fields live in a `hidden` container so the submitted FormData
  // carries all of them, and Tailwind's preflight makes `[hidden]` a hard
  // `display: none`. The form only submits from step 2, so a refusal about a
  // step-1 field rendered "Check the highlighted fields" with every message
  // invisible and no way back except guessing at "Back". Showing the step that
  // owns the complaint is the fix; `step` is state, so this is just where it
  // should be looking.
  const stepOneFields = [
    "name",
    "registrationNumber",
    "jurisdiction",
    "address",
    "webUrl",
  ];
  const shownStep =
    result.status === "error" &&
    stepOneFields.some((field) => errors[field] !== undefined)
      ? 1
      : step;
  const jurisdictionLabel =
    JURISDICTIONS.find((entry) => entry.code === jurisdiction)?.label ??
    jurisdiction;

  return (
    <WorkspaceShell
      currentPath="/organisations"
      email={email}
      navigationItems={menuItemsFor(state.isOperator)}
      navigationLabel="Account sections"
      organisations={state.organisations}
      selectedOrganisationId={state.selectedOrganisationId}
      showOrganisationSwitcher
      signedInAs={created ? name : "No organisation selected"}
      workspaceLabel="Create organisation"
    >
      <div className="account-route-workspace">
        <PrimaryNextActions state={state} />
        <div className="wizard-panel">
          {created ? (
            <div className="wizard-form">
              <div className="wizard-form-heading">
                <span className="wizard-form-icon">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="dashboard-eyebrow">
                    Submitted for verification
                  </p>
                  <h1>{name} is registered</h1>
                  {/* Deliberately not a link into agent creation. The registry
                      refuses agents in an unverified organisation, so offering
                      it here would send someone straight into a refusal. */}
                  <p>
                    Trust operations will confirm the company number against
                    Companies House and check your authority to act for it.
                    Until that is done the organisation is inert — agents can be
                    registered once it is verified.
                  </p>
                </div>
              </div>
              <div className="wizard-form-actions">
                <a className="wizard-primary-action" href="/organisations">
                  Back to organisations
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          ) : (
            <form className="wizard-form" action={formAction}>
              <div className="wizard-form-heading">
                <span className="wizard-form-icon">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="dashboard-eyebrow">
                    Step {shownStep} of 2 · Organisation setup
                  </p>
                  <h1>Create your organisation</h1>
                  <p>
                    Register the legal entity that will own and operate your
                    accountable agents.
                  </p>
                </div>
              </div>

              <ol
                className="wizard-progress"
                aria-label="Organisation setup steps"
              >
                <li data-current={shownStep === 1}>
                  <span>1</span>
                  Organisation details
                </li>
                <li data-current={shownStep === 2}>
                  <span>2</span>
                  Authority and review
                </li>
              </ol>

              {/* Every field stays mounted so the submitted FormData carries
                  all of them; step 2 hides the inputs rather than unmounting. */}
              <div className="wizard-form-grid" hidden={shownStep !== 1}>
                <label>
                  <span>Legal organisation name</span>
                  <input
                    name="name"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Example Holdings Ltd"
                  />
                  {errors["name"] ? (
                    <small role="alert">{errors["name"]}</small>
                  ) : null}
                </label>
                <label>
                  <span>Companies House number</span>
                  <input
                    name="registrationNumber"
                    required
                    value={registrationNumber}
                    onChange={(event) =>
                      setRegistrationNumber(event.target.value.toUpperCase())
                    }
                    placeholder="01234567"
                    inputMode="text"
                  />
                  {errors["registrationNumber"] ? (
                    <small role="alert">{errors["registrationNumber"]}</small>
                  ) : null}
                </label>
                <label>
                  <span>Registration jurisdiction</span>
                  <select
                    name="jurisdiction"
                    value={jurisdiction}
                    onChange={(event) => setJurisdiction(event.target.value)}
                  >
                    {JURISDICTIONS.map((entry) => (
                      <option key={entry.code} value={entry.code}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Registered office address</span>
                  <textarea
                    name="address"
                    required
                    rows={3}
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="1 Example Street, London, EC1A 1AA"
                  />
                  {errors["address"] ? (
                    <small role="alert">{errors["address"]}</small>
                  ) : null}
                </label>
                <label>
                  <span>Website (optional)</span>
                  <input
                    name="webUrl"
                    value={webUrl}
                    onChange={(event) => setWebUrl(event.target.value)}
                    placeholder="https://example.com"
                  />
                </label>
              </div>

              {shownStep === 2 ? (
                <div className="wizard-review">
                  <div>
                    <span>Organisation</span>
                    <strong>{name}</strong>
                  </div>
                  <div>
                    <span>Companies House number</span>
                    <strong>{registrationNumber}</strong>
                  </div>
                  <div>
                    <span>Jurisdiction</span>
                    <strong>{jurisdictionLabel}</strong>
                  </div>
                  <div>
                    <span>Registered office</span>
                    <strong>{address}</strong>
                  </div>
                  {/* An attestation, not a stored field. The registry has
                      nowhere to put a claimed relationship today, and a form
                      that asks and discards would be worse than not asking. */}
                  <label className="wizard-checkbox">
                    <input
                      type="checkbox"
                      required
                      checked={authorityConfirmed}
                      onChange={(event) =>
                        setAuthorityConfirmed(event.target.checked)
                      }
                    />
                    <span>
                      I confirm I am authorised to submit this organisation for
                      verification.
                    </span>
                  </label>
                </div>
              ) : null}

              {result.status === "error" ? (
                <p className="wizard-form-note" role="alert">
                  {result.message}
                </p>
              ) : (
                <div className="wizard-form-note">
                  The organisation is created pending verification. Trust
                  operations check the company number and your authority to act
                  for it before it can do anything.
                </div>
              )}

              <div className="wizard-form-actions">
                {shownStep === 2 ? (
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
                {step === 1 ? (
                  <button
                    type="button"
                    className="wizard-primary-action"
                    onClick={() => setStep(2)}
                    disabled={!name || !registrationNumber || !address}
                  >
                    Continue to authority
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="wizard-primary-action"
                    disabled={pending || !authorityConfirmed}
                  >
                    {pending ? "Submitting…" : "Complete organisation setup"}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
