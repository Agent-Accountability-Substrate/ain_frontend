"use client";

import { FileCheck2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import {
  requestEvidencePackAction,
  type RequestPackState,
} from "@/domains/agents/evidence-actions";
import { PACKAGE_CONTENTS } from "@/domains/agents/evidence-pack";
import { Button } from "@/lib/ui/button";
import { Callout } from "@/lib/ui/callout";
import { Card } from "@/lib/ui/card";
import { Eyebrow } from "@/lib/ui/eyebrow";
import { TextField } from "@/lib/ui/text-field";

/**
 * Asking for a package over a period.
 *
 * Two dates and nothing else. The MVP ships one package type, so a chooser
 * offering one option would be a control that cannot be operated wrongly and
 * cannot be operated at all — what the package contains is stated instead, so a
 * reader knows what they are asking for before it exists.
 *
 * The period is UTC and the form says so. The registry demands an offset on both
 * bounds precisely so nobody guesses a zone, and a browser quietly substituting
 * its own would shift a July package by a day at exactly the month boundaries
 * these land on.
 */

/** Today in UTC, for the same reason the period is: `toISOString` is UTC. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function EvidencePackRequestForm({
  organisationId,
  ain,
  newestHref,
}: {
  organisationId: string;
  ain: string;
  /**
   * Where the newest page of the listing is, when this form is being shown
   * on a later one. A package lands at the top of a newest-first listing, so
   * "it is listed below" is only true where below *is* the top.
   */
  newestHref?: string;
}) {
  const [state, action, pending] = useActionState<RequestPackState, FormData>(
    requestEvidencePackAction,
    { status: "idle" },
  );
  const errors = state.status === "error" ? state.errors : {};
  const max = today();

  return (
    <Card
      as="section"
      aria-labelledby="request-title"
      className="flex flex-col gap-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wash-blue text-cobalt">
          <FileCheck2 className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <Eyebrow>Request a package</Eyebrow>
          <h2 id="request-title" className="text-sm font-semibold text-ink">
            Assemble this agent&rsquo;s record for a period
          </h2>
          <p className="text-[11px] leading-4 text-mist">
            The registry assembles and signs the package away from this page. It
            appears below as soon as it is asked for, and becomes downloadable
            when it is ready.
          </p>
        </div>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="organisationId" value={organisationId} />
        <input type="hidden" name="ain" value={ain} />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="From"
            name="from"
            type="date"
            required
            max={max}
            defaultValue=""
            description="Whole day, from 00:00:00 UTC"
            {...(errors.from !== undefined && { error: errors.from })}
          />
          <TextField
            label="To"
            name="to"
            type="date"
            required
            max={max}
            defaultValue=""
            description="Whole day, to 23:59:59 UTC"
            {...(errors.to !== undefined && { error: errors.to })}
          />
        </div>

        {/* A refusal the fields already carry is not repeated in a banner; one
            they cannot carry — an outage, an expired session — has nowhere
            else to go. */}
        {state.status === "error" &&
        errors.from === undefined &&
        errors.to === undefined ? (
          <Callout tone="danger" alert>
            {state.message}
          </Callout>
        ) : null}

        {state.status === "done" ? (
          // Informational, not a success banner: what landed is the request,
          // and the package does not exist until the registry has assembled
          // and signed it.
          <Callout icon={FileCheck2}>
            {newestHref === undefined ? (
              "Requested. It is listed below and will say when it is ready."
            ) : (
              <>
                Requested. It is at the top of the listing, which is not this
                page — <Link href={newestHref}>see the newest</Link>.
              </>
            )}
          </Callout>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          className="w-fit"
          disabled={pending}
        >
          {pending ? "Requesting…" : "Request package"}
        </Button>
      </form>

      <div className="flex flex-col gap-2 border-t border-line pt-4">
        <Eyebrow>What a package contains</Eyebrow>
        <ol className="grid gap-1 text-[11px] leading-5 text-mist sm:grid-cols-2">
          {PACKAGE_CONTENTS.map((record, index) => (
            <li key={record} className="flex gap-2">
              <span className="font-mono text-mist-light">
                {String(index + 1).padStart(2, "0")}
              </span>
              {record}
            </li>
          ))}
        </ol>
        <p className="text-[11px] leading-4 text-mist-light">
          Narrative is templated, not generated. No model decides what a record
          means.
        </p>
      </div>
    </Card>
  );
}
