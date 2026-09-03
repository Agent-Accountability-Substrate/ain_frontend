import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { transitionMock } = vi.hoisted(() => ({ transitionMock: vi.fn() }));

vi.mock("@/domains/agents/agent-actions", () => ({
  transitionAgentAction: transitionMock,
}));

import { AgentLifecycleMenu } from "@/domains/agents/agent-lifecycle-menu";
import type { AgentTransition } from "@/domains/agents/agent-record";

const ORG_ID = "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d";
const AIN = "did:ain:gb:01ARZ3NDEKTSV4RRFFQ69G5FAV:01BX5ZZKBKACTAV9WEVGEMMVRZ";

function open(transitions: readonly AgentTransition[]) {
  render(
    <AgentLifecycleMenu
      agentName="Collections Assistant"
      ain={AIN}
      organisationId={ORG_ID}
      transitions={transitions}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Manage Collections Assistant" }),
  );
  return screen.getByRole("menu");
}

describe("AgentLifecycleMenu", () => {
  beforeEach(() => {
    transitionMock.mockReset();
    transitionMock.mockResolvedValue({ status: "idle" });
  });

  it("offers only the transitions the registry would accept", () => {
    // A suspended agent cannot be suspended again, and there is no
    // reinstatement event, so the menu must not imply one exists.
    const menu = open(["revoke"]);

    expect(
      within(menu).getByRole("menuitem", { name: /Revoke this agent/ }),
    ).toBeDefined();
    expect(
      within(menu).queryByRole("menuitem", { name: /Suspend this agent/ }),
    ).toBeNull();
  });

  it("asks before withdrawing authority, and says what is at stake", () => {
    const menu = open(["suspend", "revoke"]);
    fireEvent.click(
      within(menu).getByRole("menuitem", { name: /Revoke this agent/ }),
    );

    const dialog = screen.getByRole("alertdialog");
    expect(
      within(dialog).getByText(/Revoke Collections Assistant\?/),
    ).toBeDefined();
    // Terminal, and the identifier is never reissued — both worth saying
    // before the click rather than after.
    expect(within(dialog).getByText(/terminal/)).toBeDefined();
  });

  it("demands a reason, which the registry does too", () => {
    const menu = open(["suspend"]);
    fireEvent.click(
      within(menu).getByRole("menuitem", { name: /Suspend this agent/ }),
    );

    const reason = screen.getByRole("textbox", {
      name: /Why this is being suspended/,
    });
    expect(reason.hasAttribute("required")).toBe(true);
  });

  it("carries the transition it was opened for into the form", () => {
    const menu = open(["suspend", "revoke"]);
    fireEvent.click(
      within(menu).getByRole("menuitem", { name: /Suspend this agent/ }),
    );

    const form = screen.getByRole("alertdialog").querySelector("form")!;
    const data = new FormData(form);
    expect(data.get("transition")).toBe("suspend");
    expect(data.get("ain")).toBe(AIN);
    expect(data.get("organisationId")).toBe(ORG_ID);
  });

  it("opens a fresh dialog for a second transition after the first succeeded", async () => {
    // `useActionState` has no reset, so a dialog that survived a successful
    // suspension carried `done` into the revoke and refused to open — which is
    // exactly the sequence a suspended agent invites.
    transitionMock.mockResolvedValue({
      status: "done",
      agentStatus: "suspended",
      eventType: "suspended",
      seq: 3,
    });

    const menu = open(["suspend", "revoke"]);
    fireEvent.click(
      within(menu).getByRole("menuitem", { name: /Suspend this agent/ }),
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: /Why this is being suspended/ }),
      { target: { value: "Model replaced" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Suspend" }));

    // The dialog closes itself once the transition is recorded.
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());

    fireEvent.click(
      screen.getByRole("button", { name: "Manage Collections Assistant" }),
    );
    fireEvent.click(
      within(screen.getByRole("menu")).getByRole("menuitem", {
        name: /Revoke this agent/,
      }),
    );

    const dialog = await screen.findByRole("alertdialog");
    expect(new FormData(dialog.querySelector("form")!).get("transition")).toBe(
      "revoke",
    );
  });

  it("keeps the dialog open on a refusal, where the reason is", () => {
    transitionMock.mockResolvedValue({
      status: "error",
      message: "this agent is revoked, which is terminal",
      errors: {},
    });

    const menu = open(["suspend"]);
    fireEvent.click(
      within(menu).getByRole("menuitem", { name: /Suspend this agent/ }),
    );

    expect(screen.getByRole("alertdialog")).toBeDefined();
  });
});
