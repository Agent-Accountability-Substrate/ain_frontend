import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorkspaceUnavailable } from "@/domains/workspace/workspace-unavailable";

describe("WorkspaceUnavailable", () => {
  it("says what failed", () => {
    render(
      <WorkspaceUnavailable
        detail="storage is temporarily unavailable"
        email="owner@example.com"
      />,
    );

    expect(screen.getByRole("alert").textContent).toBe(
      "storage is temporarily unavailable",
    );
  });

  it("carries no rail, because the rail is what could not be read", () => {
    // Every section hangs off an organisation, and the membership list is
    // exactly what the registry could not answer for. Offering sections here
    // would be inventing the one missing fact.
    render(<WorkspaceUnavailable detail="down" email="owner@example.com" />);

    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.queryByText(/organisations owned/i)).toBeNull();
  });

  it("offers a retry that asks the server again", () => {
    // A router refresh would not help: this was server-rendered from a failed
    // read, so only another request can succeed.
    render(<WorkspaceUnavailable detail="down" email="owner@example.com" />);

    expect(
      screen.getByRole("link", { name: "Try again" }).getAttribute("href"),
    ).toBe("/o");
  });

  it("says nothing about who is signed in when nobody is", () => {
    render(<WorkspaceUnavailable detail="down" email={null} />);

    expect(screen.queryByText(/signed in as/i)).toBeNull();
  });
});
