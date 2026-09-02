import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CopyableAin } from "@/domains/agents/copyable-ain";

const permanentAin =
  "did:ain:gb:01ARZ3NDEKTSV4RRFFQ69G5FAV:01BX5ZZKBKACTAV9WEVGEMMVRZ";

function setClipboard(
  writeText: ((value: string) => Promise<void>) | undefined,
) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: writeText === undefined ? undefined : { writeText },
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  setClipboard(undefined);
});

describe("CopyableAin", () => {
  it("shows the identifier, rather than only offering to copy it", () => {
    // The AIN is the one string the whole product exists to produce. It used to
    // live only inside a href behind this button, so it could be copied blind
    // and never read, checked, or written down.
    render(<CopyableAin value={permanentAin} />);

    expect(screen.getByText(permanentAin)).toBeDefined();
  });

  it("copies the full AIN and announces success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard(writeText);
    render(<CopyableAin value={permanentAin} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy permanent AIN" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledExactlyOnceWith(permanentAin);
    });
    expect(screen.getByRole("status").textContent).toBe("Copied");
  });

  it("announces failure without reporting a successful copy", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("Clipboard denied"));
    setClipboard(writeText);
    render(<CopyableAin value={permanentAin} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy permanent AIN" }));

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toBe("Copy failed");
    });
    expect(screen.queryByText("Copied")).toBeNull();
  });

  it("fails safely when the Clipboard API is unavailable", async () => {
    setClipboard(undefined);
    render(<CopyableAin value={permanentAin} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy permanent AIN" }));

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toBe("Copy failed");
    });
    expect(screen.queryByText("Copied")).toBeNull();
  });

  it("resets transient feedback after two seconds", async () => {
    vi.useFakeTimers();
    setClipboard(vi.fn().mockResolvedValue(undefined));
    render(<CopyableAin value={permanentAin} />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Copy permanent AIN" }),
      );
      await Promise.resolve();
    });
    expect(screen.getByRole("status").textContent).toBe("Copied");

    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(screen.getByRole("status").textContent).toBe("");
  });
});
