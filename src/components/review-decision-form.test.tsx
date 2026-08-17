import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewDecisionForm } from "@/components/review-decision-form";
import type { DecisionState } from "@/lib/operations-actions";

const { recordDecisionActionMock } = vi.hoisted(() => ({
  recordDecisionActionMock: vi.fn(),
}));

vi.mock("@/lib/operations-actions", () => ({
  recordDecisionAction: recordDecisionActionMock,
}));

function renderForm() {
  render(
    <ReviewDecisionForm
      organisationId="6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d"
      organisationName="Northwind Advisory Ltd"
    />,
  );
}

describe("ReviewDecisionForm", () => {
  beforeEach(() => {
    recordDecisionActionMock.mockReset();
    recordDecisionActionMock.mockImplementation((): DecisionState => ({
      status: "idle",
    }));
  });

  it("asks for no reason when approving", () => {
    // An approval has nothing to explain, and the registry refuses a reason on
    // it rather than ignoring one.
    renderForm();

    expect(screen.queryByLabelText(/why this was refused/i)).toBeNull();
    expect(screen.queryByLabelText(/needs to send/i)).toBeNull();
  });

  it("asks a different question for each outcome that needs one", () => {
    // The reason depends on the outcome, which is why the outcome is chosen
    // first: one notes box would collect the same text for three questions.
    renderForm();

    fireEvent.click(screen.getByRole("radio", { name: /ask for more/i }));
    expect(
      screen.getByLabelText(/what the holder needs to send/i),
    ).toBeDefined();

    fireEvent.click(screen.getByRole("radio", { name: /refuse/i }));
    expect(screen.getByLabelText(/why this was refused/i)).toBeDefined();
  });

  it("labels the button for the outcome, not with a template", () => {
    // "${label} this company" read as "Ask for more this company".
    renderForm();

    expect(
      screen.getByRole("button", { name: "Verify this company" }),
    ).toBeDefined();

    fireEvent.click(screen.getByRole("radio", { name: /ask for more/i }));
    expect(
      screen.getByRole("button", { name: "Send this back for more" }),
    ).toBeDefined();

    fireEvent.click(screen.getByRole("radio", { name: /refuse/i }));
    expect(
      screen.getByRole("button", { name: "Refuse this company" }),
    ).toBeDefined();
  });

  it("warns that no outcome can be taken back", () => {
    renderForm();

    expect(screen.getByText(/taken back through any route/i)).toBeDefined();
  });

  it("reports the outcome in words, never as the raw enum", async () => {
    // `needs_attention` is the registry's word, not a sentence for a person.
    recordDecisionActionMock.mockImplementation((): DecisionState => ({
      status: "recorded",
      outcome: "needs_attention",
    }));
    renderForm();

    fireEvent.click(screen.getByRole("radio", { name: /ask for more/i }));
    fireEvent.change(screen.getByLabelText(/needs to send/i), {
      target: { value: "Send the certificate of incorporation." },
    });
    fireEvent.click(screen.getByRole("button", { name: /send this back/i }));

    expect(
      await screen.findByText(/waiting on more information/i),
    ).toBeDefined();
    expect(screen.queryByText("needs_attention")).toBeNull();
  });

  it("shows a refusal from the registry beside the field", async () => {
    recordDecisionActionMock.mockImplementation((): DecisionState => ({
      status: "error",
      message: "a decision has already been recorded",
      errors: {},
    }));
    renderForm();

    fireEvent.click(
      screen.getByRole("button", { name: /verify this company/i }),
    );

    const alerts = await screen.findAllByRole("alert");
    expect(
      alerts.some(
        (n) => n.textContent === "a decision has already been recorded",
      ),
    ).toBe(true);
  });
});
