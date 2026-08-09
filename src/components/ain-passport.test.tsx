import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AinPassport } from "@/components/ain-passport";

describe("AinPassport", () => {
  it("keeps all four verification claims visible with decorative ticks", () => {
    render(<AinPassport />);
    const verification = screen.getByTestId("hero-passport-verification");

    for (const claim of [
      "Identity record authentic",
      "Lifecycle status active",
      "Signing key acceptable",
      "Proposed action within declared scope",
    ]) {
      expect(within(verification).getByText(claim)).toBeDefined();
    }

    expect(within(verification).getAllByText("Yes")).toHaveLength(4);
    expect(
      verification.querySelectorAll(".hero-passport-check-tick[aria-hidden='true']"),
    ).toHaveLength(4);
  });

  it("copies the complete AIN and reports the copied state", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<AinPassport />);
    fireEvent.click(screen.getByRole("button", { name: "Copy full AIN to clipboard" }));

    expect(writeText).toHaveBeenCalledWith(
      "ain:0000000000000000000000000042EXAMPLEabcdefghijkl",
    );
    expect(await screen.findByText("Copied")).toBeDefined();
  });

  it("does not claim success when clipboard access fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("clipboard unavailable"));
    Object.assign(navigator, { clipboard: { writeText } });

    render(<AinPassport />);
    fireEvent.click(screen.getByRole("button", { name: "Copy full AIN to clipboard" }));

    expect(writeText).toHaveBeenCalled();
    expect(screen.queryByText("Copied")).toBeNull();
    expect(screen.getByText("Copy")).toBeDefined();
  });
});
