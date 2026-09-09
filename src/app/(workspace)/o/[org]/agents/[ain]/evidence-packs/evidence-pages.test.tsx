import { describe, expect, it, vi } from "vitest";

const {
  loadOrganisationPageMock,
  getAgentMock,
  listEvidencePacksMock,
  getEvidencePackMock,
  notFoundMock,
} = vi.hoisted(() => ({
  loadOrganisationPageMock: vi.fn(),
  getAgentMock: vi.fn(),
  listEvidencePacksMock: vi.fn(),
  getEvidencePackMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    // Next aborts rendering rather than returning, and a page relying on that
    // must not carry on to the read below it.
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/domains/workspace/organisation-page", () => ({
  loadOrganisationPage: loadOrganisationPageMock,
}));
vi.mock("@/lib/registry/registry-api", () => ({
  getAgent: getAgentMock,
  listEvidencePacks: listEvidencePacksMock,
  getEvidencePack: getEvidencePackMock,
}));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));
vi.mock("@/domains/agents/evidence-pack-list-view", () => ({
  EvidencePackListView: () => null,
}));
vi.mock("@/domains/agents/evidence-pack-view", () => ({
  EvidencePackView: () => null,
}));

import EvidencePacksPage from "./page";
import EvidencePackPage from "./[pack]/page";

const ULID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const ORG_ID = "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d";
const AIN = `did:ain:gb:${ULID}:01BX5ZZKBKACTAV9WEVGEMMVRZ`;
const PACK_ID = "0b6f1d2c-8a4e-4f19-9c3d-5e7a1b2c4d6f";

const READY = {
  status: "ready",
  organisation: { id: ORG_ID, ulid: ULID, name: "Northbank Credit Ltd" },
};

const AGENT = { ain: AIN, name: "Collections Assistant", status: "active" };

function reset() {
  loadOrganisationPageMock.mockReset();
  getAgentMock.mockReset();
  listEvidencePacksMock.mockReset();
  getEvidencePackMock.mockReset();
  notFoundMock.mockClear();
}

/**
 * The two evidence screens, as route entry points.
 *
 * What is worth pinning here is not what they render — the views have their
 * own tests — but the order they do things in. The tenant is resolved before
 * either registry read is attempted, and the agent is resolved before the
 * packages, so a package can never be read under an AIN this organisation does
 * not hold.
 */
describe("the evidence packages page", () => {
  it("resolves the tenant before reading anything", async () => {
    reset();
    // The layout above has already replaced the frame with the outage screen,
    // so the page renders nothing rather than reading on regardless.
    loadOrganisationPageMock.mockResolvedValue({ status: "unavailable" });

    const rendered = await EvidencePacksPage({
      params: Promise.resolve({ org: ULID, ain: encodeURIComponent(AIN) }),
      searchParams: Promise.resolve({}),
    });

    expect(rendered).toBeNull();
    expect(getAgentMock).not.toHaveBeenCalled();
    expect(listEvidencePacksMock).not.toHaveBeenCalled();
  });

  it("never reads packages under an agent this organisation does not hold", async () => {
    reset();
    loadOrganisationPageMock.mockResolvedValue(READY);
    getAgentMock.mockResolvedValue(null);

    await expect(
      EvidencePacksPage({
        params: Promise.resolve({ org: ULID, ain: encodeURIComponent(AIN) }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(listEvidencePacksMock).not.toHaveBeenCalled();
  });

  it("hands the registry the AIN as minted, not as it sits in the address", async () => {
    reset();
    loadOrganisationPageMock.mockResolvedValue(READY);
    getAgentMock.mockResolvedValue(AGENT);
    listEvidencePacksMock.mockResolvedValue({ packs: [] });

    await EvidencePacksPage({
      params: Promise.resolve({ org: ULID, ain: encodeURIComponent(AIN) }),
      searchParams: Promise.resolve({}),
    });

    // Encoding it twice would have the registry look up an identifier nobody
    // minted, and answer 404 for an agent that exists.
    expect(getAgentMock).toHaveBeenCalledWith(ORG_ID, AIN);
    expect(listEvidencePacksMock).toHaveBeenCalledWith(ORG_ID, AIN, undefined);
  });
});

describe("the cursor a listing page is read at", () => {
  async function read(cursor: unknown) {
    reset();
    loadOrganisationPageMock.mockResolvedValue(READY);
    getAgentMock.mockResolvedValue(AGENT);
    listEvidencePacksMock.mockResolvedValue({ packs: [] });

    await EvidencePacksPage({
      params: Promise.resolve({ org: ULID, ain: encodeURIComponent(AIN) }),
      searchParams: Promise.resolve({ cursor } as { cursor?: string }),
    });
    return listEvidencePacksMock.mock.calls[0];
  }

  it("passes the address's cursor to the registry untouched", async () => {
    // Opaque by construction. A page that parsed one would depend on an
    // ordering the listing does not promise.
    expect(await read("MjAyNn4xYw")).toEqual([ORG_ID, AIN, "MjAyNn4xYw"]);
  });

  it("starts from the newest when the address names no position", async () => {
    expect(await read(undefined)).toEqual([ORG_ID, AIN, undefined]);
  });

  it("starts from the newest when the cursor is repeated in the address", async () => {
    // A param given twice arrives as an array, which names no single
    // position — so it is treated as no position rather than as its first.
    expect(await read(["a", "b"])).toEqual([ORG_ID, AIN, undefined]);
  });
});

describe("the single package page", () => {
  it("resolves the tenant before reading anything", async () => {
    reset();
    loadOrganisationPageMock.mockResolvedValue({ status: "unavailable" });

    const rendered = await EvidencePackPage({
      params: Promise.resolve({
        org: ULID,
        ain: encodeURIComponent(AIN),
        pack: PACK_ID,
      }),
    });

    expect(rendered).toBeNull();
    expect(getEvidencePackMock).not.toHaveBeenCalled();
  });

  it("never reads a package under an agent this organisation does not hold", async () => {
    reset();
    loadOrganisationPageMock.mockResolvedValue(READY);
    getAgentMock.mockResolvedValue(null);

    await expect(
      EvidencePackPage({
        params: Promise.resolve({
          org: ULID,
          ain: encodeURIComponent(AIN),
          pack: PACK_ID,
        }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(getEvidencePackMock).not.toHaveBeenCalled();
  });

  it("reads the package under the agent it is addressed beneath", async () => {
    reset();
    loadOrganisationPageMock.mockResolvedValue(READY);
    getAgentMock.mockResolvedValue(AGENT);
    getEvidencePackMock.mockResolvedValue({ packId: PACK_ID });

    await EvidencePackPage({
      params: Promise.resolve({
        org: ULID,
        ain: encodeURIComponent(AIN),
        pack: PACK_ID,
      }),
    });

    expect(getEvidencePackMock).toHaveBeenCalledWith(ORG_ID, AIN, PACK_ID);
  });

  it("is not found when this agent has no such package", async () => {
    reset();
    loadOrganisationPageMock.mockResolvedValue(READY);
    getAgentMock.mockResolvedValue(AGENT);
    getEvidencePackMock.mockResolvedValue(null);

    await expect(
      EvidencePackPage({
        params: Promise.resolve({
          org: ULID,
          ain: encodeURIComponent(AIN),
          pack: PACK_ID,
        }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
