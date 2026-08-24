import type { Metadata } from "next";
import Link from "next/link";

import { AuthBrand } from "@/domains/auth/auth-brand";
import {
  AuthAlternatives,
  AuthCheck,
  AuthField,
  AuthLegal,
  AuthSubmit,
} from "@/domains/auth/auth-fields";
import { AuthForm } from "@/domains/auth/auth-form";
import { SignupPassport } from "@/domains/auth/signup-passport";

/**
 * As `sign-in-screen.tsx`. The og:title differs from the `<title>` on purpose:
 * "Create your account" is what a shared link should say, "Sign up" is what a
 * tab should.
 */
export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a Subra account. Preview access is granted per firm.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Create your account · Subra",
    description: "Create a Subra account. Preview access is granted per firm.",
  },
};

/**
 * The hand-made sign-up screen — built, kept, and not currently served.
 *
 * See `sign-in-screen.tsx`. The panel is dropped below 900px rather than
 * stacked: a decorative card above a form is something a visitor scrolls past
 * to reach what they came for.
 */
export function SignUpScreen() {
  return (
    <main className="grid min-h-screen grid-cols-2 bg-site-paper font-site-sans leading-[normal] text-site-ink max-[900px]:grid-cols-[minmax(0,1fr)]">
      <aside className="site-dots relative flex flex-col justify-center overflow-hidden bg-site-ink p-[clamp(34px,5vw,72px)] text-site-cream max-[900px]:hidden after:pointer-events-none after:absolute after:inset-0 after:bg-[radial-gradient(52%_38%_at_50%_108%,rgba(255,233,198,0.3),transparent_70%),radial-gradient(64%_46%_at_50%_112%,rgba(240,128,60,0.26),transparent_72%)] after:content-['']">
        <div className="relative z-[1]">
          <SignupPassport />

          <p className="mt-10 max-w-[30ch] text-[clamp(19px,1.9vw,24px)] leading-[1.35] font-medium tracking-[-0.028em] text-site-cream">
            Every agent your firm runs,{" "}
            <span className="text-site-accent">on the record.</span>
          </p>
          <p className="mt-[18px] max-w-[38ch] text-[14.5px] leading-[1.6] text-site-cream-soft">
            One identifier per agent, every version it has ever had, and the
            role that answers for each one.
          </p>
        </div>
      </aside>

      <section className="flex flex-col justify-center px-[clamp(20px,4vw,60px)] py-[clamp(34px,5vw,72px)]">
        <div className="mx-auto w-full max-w-[26rem]">
          <AuthBrand />

          <h1 className="mt-[26px] text-[26px] font-medium tracking-[-0.03em]">
            Create your account
          </h1>
          <p className="mt-3 text-[14.5px] leading-[1.55] text-site-ink-soft">
            Preview access is granted per firm. If you have not spoken to us
            yet,{" "}
            <Link
              href="/#request"
              className="text-site-ink underline underline-offset-[3px] hover:text-site-accent"
            >
              book a demo
            </Link>{" "}
            first.
          </p>

          <AuthForm>
            <AuthField
              id="su-email"
              name="email"
              type="email"
              label="Email"
              placeholder="name@firm.co.uk"
              autoComplete="email"
            />
            <AuthField
              id="su-name"
              name="name"
              type="text"
              label="Full name"
              placeholder="Ada Lovelace"
              autoComplete="name"
            />
            <AuthField
              id="su-password"
              name="password"
              type="password"
              label="Password"
              placeholder="At least 12 characters"
              autoComplete="new-password"
              hint="Twelve characters or more. It never touches the register itself."
            />

            <AuthCheck name="terms" required>
              I accept the terms of service and the privacy policy.
            </AuthCheck>

            <AuthSubmit accent>Create account</AuthSubmit>
          </AuthForm>

          <AuthAlternatives />

          <p className="mt-[26px] text-center text-[14px] text-site-muted">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-medium text-site-ink underline underline-offset-[3px] hover:text-site-accent"
            >
              Sign in
            </Link>
          </p>

          <AuthLegal>
            Subra never holds your signing keys, and is not regulatory advice. ©
            2026 Subra Inc.
          </AuthLegal>
        </div>
      </section>
    </main>
  );
}
