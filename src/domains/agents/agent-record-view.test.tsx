import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/domains/agents/agent-actions", () => ({
  transitionAgentAction: vi.fn(),
}));

import { AgentRecordView } from "@/domains/agents/agent-record-view";
import type { AgentRecord } from "@/domains/agents/agent-record";
import type { OrganisationSummary } from "@/domains/workspace/account-workspace";

const ULID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const ORG_ID = "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d";
const AIN = `did:ain:gb:${ULID}:01BX5ZZKBKACTAV9WEVGEMMVRZ`;

const ORGANISATION: OrganisationSummary = {
  id: ORG_ID,
  ulid: ULID,
  name: "Northbank Credit Ltd",
  membershipRole: "owner",
  verificationStatus: "verified",
};

const ISSUED: AgentRecord = {
  ain: AIN,
  name: "Collections Assistant",
  role: "customer collections outreach",
  status: "active",
  riskClass: "high",
  organisationId: ORG_ID,
  validFrom: "2026-07-16T12:00:00Z",
  createdAt: "2026-07-16T11:00:00Z",
  document: {
    documentVersion: 3,
    documentHash: "9f2c7a".padEnd(64, "0"),
    kid: "ain-registry-2026-07",
    validFrom: "2026-07-16T12:00:00Z",
  },
  scope: {
    actionClasses: ["customer_comms.send", "payments.initiate"],
    constraints: { "payments.initiate": { max_value_gbp: 5000 } },
    riskLevel: "high",
    regulatoryMappings: ["FCA CONC 7"],
  },
  accountability: {
    roleTitle: "Head of Collections",
    responsibilityArea: "collections operations",
    regulatoryIdentifier: "SMF24-000123",
  },
  externalIdentities: [
    {
      refType: "spiffe",
      refValue: "spiffe://northbank.example/agents/collections",
      verified: false,
    },
  ],
  lifecycle: [
    {
      seq: 1,
      eventType: "registered",
      occurredAt: "2026-07-16T11:00:00Z",
      eventHash: "aa",
      previousEventHash: null,
    },
    {
      seq: 2,
      eventType: "approved",
      occurredAt: "2026-07-16T12:00:00Z",
      eventHash: "bb",
      previousEventHash: "aa",
    },
  ],
  resolverUrl: `https://resolver.subrahq.com/${AIN}`,
};

describe("AgentRecordView", () => {
  it("shows the authorised scope, which the register never did", () => {
    render(<AgentRecordView agent={ISSUED} organisation={ORGANISATION} />);

    // Twice: once as an authorised class, once as the class its bound applies
    // to. Both matter — a bound on a class that is not declared is refused.
    expect(screen.getAllByText("payments.initiate")).toHaveLength(2);
    expect(screen.getByText("customer_comms.send")).toBeDefined();
    // The bound is shown as the pair it is. Whether `max_value_gbp` is a
    // ceiling is the vocabulary's to say, not this screen's.
    expect(screen.getByText("max_value_gbp")).toBeDefined();
    expect(screen.getByText("5000")).toBeDefined();
  });

  it("names the human who answers for the agent", () => {
    // Named accountability is the product's fifth principle and appeared on no
    // screen at all before this one.
    render(<AgentRecordView agent={ISSUED} organisation={ORGANISATION} />);

    expect(screen.getByText("Head of Collections")).toBeDefined();
    expect(screen.getByText("SMF24-000123")).toBeDefined();
  });

  it("shows the version the document was signed at, and the key that signed it", () => {
    render(<AgentRecordView agent={ISSUED} organisation={ORGANISATION} />);

    expect(screen.getByText("v3")).toBeDefined();
    expect(screen.getByText("ain-registry-2026-07")).toBeDefined();
  });

  it("says an external reference is recorded rather than proved", () => {
    // The MVP stores the link and verifies nothing, so the row must not read
    // as though something checked it.
    render(<AgentRecordView agent={ISSUED} organisation={ORGANISATION} />);

    expect(screen.getByText("Recorded, not verified")).toBeDefined();
  });

  it("renders the lifecycle chain in sequence", () => {
    render(<AgentRecordView agent={ISSUED} organisation={ORGANISATION} />);

    const entries = screen.getAllByRole("listitem");
    const chain = entries.filter((entry) =>
      /Registered|Approved and signed/.test(entry.textContent ?? ""),
    );
    expect(chain).toHaveLength(2);
    expect(within(chain[0]!).getByText("Registered")).toBeDefined();
  });

  it("says plainly when the chain does not link up", () => {
    // A break is the one thing this ledger exists to reveal, so it is stated
    // rather than rendered over with a tidy timeline.
    render(
      <AgentRecordView
        agent={{
          ...ISSUED,
          lifecycle: [
            { ...ISSUED.lifecycle[0]! },
            { ...ISSUED.lifecycle[1]!, previousEventHash: "wrong" },
          ],
        }}
        organisation={ORGANISATION}
      />,
    );

    expect(screen.getByText("This chain does not link up")).toBeDefined();
  });

  it("offers both withdrawals on an active agent", () => {
    render(<AgentRecordView agent={ISSUED} organisation={ORGANISATION} />);

    expect(
      screen.getByRole("button", { name: /Manage Collections Assistant/ }),
    ).toBeDefined();
  });

  it("offers no withdrawal once the agent is revoked", () => {
    // Terminal. Nothing follows a revocation.
    render(
      <AgentRecordView
        agent={{ ...ISSUED, status: "revoked" }}
        organisation={ORGANISATION}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /Manage Collections Assistant/ }),
    ).toBeNull();
  });

  it("routes a draft back into the wizard rather than leaving it stranded", () => {
    // A draft already holds a permanent identifier, and an AIN is never
    // recycled — so the way on has to be continuing this one.
    render(
      <AgentRecordView
        agent={{
          ...ISSUED,
          status: "draft",
          lifecycle: [],
          externalIdentities: [],
        }}
        organisation={ORGANISATION}
      />,
    );

    const resume = screen.getByRole("link", { name: /Continue this draft/ });
    expect(resume.getAttribute("href")).toBe(
      `/o/${ULID}/agents/new?draft=${encodeURIComponent(AIN)}`,
    );
  });

  it("says an undeclared scope authorises nothing", () => {
    render(
      <AgentRecordView
        agent={{
          ...ISSUED,
          status: "draft",
          lifecycle: [],
          externalIdentities: [],
          scope: undefined,
          accountability: undefined,
          document: undefined,
          resolverUrl: undefined,
        }}
        organisation={ORGANISATION}
      />,
    );

    expect(
      screen.getByText(/authorised to do nothing/, { exact: false }),
    ).toBeDefined();
  });
});
