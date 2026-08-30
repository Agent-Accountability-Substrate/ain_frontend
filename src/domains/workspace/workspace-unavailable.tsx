import { CloudOff } from "lucide-react";

import { ButtonLink } from "@/lib/ui/button";
import { Eyebrow } from "@/lib/ui/eyebrow";

/**
 * The workspace, with the registry not answering.
 *
 * It carries its own frame rather than sitting inside the shell, because the
 * shell is built from the membership list and that is exactly what could not
 * be read. Offering a rail here would mean inventing the one fact that is
 * missing. The account menu goes with it; signing out still works from the
 * landing page.
 */
export function WorkspaceUnavailable({
  detail,
  email,
}: {
  detail: string;
  email: string | null | undefined;
}) {
  return (
    <main className="flex h-[100dvh] items-center justify-center bg-[#f3f6fa] p-6">
      <section
        aria-label="Registry unavailable"
        className="flex w-[min(100%,36rem)] flex-col gap-5 rounded-2xl border border-line bg-white p-6"
      >
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-line-soft text-ink-muted">
            <CloudOff className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-2">
            <Eyebrow>Registry unavailable</Eyebrow>
            <h1 className="text-lg font-semibold tracking-[-0.02em] text-ink">
              We could not load your workspace
            </h1>
            <p role="alert" className="text-xs leading-5 text-mist">
              {detail}
            </p>
            {email ? (
              <p className="text-[11px] text-mist-light">
                Signed in as {email}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex">
          {/* A plain link rather than a router refresh: this was server-
              rendered from a failed read, so the only thing that helps is
              asking the server again. */}
          <ButtonLink variant="primary" href="/o">
            Try again
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
