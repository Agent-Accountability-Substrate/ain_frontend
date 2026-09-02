import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CtaBand } from "@/domains/marketing/cta-band";
import { ActionReceipt } from "@/domains/marketing/action-receipt";
import { BuyerProblem } from "@/domains/marketing/buyer-problem";
import { CompatibilityRail } from "@/domains/marketing/compatibility-rail";
import { EvidenceFlow } from "@/domains/marketing/evidence-flow";
import { EvidencePackage } from "@/domains/marketing/evidence-package";
import { IntegrityChain } from "@/domains/marketing/integrity-chain";
import { RecordBand } from "@/domains/marketing/record-band";
import { SecurityBoundaries } from "@/domains/marketing/security-boundaries";
import { SECURITY_BOUNDARIES } from "@/domains/marketing/security-content";
import { SiteFooter } from "@/domains/marketing/site-footer";
import { SiteHero } from "@/domains/marketing/site-hero";
import { UseCaseStories } from "@/domains/marketing/use-case-stories";

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

describe("EvidenceFlow", () => {
  it("explains the six evidence outcomes before their mechanisms", () => {
    const { container } = render(<EvidenceFlow />);

    expect(screen.getByText("How Subra works")).toBeDefined();
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      "From external identity to independently verifiable evidence.",
    );
    expect(
      screen.getByText(
        "Subra doesn't replace the systems you already use to establish identity and authority. It sits alongside them, and turns each completed action into a signed record.",
      ),
    ).toBeDefined();

    const sequence = screen.getByRole("list", {
      name: "Six-step evidence flow",
    });
    expect(within(sequence).getAllByRole("listitem")).toHaveLength(6);
    expect(
      within(sequence).getByText(
        "The action is recorded after it happens, not before",
      ),
    ).toBeDefined();
    expect(
      within(sequence).getByText(
        "This is post-action attestation. Subra records what happened after it happened. It does not authorise or block the action.",
      ),
    ).toBeDefined();
    expect(container.textContent).not.toContain("—");
  });

  it("names one concrete output for every step", () => {
    render(<EvidenceFlow />);

    for (const output of [
      "Accepted identity reference",
      "Bound authority context",
      "Action attestation",
      "Version snapshot",
      "Signed receipt",
      "Verifiable evidence package",
    ]) {
      expect(screen.getByText(output)).toBeDefined();
    }
  });

  it("links directly to the public action-receipt specimen", () => {
    render(<EvidenceFlow />);

    expect(
      screen
        .getByRole("link", { name: "See a sample action receipt" })
        .getAttribute("href"),
    ).toBe("#action-receipt");
  });
});

describe("CompatibilityRail", () => {
  it("positions Subra between existing systems and evidence consumers", () => {
    render(<CompatibilityRail />);

    expect(screen.getByText("Compatibility")).toBeDefined();
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      "Keep the identity and control systems you already trust.",
    );

    const rail = screen.getByRole("group", {
      name: "Compatibility without competition",
    });
    expect(
      within(rail).getByRole("list", { name: "Existing identity systems" }),
    ).toBeDefined();
    expect(within(rail).getByText("Evidence layer")).toBeDefined();
    expect(
      within(rail).getByRole("list", { name: "Evidence consumers" }),
    ).toBeDefined();
  });

  it("states the three compatibility boundaries without protocol logos or em dashes", () => {
    const { container } = render(<CompatibilityRail />);
    const boundaries = screen.getByRole("list", {
      name: "Subra compatibility boundaries",
    });

    expect(within(boundaries).getAllByRole("listitem")).toHaveLength(3);
    for (const boundary of [
      "Does not replace your IAM",
      "Does not orchestrate agents",
      "Does not become a runtime gateway",
    ]) {
      expect(within(boundaries).getByText(boundary)).toBeDefined();
    }
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).not.toContain("—");
  });
});

