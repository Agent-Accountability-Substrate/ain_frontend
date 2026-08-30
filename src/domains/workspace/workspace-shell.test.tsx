import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { pathnameMock } = vi.hoisted(() => ({ pathnameMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: pathnameMock,
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/domains/auth/auth-actions", () => ({ signOutAction: vi.fn() }));

import { WorkspaceShell } from "@/domains/workspace/workspace-shell";
import type { OrganisationSummary } from "@/domains/workspace/account-workspace";
import type { IndividualAssuranceStatus } from "@/domains/identity/identity-assurance";

const ALPHA: OrganisationSummary = {
  id: "3f1b1f7e-0000-4000-8000-00000000000a",
  ulid: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  name: "Alpha Ltd",
  membershipRole: "owner",
  verificationStatus: "verified",
};
const BETA: OrganisationSummary = {
  id: "3f1b1f7e-0000-4000-8000-00000000000b",
  ulid: "01BX5ZZKBKACTAV9WEVGEMMVRZ",
  name: "Beta Ltd",
  membershipRole: "member",
  verificationStatus: "verified",
};

function renderShell(
  organisations = [ALPHA, BETA],
  selectedOrganisationId: string | null = null,
  assuranceStatus: IndividualAssuranceStatus = "not_started",
) {
  render(
    <WorkspaceShell
      assuranceStatus={assuranceStatus}
      email="owner@example.com"
      organisations={organisations}
      selectedOrganisationId={selectedOrganisationId}
    >
      <p>the screen</p>
    </WorkspaceShell>,
  );
}

describe("WorkspaceShell", () => {
  beforeEach(() => {
    pathnameMock.mockReset();
    pathnameMock.mockReturnValue(`/o/${ALPHA.ulid}`);
  });

  it("reads the organisation off the address", () => {
    // A layout is not re-rendered per route, so it cannot be told which
    // organisation the screen beneath it is for. It reads the path instead —
    // the same resolution the page does, in the one place that survives a
    // navigation.
    pathnameMock.mockReturnValue(`/o/${BETA.ulid}/agents`);

    renderShell();

    expect(
      screen.getByRole("button", { name: `${BETA.name}, switch organisation` }),
    ).toBeDefined();
    const rail = screen.getByRole("navigation", {
      name: "Workspace navigation",
    });
    expect(
      within(rail).getByRole("link", { name: "Home" }).getAttribute("href"),
    ).toBe(`/o/${BETA.ulid}`);
  });

  it("keeps a workspace on a screen that names no organisation", () => {
    // The account's own settings, and registering a company. Emptying the bar
    // there reads as having been moved out of the company you were in.
    pathnameMock.mockReturnValue("/settings/account");

    renderShell();

    expect(
      screen.getByRole("button", {
        name: `${ALPHA.name}, switch organisation`,
      }),
    ).toBeDefined();
  });

  it("marks the section you are on", () => {
    pathnameMock.mockReturnValue(`/o/${ALPHA.ulid}/agents`);

    renderShell();

    expect(
      screen.getByRole("link", { name: "Agents" }).getAttribute("aria-current"),
    ).toBe("page");
    expect(
      screen.getByRole("link", { name: "Home" }).getAttribute("aria-current"),
    ).toBeNull();
  });

  it("shows the product, not an empty switcher, before the first membership", () => {
    pathnameMock.mockReturnValue("/o/new");

    renderShell([]);

    expect(
      screen.queryByRole("button", { name: /switch organisation/ }),
    ).toBeNull();
    expect(screen.getByRole("img", { name: "Subra" })).toBeDefined();
    // Home and Agents do not exist for this person yet.
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("renders the screen beneath it", () => {
    renderShell();

    expect(screen.getByText("the screen")).toBeDefined();
  });

  it("shows what the loader resolved where the address names none", () => {
    // The account's settings and the register-a-company screen. The frame and
    // the screen inside it are told the same thing, so they cannot disagree
    // about which company you are looking at.
    pathnameMock.mockReturnValue("/settings/account");

    renderShell([ALPHA, BETA], BETA.id);

    expect(
      screen.getByRole("button", { name: `${BETA.name}, switch organisation` }),
    ).toBeDefined();
  });

  it("lets the address win over what the loader resolved", () => {
    pathnameMock.mockReturnValue(`/o/${ALPHA.ulid}/agents`);

    renderShell([ALPHA, BETA], BETA.id);

    expect(
      screen.getByRole("button", {
        name: `${ALPHA.name}, switch organisation`,
      }),
    ).toBeDefined();
  });

  it("raises the identity notification from the record, not the address", () => {
    // Keyed on the address, the bell would announce the identity check only
    // while you stood on the identity screen, and would keep announcing it to
    // an account the registry reports as verified.
    pathnameMock.mockReturnValue("/o/01ARZ3NDEKTSV4RRFFQ69G5FAV");
    renderShell([ALPHA, BETA], null, "not_started");
    expect(
      screen.getByRole("button", { name: /Notifications, 1 unread/ }),
    ).toBeDefined();
  });

  it("stays quiet once the registry reports assurance", () => {
    pathnameMock.mockReturnValue("/onboarding/identity");
    renderShell([ALPHA, BETA], null, "verified");
    expect(
      screen.getByRole("button", { name: /Notifications, none unread/ }),
    ).toBeDefined();
  });
});
