import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AgentCreationView } from "@/components/agent-creation-view";
import {
  initialAccountWorkspaceState,
  type AccountWorkspaceState,
} from "@/lib/account-workspace";

vi.mock("@/lib/auth-actions", () => ({
  signInAction: vi.fn(),
  signOutAction: vi.fn(),
}));

// The wizard's actions reach the registry, which reaches next-auth. Mocked so
// this stays a test of what the view renders for each organisation state.
vi.mock("@/lib/agent-actions", () => ({
  registerAgentAction: vi.fn(),
  patchAgentAction: vi.fn(),
  submitAgentAction: vi.fn(),
}));

function workspace(
  overrides: Partial<AccountWorkspaceState>,
): AccountWorkspaceState {
  return { ...initialAccountWorkspaceState, ...overrides };
}

const ORG_ID = "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d";

describe("AgentCreationView", () => {
  it("keeps the direct agent route honest without an organisation", () => {
    render(<AgentCreationView email="owner@example.com" />);

    expect(
      screen.getByRole("heading", { name: "Select an organisation first" }),
    ).toBeDefined();
    expect(
      screen.getByRole("heading", {
        name: "Choose an organisation to continue",
      }),
    ).toBeDefined();

    // With no organisation there must be no submittable agent form at all.
    expect(screen.queryByLabelText("Agent name")).toBeNull();
  });

  it("says why the form is closed while verification is pending", () => {
    render(
      <AgentCreationView
        email="owner@example.com"
        state={workspace({
          organisations: [
            {
              id: ORG_ID,
              name: "Acme Ltd",
              membershipRole: "owner",
              verificationStatus: "pending",
            },
          ],
          selectedOrganisationId: ORG_ID,
        })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Acme Ltd is not verified yet" }),
    ).toBeDefined();
    expect(screen.queryByLabelText("Agent name")).toBeNull();
  });

  it("opens the identity step once the organisation is verified", () => {
    render(
      <AgentCreationView
        email="owner@example.com"
        state={workspace({
          organisations: [
            {
              id: ORG_ID,
              name: "Acme Ltd",
              membershipRole: "owner",
              verificationStatus: "verified",
            },
          ],
          selectedOrganisationId: ORG_ID,
        })}
      />,
    );

    expect(screen.getByLabelText("Agent name")).toBeDefined();
    expect(screen.getByLabelText("What it does")).toBeDefined();
    expect(screen.getByLabelText("Risk class")).toBeDefined();
    // Step 2's fields only exist once an AIN has been minted — the scope and
    // the SMCR reference are attached to a draft, not collected before one.
    expect(screen.queryByLabelText("SMCR reference")).toBeNull();
  });
});