describe("ActionReceipt", () => {
  it("presents one synthetic action as a human-readable evidence record", () => {
    const { container } = render(<ActionReceipt />);

    expect(screen.getByText("The action receipt")).toBeDefined();
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      "One action. One evidence record.",
    );
    expect(
      screen.getByText(
        "Every action produces a receipt like this. Human-readable first, with the underlying cryptography available one layer down for anyone who needs to check it.",
      ),
    ).toBeDefined();
    expect(
      screen.getByRole("article", {
        name: "Supplier payment action receipt",
      }),
    ).toBeDefined();
    expect(screen.queryByText(/synthetic/i)).toBeNull();

    for (const label of [
      "External identity reference",
      "Organisation",
      "Accountable owner",
      "Declared authority",
      "Policy version",
      "Model version",
      "Occurred",
      "Recorded",
    ]) {
      expect(screen.getByText(label)).toBeDefined();
    }
    expect(container.textContent).not.toContain("—");
  });

  it("treats scope as evidence classification rather than an enforcement decision", () => {
    render(<ActionReceipt />);

    expect(screen.getAllByText("Inside declared scope").length).toBe(2);
    expect(screen.getByText("Outside declared scope")).toBeDefined();
    expect(
      screen.getByText(
        "Scope result is a classification of the evidence, not an access-control decision made by Subra.",
      ),
    ).toBeDefined();
  });

  it("keeps hashes and signing details in an expandable technical layer", () => {
    const { container } = render(<ActionReceipt />);
    const details = container.querySelector("details");

    expect(details).not.toBeNull();
    expect(
      within(details as HTMLElement).getByText("Technical proof"),
    ).toBeDefined();
    expect(
      within(details as HTMLElement).getByText("Previous receipt hash"),
    ).toBeDefined();
    expect(
      within(details as HTMLElement).getByText("Receipt hash"),
    ).toBeDefined();
    expect(
      within(details as HTMLElement).getByText("Signer key"),
    ).toBeDefined();
    expect(
      within(details as HTMLElement).getByText("Signature valid"),
    ).toBeDefined();
  });
});

describe("EvidencePackage", () => {
  it("assembles the eight records an auditor receives into one artefact", () => {
    const { container } = render(<EvidencePackage />);

    expect(screen.getByText("Evidence packages")).toBeDefined();
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      "The evidence an auditor asks for, assembled around the action.",
    );
    expect(
      screen.getByText(
        "A package brings the identity, accountability, scope, receipts, versions and verification results for a given period into one signed manifest. It is reviewable on its own, without needing access to Subra.",
      ),
    ).toBeDefined();

    const contents = screen.getByRole("list", {
      name: "Evidence package contents",
    });
    expect(within(contents).getAllByRole("listitem")).toHaveLength(8);
    expect(container.textContent).not.toContain("—");
  });

  it("switches between the compliance summary and technical manifest", () => {
    render(<EvidencePackage />);

    const summaryTab = screen.getByRole("tab", {
      name: "Compliance summary",
    });
    const manifestTab = screen.getByRole("tab", {
      name: "Technical manifest",
    });

    expect(summaryTab.getAttribute("aria-selected")).toBe("true");
    expect(
      screen.getByRole("tabpanel", { name: "Compliance summary" }),
    ).toBeDefined();

    fireEvent.click(manifestTab);

    expect(manifestTab.getAttribute("aria-selected")).toBe("true");
    expect(
      screen.getByRole("tabpanel", { name: "Technical manifest" }),
    ).toBeDefined();
    expect(screen.getByText("manifest_digest")).toBeDefined();
  });

  it("states the narrative boundary and links to the private preview", () => {
    render(<EvidencePackage />);

    expect(
      screen.getByText(
        "Package narrative is templated, not AI-generated. No model is used to decide what a record means.",
      ),
    ).toBeDefined();
    expect(
      screen
        .getByRole("link", { name: "Request private preview" })
        .getAttribute("href"),
    ).toBe("#request");
  });
});

