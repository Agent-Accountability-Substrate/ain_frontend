import { describe, expect, it } from "vitest";

import {
  ACCOUNT_SETTINGS,
  agentHref,
  ainFromParam,
  isOrganisationUlid,
  landingHref,
  NEW_ORGANISATION,
  orgHref,
  ORGANISATION_SETTINGS,
  SETTINGS,
} from "@/domains/workspace/workspace-routes";

const ALPHA = { ulid: "01ARZ3NDEKTSV4RRFFQ69G5FAV" };
const BETA = { ulid: "01BX5ZZKBKACTAV9WEVGEMMVRZ" };

describe("workspace routes", () => {
  it("addresses an organisation by its public identifier", () => {
    // The ULID, not the internal uuid: it is already the organisation segment
    // of every AIN this organisation mints, so the address bar publishes
    // nothing the identifiers do not already carry.
    expect(orgHref(ALPHA.ulid)).toBe("/o/01ARZ3NDEKTSV4RRFFQ69G5FAV");
    expect(orgHref(ALPHA.ulid, "agents/new")).toBe(
      "/o/01ARZ3NDEKTSV4RRFFQ69G5FAV/agents/new",
    );
  });

  it("splits settings by what owns them", () => {
    // The account's own pages carry no tenant, because none owns them. A
    // company's do, like every other screen scoped to it.
    expect(SETTINGS).toBe("/settings");
    expect(ACCOUNT_SETTINGS).toBe("/settings/account");
    expect(ORGANISATION_SETTINGS).toBe("/settings/organisations");
    expect(orgHref(ALPHA.ulid, "settings/registration")).toBe(
      "/o/01ARZ3NDEKTSV4RRFFQ69G5FAV/settings/registration",
    );
    expect(orgHref(ALPHA.ulid, "settings/members")).toBe(
      "/o/01ARZ3NDEKTSV4RRFFQ69G5FAV/settings/members",
    );
  });

  it("registers a company outside settings, because that is what creates one", () => {
    expect(NEW_ORGANISATION).toBe("/o/new");
  });

  it("recognises a ULID, and only a ULID", () => {
    expect(isOrganisationUlid(ALPHA.ulid)).toBe(true);
    // Crockford base32 excludes I, L, O and U so they cannot be misread.
    expect(isOrganisationUlid("01ARZ3NDEKTSV4RRFFQ69G5FAI")).toBe(false);
    expect(isOrganisationUlid("6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d")).toBe(
      false,
    );
    // The one static segment under /o, which must never resolve as a tenant.
    expect(isOrganisationUlid("new")).toBe(false);
    expect(isOrganisationUlid(ALPHA.ulid.toLowerCase())).toBe(false);
  });

  it("lands an arrival inside an organisation rather than on a chooser", () => {
    // The switcher is the first thing in the top bar, so a screen whose only
    // job is to ask which organisation you meant asks a question the bar has
    // already answered.
    expect(landingHref([])).toBe(NEW_ORGANISATION);
    expect(landingHref([ALPHA])).toBe(orgHref(ALPHA.ulid));
    expect(landingHref([ALPHA, BETA])).toBe(orgHref(ALPHA.ulid));
  });
});

describe("ainFromParam", () => {
  const AIN =
    "did:ain:gb:01ARZ3NDEKTSV4RRFFQ69G5FAV:01BX5ZZKBKACTAV9WEVGEMMVRZ";

  it("reads back the identifier a route segment carries", () => {
    // Next hands a dynamic param over still percent-encoded, on a server
    // render and a client navigation alike. Passing it straight to the API
    // client encodes it twice, and the registry then answers 404 for an
    // identifier nobody minted.
    expect(ainFromParam(agentHref("X", AIN).split("/agents/")[1]!)).toBe(AIN);
  });

  it("leaves an already-decoded identifier alone", () => {
    // An AIN is `did:ain:` plus two Crockford base32 ULIDs — an alphabet with
    // no `%` in it — so this keeps working if Next ever starts decoding.
    expect(ainFromParam(AIN)).toBe(AIN);
  });
});
