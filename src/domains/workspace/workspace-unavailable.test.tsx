import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WorkspaceUnavailable } from "@/domains/workspace/workspace-unavailable";

vi.mock("@/domains/auth/auth-actions", () => ({ signOutAction: vi.fn() }));

describe("WorkspaceUnavailable", () => {
  it("keeps the workspace navigable while the registry is down", () => {
    // The failure is real but it is not the end of the session. A page that
    // loses its navigation turns a passing outage into a dead end.
    render(
      <WorkspaceUnavailable
        currentPath="/dashboard"
        detail="storage is temporarily unavailable"
        email="owner@example.com"
        workspaceLabel="Overview"
      />,
    );

    expect(screen.getByRole("alert").textContent).toBe(
      "storage is temporarily unavailable",
    );
    expect(screen.getByRole("link", { name: "Overview" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Organisations" })).toBeDefined();
  });

  it("offers a retry that asks the server again", () => {
    // A router refresh would not help: this page was server-rendered from a
    // failed read, so only another request can succeed.
    render(
      <WorkspaceUnavailable
        currentPath="/organisations"
        detail="The registry is not answering right now."
        email="owner@example.com"
        workspaceLabel="Organisations"
      />,
    );

    expect(
      screen.getByRole("link", { name: "Try again" }).getAttribute("href"),
    ).toBe("/organisations");
  });

  it("invents no data it could not read", () => {
    render(
      <WorkspaceUnavailable
        currentPath="/dashboard"
        detail="down"
        email="owner@example.com"
        workspaceLabel="Overview"
      />,
    );

    // No counts, no organisation names — showing zeros would be a claim.
    expect(screen.queryByText(/organisations owned/i)).toBeNull();
  });
});