describe("IntegrityChain", () => {
  it("introduces independent verification as its own addressable section", () => {
    const { container } = render(<IntegrityChain />);

    expect(container.querySelector("#integrity")).not.toBeNull();
    expect(screen.getByText("Integrity")).toBeDefined();
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      "Evidence should remain verifiable after the originating system is unavailable.",
    );
    expect(
      screen.getByText(
        "A record you can argue with is not evidence. Each receipt is linked to the one before it. Changing any field breaks the chain, visibly.",
      ),
    ).toBeDefined();
    expect(container.textContent).not.toContain("—");
  });

  it("starts with four intact records and no raw cryptography in the main view", () => {
    render(<IntegrityChain />);

    expect(
      within(screen.getByRole("list", { name: "Receipt chain" })).getAllByRole(
        "listitem",
      ),
    ).toHaveLength(4);
    expect(screen.getByTestId("integrity-state").textContent).toBe(
      "✓Verified4 of 4 records intact",
    );
    expect(screen.queryByText(/sha256:/i)).toBeNull();
    expect(screen.queryByText(/key id/i)).toBeNull();
  });

  it("recalculates the chain after one field is changed", () => {
    render(<IntegrityChain />);

    fireEvent.click(screen.getByRole("button", { name: "Change one field" }));

    expect(screen.getByTestId("integrity-state").textContent).toBe(
      "!Integrity failurechain broken from record 2 onward",
    );
    expect(screen.getByText("Amount changed: £84,200")).toBeDefined();
    expect(screen.getByText("Field changed")).toBeDefined();
    expect(screen.getAllByText("Chain broken")).toHaveLength(2);

    fireEvent.click(
      screen.getByRole("button", { name: "Restore original field" }),
    );
    expect(screen.getByText("Amount: £24,800")).toBeDefined();
    expect(screen.getByText("4 of 4 records intact")).toBeDefined();
  });

  it("explains the calculation progressively and keeps the technical claim explicit", () => {
    render(<IntegrityChain />);

    expect(screen.getByText("How this is calculated")).toBeDefined();
    for (const term of ["Canonicalisation", "Hashing", "Signatures"]) {
      expect(screen.getByText(term)).toBeDefined();
    }
    expect(
      screen.getByText(
        "Verification recalculates the record. Nothing is simply trusted from storage.",
      ),
    ).toBeDefined();
  });

  it("offers both requested next steps", () => {
    render(<IntegrityChain />);

    expect(
      screen
        .getByRole("link", { name: "Request private preview" })
        .getAttribute("href"),
    ).toBe("#request");
    expect(
      screen
        .getByRole("link", { name: "Read the security overview" })
        .getAttribute("href"),
    ).toBe("#security");
  });
});

