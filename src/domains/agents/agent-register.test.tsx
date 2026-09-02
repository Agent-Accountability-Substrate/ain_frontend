import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AgentRegister } from "@/domains/agents/agent-register";
import type { WorkspaceAgent } from "@/domains/workspace/account-workspace";

const ORG_A = "3f1b1f7e-0000-4000-8000-00000000000a";
const ORG_B = "3f1b1f7e-0000-4000-8000-00000000000b";

const AGENTS: WorkspaceAgent[] = [
  {
    ain: "did:ain:gb:01ARZ3NDEKTSV4RRFFQ69G5FAV:01J9Z3K7Q2M8WXG0J8N1V6ABCD",
    name: "Payments Operations Agent",
    role: "Initiates and reconciles supplier payments",
    status: "active",
    riskClass: "high",
    organisationId: ORG_A,
    validFrom: "2026-07-23T10:42:00Z",
    createdAt: "2026-07-23T10:40:00Z",
  },
  {
    ain: "did:ain:gb:01ARZ3NDEKTSV4RRFFQ69G5FAV:01J9Z3K7Q2M8WXG0J8N1V6EFGH",
    name: "Reconciliation Agent",
    role: "Matches ledger entries overnight",
    status: "draft",
    riskClass: "low",
    organisationId: ORG_B,
    validFrom: null,
    createdAt: "2026-07-24T09:00:00Z",
  },
];

const ONE_ORG = [{ id: ORG_A, name: "Example Holdings Ltd" }];
const TWO_ORGS = [...ONE_ORG, { id: ORG_B, name: "Northgate Trading Ltd" }];

describe("AgentRegister", () => {
  it("shows each agent's permanent identifier in full", () => {
    // These rows were already fetched, parsed and counted for a metric tile,
    // then discarded — so three registered agents appeared on no screen at all.
    render(<AgentRegister agents={AGENTS} organisations={TWO_ORGS} />);

    for (const agent of AGENTS) {
      expect(screen.getByText(agent.ain)).toBeDefined();
      expect(screen.getByText(agent.name)).toBeDefined();
      expect(screen.getByText(agent.role)).toBeDefined();
    }
  });

  it("reports the registry's own status word rather than a friendlier one", () => {
    // `status` and `risk_class` are deliberately open strings in the payload
    // contract — the vocabulary is partner-gated — so a fixed enum here would
    // silently drop any value the registry adds.
    render(<AgentRegister agents={AGENTS} organisations={TWO_ORGS} />);

    const rows = screen.getAllByRole("listitem");
    expect(within(rows[0]!).getByText("active")).toBeDefined();
    expect(within(rows[1]!).getByText("draft")).toBeDefined();
  });

  it("names the owning organisation only when there is more than one", () => {
    const { unmount } = render(
      <AgentRegister agents={AGENTS} organisations={TWO_ORGS} />,
    );
    expect(screen.getByText("Northgate Trading Ltd")).toBeDefined();
    unmount();

    render(<AgentRegister agents={[AGENTS[0]!]} organisations={ONE_ORG} />);
    // One membership means the column repeats one value on every row.
    expect(screen.queryByText("Example Holdings Ltd")).toBeNull();
  });

  it("says the register is empty rather than showing an empty list", () => {
    render(<AgentRegister agents={[]} organisations={ONE_ORG} />);

    expect(
      screen.getByRole("heading", { name: "No agents yet" }),
    ).toBeDefined();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
