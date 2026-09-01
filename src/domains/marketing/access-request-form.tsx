"use client";

import { Check, Send } from "lucide-react";
import Link from "next/link";
import {
  useActionState,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  requestAccessAction,
  type AccessRequestField,
  type AccessRequestFieldErrors,
  type AccessRequestState,
} from "@/domains/marketing/access-request";
import { PARTNER_EMAIL } from "@/domains/marketing/landing-content";

/**
 * The private-preview request: its fields, its validation and its three
 * delivery states.
 *
 * Rendered on the landing page inside the stage in `access-form.tsx`, and at
 * the end of a post inside the closing aside. Both sit on ink, so the form
 * carries one appearance and the surrounding page supplies the ground.
 */

const INITIAL: AccessRequestState = { status: "idle" };
const EMPTY_VALUES = {
  name: "",
  email: "",
  organisation: "",
  role: "",
  workflow: "",
};

function FormField({
  id,
  name,
  label,
  required = false,
  helper,
  error,
  children,
}: {
  id: string;
  name: AccessRequestField;
  label: string;
  required?: boolean;
  helper?: string;
  error?: string;
  children: ReactNode;
}) {
  const descriptionId = `${id}-description`;

  return (
    <div data-field={name}>
      <label
        className="flex items-center justify-between gap-3 font-site-mono text-[10px] uppercase tracking-[0.14em] text-site-cream-soft"
        htmlFor={id}
      >
        <span>{label}</span>
        <span
          aria-hidden="true"
          className="normal-case tracking-normal text-site-cream-dim"
        >
          {required ? "Required" : "Optional"}
        </span>
      </label>
      <div
        className={`mt-2.5 rounded-[12px] border bg-site-cream/[0.055] px-[17px] transition-[border-color,background-color,box-shadow] duration-200 ease-site focus-within:bg-site-cream/[0.09] ${
          error
            ? "border-site-rose/80 shadow-[0_0_0_3px_rgba(225,105,114,0.08)]"
            : "border-site-hair hover:border-site-cream/[0.28] focus-within:border-site-cream/70"
        }`}
      >
        {children}
      </div>
      {(error || helper) && (
        <p
          id={descriptionId}
          className={`mt-2 text-[12px] leading-[1.45] ${
            error ? "text-site-rose" : "text-site-cream-soft"
          }`}
        >
          {error ?? helper}
        </p>
      )}
    </div>
  );
}

