import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/domains/agents/evidence-pack-watch", () => ({
  EvidencePackWatch: ({ watching }: { watching: readonly string[] }) =>
    watching.length > 0 ? <p>watching {watching.join(",")}</p> : null,
}));

import { EvidencePackView } from "@/domains/agents/evidence-pack-view";
import type { EvidencePackDetail } from "@/domains/agents/evidence-pack";
import type { AgentRecord } from "@/domains/agents/agent-record";
import type { OrganisationSummary } from "@/domains/workspace/account-workspace";

const ULID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const ORG_ID = "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d";
const AIN = `did:ain:gb:${ULID}:01BX5ZZKBKACTAV9WEVGEMMVRZ`;
const PACK_ID = "0b6f1d2c-8a4e-4f19-9c3d-5e7a1b2c4d6f";
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

const COMPLETED: EvidencePackDetail = {
  packId: PACK_ID,
  ain: AIN,
  packType: "agent-activity",
  packVersion: "1",
  rangeStart: "2026-07-01T00:00:00Z",
  rangeEnd: "2026-07-31T23:59:59Z",
  status: "completed",
  contentHash: HASH,
  exportSignature: "eyJhbGciOiJFZERTQSJ9..c2ln",
  kid: "ain-issuer-2026-01",
  createdAt: "2026-08-01T06:00:00Z",
  downloadUrl: "https://objects.example.test/packs/p.json?X-Amz-Signature=abc",
  pdfDownloadUrl:
    "https://objects.example.test/packs/p.pdf?X-Amz-Signature=abc",
  downloadExpiresIn: 300,
};

const view = (pack: EvidencePackDetail) =>
  render(
    <EvidencePackView agent={AGENT} organisation={ORGANISATION} pack={pack} />,
  );

describe("a completed package", () => {
  it("offers both files and says which one is the evidence", () => {
    view(COMPLETED);

    const bundle = screen.getByRole("link", { name: /Signed bundle/ });
    const rendering = screen.getByRole("link", { name: /Rendering/ });

    expect(bundle.getAttribute("href")).toBe(COMPLETED.downloadUrl);
    expect(rendering.getAttribute("href")).toBe(COMPLETED.pdfDownloadUrl);
    expect(bundle.textContent).toMatch(/what a verifier checks/i);
    expect(rendering.textContent).toMatch(/for a person to read/i);
  });

  it("saves the file rather than navigating away from what explains it", () => {
    view(COMPLETED);

    expect(
      screen
        .getByRole("link", { name: /Signed bundle/ })
        .getAttribute("download"),
    ).toBe(`evidence-package-${PACK_ID}.json`);
  });

  it("keeps this workspace's address out of the request for the file", () => {
    // The address carries the organisation and the agent. A `Referer` would
    // send both to whoever hosts the bucket, for no benefit at all.
    view(COMPLETED);

    for (const name of [/Signed bundle/, /Rendering/]) {
      expect(screen.getByRole("link", { name }).getAttribute("rel")).toBe(
        "noreferrer",
      );
    }
  });

  it("says the links expire, because the link is the credential", () => {
    view(COMPLETED);

    const note = screen.getByText(/stop working in about 5 minutes/i);
    expect(note.textContent).toMatch(/the link is the credential/i);
  });

  it("prints what a reader checks the bundle against", () => {
    view(COMPLETED);

    expect(screen.getByText(HASH)).not.toBeNull();
    expect(screen.getByText("ain-issuer-2026-01")).not.toBeNull();
    expect(screen.getByText(COMPLETED.exportSignature!)).not.toBeNull();
  });

  it("gives a very short expiry in seconds rather than rounding it to zero", () => {
    // A deployment may set the window low. "0 minutes" would read as expired.
    view({ ...COMPLETED, downloadExpiresIn: 45 });

    expect(
      screen.getByText(/stop working in about 45 seconds/i),
    ).not.toBeNull();
  });

  it("still says the links are short-lived when the registry gave no expiry", () => {
    const { downloadExpiresIn, ...noExpiry } = COMPLETED;
    void downloadExpiresIn;
    view(noExpiry);

    expect(screen.getByText(/short-lived/i)).not.toBeNull();
  });

  it("prints only the manifest values the registry actually sent", () => {
    // A completed package carries all three; a row that somehow carries fewer
    // must not render an empty field where a signature belongs.
    view({ ...COMPLETED, exportSignature: undefined, kid: undefined });

    expect(screen.getByText(HASH)).not.toBeNull();
    expect(screen.queryByText("ain-issuer-2026-01")).toBeNull();
  });

  it("still serves the record where the registry can hand out no files", () => {
    // The truth about that deployment, rather than a page that refuses a
    // package a member is entitled to see the record of.
    const { downloadUrl, pdfDownloadUrl, downloadExpiresIn, ...noFiles } =
      COMPLETED;
    void downloadUrl;
    void pdfDownloadUrl;
    void downloadExpiresIn;
    view(noFiles);

    expect(screen.queryByRole("link", { name: /Signed bundle/ })).toBeNull();
    expect(screen.getByText(/cannot hand out files/i)).not.toBeNull();
    expect(screen.getByText(HASH)).not.toBeNull();
  });
});

describe("a package that is not ready", () => {
  it("offers nothing to download while it is being assembled", () => {
    view({ ...COMPLETED, status: "generating", contentHash: undefined });

    expect(screen.queryByRole("link", { name: /Signed bundle/ })).toBeNull();
    expect(screen.getByText(`watching ${PACK_ID}`)).not.toBeNull();
    expect(
      screen.getByText(/Nothing is downloadable until it has/i),
    ).not.toBeNull();
  });

  it("says a failure lost nothing, and how to try again", () => {
    view({ ...COMPLETED, status: "failed" });

    expect(screen.queryByRole("link", { name: /Signed bundle/ })).toBeNull();
    expect(screen.getByRole("alert").textContent).toMatch(
      /Nothing has been lost/i,
    );
    // Finished, not in flight: watching a failed package would poll forever
    // over a row that has already reached its outcome.
    expect(screen.queryByText(/^watching/)).toBeNull();
  });

  it("never renders a link the registry did not send", () => {
    // A completed package whose links are absent, and an unfinished one, must
    // both produce no anchor into object storage at all.
    view({ ...COMPLETED, status: "queued" });

    for (const link of screen.queryAllByRole("link")) {
      expect(link.getAttribute("href")).not.toContain("objects.example.test");
    }
  });
});
