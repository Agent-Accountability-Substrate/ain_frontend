import { fireEvent, render, screen } from "@testing-library/react";
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
    // The address matters most here: the column is NOT NULL, so a form
    // without the field submits nothing but 422s.
    render(<OrganisationCreationView />);

    expect(screen.getByLabelText("Legal organisation name")).toBeDefined();
    expect(screen.getByLabelText("Companies House number")).toBeDefined();
    expect(screen.getByLabelText("Registered office address")).toBeDefined();
    expect(screen.getByLabelText("Website (optional)")).toBeDefined();
  });

  it("submits the jurisdiction as a code, not as a country name", () => {
    // The registry takes ISO 3166-1 alpha-2 lowercase. The select used to
    // carry the display name, which no amount of backend validation could fix.
    render(<OrganisationCreationView />);

    // A listbox trigger is a button, so the submitted value lives on the hidden
    // input the select renders — which is the thing the action actually reads.
    const trigger = screen.getByRole("combobox", {
      name: "Registration jurisdiction",
    });
    expect(trigger.textContent).toContain("United Kingdom");
    const submitted = document.querySelector<HTMLInputElement>(
      'input[name="jurisdiction"]',
    );
    expect(submitted).not.toBeNull();
    expect(submitted).toHaveProperty("value", "gb");
  });

  it("will not submit until authority is attested", () => {
    render(<OrganisationCreationView />);
    fillDetails();
    fireEvent.click(
      screen.getByRole("button", { name: /continue to authority/i }),
    );

    const submit = screen.getByRole("button", {
      name: /complete organisation setup/i,
    });
    expect(submit).toHaveProperty("disabled", true);

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /I confirm I am authorised to submit this organisation/i,
      }),
    );

    expect(submit).toHaveProperty("disabled", false);
  });

  it("shows what happens next, and does not offer agent creation", async () => {
    // The registry refuses agents in an unverified organisation (403), so a
    // link into the agent wizard here would walk someone into a refusal.
    createOrganisationActionMock.mockImplementation(
      (): CreateOrganisationState => ({
        status: "created",
        organisationId: "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d",
        organisationUlid: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
      }),
    );
    render(<OrganisationCreationView />);
    fillDetails();
    fireEvent.click(
      screen.getByRole("button", { name: /continue to authority/i }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /I confirm I am authorised to submit this organisation/i,
      }),
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
    // The way on is the organisation itself, addressed by the ULID the
    // registry just minted.
    expect(
      screen.getByRole("link", { name: /go to example holdings ltd/i }),
    ).toHaveProperty(
      "href",
      "http://localhost:3000/o/01ARZ3NDEKTSV4RRFFQ69G5FAV",
    );
  });

  it("puts the registry's refusal beside the field at fault", async () => {
    createOrganisationActionMock.mockImplementation(
      (): CreateOrganisationState => ({
        status: "error",
        message: "company already registered",
        errors: { registrationNumber: "company already registered" },
      }),
    );
    render(<OrganisationCreationView />);
    fillDetails();
    fireEvent.click(
      screen.getByRole("button", { name: /continue to authority/i }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /I confirm I am authorised to submit this organisation/i,
      }),
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
