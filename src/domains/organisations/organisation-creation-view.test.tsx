import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrganisationCreationView } from "@/domains/organisations/organisation-creation-view";
import type { CreateOrganisationState } from "@/domains/organisations/organisation-actions";

vi.mock("@/domains/auth/auth-actions", () => ({
  signOutAction: vi.fn(),
}));

// The action reaches the registry, which reaches next-auth. Mocked so this
// stays a test of the form — what it collects, what it refuses to submit, and
// what it says afterwards — rather than of the network path underneath it.
const { createOrganisationActionMock } = vi.hoisted(() => ({
  createOrganisationActionMock: vi.fn(),
}));

// Only the action is mocked. JURISDICTIONS deliberately is not: it lives in
// its own module because a "use server" file may export only async functions,
// and mocking it here would hide a regression that reaching for it again.
vi.mock("@/domains/organisations/organisation-actions", () => ({
  createOrganisationAction: createOrganisationActionMock,
}));

function fillDetails(): void {
  fireEvent.change(screen.getByLabelText("Legal organisation name"), {
    target: { value: "Example Holdings Ltd" },
  });
  fireEvent.change(screen.getByLabelText("Companies House number"), {
    target: { value: "01234567" },
  });
  fireEvent.change(screen.getByLabelText("Registered office address"), {
    target: { value: "1 Example Street, London, EC1A 1AA" },
  });
}

describe("OrganisationCreationView", () => {
  beforeEach(() => {
    createOrganisationActionMock.mockReset();
    createOrganisationActionMock.mockImplementation(
      (): CreateOrganisationState => ({ status: "idle" }),
    );
  });

  it("collects everything the registry requires", () => {
    // The address is the one that matters here: the column is NOT NULL, and
    // this form used to have no field for it at all, so every submission it
    // could have made would have been a 422.
    render(<OrganisationCreationView email="owner@example.com" />);

    expect(screen.getByLabelText("Legal organisation name")).toBeDefined();
    expect(screen.getByLabelText("Companies House number")).toBeDefined();
    expect(screen.getByLabelText("Registered office address")).toBeDefined();
    expect(screen.getByLabelText("Website (optional)")).toBeDefined();
  });

  it("submits the jurisdiction as a code, not as a country name", () => {
    // The registry takes ISO 3166-1 alpha-2 lowercase. The select used to
    // carry the display name, which no amount of backend validation could fix.
    render(<OrganisationCreationView email="owner@example.com" />);

    const select = screen.getByLabelText("Registration jurisdiction");
    expect(select).toHaveProperty("value", "gb");
    expect(within(select as HTMLElement).getByRole("option")).toHaveProperty(
      "text",
      "United Kingdom",
    );
  });

  it("will not submit until authority is attested", () => {
    render(<OrganisationCreationView email="owner@example.com" />);
    fillDetails();
    fireEvent.click(
      screen.getByRole("button", { name: /continue to authority/i }),
    );

    const submit = screen.getByRole("button", {
      name: /complete organisation setup/i,
    });
    expect(submit).toHaveProperty("disabled", true);

    fireEvent.click(
      screen.getByLabelText(
        /I confirm I am authorised to submit this organisation/i,
      ),
    );

    expect(submit).toHaveProperty("disabled", false);
  });

  it("shows what happens next, and does not offer agent creation", async () => {
    // The registry refuses agents in an unverified organisation (403), so a
    // link into the agent wizard here would walk someone into a refusal. This
    // screen used to do exactly that.
    createOrganisationActionMock.mockImplementation(
      (): CreateOrganisationState => ({
        status: "created",
        organisationId: "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d",
      }),
    );
    render(<OrganisationCreationView email="owner@example.com" />);
    fillDetails();
    fireEvent.click(
      screen.getByRole("button", { name: /continue to authority/i }),
    );
    fireEvent.click(
      screen.getByLabelText(
        /I confirm I am authorised to submit this organisation/i,
      ),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /complete organisation setup/i }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Example Holdings Ltd is registered",
      }),
    ).toBeDefined();
    expect(screen.queryByText(/create your first agent/i)).toBeNull();
    expect(
      screen.getByText(/agents can be registered once it is verified/i),
    ).toBeDefined();
  });

  it("puts the registry's refusal beside the field at fault", async () => {
    createOrganisationActionMock.mockImplementation(
      (): CreateOrganisationState => ({
        status: "error",
        message: "company already registered",
        errors: { registrationNumber: "company already registered" },
      }),
    );
    render(<OrganisationCreationView email="owner@example.com" />);
    fillDetails();
    fireEvent.click(
      screen.getByRole("button", { name: /continue to authority/i }),
    );
    fireEvent.click(
      screen.getByLabelText(
        /I confirm I am authorised to submit this organisation/i,
      ),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /complete organisation setup/i }),
    );

    const alerts = await screen.findAllByRole("alert");
    expect(
      alerts.some((node) => node.textContent === "company already registered"),
    ).toBe(true);
    // And what was typed is still there. Queried by form-control name rather
    // than by label, because on the review step the details are hidden — the
    // point is that the value is still in the form, ready to resubmit, not
    // that it is on screen.
    expect(
      document.querySelector<HTMLInputElement>(
        'input[name="registrationNumber"]',
      )?.value,
    ).toBe("01234567");
  });
});
