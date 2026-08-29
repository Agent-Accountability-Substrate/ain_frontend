import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CtaBand } from "@/domains/marketing/cta-band";
import { BuyerProblem } from "@/domains/marketing/buyer-problem";
import { IntegrityChain } from "@/domains/marketing/integrity-chain";
import { RecordBand } from "@/domains/marketing/record-band";
import { ScopeArtifact } from "@/domains/marketing/scope-artifact";
import { SiteFooter } from "@/domains/marketing/site-footer";
import { SiteHero } from "@/domains/marketing/site-hero";
import {
  CHAIN_ENTRIES,
  SCOPE_DIFF,
  SECTION_LINKS,
} from "@/domains/marketing/landing-content";

describe("SiteHero", () => {
  it("leads with the claim the whole page rests on", () => {
    render(<SiteHero />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Evidence for every consequential action an AI agent takes.",
    );
    expect(screen.getByTestId("hero-eyebrow").textContent).toBe(
      "Evidence and accountability for consequential AI agentsBeta",
    );
    expect(
      screen.getByText(
        "Subra binds each consequential action to the identity presented, the organisation, the accountable owner, the declared scope, and the policy and model versions in force - then produces signed evidence that can be checked independently later, by someone else.",
      ),
    ).toBeDefined();
    expect(screen.queryByText("Accountability register")).toBeNull();
    expect(screen.queryByText(/passport/i)).toBeNull();
    expect(screen.queryByText(/registry/i)).toBeNull();
  });

  it("offers the primary action and the way to read on", () => {
    render(<SiteHero />);

    expect(
      screen.getByRole("link", { name: "Book a demo" }).getAttribute("href"),
    ).toBe("#request");
    expect(
      screen
        .getByRole("link", { name: "See what a record contains" })
        .getAttribute("href"),
    ).toBe("#record");
  });

  it("states the three commitments a regulated buyer checks first", () => {
    render(<SiteHero />);

    expect(screen.getByText("UK / EU data residency")).toBeDefined();
    expect(
      screen.getByText("Never in your agents’ runtime path"),
    ).toBeDefined();
    expect(
      screen.getByText("Signed, versioned, permanently held"),
    ).toBeDefined();
  });
});

describe("RecordBand", () => {
  it("is addressable from the navigation", () => {
    const { container } = render(<RecordBand />);
    expect(container.querySelector("#record")).not.toBeNull();
  });

  it("places the open partner invitation immediately before the record divider", () => {
    const { container } = render(<RecordBand />);
    const carousel = screen.getByTestId("partner-carousel");
    const divider = container.querySelector(".border-t.border-site-hair");

    expect(carousel.nextElementSibling).toBe(divider);
  });

  it("says what the deck below it is showing", () => {
    render(<RecordBand />);

    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .find(
          (heading) => heading.textContent === "Every version it has ever had.",
        ),
    ).toBeDefined();
    expect(screen.getByText("One identifier")).toBeDefined();
    expect(screen.getByText("Multiple signed versions")).toBeDefined();
  });

  it("renders the supplied agent identity passport without an added wrapper", () => {
    render(<RecordBand />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "One registry. A distinct passport for every agent.",
      }),
    ).toBeDefined();
    expect(
      screen.getByLabelText("Agent identity passport cards"),
    ).toBeDefined();
  });
});

describe("BuyerProblem", () => {
  it("frames the buyer problem as fragmented evidence converging on one question", () => {
    render(<BuyerProblem />);

    expect(screen.getByText("The problem")).toBeDefined();
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      "When an agent action has to be explained, the evidence is rarely in one place.",
    );
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Who acted, under whose authority, using which policy and model version?",
      }),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Audit teams assemble these fragments manually after the event.",
      ),
    ).toBeDefined();
  });

  it("shows the five evidence fragments as one semantic diagram rather than feature cards", () => {
    const { container } = render(<BuyerProblem />);
    const diagram = screen.getByRole("list", {
      name: "Fragmented evidence sources",
    });

    expect(within(diagram).getAllByRole("listitem")).toHaveLength(5);
    for (const label of [
      "Identity",
      "Authority",
      "Versions",
      "Accountability",
      "Activity",
    ]) {
      expect(within(diagram).getByText(label)).toBeDefined();
    }
    expect(container.querySelector(".buyer-problem-paths")).not.toBeNull();
    expect(container.querySelector(".card")).toBeNull();
  });

  it("sequences one signal dot from the question panel to each evidence item", () => {
    const { container } = render(<BuyerProblem />);
    const paths = Array.from(
      container.querySelectorAll<SVGPathElement>(
        ".buyer-problem-paths > path[data-signal]",
      ),
    );
    const dots = Array.from(
      container.querySelectorAll<SVGGElement>(
        ".buyer-problem-signal-dot[data-signal]",
      ),
    );
    const signals = [
      "identity",
      "authority",
      "versions",
      "accountability",
      "activity",
    ];

    expect(paths).toHaveLength(5);
    expect(dots).toHaveLength(5);
    expect(paths.map((path) => path.dataset.signal)).toEqual(signals);
    expect(dots.map((dot) => dot.dataset.signal)).toEqual(signals);

    dots.forEach((dot, index) => {
      const motion = dot.querySelector("animateMotion");
      const motionPath = dot.querySelector("mpath");

      expect(motion?.getAttribute("begin")).toBe(`${index * 2}s`);
      expect(motion?.getAttribute("dur")).toBe("10s");
      expect(motionPath?.getAttribute("href")).toBe(
        `#buyer-problem-path-${signals[index]}`,
      );
    });
  });

  it("uses buyer-oriented copy without em dashes", () => {
    const { container } = render(<BuyerProblem />);

    expect(container.textContent).not.toContain("—");
    expect(
      screen.getByText(
        "Identity, authority, ownership, policy and model versions often live in different systems. Runtime logs show what happened, but not always what the agent was authorised to do.",
      ),
    ).toBeDefined();
  });

  it("frames the dashboard-derived review as an evidence signal", () => {
    render(<BuyerProblem />);

    const preview = screen.getByRole("complementary", {
      name: "Illustrative evidence review interface",
    });
    expect(within(preview).getByText("Evidence signal")).toBeDefined();
    expect(within(preview).getByText("2 of 5 fragments")).toBeDefined();
    expect(
      within(preview).getByText("Manual reconstruction required"),
    ).toBeDefined();
  });
});

