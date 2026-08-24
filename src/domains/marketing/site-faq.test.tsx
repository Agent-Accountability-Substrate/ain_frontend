import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteFaq } from "@/domains/marketing/site-faq";
import { FAQ_ENTRIES } from "@/domains/marketing/landing-content";

describe("SiteFaq", () => {
  it("offers every question as a trigger", () => {
    render(<SiteFaq />);

    for (const entry of FAQ_ENTRIES) {
      expect(
        screen.getByRole("button", { name: entry.question }),
      ).toBeDefined();
    }
  });

  it("opens the first answer on arrival and leaves the rest closed", () => {
    render(<SiteFaq />);

    // Four closed rows read as a list of things a visitor has to guess at.
    // One open answer shows what the section is for before anything is clicked.
    const [first, ...rest] = FAQ_ENTRIES;
    expect(
      screen
        .getByRole("button", { name: first!.question })
        .getAttribute("aria-expanded"),
    ).toBe("true");
    expect(screen.getByText(first!.answer)).toBeDefined();

    for (const entry of rest) {
      expect(
        screen
          .getByRole("button", { name: entry.question })
          .getAttribute("aria-expanded"),
      ).toBe("false");
    }
  });

  it("opens the answer to the question that was asked", () => {
    render(<SiteFaq />);
    const [, second] = FAQ_ENTRIES;

    fireEvent.click(screen.getByRole("button", { name: second!.question }));

    expect(
      screen
        .getByRole("button", { name: second!.question })
        .getAttribute("aria-expanded"),
    ).toBe("true");
    expect(screen.getByText(second!.answer)).toBeDefined();
  });

  it("keeps one answer open at a time", () => {
    render(<SiteFaq />);
    const [first, second] = FAQ_ENTRIES;

    fireEvent.click(screen.getByRole("button", { name: first!.question }));
    fireEvent.click(screen.getByRole("button", { name: second!.question }));

    // Four answers open at once turns a scannable list into a wall of prose.
    expect(
      screen
        .getByRole("button", { name: first!.question })
        .getAttribute("aria-expanded"),
    ).toBe("false");
    expect(
      screen
        .getByRole("button", { name: second!.question })
        .getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("closes again when the open question is clicked", () => {
    render(<SiteFaq />);
    const [first] = FAQ_ENTRIES;

    // The first is already open, so one click is the close.
    fireEvent.click(screen.getByRole("button", { name: first!.question }));

    expect(
      screen
        .getByRole("button", { name: first!.question })
        .getAttribute("aria-expanded"),
    ).toBe("false");
  });
});
