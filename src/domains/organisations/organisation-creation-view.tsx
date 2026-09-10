"use client";

import { ArrowRight, Building2, ShieldCheck } from "lucide-react";
import { useActionState, useState } from "react";

import { PrimaryNextActions } from "@/domains/workspace/primary-next-actions";
import {
  WorkspaceContent,
  WorkspacePane,
} from "@/domains/workspace/workspace-content";
import {
  initialAccountWorkspaceState,
  isSetupComplete,
  type AccountWorkspaceState,
} from "@/domains/workspace/account-workspace";
import { JURISDICTIONS } from "@/domains/organisations/jurisdictions";
import {
  createOrganisationAction,
  type CreateOrganisationState,
} from "@/domains/organisations/organisation-actions";
import { orgHref, WORKSPACE } from "@/domains/workspace/workspace-routes";
import { Callout } from "@/lib/ui/callout";
import { Button, ButtonLink } from "@/lib/ui/button";
import { CheckboxField } from "@/lib/ui/checkbox-field";
import { Eyebrow } from "@/lib/ui/eyebrow";
import { SelectField } from "@/lib/ui/select-field";
import { TextField } from "@/lib/ui/text-field";

const INITIAL: CreateOrganisationState = { status: "idle" };

const JURISDICTION_ITEMS = JURISDICTIONS.map((entry) => ({
  value: entry.code,
  label: entry.label,
}));

/** Which step owns each field, so a refusal shows the step that can fix it. */
const STEP_ONE_FIELDS = [
  "name",
  "registrationNumber",
  "jurisdiction",
  "address",
  "webUrl",
];

