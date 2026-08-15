import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LandingRegisterEntry } from "@/components/landing-register-entry";

/**
 * The entry card's rows, as label → value. Values are read leaf by leaf:
 * textContent runs sibling spans together, so a two-line field would come back
 * as "Head of CollectionsSMF24-000123".
 */
function readable(el: Element | null) {
  if (!el) return "";
  const leaves = [...el.querySelectorAll("span")].filter(
    (span) => span.querySelector("span") === null,
  );
  return (leaves.length ? leaves : [el])
    .map((node) => (node.textContent ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");
}

function entryRows(container: HTMLElement) {
  const card = container.querySelector("figure");
  return [...(card?.querySelectorAll("dl > div") ?? [])].map((row) => [
    row.querySelector("dt")?.textContent ?? "",
    readable(row.querySelector("dd")),
  ]);
}

function conceptItems(container: HTMLElement) {
  const list = container.querySelector("ol");
  if (!list) throw new Error("concept list not found");
  return within(list as HTMLElement).getAllByRole("listitem");
}

const litRows = (container: HTMLElement) =>
  [...(container.querySelectorAll("figure dl > div") ?? [])]
    .filter((row) => row.className.includes("bg-wash-blue"))
    .map((row) => row.querySelector("dt")?.textContent);

describe("LandingRegisterEntry", () => {
  it("shows the entry as the register holds it, field names and all", () => {
    const { container } = render(<LandingRegisterEntry />);

    // Every value here is the AIN Document payload example from
    // architecture.md:134-155. A reader who knows the contract should
    // recognise the shape; one who does not should still be able to paste any
    // line into the spec and find it.
    expect(entryRows(container)).toEqual([
      [
        "Identifier",
        "did:ain:gb:01ARZ3NDEKTSV4RRFFQ69G5FAV:01BX5ZZKBKACTAV9WEVGEMMVRZ · permanent",
      ],
      [
        "Action classes",
        "customer_comms.send, payments.initiate constraint: max_value_gbp 5000 · risk high",
      ],
      [
        "Accountability",
        "Head of Collections SMF24-000123 · collections operations",
      ],
      ["Signed", "2026-07-16T12:00:00Z ed25519:9f41c2…7ab0"],
      ["Document", "version 9 · prior versions retained"],
    ]);
  });

  it("binds accountability to a role, never to a person's name", () => {
    const { container } = render(<LandingRegisterEntry />);

    // The signed payload carries accountability {role_title,
    // responsibility_area, regulatory_identifier} and no person-name field.
    // Binding the role is also what lets a successor inherit it.
    screen.getByText("Head of Collections");
    expect(container.textContent).toMatch(/role title/i);
    expect(container.textContent).not.toMatch(/named individual/i);
  });

  it("holds the concepts and the entry, and nothing else", () => {
    const { container } = render(<LandingRegisterEntry />);

    // The scope diff lives in its own section. Nested here it made this one
    // read as three stacked modules instead of a single claim and its record.
    expect(container.querySelectorAll("figure")).toHaveLength(1);
    expect(container.textContent).not.toMatch(/scope diff/i);
  });

  it("says the entry is illustrative rather than implying a live lookup", () => {
    const { container } = render(<LandingRegisterEntry />);
    const caption = container.querySelector("figcaption")?.textContent ?? "";

    // The resolver is deliberately unprovisioned, so nothing here may read as
    // a record fetched from anywhere.
    expect(caption).toMatch(/^Illustrative entry\./);
    expect(container.textContent).not.toMatch(
      /verified|verifying|checked in your browser|live/i,
    );
  });

  it("lights the fields a concept is about, and only those", () => {
    const { container } = render(<LandingRegisterEntry />);
    const concepts = conceptItems(container);

    expect(litRows(container)).toEqual([]);

    fireEvent.mouseEnter(concepts[1]!);
    expect(litRows(container)).toEqual(["Action classes"]);

    fireEvent.mouseLeave(concepts[1]!);
    fireEvent.mouseEnter(concepts[2]!);
    expect(litRows(container)).toEqual(["Accountability"]);

    // Evidence is the one concept backed by two fields: the signature that
    // fixes a version, and the retention of the versions before it.
    fireEvent.mouseLeave(concepts[2]!);
    fireEvent.mouseEnter(concepts[3]!);
    expect(litRows(container)).toEqual(["Signed", "Document"]);

    fireEvent.mouseLeave(concepts[3]!);
    expect(litRows(container)).toEqual([]);
  });

  it("lights the concept a field belongs to, hovering the other way", () => {
    const { container } = render(<LandingRegisterEntry />);
    const rows = [...container.querySelectorAll("figure dl > div")];
    const conceptTitle = () =>
      [...conceptItems(container)]
        .filter((li) => li.className.includes("bg-wash-blue"))
        .map((li) => within(li).getByRole("heading").textContent);

    expect(conceptTitle()).toEqual([]);

    fireEvent.mouseEnter(rows[2]!);
    expect(conceptTitle()).toEqual(["Accountability"]);

    // A field lights its whole group, so pointing at the signature shows that
    // Evidence rests on it and on the retained versions together.
    fireEvent.mouseLeave(rows[2]!);
    fireEvent.mouseEnter(rows[3]!);
    expect(conceptTitle()).toEqual(["Evidence"]);
    expect(litRows(container)).toEqual(["Signed", "Document"]);

    fireEvent.mouseLeave(rows[3]!);
    expect(conceptTitle()).toEqual([]);
  });

  it("reaches the same emphasis from the keyboard", () => {
    const { container } = render(<LandingRegisterEntry />);
    const concepts = conceptItems(container);

    // Hover-only emphasis would be unreachable without a mouse. Each concept
    // is focusable and lights the same rows on focus.
    expect(concepts.every((li) => li.getAttribute("tabindex") === "0")).toBe(
      true,
    );

    fireEvent.focus(concepts[0]!);
    expect(litRows(container)).toEqual(["Identifier"]);
    fireEvent.blur(concepts[0]!);
    expect(litRows(container)).toEqual([]);
  });

  it("pairs every concept with at least one field on the card", () => {
    const { container } = render(<LandingRegisterEntry />);
    const concepts = conceptItems(container);

    expect(
      concepts.map((li) => within(li).getByRole("heading").textContent),
    ).toEqual(["Identifier", "Authorised scope", "Accountability", "Evidence"]);

    for (const concept of concepts) {
      fireEvent.mouseEnter(concept);
      expect(litRows(container).length).toBeGreaterThan(0);
      fireEvent.mouseLeave(concept);
    }
  });

  it("claims no scope attenuation, which is not a mechanism that exists", () => {
    const { container } = render(<LandingRegisterEntry />);

    // There is no parent/child scope rule: a delegated scope is its own signed
    // declaration, not a narrowing of the one above it.
    expect(container.textContent).not.toMatch(/never widen|only narrow/i);
  });

  it("keeps every paragraph under the corpus ceiling", () => {
    const { container } = render(<LandingRegisterEntry />);

    for (const paragraph of container.querySelectorAll("p")) {
      const words = (paragraph.textContent ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
      expect(words).toBeLessThanOrEqual(40);
    }
  });
});
