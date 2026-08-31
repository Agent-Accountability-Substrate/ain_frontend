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

  it("offers a retry that asks the server again, for the page that failed", () => {
    // Two properties, and the outage screen is useless without either. A
    // router transition would not help — this was server-rendered from a
    // failed read, so only another document request can succeed — and a fixed
    // `/o` would answer a question nobody asked, sending someone whose members
    // page failed somewhere else entirely.
    render(<WorkspaceUnavailable detail="down" email="owner@example.com" />);

    const retry = screen.getByRole("link", { name: "Try again" });
    // `usePathname` is stubbed at "/" — the point is that it is the caller's
    // path rather than a constant.
    expect(retry.getAttribute("href")).toBe("/");
    // `next/link` sets neither of these, and would soft-navigate inside the
    // very layout segment that is rendering this instead of its children.
    expect(retry.getAttribute("data-prefetch")).toBeNull();
  });

  it("says nothing about who is signed in when nobody is", () => {
    render(<WorkspaceUnavailable detail="down" email={null} />);

    expect(screen.queryByText(/signed in as/i)).toBeNull();
  });
});