export function OrganisationCreationView({
  state = initialAccountWorkspaceState,
}: {
  state?: AccountWorkspaceState;
}) {
  const [result, formAction, pending] = useActionState(
    createOrganisationAction,
    INITIAL,
  );
  // Which step to show, remembered together with the action result it was
  // chosen under. A fresh refusal that names a step-one field shows step one
  // until the person chooses again. Deriving it from the result alone pinned
  // the form to step one for as long as that result stood, and the only
  // control that could replace the result was the submit button step two
  // renders, so a corrected number could never be resubmitted.
  const [choice, setChoice] = useState<{
    step: 1 | 2;
    under: CreateOrganisationState;
  }>({ step: 1, under: INITIAL });
  const [name, setName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [jurisdiction, setJurisdiction] = useState<string>(
    JURISDICTIONS[0].code,
  );
  const [address, setAddress] = useState("");
  const [webUrl, setWebUrl] = useState("");
  const [authorityConfirmed, setAuthorityConfirmed] = useState(false);

  const errors = result.status === "error" ? result.errors : {};
  const created = result.status === "created";
  const stepOneRefused =
    result.status === "error" &&
    STEP_ONE_FIELDS.some((f) => errors[f] !== undefined);
  const step = choice.under === result || !stepOneRefused ? choice.step : 1;
  const choose = (next: 1 | 2) => setChoice({ step: next, under: result });
  // The refusal is shown on the step that can act on it. Once step one has
  // been corrected and left, repeating "check the highlighted fields" above a
  // review that highlights nothing would only send the person back again.
  const refusal =
    result.status === "error" && (!stepOneRefused || step === 1)
      ? result.message
      : null;

  const jurisdictionLabel =
    JURISDICTIONS.find((entry) => entry.code === jurisdiction)?.label ??
    jurisdiction;
  const setupRunning = !isSetupComplete(state);

  return (
    <>
      <WorkspaceContent columns={setupRunning ? "sidebar" : "single"}>
        {/* The checklist stops existing once setup is done, so the column it
          sits in has to go with it — otherwise the form is pushed off centre
          by a reserved space holding nothing. */}
        {setupRunning ? (
          <WorkspacePane as="aside" className="max-lg:order-2">
            <PrimaryNextActions state={state} />
          </WorkspacePane>
        ) : null}

        <WorkspacePane className="max-lg:order-1">
          {created ? (
            <section className="mx-auto flex w-[min(100%,52rem)] flex-col gap-5 rounded-2xl border border-line bg-white p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-wash text-success-strong">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-2">
                  <Eyebrow>Submitted for verification</Eyebrow>
                  <h1 className="text-xl font-semibold tracking-[-0.02em] text-ink">
                    {name} is registered
                  </h1>
                  {/* Deliberately not a link into agent creation: the registry
                    refuses agents in an unverified organisation. */}
                  <p className="text-xs leading-5 text-mist">
                    We check the company number against Companies House and
                    confirm your authority to act for it. Until that is done the
                    organisation is inert — agents can be registered once it is
                    verified.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <ButtonLink
                  variant="primary"
                  href={
                    result.status === "created"
                      ? orgHref(result.organisationUlid)
                      : WORKSPACE
                  }
                >
                  Go to {name}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
              </div>
            </section>
          ) : (
            <form
              action={formAction}
              className="mx-auto flex w-[min(100%,52rem)] flex-col gap-5 rounded-2xl border border-line bg-white p-6"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wash-blue text-cobalt">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-2">
                  <Eyebrow>Step {step} of 2 · Organisation setup</Eyebrow>
                  <h1 className="text-xl font-semibold tracking-[-0.02em] text-ink">
                    Create your organisation
                  </h1>
                  <p className="text-xs leading-5 text-mist">
                    Register the legal entity that will own and operate your
                    accountable agents.
                  </p>
                </div>
              </div>

              <ol
                className="grid grid-cols-2 gap-3"
                aria-label="Organisation setup steps"
              >
                {["Organisation details", "Authority and review"].map(
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
                            ? "flex h-5 w-5 items-center justify-center rounded-full bg-cobalt text-[10px] font-semibold text-white"
                            : "flex h-5 w-5 items-center justify-center rounded-full border border-line-strong text-[10px] font-semibold text-mist"
                        }
                      >
                        {index + 1}
                      </span>
                      {label}
                    </li>
                  ),
                )}
              </ol>

              {step === 1 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    className="sm:col-span-2"
                    label="Legal organisation name"
                    name="name"
                    required
                    placeholder="Example Holdings Ltd"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    error={errors["name"]}
                  />
                  <TextField
                    label="Companies House number"
                    name="registrationNumber"
                    required
                    placeholder="01234567"
                    value={registrationNumber}
                    onChange={(event) =>
                      setRegistrationNumber(event.target.value.toUpperCase())
                    }
                    error={errors["registrationNumber"]}
                  />
                  <SelectField
                    label="Registration jurisdiction"
                    name="jurisdiction"
                    items={JURISDICTION_ITEMS}
                    value={jurisdiction}
                    onValueChange={setJurisdiction}
                    error={errors["jurisdiction"]}
                  />
                  <TextField
                    className="sm:col-span-2"
                    label="Registered office address"
                    name="address"
                    multiline
                    rows={3}
                    required
                    placeholder="1 Example Street, London, EC1A 1AA"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    error={errors["address"]}
                  />
                  <TextField
                    className="sm:col-span-2"
                    label="Website (optional)"
                    name="webUrl"
                    placeholder="https://example.com"
                    value={webUrl}
                    onChange={(event) => setWebUrl(event.target.value)}
                    error={errors["webUrl"]}
                  />
                </div>
              ) : (
                <>
                  {/* Step 1's values ride along as hidden inputs rather than as
                    visually-hidden required controls. The previous form kept
                    them mounted under [hidden] with `required` still set,
                    which Chrome refuses to submit — it cannot focus the
                    invalid control to report it — so the whole form silently
                    deadlocked. A truthiness guard on the Continue button
                    masked it, and a single space defeated that guard. */}
                  <input type="hidden" name="name" value={name} />
                  <input
                    type="hidden"
                    name="registrationNumber"
                    value={registrationNumber}
                  />
                  <input
                    type="hidden"
                    name="jurisdiction"
                    value={jurisdiction}
                  />
                  <input type="hidden" name="address" value={address} />
                  <input type="hidden" name="webUrl" value={webUrl} />

                  <dl className="grid gap-3 rounded-xl border border-line bg-band p-4 sm:grid-cols-2">
                    {[
                      ["Organisation", name],
                      ["Companies House number", registrationNumber],
                      ["Jurisdiction", jurisdictionLabel],
                      ["Registered office", address],
                    ].map(([term, value]) => (
                      <div key={term} className="flex flex-col gap-1">
                        <dt className="text-[11px] font-semibold text-ink-muted">
                          {term}
                        </dt>
                        <dd className="text-xs font-semibold text-ink">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {/* An attestation, not a stored field: the registry has
                    nowhere to put a claimed relationship, and a form that
                    asks and discards would be worse than not asking. */}
                  <CheckboxField
                    required
                    checked={authorityConfirmed}
                    onCheckedChange={setAuthorityConfirmed}
                  >
                    I confirm I am authorised to submit this organisation for
                    verification.
                  </CheckboxField>
                </>
              )}

              {refusal !== null ? (
                <Callout tone="danger" alert>
                  {refusal}
                </Callout>
              ) : (
                <Callout>
                  The organisation is created pending verification. We check the
                  company number and your authority to act for it before it can
                  do anything.
                </Callout>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                {step === 2 ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => choose(1)}
                  >
                    Back
                  </Button>
                ) : (
                  <ButtonLink variant="secondary" href={WORKSPACE}>
                    Save and return
                  </ButtonLink>
                )}
                {/* Keyed off the same `step` as the fields above, so a
                    refusal that collapses the form to step one never leaves
                    step one's fields under step two's submit button.

                    The two buttons carry distinct keys on purpose. Without
                    them React reuses one <button> node for both, and a click
                    on Continue turns that node into the submit button before
                    the browser runs the click's default action, which then
                    submits the form. Harmless while the attestation is
                    unticked, because the submit is disabled; after Back, or
                    after a refusal, it is ticked, and Continue submitted. */}
                {step === 1 ? (
                  <Button
                    key="continue"
                    type="button"
                    onClick={() => choose(2)}
                    disabled={
                      !name.trim() ||
                      !registrationNumber.trim() ||
                      !address.trim()
                    }
                  >
                    Continue to authority
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                ) : (
                  <Button
                    key="submit"
                    type="submit"
                    disabled={pending || !authorityConfirmed}
                  >
                    {pending ? "Submitting…" : "Complete organisation setup"}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </form>
          )}
        </WorkspacePane>
      </WorkspaceContent>
    </>
  );
}
