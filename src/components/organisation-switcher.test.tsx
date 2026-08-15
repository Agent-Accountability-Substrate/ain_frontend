import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OrganisationSwitcher } from "@/components/organisation-switcher";

describe("OrganisationSwitcher", () => {
  it("is disabled when no organisations are accessible", () => {
    render(
      <OrganisationSwitcher organisations={[]} selectedOrganisationId={null} />,
    );

    const switcher = screen.getByRole("combobox", {
      name: "Organisation switcher",
    });
    expect(switcher).toHaveProperty("disabled", true);
    expect(screen.getByText("No organisation selected")).toBeDefined();
  });

  it("selects the provided organisation", () => {
    render(
      <OrganisationSwitcher
        organisations={[{ id: "org-1", name: "Organisation one" }]}
        selectedOrganisationId="org-1"
      />,
    );

    expect(
      screen.getByRole("combobox", { name: "Organisation switcher" }),
    ).toHaveProperty("value", "org-1");
  });
});