describe("ScopeArtifact", () => {
  it("renders every line of the diff", () => {
    const { container } = render(<ScopeArtifact />);
    expect(container.querySelectorAll("ol li").length).toBe(SCOPE_DIFF.length);
  });

  it("carries the sign as a character, not only as a colour", () => {
    const { container } = render(<ScopeArtifact />);
    const signs = Array.from(
      container.querySelectorAll("ol li > span:first-child"),
    )
      .map((node) => node.textContent)
      .filter((sign) => sign !== " ");

    // The diff has to survive being pasted into a compliance questionnaire in
    // black and white, which is where a document like this usually ends up.
    expect(signs).toContain("+");
    expect(signs).toContain("−");
  });

  it("names who is accountable for the change and what it did to the risk class", () => {
    render(<ScopeArtifact />);

    expect(screen.getByText("Head of Collections")).toBeDefined();
    expect(
      screen.getByText("SMF24-000123 · collections operations"),
    ).toBeDefined();
    expect(screen.getByText("high")).toBeDefined();
  });

  it("says the superseded version is kept", () => {
    render(<ScopeArtifact />);
    // The claim the section exists to make: nothing is edited in place.
    expect(screen.getByText("v8, retained in full")).toBeDefined();
  });

  it("sends the reader to the demo, not to a sign-up they are told to skip", () => {
    render(<ScopeArtifact />);

    // The sign-up screen tells firms to book a demo first, so offering
    // "Create your account" here would point at a door its own page closes.
    expect(
      screen.getByRole("link", { name: /Book a demo/ }).getAttribute("href"),
    ).toBe("#request");
    expect(screen.queryByText(/Create your account/)).toBeNull();
  });
});

describe("IntegrityChain", () => {
  it("renders one row per entry", () => {
    const { container } = render(<IntegrityChain />);
    expect(container.querySelectorAll("tbody tr").length).toBe(
      CHAIN_ENTRIES.length,
    );
  });

  it("shows the break propagating from the edited entry", () => {
    render(<IntegrityChain />);

    // One edit, and everything chained after it fails with it — the only
    // thing this table is here to demonstrate.
    expect(screen.getByText("Altered")).toBeDefined();
    expect(screen.getAllByText("Broken").length).toBe(2);
    expect(screen.getByText("Verified")).toBeDefined();
  });

  it("spells out the consequence in words as well as in the table", () => {
    render(<IntegrityChain />);

    expect(
      screen.getByText(/2 entries after it fail\s+verification/),
    ).toBeDefined();
  });
});

describe("CtaBand", () => {
  it("offers both the demo and the way in for someone who already has an account", () => {
    render(<CtaBand />);

    expect(
      screen.getByRole("link", { name: "Book a demo" }).getAttribute("href"),
    ).toBe("#request");
    // One way in: a plain link to the vanity route, which forwards to Auth0.
    expect(
      screen.getByRole("link", { name: "Sign in" }).getAttribute("href"),
    ).toBe("/signin");
  });
});

describe("SiteFooter", () => {
  it("gives the contact address as a mailto", () => {
    render(<SiteFooter />);

    const link = screen.getByRole("link", { name: "partner@subrahq.com" });
    expect(link.getAttribute("href")).toBe("mailto:partner@subrahq.com");
  });

  it("carries the disclaimer a regulated buyer's compliance team looks for", () => {
    render(<SiteFooter />);

    expect(
      screen.getByText(/not endorsed by or affiliated\s+with any regulator/),
    ).toBeDefined();
  });

  it("groups the links under headings rather than as one list", () => {
    render(<SiteFooter />);

    for (const heading of ["Product", "Company", "Legal"]) {
      expect(screen.getByText(heading)).toBeDefined();
    }
  });

  it("names the sections exactly as the nav does", () => {
    render(<SiteFooter />);

    // Two vocabularies for one page is how "The record" and "How it works"
    // end up meaning the same section to everyone except the reader.
    for (const link of SECTION_LINKS) {
      expect(
        screen.getByRole("link", { name: link.label }).getAttribute("href"),
      ).toBe(link.href);
    }
  });
});
