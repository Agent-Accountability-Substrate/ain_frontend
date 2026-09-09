import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { actionMock } = vi.hoisted(() => ({ actionMock: vi.fn() }));

vi.mock("@/domains/agents/evidence-actions", () => ({
  requestEvidencePackAction: actionMock,
}));

import { EvidencePackRequestForm } from "@/domains/agents/evidence-pack-request-form";
import { PACKAGE_CONTENTS } from "@/domains/agents/evidence-pack";

const ORG_ID = "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d";
const AIN = "did:ain:gb:01ARZ3NDEKTSV4RRFFQ69G5FAV:01BX5ZZKBKACTAV9WEVGEMMVRZ";

const form = (newestHref?: string) =>
  render(
    <EvidencePackRequestForm
      organisationId={ORG_ID}
      ain={AIN}
      {...(newestHref !== undefined && { newestHref })}
    />,
  );

/**
 * Fill the period and submit, so `useActionState` actually transitions.
 *
 * `requestSubmit`, not `fireEvent.submit`: React refuses a form submitted
 * around it and says so in the thrown message.
 */
async function submit() {
  fireEvent.change(screen.getByLabelText("From"), {
    target: { value: "2026-07-01" },
  });
  fireEvent.change(screen.getByLabelText("To"), {
    target: { value: "2026-07-31" },
  });
  const button = screen.getByRole("button", { name: /Request package/ });
  await act(async () => {
    button.closest("form")!.requestSubmit();
  });
  await waitFor(() => expect(actionMock).toHaveBeenCalled());
}

describe("what the confirmation says", () => {
  beforeEach(() => {
    actionMock.mockReset();
    actionMock.mockResolvedValue({ status: "done", packId: "p" });
  });

  it("points at the listing below, on the page that has it", async () => {
    form();

    await submit();

    await waitFor(() =>
      expect(screen.getByText(/listed below/i)).not.toBeNull(),
    );
    expect(screen.queryByRole("link", { name: /see the newest/i })).toBeNull();
  });

  it("points at the newest page from a deep one, where below is not the top", async () => {
    // A package lands at the top of a newest-first listing, so "listed below"
    // would be false everywhere but the first page.
    form("/o/ULID/agents/AIN/evidence-packs");

    await submit();

    const link = await waitFor(() =>
      screen.getByRole("link", { name: /see the newest/i }),
    );
    expect(link.getAttribute("href")).toBe("/o/ULID/agents/AIN/evidence-packs");
    expect(screen.queryByText(/listed below/i)).toBeNull();
  });
});

describe("asking for a package", () => {
  it("asks for a period and nothing else", () => {
    // One package type ships, so a chooser offering one option would be a
    // control that cannot be operated. What it contains is stated instead.
    form();

    expect(screen.getByLabelText("From")).not.toBeNull();
    expect(screen.getByLabelText("To")).not.toBeNull();
    expect(screen.queryByLabelText(/type/i)).toBeNull();
    expect(screen.queryByLabelText(/version/i)).toBeNull();
  });

  it("says the period is UTC at both ends", () => {
    // The registry demands an offset on both bounds precisely so nobody
    // guesses a zone. A browser substituting its own would move a July
    // package by a day at exactly the month boundary these land on.
    form();

    expect(screen.getByText(/from 00:00:00 UTC/)).not.toBeNull();
    expect(screen.getByText(/to 23:59:59 UTC/)).not.toBeNull();
  });

  it("refuses a period that has not happened yet", () => {
    form();

    const today = new Date().toISOString().slice(0, 10);
    for (const label of ["From", "To"]) {
      expect(screen.getByLabelText(label).getAttribute("max")).toBe(today);
    }
  });

  it("carries the tenant and the agent rather than trusting the server to guess", () => {
    const { container } = form();

    expect(
      container.querySelector<HTMLInputElement>('input[name="organisationId"]')
        ?.value,
    ).toBe(ORG_ID);
    expect(
      container.querySelector<HTMLInputElement>('input[name="ain"]')?.value,
    ).toBe(AIN);
  });

  it("lists what a package will contain, before it exists", () => {
    form();

    for (const record of PACKAGE_CONTENTS) {
      expect(screen.getByText(record)).not.toBeNull();
    }
  });

  it("says the narrative is templated rather than generated", () => {
    form();

    expect(screen.getByText(/templated, not generated/i)).not.toBeNull();
  });
});
