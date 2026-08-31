import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import {
  newConstraintRow,
  ScopeConstraintsField,
  type ConstraintRow,
} from "@/domains/agents/scope-constraints-field";

/** The field is controlled, so the test owns the rows the way the wizard does. */
function Harness({
  actionClasses,
  initial = [],
  error,
}: {
  actionClasses: string[];
  initial?: ConstraintRow[];
  error?: string;
}) {
  const [rows, setRows] = useState<readonly ConstraintRow[]>(initial);
  return (
    <form>
      <ScopeConstraintsField
        actionClasses={actionClasses}
        rows={rows}
        onChange={setRows}
        {...(error !== undefined && { error })}
      />
    </form>
  );
}

describe("ScopeConstraintsField", () => {
  it("has nothing to bound until an action class is declared", () => {
    // A bound must name a declared class, so offering the control first would
    // invite a row the registry refuses.
    render(<Harness actionClasses={[]} />);

    expect(
      screen.getByText(/List an authorised action above first/),
    ).toBeDefined();
    expect(screen.queryByRole("button", { name: /Add a bound/ })).toBeNull();
  });

  it("adds a row already pointed at the first declared class", () => {
    render(<Harness actionClasses={["payments.initiate"]} />);

    fireEvent.click(screen.getByRole("button", { name: /Add a bound/ }));

    expect(screen.getByRole("textbox", { name: /Bound/ })).toBeDefined();
    // The select posts the class, so it must not start empty.
    expect(screen.getByText("payments.initiate")).toBeDefined();
  });

  it("posts each row as parallel fields the action can read with getAll", () => {
    render(
      <Harness
        actionClasses={["payments.initiate"]}
        initial={[newConstraintRow("payments.initiate")]}
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: /Bound/ }), {
      target: { value: "max_value_gbp" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /^Value/ }), {
      target: { value: "5000" },
    });

    const form = document.querySelector("form")!;
    const data = new FormData(form);
    expect(data.getAll("constraintClass")).toEqual(["payments.initiate"]);
    expect(data.getAll("constraintKey")).toEqual(["max_value_gbp"]);
    expect(data.getAll("constraintValue")).toEqual(["5000"]);
    // The type travels with the value: the evaluator refuses a bound of the
    // wrong kind, and a form that posted everything as text would declare
    // bounds that only fail later, at admission.
    expect(data.getAll("constraintType")).toEqual(["number"]);
  });

  it("removes the row it was asked to remove", () => {
    render(
      <Harness
        actionClasses={["payments.initiate"]}
        initial={[
          newConstraintRow("payments.initiate"),
          newConstraintRow("payments.initiate"),
        ]}
      />,
    );

    expect(screen.getAllByRole("textbox", { name: /Bound/ })).toHaveLength(2);
    fireEvent.click(
      screen.getAllByRole("button", { name: /Remove the bound/ })[0]!,
    );
    expect(screen.getAllByRole("textbox", { name: /Bound/ })).toHaveLength(1);
  });

  it("shows the action's refusal beside the rows that caused it", () => {
    render(
      <Harness
        actionClasses={["payments.initiate"]}
        initial={[newConstraintRow("payments.initiate")]}
        error="max_value_gbp: A number bound needs a number"
      />,
    );

    expect(
      screen.getByText("max_value_gbp: A number bound needs a number"),
    ).toBeDefined();
  });
});