describe("UseCaseStories", () => {
  it("grounds the product in three action-led stories", () => {
    const { container } = render(<UseCaseStories />);

    expect(container.querySelector("#use-cases")).not.toBeNull();
    expect(screen.getByText("Where this applies")).toBeDefined();
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      "Built for organisations where an agent's action carries a consequence.",
    );

    const stories = screen.getByRole("list", { name: "Use-case stories" });
    expect(within(stories).getAllByRole("listitem")).toHaveLength(3);
    for (const title of [
      "Payments and refunds",
      "Lending and underwriting operations",
      "Insurance claims",
    ]) {
      expect(within(stories).getByText(title)).toBeDefined();
    }
    expect(container.textContent).not.toContain("—");
  });

  it("shows the action, risk, accountable function and evidence for every story", () => {
    render(<UseCaseStories />);

    expect(screen.getAllByText("Action")).toHaveLength(3);
    expect(screen.getAllByText("Risk")).toHaveLength(3);
    expect(screen.getAllByText("Accountable function")).toHaveLength(3);
    expect(screen.getAllByText("Evidence produced")).toHaveLength(3);
    expect(screen.getByText("Operations")).toBeDefined();
    expect(screen.getByText("Credit Risk")).toBeDefined();
    expect(screen.getByText("Claims Operations")).toBeDefined();
  });

  it("names the primary buyer group and the teams involved", () => {
    render(<UseCaseStories />);

    expect(screen.getByText("Primary ICP")).toBeDefined();
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Regulated organisations deploying consequential AI agents",
      }),
    ).toBeDefined();
    expect(screen.getByText("Compliance and AI governance")).toBeDefined();
    expect(screen.getByText("Internal audit")).toBeDefined();
    expect(screen.getByText("Agent infrastructure leaders")).toBeDefined();
  });

  it("places three relatable agent types after the main use-case stories", () => {
    render(<UseCaseStories />);

    const adjacent = screen.getByRole("complementary", {
      name: "The same evidence model applies wherever agents communicate or act",
    });
    expect(within(adjacent).getAllByRole("listitem")).toHaveLength(3);
    expect(within(adjacent).getByText("Call agents")).toBeDefined();
    expect(within(adjacent).getByText("Chat agents")).toBeDefined();
    expect(within(adjacent).getByText("Operations agents")).toBeDefined();

    const stories = screen.getByRole("list", { name: "Use-case stories" });
    expect(
      stories.compareDocumentPosition(adjacent) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

describe("SecurityBoundaries", () => {
  it("states all ten checkable security and product boundaries", () => {
    const { container } = render(<SecurityBoundaries />);

    expect(container.querySelector("#security")).not.toBeNull();
    expect(screen.getByText("Security and boundaries")).toBeDefined();
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      "What Subra stores, and what it deliberately does not.",
    );
    const list = screen.getByRole("list", {
      name: "Security and product boundaries",
    });
    expect(within(list).getAllByRole("listitem")).toHaveLength(10);
    expect(container.textContent).not.toContain("—");
  });

  it("keeps each explanation in one contextual detail card", () => {
    render(<SecurityBoundaries />);

    for (const boundary of SECURITY_BOUNDARIES) {
      expect(
        screen.getByRole("button", { name: boundary.label }),
      ).toBeDefined();
    }

    const detail = document.getElementById("security-boundary-detail");
    expect(detail?.textContent).toContain(SECURITY_BOUNDARIES[0].detail);
    expect(
      screen.queryByRole("link", { name: /evidence recorded/i }),
    ).toBeNull();

    const finalBoundary = SECURITY_BOUNDARIES.at(-1)!;
    fireEvent.click(screen.getByRole("button", { name: finalBoundary.label }));
    expect(
      document.getElementById("security-boundary-detail")?.textContent,
    ).toContain(finalBoundary.detail);
    expect(
      screen
        .getByRole("button", { name: finalBoundary.label })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("omits a public data-region claim until operations verify it", () => {
    render(<SecurityBoundaries />);

    expect(screen.queryByText(/data residency/i)).toBeNull();
    expect(screen.queryByText(/UK \/ EU/i)).toBeNull();
    expect(screen.queryByText(/compliance badge/i)).toBeNull();
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
  it("provides a direct contact route", () => {
    render(<SiteFooter />);

    const link = screen.getByRole("link", { name: "Contact" });
    expect(link.getAttribute("href")).toBe("mailto:partner@subrahq.com");
  });

  it("links the legal column to real standalone pages", () => {
    render(<SiteFooter />);

    for (const [name, href] of [
      ["Privacy Notice", "/privacy"],
      ["Terms of Service", "/terms"],
      ["Cookie Policy", "/cookies"],
    ] as const) {
      expect(screen.getByRole("link", { name }).getAttribute("href")).toBe(
        href,
      );
    }
  });

  it("carries the disclaimer a regulated buyer's compliance team looks for", () => {
    render(<SiteFooter />);

    expect(
      screen.getByText(
        /not a certification, regulatory approval, or legal compliance guarantee/,
      ),
    ).toBeDefined();
  });

  it("groups the links under headings rather than as one list", () => {
    render(<SiteFooter />);

    for (const heading of ["Product", "Company", "Legal"]) {
      expect(
        screen.getByRole("heading", { level: 2, name: heading }),
      ).toBeDefined();
    }
  });

  it("links every product label to its landing-page section", () => {
    render(<SiteFooter />);

    for (const [name, href] of [
      ["Product", "/#top"],
      ["Evidence flow", "/#how-it-works"],
      ["Compatibility", "/#compatibility"],
      ["Integrity", "/#integrity"],
      ["Use cases", "/#use-cases"],
      ["Security", "/#security"],
    ] as const) {
      expect(screen.getByRole("link", { name }).getAttribute("href")).toBe(
        href,
      );
    }
  });
});
