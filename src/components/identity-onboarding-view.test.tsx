import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { IdentityOnboardingView } from "@/components/identity-onboarding-view";

vi.mock("@/lib/auth-actions", () => ({
  signInAction: vi.fn(),
  signOutAction: vi.fn(),
}));

describe("IdentityOnboardingView", () => {
  it("renders the individual due-diligence landing inside the workspace shell", () => {
    render(
      <IdentityOnboardingView
        email="creator@example.com"
        name="Casey Morgan"
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Verify the person behind the organisation",
      }),
    ).toBeDefined();
    expect(screen.getByText("creator@example.com")).toBeDefined();
    expect(
      within(screen.getByRole("contentinfo")).getByText("Casey Morgan"),
    ).toBeDefined();
    expect(screen.getByText("Not started")).toBeDefined();
    expect(
      screen.getByText("Individual identity due diligence"),
    ).toBeDefined();
  });

  it("uses the side panel for onboarding context without repeating top navigation", () => {
    render(
      <IdentityOnboardingView
        email="creator@example.com"
        name="Casey Morgan"
      />,
    );

    expect(
      screen.queryByRole("navigation", { name: "Onboarding stages" }),
    ).toBeNull();

    const sidePanel = screen.getByRole("complementary", {
      name: "Due-diligence stages",
    });
    ["Identity verification", "Organisation verification", "Agent workspace"].forEach(
      (label) => {
        expect(within(sidePanel).getByText(label)).toBeDefined();
      },
    );
  });

  it("keeps the identity provider action disabled without claiming success", () => {
    render(
      <IdentityOnboardingView
        email="creator@example.com"
        name="Casey Morgan"
      />,
    );

    const startButton = screen.getByRole("button", {
      name: "Begin identity check",
    });

    expect(startButton).toHaveProperty("disabled", true);
    expect(
      screen.getByText(/Verification provider not connected yet/),
    ).toBeDefined();
    expect(screen.queryByText(/^Verified$/)).toBeNull();
    expect(screen.queryByText(/^Complete$/)).toBeNull();
  });

  it("explains the assurance boundary, privacy handling, and fallback", () => {
    render(
      <IdentityOnboardingView
        email="creator@example.com"
        name="Casey Morgan"
      />,
    );

    expect(
      screen.getByText(/will not verify a company or prove that you are authorised/),
    ).toBeDefined();
    expect(screen.getByText("Minimal data retained")).toBeDefined();
    expect(
      screen.getByText(/not document images, selfies, video or biometric templates/),
    ).toBeDefined();
    expect(
      screen.getByText(/retry or manual review, not a permanent denial/),
    ).toBeDefined();
  });

  it("provides a footer skip without changing the assurance state", () => {
    render(
      <IdentityOnboardingView
        email="creator@example.com"
        name="Casey Morgan"
      />,
    );

    expect(
      within(screen.getByRole("contentinfo")).getByRole("link", {
        name: "Skip for now",
      }),
    ).toHaveProperty("href", "http://localhost:3000/dashboard");
    expect(
      screen.queryByRole("link", { name: "Continue in read-only mode" }),
    ).toBeNull();
    expect(screen.getByText("Assurance state: not_started")).toBeDefined();
    expect(
      screen.queryByRole("combobox", { name: "Organisation switcher" }),
    ).toBeNull();
  });

  it("shows the onboarding notification state", () => {
    render(
      <IdentityOnboardingView
        email="creator@example.com"
        name="Casey Morgan"
      />,
    );

    expect(screen.getByLabelText("Open notifications")).toBeDefined();
    expect(
      screen.getByText("Identity verification not started"),
    ).toBeDefined();
  });
});
