import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { IdentityOnboardingView } from "@/domains/identity/identity-onboarding-view";
import {
  initialIndividualAssurance,
  type IndividualAssuranceSummary,
} from "@/domains/identity/identity-assurance";

/** What the registry answers today: verified, from a confirmed address. */
const EMAIL_ONLY: IndividualAssuranceSummary = {
  status: "verified",
  assuranceProfile: "email_verified",
};

vi.mock("@/domains/auth/auth-actions", () => ({
  signOutAction: vi.fn(),
}));

describe("IdentityOnboardingView", () => {
  it("renders the identity check inside the workspace shell", () => {
    render(<IdentityOnboardingView assurance={initialIndividualAssurance} />);

    expect(
      screen.getByRole("heading", {
        name: "Verify the person behind the organisation",
      }),
    ).toBeDefined();
    expect(screen.getByText("Not started")).toBeDefined();
    expect(screen.getByText("Identity check")).toBeDefined();
  });

  it("is one column, with the questions folded away and the check itself not", () => {
    render(<IdentityOnboardingView assurance={initialIndividualAssurance} />);

    expect(screen.queryByRole("complementary")).toBeNull();
    expect(screen.queryByText("Due-diligence stages")).toBeNull();

    // The check is a plain card, not a row: it has no trigger to collapse it,
    // because reading about data handling must never take the button off
    // screen. Base UI's accordion opens one row at a time, so a collapsible
    // first row would do exactly that.
    expect(
      screen.getByRole("heading", { name: "What the check will involve" }),
    ).toBeDefined();
    expect(
      screen.queryByRole("button", { name: /What the check will involve/ }),
    ).toBeNull();

    // Everything answering "and what about…" is a row, and starts closed.
    const questions = screen.getAllByRole("button", { expanded: false });
    expect(questions).toHaveLength(2);
  });

  it("keeps the identity provider action disabled without claiming success", () => {
    render(<IdentityOnboardingView assurance={initialIndividualAssurance} />);

    const startButton = screen.getByRole("button", {
      name: "Begin identity check",
    });

    expect(startButton).toHaveProperty("disabled", true);
    expect(screen.getByText(/This check is not open yet/)).toBeDefined();
    expect(screen.queryByText(/^Verified$/)).toBeNull();
    expect(screen.queryByText(/^Complete$/)).toBeNull();
  });

  it("explains the privacy handling and the fallback", () => {
    render(<IdentityOnboardingView assurance={initialIndividualAssurance} />);

    // The closed rows stay in the document — `hiddenUntilFound` — so a closed
    // row is never a hidden answer, and find-in-page still reaches it.
    expect(screen.getByRole("button", { name: /What we keep/ })).toBeDefined();
    expect(
      screen.getByText(
        /no document images, selfies, video or biometric templates/,
      ),
    ).toBeDefined();
    expect(
      screen.getByText(/retry or a manual review, not a permanent denial/),
    ).toBeDefined();
  });

  it("reports the level held, not just the status", () => {
    // A bare "Verified" would claim this check had run, when a confirmed
    // address is all the registry holds (`ain_docs` DECISIONS.md, 2026-08-16).
    render(<IdentityOnboardingView assurance={EMAIL_ONLY} />);

    expect(screen.getByText("Verified · email only")).toBeDefined();
    expect(screen.queryByText("Not started")).toBeNull();
    expect(
      screen.getByText(/we have only confirmed your email address/),
    ).toBeDefined();
  });

  it("keeps an unrecognised profile a token rather than inventing wording", () => {
    render(
      <IdentityOnboardingView
        assurance={{ status: "verified", assuranceProfile: "eidas_high" }}
      />,
    );

    expect(screen.getByText("Verified")).toBeDefined();
  });

  it("can be left without finishing it", () => {
    render(<IdentityOnboardingView assurance={initialIndividualAssurance} />);

    // A flow, not a gate: nothing here blocks registering a company, so the
    // way out is a close in the corner rather than a decision to skip.
    expect(
      screen.getByRole("link", { name: "Close the identity check" }),
    ).toHaveProperty("href", "http://localhost:3000/o");
    expect(
      screen.queryByRole("link", { name: "Continue in read-only mode" }),
    ).toBeNull();
    expect(
      screen.queryByRole("combobox", { name: "Organisation switcher" }),
    ).toBeNull();
  });
});
