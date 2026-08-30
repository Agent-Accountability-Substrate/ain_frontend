import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { registerMock, patchMock, submitMock } = vi.hoisted(() => ({
  registerMock: vi.fn(),
  patchMock: vi.fn(),
  submitMock: vi.fn(),
}));

vi.mock("@/domains/agents/agent-actions", () => ({
  registerAgentAction: registerMock,
  patchAgentAction: patchMock,
  submitAgentAction: submitMock,
}));

import { AgentCreationWizard } from "@/domains/agents/agent-creation-wizard";
import { chooseOption, selectTrigger } from "@/lib/testing/select";

const ORG_ID = "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d";
const ORG_ULID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const AIN = "did:ain:gb:01ARZ3NDEKTSV4RRFFQ69G5FAV:01BX5ZZKBKACTAV9WEVGEMMVRZ";

function renderWizard(
  props: Partial<Parameters<typeof AgentCreationWizard>[0]> = {},
) {
  return render(
    <AgentCreationWizard
      organisationId={ORG_ID}
      organisationName="Northwind Advisory Ltd"
      organisationUlid={ORG_ULID}
      organisationVerified
      {...props}
    />,
  );
}

/** Fill the required identity fields so jsdom does not block the submit. */
function fillIdentity() {
  fireEvent.change(screen.getByLabelText(/agent name/i), {
    target: { value: "Payments Operations Agent" },
  });
  fireEvent.change(screen.getByLabelText(/what it does/i), {
    target: { value: "Initiates supplier payments" },
  });
}

function fillDeclaration() {
  fireEvent.change(screen.getByLabelText(/authorised action classes/i), {
    target: { value: "payments.initiate" },
  });
  fireEvent.change(screen.getByLabelText(/accountable role title/i), {
    target: { value: "Head of Collections" },
  });
  fireEvent.change(screen.getByLabelText(/responsibility area/i), {
    target: { value: "collections" },
  });
  fireEvent.change(screen.getByLabelText(/smcr reference/i), {
    target: { value: "SMF24-000123" },
  });
}

