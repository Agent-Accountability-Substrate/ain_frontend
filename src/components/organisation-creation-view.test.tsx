import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OrganisationCreationView } from "@/components/organisation-creation-view";

vi.mock("@/lib/auth-actions", () => ({
  signInAction: vi.fn(),
  signOutAction: vi.fn(),
}));

describe("OrganisationCreationView", () => {
  it("moves from organisation details into the agent wizard", () => {
    render(<OrganisationCreationView email="owner@example.com" />);

    expect(
      screen.getByRole("heading", { name: "Create your first organisation" }),
    ).toBeDefined();
    expect(screen.queryByRole("combobox", { name: "Organisation switcher" }))
      .toBeDefined();
    expect(
      within(screen.getByRole("contentinfo")).getByText(
        "No organisation selected",
      ),
    ).toBeDefined();

    fireEvent.change(screen.getByLabelText("Legal organisation name"), {
      target: { value: "Example Holdings Ltd" },
    });
    fireEvent.change(screen.getByLabelText("Companies House number"), {
      target: { value: "01234567" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /continue to authority/i }),
    );

    expect(screen.getByText("Authority and review")).toBeDefined();
    fireEvent.click(
      screen.getByLabelText(
        /I confirm I am authorised to submit this organisation/i,
      ),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /complete organisation setup/i }),
    );

    expect(
      screen.getByRole("heading", { name: "Create your first agent" }),
    ).toBeDefined();
    expect(screen.getAllByText("Example Holdings Ltd")).toHaveLength(2);
    expect(
      within(screen.getByRole("contentinfo")).getByRole("combobox", {
        name: "Organisation switcher",
      }),
    ).toHaveProperty("disabled", false);
  });
});
