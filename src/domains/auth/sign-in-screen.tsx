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

/**
 * The head this screen needs, kept beside it.
 *
 * `/signin` forwards to Auth0, so this renders nowhere yet and a component
 * cannot export page metadata. Held here so switching the screen on is
 * `export { metadata } from` and nothing else.
 *
 * `title` is bare: the root template in `app/layout.tsx` renders it as
 * "Sign in · Subra".
 */
export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the Subra accountability register.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Sign in · Subra",
    description: "Sign in to the Subra accountability register.",
  },
};

/**
 * The hand-made sign-in screen — built, kept, and not currently served.
 *
 * `/signin` is a route handler that forwards to Auth0's Universal Login, so
 * nothing renders this today. It stays in the tree, and under test, as the
 * design that replaces the hosted page: point the route at this component and
 * give `AuthForm` a server action.
 */
export function SignInScreen() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-site-paper px-5 pt-[clamp(34px,7vh,74px)] pb-10 font-site-sans leading-[normal] text-site-ink">
      <AuthBrand className="mb-[clamp(26px,4vh,44px)]" />

      <div className="w-full max-w-[27rem] rounded-2xl border border-site-rule bg-white/55 p-[clamp(26px,4vw,40px)] shadow-[0_1px_2px_rgba(22,24,28,0.04),0_22px_50px_-34px_rgba(22,24,28,0.4)]">
        <h1 className="m-0 text-[25px] font-medium tracking-[-0.03em]">
          Sign in to Subra
        </h1>
        <p className="mt-3 text-[14.5px] leading-[1.55] text-site-ink-soft">
          The register is read by your firm’s own people. Everything you do here
          is attributable.
        </p>

        <AuthForm>
          <AuthField
            id="email"
            name="email"
            type="email"
            label="Work email"
            placeholder="name@firm.co.uk"
            autoComplete="email"
          />
          <AuthField
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="••••••••••"
            autoComplete="current-password"
            trailing={
              <a
                href="#reset"
                className="text-[12px] text-site-ink-soft underline underline-offset-[3px] hover:text-site-accent"
              >
                Forgot your password?
              </a>
            }
          />

          <AuthCheck name="remember">
            Keep me signed in on this device
          </AuthCheck>

          <AuthSubmit>Sign in</AuthSubmit>
        </AuthForm>

        <AuthAlternatives />

        <p className="mt-[26px] text-center text-[14px] text-site-muted">
          Not set up yet?{" "}
          <Link
            href="/signup"
            className="font-medium text-site-ink underline underline-offset-[3px] hover:text-site-accent"
          >
            Create your account
          </Link>
        </p>
      </div>

      <AuthLegal>
        Subra never holds your signing keys. © 2026 Subra Inc. ·{" "}
        <a
          href="#privacy"
          className="text-site-muted underline underline-offset-[3px]"
        >
          Privacy &amp; terms
        </a>
      </AuthLegal>
    </main>
  );
}
