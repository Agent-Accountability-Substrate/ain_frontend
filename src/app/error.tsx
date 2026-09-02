"use client";

import { useEffect } from "react";

import { logger } from "@/lib/logger";
import { Button, ButtonLink } from "@/lib/ui/button";
import { Eyebrow } from "@/lib/ui/eyebrow";

/**
 * The backstop, for what nobody anticipated.
 *
 * Deliberately says almost nothing about the cause, because it cannot know:
 * Next replaces a Server Component's error message with a generic one in
 * production and passes only `digest`, so any wording here that guessed at a
 * reason would be wrong as often as right. The expected failures — an expired
 * access token, a registry that is not answering — are caught in the page and
 * rendered inside the workspace with their real explanations.
 *
 * `digest` is shown because it is the one thing that ties this screen to a
 * server log line. `reset()` re-renders the segment, which is worth offering:
 * a transient failure fixes itself and a persistent one costs a click.
 */
export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Through the logger, not console: it is the one sanctioned sink, and it
    // keeps the shape of this line the same as every other. Sentry captures
    // the error itself via instrumentation; this ties the digest on screen to
    // a log entry. The message is safe to record — for a Server Component
    // error Next has already replaced it with a generic string.
    logger.error("workspace.unhandled_error", { digest: error.digest ?? null });
  }, [error]);

  return (
    <main className="workspace-canvas flex min-h-screen items-center justify-center p-6">
      <section
        aria-label="Something went wrong"
        className="flex w-[min(100%,36rem)] flex-col gap-5 rounded-2xl border border-line bg-white p-6"
      >
        <div className="flex flex-col gap-2">
          <Eyebrow>Unexpected error</Eyebrow>
          <h1 className="text-xl font-semibold tracking-[-0.02em] text-ink">
            Something went wrong
          </h1>
          <p className="text-xs leading-5 text-mist">
            This one is ours, not yours. Nothing you submitted has been lost,
            and trying again is safe.
          </p>
          {error.digest ? (
            <p className="rounded-xl border border-frost bg-wash-blue p-3 text-[11px] leading-5 text-ink-muted">
              Reference <code className="font-mono">{error.digest}</code> —
              quote it if you get in touch.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ButtonLink href="/dashboard">Back to overview</ButtonLink>
          <Button type="button" onClick={reset}>
            Try again
          </Button>
        </div>
      </section>
    </main>
  );
}
