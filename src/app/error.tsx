"use client";

import { useEffect } from "react";

import { logger } from "@/lib/logger";

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
    logger.error("workspace.unhandled_error", {
      digest: error.digest ?? null,
    });
  }, [error]);

  return (
    <main className="dashboard-canvas">
      <section className="dashboard-shell" aria-label="Something went wrong">
        <div className="account-route-workspace">
          <div className="wizard-form">
            <div className="wizard-form-heading">
              <div>
                <p className="dashboard-eyebrow">Unexpected error</p>
                <h1>Something went wrong</h1>
                <p>
                  This one is ours, not yours. Nothing you submitted has been
                  lost, and trying again is safe.
                </p>
                {error.digest ? (
                  <p className="wizard-form-note">
                    Reference <code>{error.digest}</code> — quote it if you get
                    in touch.
                  </p>
                ) : null}
              </div>
            </div>
            <div className="wizard-form-actions">
              <a className="wizard-secondary-action" href="/dashboard">
                Back to overview
              </a>
              <button
                type="button"
                className="wizard-primary-action"
                onClick={reset}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
