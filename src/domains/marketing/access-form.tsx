"use client";

import { Check, Send } from "lucide-react";
import Link from "next/link";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { RevealHeading } from "@/domains/marketing/reveal";
import {
  requestAccessAction,
  type AccessRequestField,
  type AccessRequestFieldErrors,
  type AccessRequestState,
} from "@/domains/marketing/access-request";
import { PARTNER_EMAIL } from "@/domains/marketing/landing-content";

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

/** The closing private-preview request and its complete delivery states. */
export function AccessForm() {
  const stageRef = useRef<HTMLElement>(null);
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

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof window.matchMedia !== "function") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame: number | undefined;

    const reset = () => {
      stage.style.setProperty("--preview-x", "0");
      stage.style.setProperty("--preview-y", "0");
      stage.style.setProperty("--preview-scroll", "0");
    };

    const updateScrollDepth = () => {
      animationFrame = undefined;
      if (reducedMotion.matches) {
        reset();
        return;
      }

      const rect = stage.getBoundingClientRect();
      const viewportCentre = window.innerHeight / 2;
      const stageCentre = rect.top + rect.height / 2;
      const travel = (window.innerHeight + rect.height) / 2;
      const progress = Math.max(
        -1,
        Math.min(1, (viewportCentre - stageCentre) / travel),
      );
      stage.style.setProperty("--preview-scroll", progress.toFixed(3));
    };

    const scheduleScrollDepth = () => {
      if (animationFrame === undefined) {
        animationFrame = window.requestAnimationFrame(updateScrollDepth);
      }
    };

    const syncMotionPreference = () => {
      if (reducedMotion.matches) reset();
      else scheduleScrollDepth();
    };

    window.addEventListener("scroll", scheduleScrollDepth, { passive: true });
    window.addEventListener("resize", scheduleScrollDepth);
    reducedMotion.addEventListener("change", syncMotionPreference);
    scheduleScrollDepth();

    return () => {
      window.removeEventListener("scroll", scheduleScrollDepth);
      window.removeEventListener("resize", scheduleScrollDepth);
      reducedMotion.removeEventListener("change", syncMotionPreference);
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  function moveAtmosphere(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") return;

    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    event.currentTarget.style.setProperty("--preview-x", x.toFixed(3));
    event.currentTarget.style.setProperty("--preview-y", y.toFixed(3));
  }

  function resetAtmosphere(event: ReactPointerEvent<HTMLElement>) {
    event.currentTarget.style.setProperty("--preview-x", "0");
    event.currentTarget.style.setProperty("--preview-y", "0");
  }

  return (
    <section
      ref={stageRef}
      id="request"
      onPointerMove={moveAtmosphere}
      onPointerLeave={resetAtmosphere}
      className="private-preview-stage relative isolate scroll-mt-24 overflow-hidden bg-[linear-gradient(132deg,#e7e2dc_0%,#d8d6d2_52%,#e7ddd4_100%)] pt-[clamp(84px,9.4vw,138px)] pb-[clamp(78px,8.8vw,126px)]"
    >
      <div
        aria-hidden="true"
        className="private-preview-atmosphere pointer-events-none absolute -inset-[3%] -z-10 bg-[radial-gradient(ellipse_at_50%_48%,rgba(255,252,247,0.72),transparent_54%),radial-gradient(circle_at_92%_6%,rgba(222,112,58,0.16),transparent_25%),radial-gradient(circle_at_5%_96%,rgba(255,250,242,0.62),transparent_30%),repeating-radial-gradient(circle_at_96%_10%,transparent_0_104px,rgba(11,17,39,0.075)_105px_106px)]"
      />
      <div
        aria-hidden="true"
        className="private-preview-grid pointer-events-none absolute -inset-4 -z-10 opacity-40 [background-image:linear-gradient(rgba(11,17,39,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(11,17,39,0.07)_1px,transparent_1px)] [background-size:82px_82px] [mask-image:linear-gradient(90deg,black,transparent_24%,transparent_76%,black)]"
      />
      <div
        aria-hidden="true"
        className="private-preview-watermark pointer-events-none absolute top-[7%] left-[-0.045em] -z-10 whitespace-nowrap font-site-sans text-[clamp(76px,11vw,170px)] leading-[0.73] font-semibold tracking-[-0.075em] text-site-ink/[0.045] uppercase select-none"
      >
        Private preview
      </div>

      <div className="relative z-[1] mx-auto max-w-[1320px] px-[clamp(20px,3.05vw,44px)]">
        <div
          aria-hidden="true"
          className="private-preview-frame pointer-events-none absolute inset-x-[clamp(10px,1.5vw,22px)] inset-y-[-28px] -z-10 border border-site-ink/10 max-[700px]:inset-x-3 max-[700px]:inset-y-[-18px]"
        >
          <span className="absolute -top-px -left-px h-5 w-5 border-t border-l border-site-ink/45" />
          <span className="absolute -top-px -right-px h-5 w-5 border-t border-r border-site-ink/45" />
          <span className="absolute -bottom-px -left-px h-5 w-5 border-b border-l border-site-ink/45" />
          <span className="absolute -right-px -bottom-px h-5 w-5 border-r border-b border-site-ink/45" />

          <span className="absolute top-[-20px] left-8 bg-[#dfdcd7] px-3 font-site-mono text-[9px] uppercase tracking-[0.18em] text-site-ink/55 max-[700px]:hidden">
            Private access / 01
          </span>
          <span className="absolute right-8 bottom-[-20px] bg-[#e2d9d1] px-3 font-site-mono text-[9px] uppercase tracking-[0.18em] text-site-ink/55 max-[700px]:hidden">
            Subra / limited cohort
          </span>

          <span className="absolute top-1/2 left-[-42px] -translate-y-1/2 -rotate-90 font-site-mono text-[8px] uppercase tracking-[0.24em] text-site-ink/35 max-[900px]:hidden">
            Evidence infrastructure
          </span>
          <span className="absolute top-1/2 right-[-22px] h-px w-11 -translate-y-1/2 bg-site-accent/70" />
          <span className="absolute top-1/2 right-[-24px] h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-site-accent" />
        </div>

        <div className="site-dots relative grid items-start gap-[clamp(42px,5.2vw,76px)] overflow-hidden rounded-[clamp(14px,1.8vw,26px)] bg-site-ink p-[clamp(32px,4.6vw,66px)] text-site-cream [grid-template-columns:minmax(0,0.82fr)_minmax(0,1.18fr)] after:pointer-events-none after:absolute after:inset-0 after:z-0 after:bg-[radial-gradient(58%_52%_at_90%_108%,rgba(255,233,198,0.12),transparent_70%)] after:content-[''] max-[1000px]:grid-cols-[minmax(0,1fr)]">
          <div className="relative z-[1]">
            <div className="mb-[22px] font-site-mono text-[10.5px] uppercase tracking-[0.16em] text-site-accent select-none">
              Private preview
            </div>
            <RevealHeading
              lead="Be ready to explain every"
              accent="agent action that matters."
              className="max-w-[14ch] text-[clamp(30px,4.2vw,48px)] leading-[1.04] font-medium tracking-[-0.04em] text-site-cream"
            />
            <p className="mt-6 max-w-[43ch] text-[16px] leading-[1.68] text-site-cream/80">
              We&apos;re working with a limited number of regulated
              organisations that operate real AI-agent workflows and need
              stronger evidence around authority, accountability and actions.
            </p>
            <div className="mt-9 flex items-center gap-3 border-t border-site-hair pt-5 font-site-mono text-[10px] uppercase tracking-[0.13em] text-site-cream-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-site-accent" />
              Limited preview cohort
            </div>
          </div>

          <div className="relative z-[1]">
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
                        fieldError("name")
                          ? "access-name-description"
                          : undefined
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
                        fieldError("role")
                          ? "access-role-description"
                          : undefined
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
                        aria-describedby="access-workflow-description"
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
                      We couldn&apos;t submit your request. Please try again, or
                      email{" "}
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
                  Subra is not regulatory advice and is not endorsed by or
                  affiliated with any regulator.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