export function AccessRequestForm() {
  const [state, formAction, pending] = useActionState(
    requestAccessAction,
    INITIAL,
  );
  const [clientErrors, setClientErrors] = useState<AccessRequestFieldErrors>(
    {},
  );
  const [dismissedServerErrors, setDismissedServerErrors] = useState<{
    state: AccessRequestState;
    fields: Partial<Record<AccessRequestField, true>>;
  }>({ state, fields: {} });

  const sent = state.status === "sent";
  const failed = state.status === "error";
  const values = failed ? state.values : EMPTY_VALUES;
  const serverErrors = failed ? (state.fieldErrors ?? {}) : {};
  const activeDismissals =
    dismissedServerErrors.state === state ? dismissedServerErrors.fields : {};
  const fieldError = (field: AccessRequestField) =>
    clientErrors[field] ??
    (activeDismissals[field] ? undefined : serverErrors[field]);

  function clearError(field: AccessRequestField) {
    setClientErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setDismissedServerErrors((current) => ({
      state,
      fields: {
        ...(current.state === state ? current.fields : {}),
        [field]: true,
      },
    }));
  }

  function validate(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const next: AccessRequestFieldErrors = {};
    for (const field of ["name", "email", "organisation", "role"] as const) {
      if (String(data.get(field) ?? "").trim() === "") {
        next[field] = "This field is required.";
      }
    }
    const email = String(data.get("email") ?? "").trim();
    if (email !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Enter a valid work email address.";
    }

    if (Object.keys(next).length > 0) {
      event.preventDefault();
      setClientErrors(next);
      return;
    }
    setClientErrors({});
  }

  const inputClass =
    "min-w-0 w-full border-0 bg-transparent py-[12px] text-[14px] text-site-cream outline-none placeholder:text-site-cream-dim";

  return (
    <>
      {sent ? (
        <div
          role="status"
          aria-live="polite"
          className="flex min-h-[420px] flex-col justify-center rounded-[18px] border border-site-hair bg-site-cream/[0.055] p-[clamp(26px,4vw,48px)]"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-site-verified/50 bg-site-verified/10 text-site-verified">
            <Check aria-hidden="true" className="h-5 w-5" />
          </span>
          <h3 className="mt-7 max-w-[18ch] text-[clamp(24px,3vw,34px)] leading-[1.12] font-medium tracking-[-0.03em] text-site-cream">
            Thank you. Your request has been received.
          </h3>
          <p className="mt-4 max-w-[42ch] text-[15px] leading-[1.65] text-site-cream/80">
            A member of the team will be in touch.
          </p>
        </div>
      ) : (
        <form
          action={formAction}
          aria-label="Private preview request"
          noValidate
          onSubmit={validate}
          className="m-0"
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 max-[700px]:grid-cols-[minmax(0,1fr)]">
            <FormField
              id="access-name"
              name="name"
              label="Name"
              required
              error={fieldError("name")}
            >
              <input
                id="access-name"
                name="name"
                type="text"
                required
                maxLength={200}
                autoComplete="name"
                defaultValue={values.name}
                placeholder="Ada Lovelace"
                aria-invalid={Boolean(fieldError("name"))}
                aria-describedby={
                  fieldError("name") ? "access-name-description" : undefined
                }
                onChange={() => clearError("name")}
                className={inputClass}
              />
            </FormField>

            <FormField
              id="access-email"
              name="email"
              label="Work email"
              required
              helper="Use your organisation email address."
              error={fieldError("email")}
            >
              <input
                id="access-email"
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                defaultValue={values.email}
                placeholder="name@organisation.com"
                aria-invalid={Boolean(fieldError("email"))}
                aria-describedby="access-email-description"
                onChange={() => clearError("email")}
                className={inputClass}
              />
            </FormField>

            <FormField
              id="access-organisation"
              name="organisation"
              label="Organisation"
              required
              error={fieldError("organisation")}
            >
              <input
                id="access-organisation"
                name="organisation"
                type="text"
                required
                maxLength={200}
                autoComplete="organization"
                defaultValue={values.organisation}
                placeholder="Organisation name"
                aria-invalid={Boolean(fieldError("organisation"))}
                aria-describedby={
                  fieldError("organisation")
                    ? "access-organisation-description"
                    : undefined
                }
                onChange={() => clearError("organisation")}
                className={inputClass}
              />
            </FormField>

            <FormField
              id="access-role"
              name="role"
              label="Role"
              required
              error={fieldError("role")}
            >
              <input
                id="access-role"
                name="role"
                type="text"
                required
                maxLength={200}
                autoComplete="organization-title"
                defaultValue={values.role}
                placeholder="Head of AI Governance"
                aria-invalid={Boolean(fieldError("role"))}
                aria-describedby={
                  fieldError("role") ? "access-role-description" : undefined
                }
                onChange={() => clearError("role")}
                className={inputClass}
              />
            </FormField>

            <div className="col-span-2 max-[700px]:col-span-1">
              <FormField
                id="access-workflow"
                name="workflow"
                label="Which agent workflow are you responsible for?"
                error={fieldError("workflow")}
              >
                <textarea
                  id="access-workflow"
                  name="workflow"
                  rows={3}
                  maxLength={1000}
                  defaultValue={values.workflow}
                  placeholder="Tell us where stronger evidence would matter most."
                  aria-invalid={Boolean(fieldError("workflow"))}
                  aria-describedby={
                    fieldError("workflow")
                      ? "access-workflow-description"
                      : undefined
                  }
                  onChange={() => clearError("workflow")}
                  className={`${inputClass} resize-y leading-[1.55]`}
                />
              </FormField>
            </div>
          </div>

          <label className="sr-only" htmlFor="access-website">
            Website (leave this field empty)
          </label>
          <input
            id="access-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute left-[-9999px] h-px w-px opacity-0"
          />

          <div className="mt-6 flex items-center gap-5 max-[700px]:flex-col max-[700px]:items-stretch">
            <button
              type="submit"
              disabled={pending}
              className="group inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-full bg-site-accent px-[26px] py-[13px] text-[15px] font-medium tracking-[-0.012em] text-[#1b0e04] transition-colors duration-300 ease-site hover:bg-[#ff9552] disabled:cursor-wait disabled:opacity-70"
            >
              {pending ? "Submitting..." : "Request private preview"}
              {!pending && (
                <Send
                  aria-hidden="true"
                  className="h-3.5 w-3.5 transition-transform duration-300 ease-site group-hover:translate-x-0.5"
                  strokeWidth={1.8}
                />
              )}
            </button>
            <p className="max-w-[29ch] text-[12px] leading-[1.55] text-site-cream/70">
              By submitting, you agree to our{" "}
              <Link
                href="/privacy"
                className="text-site-cream underline decoration-site-cream/40 underline-offset-[4px] hover:text-site-accent"
              >
                Privacy Notice
              </Link>
              .
            </p>
          </div>

          <div aria-live="polite" className="mt-4 min-h-5">
            {failed && !state.fieldErrors ? (
              <p className="text-[13px] leading-[1.55] text-site-rose">
                We couldn&apos;t submit your request. Please try again, or email{" "}
                <a
                  href={`mailto:${PARTNER_EMAIL}`}
                  className="underline underline-offset-[3px] hover:text-site-cream"
                >
                  {PARTNER_EMAIL}
                </a>{" "}
                directly.
              </p>
            ) : Object.keys(clientErrors).length > 0 ||
              (failed && state.fieldErrors) ? (
              <p className="text-[13px] text-site-rose">
                Check the highlighted fields and try again.
              </p>
            ) : null}
          </div>

          <p className="mt-5 max-w-[52ch] border-t border-site-hair pt-[18px] font-site-mono text-[10.5px] leading-[1.75] text-site-cream/65">
            Subra is not regulatory advice and is not endorsed by or affiliated
            with any regulator.
          </p>
        </form>
      )}
    </>
  );
}
