import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import WorkspaceError from "@/app/error";

describe("the error boundary", () => {
  it("shows the digest, which is all it can honestly offer", () => {
    // Next replaces a Server Component's message in production and passes only
    // this, so the digest is the one thing tying the screen to a server log.
    render(
      <WorkspaceError
        error={Object.assign(new Error("boom"), { digest: "abc123" })}
        reset={vi.fn()}
      />,
    );

    expect(screen.getByText(/abc123/)).toBeDefined();
    expect(
      screen.getByRole("heading", { name: "Something went wrong" }),
    ).toBeDefined();
  });

  it("says nothing about the cause, because it cannot know it", () => {
    // Any wording that guessed would be wrong as often as right; the expected
    // failures are caught in the page where the reason still exists.
    render(<WorkspaceError error={new Error("boom")} reset={vi.fn()} />);

    expect(screen.queryByText(/boom/)).toBeNull();
    expect(screen.queryByText(/registry/i)).toBeNull();
  });

  it("offers a retry, since a transient failure fixes itself", () => {
    const reset = vi.fn();
    render(<WorkspaceError error={new Error("boom")} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledOnce();
  });
});
