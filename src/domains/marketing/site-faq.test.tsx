import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteFaq } from "@/domains/marketing/site-faq";
import { FAQ_ENTRIES } from "@/domains/marketing/landing-content";

describe("SiteFaq", () => {
  it("introduces the reordered buyer questions and private preview next step", () => {
    const { container } = render(<SiteFaq />);

    expect(screen.getByText("Frequently asked")).toBeDefined();
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      "Questions we get from compliance, risk and engineering teams.",
    );
    expect(FAQ_ENTRIES).toHaveLength(8);
    expect(FAQ_ENTRIES[0]?.question).toBe(
      "What exactly is captured in an action receipt?",
    );
    expect(FAQ_ENTRIES.at(-1)?.question).toBe(
      "Is Subra a regulator or a compliance certification service?",
    );
    expect(
      screen
        .getByRole("link", { name: "Request private preview" })
        .getAttribute("href"),
    ).toBe("#request");
    expect(container.textContent).not.toContain("—");
  });

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

    // Closed rows alone read as a list of things a visitor has to guess at.
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

  it("keeps every answer in the document while it is closed", () => {
    const { container } = render(<SiteFaq />);

    // The section is server-rendered, so an answer that exists only once its
    // panel has been opened is absent from the HTML a crawler indexes, a
    // printed copy carries, and find-in-page searches. The `<details>` this
    // replaced kept every answer; unmounting the closed ones would regress it.
    for (const entry of FAQ_ENTRIES) {
      expect(screen.getByText(entry.answer)).toBeDefined();
    }

    // Present, not shown: the closed answers are hidden rather than unmounted.
    const [, ...rest] = FAQ_ENTRIES;
    for (const entry of rest) {
      expect(screen.getByText(entry.answer).closest("[hidden]")).not.toBeNull();
    }
    expect(container.querySelectorAll("[hidden]")).toHaveLength(rest.length);
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

    // Several answers open at once turns a scannable list into a wall of prose.
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
