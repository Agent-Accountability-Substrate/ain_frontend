import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AgentCreationView } from "@/domains/agents/agent-creation-view";
import { type OrganisationSummary } from "@/domains/workspace/account-workspace";

vi.mock("@/domains/auth/auth-actions", () => ({
  signOutAction: vi.fn(),
}));

// The wizard's actions reach the registry, which reaches next-auth. Mocked so
// this stays a test of what the view renders for each organisation state.
vi.mock("@/domains/agents/agent-actions", () => ({
  registerAgentAction: vi.fn(),
  patchAgentAction: vi.fn(),
  submitAgentAction: vi.fn(),
}));

const ORG_ID = "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d";
const ORG_ULID = "01ARZ3ND3EX62JM1DZMBK9A9JF";

function organisation(
  verificationStatus: OrganisationSummary["verificationStatus"],
): OrganisationSummary {
  return {
    id: ORG_ID,
    ulid: ORG_ULID,
    name: "Acme Ltd",
    membershipRole: "owner",
    verificationStatus,
  };
}

function renderFor(organisationSummary: OrganisationSummary) {
  render(<AgentCreationView organisation={organisationSummary} />);
}

describe("AgentCreationView", () => {
  it("says why the form is closed while verification is pending", () => {
    renderFor(organisation("pending"));

    expect(
      screen.getByRole("heading", { name: "Acme Ltd is not verified yet" }),
    ).toBeDefined();
    expect(screen.queryByLabelText("Agent name")).toBeNull();
    // The way out of a closed wizard is the register it was opened from.
    expect(
      screen.getByRole("link", { name: "Back to the register" }),
    ).toHaveProperty("href", `http://localhost:3000/o/${ORG_ULID}/agents`);
  });

  it("stops rather than starting afresh when a resume link resolves to nothing", () => {
    // The identity step mints a permanent AIN. A resume link that did not
    // resolve must never land there, or "Continue this draft" mints twice.
    render(
      <AgentCreationView
        organisation={organisation("verified")}
        unresolvedDraft={`did:ain:gb:${ORG_ULID}:01BX5ZZKBKACTAV9WEVGEMMVRZ`}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Cannot resume this draft" }),
    ).toBeDefined();
    expect(
      screen.getByRole("heading", { name: "This draft could not be resumed" }),
    ).toBeDefined();
    expect(screen.queryByLabelText("Agent name")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Open the register" }),
    ).toHaveProperty("href", `http://localhost:3000/o/${ORG_ULID}/agents`);
  });

  it("opens the identity step once the organisation is verified", () => {
    renderFor(organisation("verified"));

    expect(screen.getByLabelText("Agent name")).toBeDefined();
    expect(screen.getByLabelText("What it does")).toBeDefined();
    expect(screen.getByLabelText("Risk class")).toBeDefined();
    // Step 2's fields only exist once an AIN has been minted — the scope and
    // the SMCR reference are attached to a draft, not collected before one.
    expect(screen.queryByLabelText("SMCR reference")).toBeNull();
  });
});
