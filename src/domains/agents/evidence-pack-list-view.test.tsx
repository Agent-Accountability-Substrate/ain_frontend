import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/domains/agents/evidence-actions", () => ({
  requestEvidencePackAction: vi.fn(),
}));
vi.mock("@/domains/agents/evidence-pack-watch", () => ({
  EvidencePackWatch: ({ watching }: { watching: readonly string[] }) =>
    watching.length > 0 ? <p>watching {watching.join(",")}</p> : null,
}));

import { EvidencePackListView } from "@/domains/agents/evidence-pack-list-view";
import type { EvidencePack } from "@/domains/agents/evidence-pack";
import type { AgentRecord } from "@/domains/agents/agent-record";
import type { OrganisationSummary } from "@/domains/workspace/account-workspace";

const ULID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const ORG_ID = "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d";
const AIN = `did:ain:gb:${ULID}:01BX5ZZKBKACTAV9WEVGEMMVRZ`;
const HASH = "c3d4".repeat(16);

const ORGANISATION: OrganisationSummary = {
  id: ORG_ID,
  ulid: ULID,
  name: "Northbank Credit Ltd",
  membershipRole: "owner",
  verificationStatus: "verified",
};

const AGENT: AgentRecord = {
  ain: AIN,
  name: "Collections Assistant",
  role: "customer collections outreach",
  status: "active",
  riskClass: "high",
  organisationId: ORG_ID,
  validFrom: "2026-07-16T12:00:00Z",
  createdAt: "2026-07-16T11:00:00Z",
  externalIdentities: [],
  lifecycle: [],
};

const pack = (over: Partial<EvidencePack> = {}): EvidencePack => ({
  packId: "0b6f1d2c-8a4e-4f19-9c3d-5e7a1b2c4d6f",
  ain: AIN,
  packType: "agent-activity",
  packVersion: "1",
  rangeStart: "2026-07-01T00:00:00Z",
  rangeEnd: "2026-07-31T23:59:59Z",
  status: "completed",
  contentHash: HASH,
  createdAt: "2026-08-01T06:00:00Z",
  ...over,
});

const view = (
  packs: readonly EvidencePack[],
  agent: AgentRecord = AGENT,
  page: { nextCursor?: string; cursor?: string } = {},
) =>
  render(
    <EvidencePackListView
      agent={agent}
      organisation={ORGANISATION}
      listing={{
        packs,
        ...(page.nextCursor !== undefined && { nextCursor: page.nextCursor }),
      }}
      {...(page.cursor !== undefined && { cursor: page.cursor })}
    />,
  );

describe("the packages requested for an agent", () => {
  it("leads to each package rather than to a file", () => {
    // Only the single-package read mints links. A list that carried them would
    // presign every package this organisation ever asked for.
    view([pack()]);

    const row = screen.getByRole("link", { name: /1 Jul 2026 to 31 Jul 2026/ });
    expect(row.getAttribute("href")).toBe(
      `/o/${ULID}/agents/${encodeURIComponent(AIN)}/evidence-packs/0b6f1d2c-8a4e-4f19-9c3d-5e7a1b2c4d6f`,
    );
  });

  it("shows a failed package rather than hiding it", () => {
    // A request that failed has to be tellable from one nobody made.
    view([pack({ status: "failed", contentHash: undefined })]);

    expect(screen.getByText("Could not be assembled")).not.toBeNull();
    expect(screen.getByText(/kept, not hidden/i)).not.toBeNull();
  });

  it("reads queued and generating the same way, because they mean the same", () => {
    view([
      pack({ packId: "a", status: "queued", contentHash: undefined }),
      pack({ packId: "b", status: "generating", contentHash: undefined }),
    ]);

    expect(screen.getAllByText("Being assembled")).toHaveLength(2);
    expect(screen.getByText("watching a,b")).not.toBeNull();
  });

  it("stops watching once everything has landed", () => {
    view([pack(), pack({ packId: "b", status: "failed" })]);

    expect(screen.queryByText(/^watching/)).toBeNull();
  });

  it("carries the digest a reader checks the bundle against", () => {
    view([pack()]);

    expect(screen.getByText(HASH)).not.toBeNull();
  });

  it("says nothing is signed yet while a package is in flight", () => {
    view([pack({ status: "generating", contentHash: undefined })]);

    expect(screen.getByText(/Nothing signed yet/i)).not.toBeNull();
  });

  it("offers the form and nothing to open when none has been asked for", () => {
    view([]);

    expect(screen.getByText(/No packages yet/i)).not.toBeNull();
    expect(
      screen.getByRole("button", { name: /Request package/ }),
    ).not.toBeNull();
    expect(
      screen
        .queryAllByRole("link")
        .filter((link) =>
          (link.getAttribute("href") ?? "").includes("/evidence-packs/"),
        ),
    ).toEqual([]);
  });
});

describe("paging the listing", () => {
  const LISTING = `/o/${ULID}/agents/${encodeURIComponent(AIN)}/evidence-packs`;

  it("offers no pager when the whole listing fits on one page", () => {
    view([pack()]);

    expect(screen.queryByRole("link", { name: /Older packages/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /Back to newest/ })).toBeNull();
  });

  it("carries the registry's cursor into the address, untouched", () => {
    // The address, so a page of the listing is a place — shareable, and
    // survivable by a back button — rather than something a component
    // remembers. Opaque, so it is carried rather than parsed.
    view([pack()], AGENT, { nextCursor: "MjAyNn4xYw" });

    expect(
      screen.getByRole("link", { name: /Older packages/ }).getAttribute("href"),
    ).toBe(`${LISTING}?cursor=MjAyNn4xYw`);
  });

  it("offers the way back to the newest, which the cursor cannot give", () => {
    // Forward-only: the registry issues no token for the page before, and
    // building one from what is on screen would guess at an ordering the
    // listing does not promise.
    view([pack()], AGENT, { cursor: "MjAyNn4xYw" });

    expect(
      screen.getByRole("link", { name: /Back to newest/ }).getAttribute("href"),
    ).toBe(LISTING);
    expect(screen.queryByRole("link", { name: /Older packages/ })).toBeNull();
  });

  it("says there is nothing further back rather than nothing at all", () => {
    // "Ask for one above" on a deep page would be answering a question the
    // reader did not ask.
    view([], AGENT, { cursor: "MjAyNn4xYw" });

    expect(screen.getByText(/Nothing further back/i)).not.toBeNull();
    expect(screen.queryByText(/No packages yet/i)).toBeNull();
  });
});

describe("an agent that has never been issued", () => {
  const draft: AgentRecord = { ...AGENT, status: "draft" };

  it("explains why instead of offering a form the registry would refuse", () => {
    view([], draft);

    expect(screen.getByText(/has not been issued/i)).not.toBeNull();
    expect(
      screen.queryByRole("button", { name: /Request package/ }),
    ).toBeNull();
  });

  it("says so in the empty state too, not just above it", () => {
    view([], draft);

    expect(
      screen.getByText(/none can be assembled until this agent is issued/i),
    ).not.toBeNull();
  });

  it("leads back to the record, which is where a draft is finished", () => {
    view([], draft);

    const back = within(
      screen.getByText(/has not been issued/i).closest("section")!,
    ).getByRole("link", { name: /Back to the record/ });
    expect(back.getAttribute("href")).toBe(
      `/o/${ULID}/agents/${encodeURIComponent(AIN)}`,
    );
  });
});
