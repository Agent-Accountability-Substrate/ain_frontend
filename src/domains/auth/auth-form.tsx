"use client";

import type { FormEvent, ReactNode } from "react";

/**
 * The form element both auth pages post to — which is to say, nowhere.
 *
 * These screens are drawn and not yet wired: sign-in still goes through Auth0's
 * hosted pages. Left as a plain `<form>` with no action, the browser would
 * submit it as a GET to the current URL and put a typed password in the query
 * string, in the address bar and in every access log between here and the
 * proxy. So the submit is intercepted and dropped.
 *
 * When these pages are connected, replace `onSubmit` with a server action —
 * the markup below it does not need to change.
 */
export function AuthForm({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      noValidate={false}
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
      }}
      className={className}
    >
      {children}
    </form>
  );
}