describe("AgentCreationWizard", () => {
  beforeEach(() => {
    registerMock.mockReset().mockResolvedValue({ status: "idle" });
    patchMock.mockReset().mockResolvedValue({ status: "idle" });
    submitMock.mockReset().mockResolvedValue({ status: "idle" });
  });

  it("refuses to run without an organisation rather than staging an orphan", () => {
    // An agent record is always owned by an organisation. A form here would
    // stage a record against an organisation that does not exist.
    renderWizard({ organisationId: null, organisationName: null });

    expect(
      screen.getByRole("heading", { name: /choose an organisation/i }),
    ).toBeDefined();
    expect(screen.queryByRole("button", { name: /mint/i })).toBeNull();
  });

  it("says the organisation is unverified instead of taking the declaration first", () => {
    // The registry answers 403 here. Better to say so before the work than to
    // collect three steps and refuse at issuance.
    renderWizard({ organisationVerified: false });

    expect(
      screen.getByRole("heading", { name: /is not verified yet/i }),
    ).toBeDefined();
    expect(screen.getByText(/Northwind Advisory Ltd/)).toBeDefined();
    expect(screen.queryByRole("button", { name: /mint/i })).toBeNull();
  });

  it("offers a back button when the caller can go back, a link otherwise", () => {
    const onBack = vi.fn();
    const { unmount } = renderWizard({ onBack });
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalled();
    unmount();

    renderWizard();
    expect(screen.queryByRole("button", { name: /^back$/i })).toBeNull();
    expect(
      screen.getByRole("link", { name: /choose organisation/i }),
    ).toBeDefined();
  });

  it("keeps the chosen risk class", async () => {
    renderWizard();
    const submitted = () =>
      document.querySelector<HTMLInputElement>('input[name="riskClass"]')
        ?.value;

    // Fail closed: the highest risk class is the default, so a form submitted
    // without touching it never understates what the agent may do.
    expect(submitted()).toBe("high");
    expect(selectTrigger("Risk class").textContent).toContain("High");

    await chooseOption("Risk class", "Low");

    expect(submitted()).toBe("low");
    expect(selectTrigger("Risk class").textContent).toContain("Low");
  });

  it("walks minting, declaration and issuance as three registry calls", async () => {
    // Not one form posted at the end: POST mints the AIN and opens a draft,
    // PATCH attaches scope and accountability, submit signs. A draft that
    // exists on the server is a draft the wizard can show.
    renderWizard();

    registerMock.mockResolvedValue({ status: "done", ain: AIN });
    fillIdentity();
    fireEvent.click(screen.getByRole("button", { name: /mint identifier/i }));

    expect(
      await screen.findByLabelText(/authorised action classes/i),
    ).toBeDefined();
    expect(document.querySelector("input[name=ain]")).toHaveProperty(
      "value",
      AIN,
    );

    patchMock.mockResolvedValue({ status: "done" });
    fillDeclaration();
    fireEvent.click(
      screen.getByRole("button", { name: /attach declaration/i }),
    );

    expect(
      await screen.findByRole("heading", { name: /sign and issue/i }),
    ).toBeDefined();

    submitMock.mockResolvedValue({
      status: "done",
      ain: AIN,
      resolverUrl: "https://resolve.ain.test/" + AIN,
      documentVersion: 1,
    });
    fireEvent.click(screen.getByRole("button", { name: /^sign and issue$/i }));

    expect(
      await screen.findByRole("heading", { name: /registered and signed/i }),
    ).toBeDefined();
    expect(screen.getByText(/document v1/i)).toBeDefined();
    expect(screen.getByRole("link", { name: /resolver url/i })).toHaveProperty(
      "href",
      "https://resolve.ain.test/" + AIN,
    );
  });

  it("shows a refusal at the step that caused it, keeping the entered work", async () => {
    renderWizard();

    registerMock.mockResolvedValue({
      status: "error",
      message: "an agent with that name already exists",
      errors: {},
    });
    fillIdentity();
    fireEvent.click(screen.getByRole("button", { name: /mint identifier/i }));

    const refusal = await screen.findByRole("alert");
    expect(refusal.textContent).toBe("an agent with that name already exists");
    expect(screen.getByLabelText(/agent name/i)).toHaveProperty(
      "value",
      "Payments Operations Agent",
    );
  });

  it("keeps the draft addressable when the declaration is refused", async () => {
    renderWizard();

    registerMock.mockResolvedValue({ status: "done", ain: AIN });
    fillIdentity();
    fireEvent.click(screen.getByRole("button", { name: /mint identifier/i }));
    await screen.findByLabelText(/authorised action classes/i);

    patchMock.mockResolvedValue({
      status: "error",
      message: "scope must declare at least one action class",
      errors: {},
    });
    fillDeclaration();
    fireEvent.click(
      screen.getByRole("button", { name: /attach declaration/i }),
    );

    expect((await screen.findByRole("alert")).textContent).toBe(
      "scope must declare at least one action class",
    );
    // The AIN is minted and permanent — a refused declaration must not lose it.
    expect(document.querySelector("input[name=ain]")).toHaveProperty(
      "value",
      AIN,
    );
    // Nor the six fields that were typed to earn the refusal. React resets an
    // uncontrolled form once its action resolves, which is why these are not.
    expect(screen.getByLabelText(/smcr reference/i)).toHaveProperty(
      "value",
      "SMF24-000123",
    );
    expect(screen.getByLabelText(/authorised action classes/i)).toHaveProperty(
      "value",
      "payments.initiate",
    );
  });

  it("leaves the agent a signable draft when issuance is refused", async () => {
    renderWizard();

    registerMock.mockResolvedValue({ status: "done", ain: AIN });
    fillIdentity();
    fireEvent.click(screen.getByRole("button", { name: /mint identifier/i }));
    await screen.findByLabelText(/authorised action classes/i);

    patchMock.mockResolvedValue({ status: "done" });
    fillDeclaration();
    fireEvent.click(
      screen.getByRole("button", { name: /attach declaration/i }),
    );
    await screen.findByRole("heading", { name: /sign and issue/i });

    submitMock.mockResolvedValue({
      status: "error",
      message: "issuance signing is not configured",
      errors: {},
    });
    fireEvent.click(screen.getByRole("button", { name: /^sign and issue$/i }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "issuance signing is not configured",
    );
    expect(screen.getByRole("link", { name: /leave as draft/i })).toBeDefined();
  });
});

describe("field-level refusals", () => {
  it("shows the message for the field that caused it", async () => {
    // "Check the highlighted fields" is only true if the fields say anything.
    // The errors map was built server-side and rendered nowhere, so the one
    // sentence telling someone what to do was discarded.
    registerMock.mockResolvedValue({
      status: "error",
      message: "Check the highlighted fields.",
      errors: { name: "Name the agent" },
    });
    renderWizard();
    fillIdentity();
    fireEvent.click(screen.getByRole("button", { name: /mint identifier/i }));

    // The refusal itself is announced once, at the top. The per-field sentence
    // is attached to the field it is about, via `aria-describedby` and
    // `aria-invalid` — so it is read when that field is reached rather than
    // firing one alert per field the moment the response lands.
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Check the highlighted fields.",
    );

    const field = screen.getByRole("textbox", { name: /agent name/i });
    expect(field.getAttribute("aria-invalid")).toBe("true");
    const described = (field.getAttribute("aria-describedby") ?? "")
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent);
    expect(described).toContain("Name the agent");
  });

  it("shows the scope message, which is the one that says what to do", async () => {
    registerMock.mockResolvedValue({ status: "done", ain: AIN });
    renderWizard();
    fillIdentity();
    fireEvent.click(screen.getByRole("button", { name: /mint identifier/i }));
    await screen.findByLabelText(/authorised action classes/i);

    patchMock.mockResolvedValue({
      status: "error",
      message: "Check the highlighted fields.",
      errors: {
        actionClasses:
          "Declare at least one action class, or state a deny-all scope explicitly",
      },
    });
    fillDeclaration();
    fireEvent.click(
      screen.getByRole("button", { name: /attach declaration/i }),
    );

    expect(await screen.findByText(/deny-all scope explicitly/i)).toBeDefined();
  });

  it("says nothing per-field when the refusal is not about a field", async () => {
    registerMock.mockResolvedValue({
      status: "error",
      message: "organisation is not verified",
      errors: {},
    });
    renderWizard();
    fillIdentity();
    fireEvent.click(screen.getByRole("button", { name: /mint identifier/i }));

    const alerts = await screen.findAllByRole("alert");
    expect(alerts.map((node) => node.textContent)).toEqual([
      "organisation is not verified",
    ]);
  });
});
