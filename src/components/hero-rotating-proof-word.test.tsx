import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HeroRotatingProofWord } from "@/components/hero-rotating-proof-word";

type MotionPreferenceListener = () => void;

function installMatchMedia(matches: boolean) {
  let changeListener: MotionPreferenceListener | undefined;
  const mediaQuery = {
    addEventListener: vi.fn(
      (event: string, listener: MotionPreferenceListener) => {
        if (event === "change") {
          changeListener = listener;
        }
      },
    ),
    addListener: vi.fn(),
    dispatchEvent: vi.fn(),
    matches,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    removeEventListener: vi.fn(),
    removeListener: vi.fn(),
  };

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => mediaQuery),
  });

  return {
    getChangeListener: () => changeListener,
    mediaQuery,
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("HeroRotatingProofWord", () => {
  it("keeps the stable proof word when matchMedia is unavailable", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: undefined,
    });

    render(<HeroRotatingProofWord />);

    expect(screen.getByTestId("hero-proof-word").textContent).toBe(
      "accountable.",
    );
    expect(screen.getByText("accountable", { selector: ".sr-only" })).toBeDefined();
  });

  it("types the next word, responds to reduced motion, and cleans up", () => {
    vi.useFakeTimers();
    const { getChangeListener, mediaQuery } = installMatchMedia(false);
    const { unmount } = render(<HeroRotatingProofWord />);
    const proofWord = screen.getByTestId("hero-proof-word");

    expect(proofWord.textContent).toBe("accountable.");

    act(() => {
      for (let step = 0; step < 12; step += 1) {
        vi.runOnlyPendingTimers();
      }
    });
    expect(proofWord.textContent).toBe("");

    act(() => {
      vi.runOnlyPendingTimers();
      vi.runOnlyPendingTimers();
    });
    expect(proofWord.textContent).toBe("a");

    act(() => {
      for (let step = 0; step < 10; step += 1) {
        vi.runOnlyPendingTimers();
      }
      vi.runOnlyPendingTimers();
    });
    expect(proofWord.textContent).toBe("authorised.");

    mediaQuery.matches = true;
    act(() => {
      getChangeListener()?.();
    });
    expect(proofWord.textContent).toBe("accountable.");

    unmount();
    expect(mediaQuery.removeEventListener).toHaveBeenCalledWith(
      "change",
      getChangeListener(),
    );
  });
});
