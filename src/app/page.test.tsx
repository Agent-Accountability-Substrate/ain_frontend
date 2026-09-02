import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { metadata, default as LandingPage } from "@/app/page";
import {
  LANDING_DESCRIPTION,
  LANDING_TITLE,
} from "@/domains/marketing/landing-content";

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth() }));

describe("LandingPage", () => {
  it("publishes the approved search title and description", () => {
    expect(metadata).toMatchObject({
      title: { absolute: LANDING_TITLE },
      description: LANDING_DESCRIPTION,
      openGraph: {
        title: LANDING_TITLE,
        description: LANDING_DESCRIPTION,
      },
      twitter: {
        title: LANDING_TITLE,
        description: LANDING_DESCRIPTION,
      },
    });
  });

  it("renders every section in the order the page argues them", () => {
    const { container } = render(<LandingPage />);

    // The section anchors only: the nav links point at these, so their order
    // is the page's outline and a reordering that broke it would be silent.
    const ids = Array.from(container.querySelectorAll("section[id]")).map(
      (node) => node.id,
    );

    expect(ids).toEqual([
      "record",
      "problem",
      "how-it-works",
      "compatibility",
      "action-receipt",
      "evidence-package",
      "integrity",
      "use-cases",
      "security",
      "questions",
      "request",
    ]);
  });

  it("reads no session and no tenant data", () => {
    render(<LandingPage />);

    // The public page must render identically for a signed-in visitor and a
    // stranger. Personalising it is how tenant data reaches the one route
    // that has no login in front of it.
    expect(auth).not.toHaveBeenCalled();
  });

  it("does not place an announcement bar above the navigation", () => {
    render(<LandingPage />);

    expect(
      screen.queryByText(/working with a small number of UK regulated firms/),
    ).toBeNull();
  });

  it("has exactly one h1", () => {
    render(<LandingPage />);

    // More than one is the usual way a landing page loses its outline.
    expect(screen.getAllByRole("heading", { level: 1 }).length).toBe(1);
  });

  it("uses the closing CTA as the break before security", () => {
    render(<LandingPage />);

    const cta = screen.getByTestId("closing-cta");
    expect(cta.nextElementSibling?.id).toBe("security");
  });

  it("points every call to action at the one form", () => {
    render(<LandingPage />);

    const demos = screen.getAllByRole("link", { name: "Book a demo" });
    expect(demos.length).toBeGreaterThan(1);
    for (const link of demos) {
      expect(link.getAttribute("href")).toBe("#request");
    }
  });
});
