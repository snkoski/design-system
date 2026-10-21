import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { takeWarnings } from "../../../tests/warnings";
import { Segment } from "./Segment";
import { SegmentedControl } from "./SegmentedControl";
import type { SegmentedControlProps } from "./SegmentedControl";

const options = (
  <>
    <Segment value="monthly">Monthly</Segment>
    <Segment value="yearly">Yearly</Segment>
    <Segment value="lifetime">Lifetime</Segment>
  </>
);

const getGroup = () => screen.getByRole("radiogroup");
const getOption = (name: string) => screen.getByRole("radio", { name });
const getOptions = () => {
  const radios = screen.getAllByRole("radio");
  expect(radios.length).toBeGreaterThan(0);
  return radios;
};
/** The names of the chosen options, in order */
const chosen = () =>
  ["Monthly", "Yearly", "Lifetime"].filter((name) => screen.queryByRole("radio", { name })?.getAttribute("aria-checked") === "true");
const submitted = (form: HTMLFormElement) => new FormData(form).getAll("billing");

describe("SegmentedControl", () => {
  describe("rendering", () => {
    it("renders a radio group named by its label, holding its options", () => {
      render(<SegmentedControl label="Billing">{options}</SegmentedControl>);
      const group = screen.getByRole("radiogroup", { name: "Billing" });
      expect(group).toContainElement(getOption("Monthly"));
      expect(group).toContainElement(getOption("Lifetime"));
    });

    it("renders each option as a span with the radio role, like Radio, so a disabled one stays focusable", () => {
      render(<SegmentedControl label="Billing">{options}</SegmentedControl>);
      for (const option of getOptions()) {
        expect(option.tagName).toBe("SPAN");
        expect(option).toHaveClass("segment__button");
      }
    });

    it("renders the label as the group's legend, so CSS can target it", () => {
      render(<SegmentedControl label="Billing">{options}</SegmentedControl>);
      expect(screen.getByText("Billing")).toHaveClass("segmented-control__label");
      expect(getGroup()).toContainElement(screen.getByText("Billing"));
    });

    it("can be named by aria-label alone, with no visible label", () => {
      const { container } = render(<SegmentedControl aria-label="Billing">{options}</SegmentedControl>);
      expect(screen.getByRole("radiogroup", { name: "Billing" })).toBeInTheDocument();
      expect(container.querySelector(".segmented-control__label")).toBeNull();
      expect(getGroup()).not.toHaveAttribute("aria-labelledby");
    });

    it("chooses nothing by default", () => {
      render(<SegmentedControl label="Billing">{options}</SegmentedControl>);
      for (const option of getOptions()) expect(option).toHaveAttribute("aria-checked", "false");
    });

    it("puts the options inside one track, in order", () => {
      const { container } = render(<SegmentedControl label="Billing">{options}</SegmentedControl>);
      const track = container.querySelector(".segmented-control__track");
      expect(track).toBeInTheDocument();
      for (const option of getOptions()) expect(track).toContainElement(option);
      expect(getOptions()).toHaveLength(3);
      expect(getOption("Monthly").compareDocumentPosition(getOption("Lifetime"))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it("gives each option its own id", () => {
      render(<SegmentedControl label="Billing">{options}</SegmentedControl>);
      const ids = getOptions().map((option) => option.id);
      expect(ids.every(Boolean)).toBe(true);
      expect(new Set(ids).size).toBe(3);
    });

    it("applies className to the outer wrapper, next to its own class", () => {
      const { container } = render(
        <SegmentedControl label="Billing" className="mt-4">
          {options}
        </SegmentedControl>,
      );
      expect(container.firstElementChild).toHaveClass("segmented-control", "mt-4");
    });

    it("passes other props through to the group element", () => {
      render(
        <SegmentedControl label="Billing" data-testid="billing">
          {options}
        </SegmentedControl>,
      );
      expect(screen.getByTestId("billing")).toBe(getGroup());
    });

    it("never uses modifier classes", () => {
      const { container } = render(
        <SegmentedControl label="Billing" size="lg" invalid disabled readOnly required description="More" error="Choose one.">
          {options}
        </SegmentedControl>,
      );
      expect(container.querySelector(".segmented-control__track")).toBeInTheDocument();
      expect(container.innerHTML).not.toMatch(/segmented-control--|segment--/);
    });
  });

  describe("sizes", () => {
    it("is medium by default", () => {
      const { container } = render(<SegmentedControl label="Billing">{options}</SegmentedControl>);
      expect(container.firstElementChild).toHaveAttribute("data-size", "md");
    });

    it("renders size as data-size on the outer wrapper", () => {
      const { container } = render(
        <SegmentedControl label="Billing" size="lg">
          {options}
        </SegmentedControl>,
      );
      expect(container.firstElementChild).toHaveAttribute("data-size", "lg");
    });
  });

  describe("choosing", () => {
    it("starts with the defaultValue option chosen", () => {
      render(
        <SegmentedControl label="Billing" defaultValue="yearly">
          {options}
        </SegmentedControl>,
      );
      expect(chosen()).toEqual(["Yearly"]);
    });

    it("chooses nothing when defaultValue matches no option", () => {
      render(
        <SegmentedControl label="Billing" defaultValue="weekly">
          {options}
        </SegmentedControl>,
      );
      expect(getOptions()).toHaveLength(3);
      expect(chosen()).toEqual([]);
    });

    it("chooses one option at a time, reporting the new value", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <SegmentedControl label="Billing" defaultValue="monthly" onValueChange={onValueChange}>
          {options}
        </SegmentedControl>,
      );
      await user.click(getOption("Yearly"));
      expect(chosen()).toEqual(["Yearly"]);
      await user.click(getOption("Lifetime"));
      expect(chosen()).toEqual(["Lifetime"]);
      expect(onValueChange.mock.calls.map(([value]) => value)).toEqual(["yearly", "lifetime"]);
    });

    it("chooses an option when its label text is clicked, once per click", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <SegmentedControl label="Billing" onValueChange={onValueChange}>
          {options}
        </SegmentedControl>,
      );
      await user.click(getOption("Lifetime").querySelector(".segment__label")!);
      expect(chosen()).toEqual(["Lifetime"]);
      expect(onValueChange).toHaveBeenCalledOnce();
    });

    it("keeps an option chosen when it's clicked again", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <SegmentedControl label="Billing" defaultValue="yearly" onValueChange={onValueChange}>
          {options}
        </SegmentedControl>,
      );
      await user.click(getOption("Yearly"));
      expect(chosen()).toEqual(["Yearly"]);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("does nothing when the control's own label is clicked", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <SegmentedControl label="Billing" onValueChange={onValueChange}>
          {options}
        </SegmentedControl>,
      );
      await user.click(screen.getByText("Billing"));
      expect(getOptions()).toHaveLength(3);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("follows the value prop when controlled, and doesn't change by itself", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(
        <SegmentedControl label="Billing" value="monthly" onValueChange={onValueChange}>
          {options}
        </SegmentedControl>,
      );
      await user.click(getOption("Yearly"));
      expect(onValueChange).toHaveBeenCalledWith("yearly", expect.anything());
      expect(chosen()).toEqual(["Monthly"]);
      rerender(
        <SegmentedControl label="Billing" value="lifetime" onValueChange={onValueChange}>
          {options}
        </SegmentedControl>,
      );
      expect(chosen()).toEqual(["Lifetime"]);
    });

    it("chooses nothing when controlled with null, and clears when set back to null", async () => {
      function Controlled() {
        const [value, setValue] = useState<string | null>(null);
        return (
          <>
            <SegmentedControl label="Billing" value={value} onValueChange={setValue}>
              {options}
            </SegmentedControl>
            <button type="button" onClick={() => setValue(null)}>
              Clear
            </button>
          </>
        );
      }
      const user = userEvent.setup();
      render(<Controlled />);
      expect(getOptions()).toHaveLength(3);
      expect(chosen()).toEqual([]);
      await user.click(getOption("Yearly"));
      expect(chosen()).toEqual(["Yearly"]);
      await user.click(screen.getByRole("button", { name: "Clear" }));
      expect(chosen()).toEqual([]);
    });

    it("works as a controlled control driven by state", async () => {
      function Controlled() {
        const [value, setValue] = useState<string | null>("monthly");
        return (
          <>
            <SegmentedControl label="Billing" value={value} onValueChange={setValue}>
              {options}
            </SegmentedControl>
            <output>{value ?? "none"}</output>
          </>
        );
      }
      const user = userEvent.setup();
      render(<Controlled />);
      expect(screen.getByRole("status")).toHaveTextContent("monthly");
      await user.click(getOption("Lifetime"));
      expect(screen.getByRole("status")).toHaveTextContent("lifetime");
    });
  });

  describe("keyboard", () => {
    it("is one Tab stop: Tab lands on the first option when nothing is chosen, and the next Tab leaves", async () => {
      const user = userEvent.setup();
      render(
        <>
          <SegmentedControl label="Billing">{options}</SegmentedControl>
          <button type="button">After</button>
        </>,
      );
      await user.tab();
      expect(getOption("Monthly")).toHaveFocus();
      expect(chosen()).toEqual([]);
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    });

    it("lands on the chosen option with Tab and Shift+Tab", async () => {
      const user = userEvent.setup();
      render(
        <>
          <SegmentedControl label="Billing" defaultValue="yearly">
            {options}
          </SegmentedControl>
          <button type="button">After</button>
        </>,
      );
      await user.tab();
      expect(getOption("Yearly")).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
      await user.tab({ shift: true });
      expect(getOption("Yearly")).toHaveFocus();
    });

    it("moves and chooses with Right and Down, and Left and Up", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <SegmentedControl label="Billing" defaultValue="monthly" onValueChange={onValueChange}>
          {options}
        </SegmentedControl>,
      );
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(getOption("Yearly")).toHaveFocus();
      expect(chosen()).toEqual(["Yearly"]);
      await user.keyboard("{ArrowDown}");
      expect(chosen()).toEqual(["Lifetime"]);
      await user.keyboard("{ArrowLeft}");
      expect(chosen()).toEqual(["Yearly"]);
      await user.keyboard("{ArrowUp}");
      expect(getOption("Monthly")).toHaveFocus();
      expect(chosen()).toEqual(["Monthly"]);
      expect(onValueChange.mock.calls.map(([value]) => value)).toEqual(["yearly", "lifetime", "yearly", "monthly"]);
    });

    it("wraps around at both ends", async () => {
      const user = userEvent.setup();
      render(
        <SegmentedControl label="Billing" defaultValue="lifetime">
          {options}
        </SegmentedControl>,
      );
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(getOption("Monthly")).toHaveFocus();
      expect(chosen()).toEqual(["Monthly"]);
      await user.keyboard("{ArrowLeft}");
      expect(chosen()).toEqual(["Lifetime"]);
    });

    it("chooses the focused option with Space", async () => {
      const user = userEvent.setup();
      render(<SegmentedControl label="Billing">{options}</SegmentedControl>);
      await user.tab();
      expect(getOption("Monthly")).toHaveFocus();
      expect(chosen()).toEqual([]);
      await user.keyboard(" ");
      expect(chosen()).toEqual(["Monthly"]);
    });

    it("doesn't choose or submit the form with Enter", async () => {
      const onSubmit = vi.fn((event: Event) => event.preventDefault());
      const user = userEvent.setup();
      render(
        <form onSubmit={(event) => onSubmit(event.nativeEvent)}>
          <SegmentedControl label="Billing" name="billing">
            {options}
          </SegmentedControl>
          <button type="submit">Save</button>
        </form>,
      );
      await user.tab();
      expect(getOption("Monthly")).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(chosen()).toEqual([]);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("does nothing with Home or End", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <SegmentedControl label="Billing" defaultValue="yearly" onValueChange={onValueChange}>
          {options}
        </SegmentedControl>,
      );
      await user.tab();
      await user.keyboard("{Home}{End}");
      expect(getOption("Yearly")).toHaveFocus();
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe("description and error", () => {
    it("links the description to the group", () => {
      render(
        <SegmentedControl label="Billing" description="You can switch at any time.">
          {options}
        </SegmentedControl>,
      );
      expect(getGroup()).toHaveAccessibleDescription("You can switch at any time.");
      expect(getGroup()).toHaveAccessibleName("Billing");
    });

    it("puts the description between the label and the options", () => {
      render(
        <SegmentedControl label="Billing" description="You can switch at any time.">
          {options}
        </SegmentedControl>,
      );
      const description = screen.getByText("You can switch at any time.");
      expect(description).toHaveClass("segmented-control__description");
      expect(screen.getByText("Billing").compareDocumentPosition(description)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(description.compareDocumentPosition(getOption("Monthly"))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it("also describes each option with the control's description", () => {
      render(
        <SegmentedControl label="Billing" description="You can switch at any time.">
          {options}
        </SegmentedControl>,
      );
      for (const option of getOptions()) expect(option).toHaveAccessibleDescription("You can switch at any time.");
    });

    it("shows the error after the options, linked to the group, when invalid", () => {
      render(
        <SegmentedControl label="Billing" invalid error="Choose how to pay.">
          {options}
        </SegmentedControl>,
      );
      const error = screen.getByText("Choose how to pay.");
      expect(getGroup()).toHaveAccessibleDescription("Choose how to pay.");
      expect(getOption("Lifetime").compareDocumentPosition(error)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it("gives the error an icon that is hidden from screen readers", () => {
      render(
        <SegmentedControl label="Billing" invalid error="Choose how to pay.">
          {options}
        </SegmentedControl>,
      );
      const error = screen.getByText("Choose how to pay.").closest(".segmented-control__error");
      expect(error).toBeInTheDocument();
      expect(error?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });

    it("reads the description and the error together", () => {
      render(
        <SegmentedControl label="Billing" invalid description="You can switch at any time." error="Choose how to pay.">
          {options}
        </SegmentedControl>,
      );
      expect(getGroup()).toHaveAccessibleDescription("You can switch at any time. Choose how to pay.");
    });

    it("keeps its own description and error linked when given an aria-describedby", () => {
      render(
        <>
          <p id="hint">Prices include tax.</p>
          <SegmentedControl
            label="Billing"
            description="You can switch at any time."
            invalid
            error="Choose how to pay."
            aria-describedby="hint"
          >
            {options}
          </SegmentedControl>
        </>,
      );
      const description = getGroup().getAttribute("aria-describedby") ?? "";
      expect(description.split(" ")).toContain("hint");
      expect(getGroup()).toHaveAccessibleDescription(expect.stringContaining("Prices include tax."));
      expect(getGroup()).toHaveAccessibleDescription(expect.stringContaining("You can switch at any time."));
      expect(getGroup()).toHaveAccessibleDescription(expect.stringContaining("Choose how to pay."));
    });

    it("hides the error when the control is valid", () => {
      render(
        <SegmentedControl label="Billing" error="Choose how to pay.">
          {options}
        </SegmentedControl>,
      );
      expect(getOptions()).toHaveLength(3);
      expect(screen.queryByText("Choose how to pay.")).not.toBeInTheDocument();
      expect(getGroup()).toHaveAccessibleDescription("");
    });

    it("shows the error again when invalid turns on later", () => {
      const { rerender } = render(
        <SegmentedControl label="Billing" error="Choose how to pay.">
          {options}
        </SegmentedControl>,
      );
      expect(getOptions()).toHaveLength(3);
      expect(screen.queryByText("Choose how to pay.")).not.toBeInTheDocument();
      rerender(
        <SegmentedControl label="Billing" invalid error="Choose how to pay.">
          {options}
        </SegmentedControl>,
      );
      expect(screen.getByText("Choose how to pay.")).toBeInTheDocument();
    });

    it("marks the group and every option invalid when the control is", () => {
      render(
        <SegmentedControl label="Billing" invalid>
          {options}
        </SegmentedControl>,
      );
      expect(getGroup()).toHaveAttribute("aria-invalid", "true");
      for (const option of getOptions()) expect(option).toHaveAttribute("aria-invalid", "true");
    });

    it("is valid by default", () => {
      render(<SegmentedControl label="Billing">{options}</SegmentedControl>);
      expect(getGroup()).not.toHaveAttribute("aria-invalid", "true");
      for (const option of getOptions()) expect(option).not.toHaveAttribute("aria-invalid", "true");
    });

    it("is invalid with no error text without breaking", () => {
      const { container } = render(
        <SegmentedControl label="Billing" invalid>
          {options}
        </SegmentedControl>,
      );
      expect(getOption("Monthly")).toHaveAttribute("aria-invalid", "true");
      expect(container.querySelector(".segmented-control__error")).toBeNull();
    });
  });

  describe("required", () => {
    it("is announced as required", () => {
      render(
        <SegmentedControl label="Billing (required)" required>
          {options}
        </SegmentedControl>,
      );
      expect(getGroup()).toHaveAttribute("aria-required", "true");
    });

    it("is not required by default", () => {
      render(<SegmentedControl label="Billing">{options}</SegmentedControl>);
      expect(getOptions()).toHaveLength(3);
      expect(getGroup()).not.toHaveAttribute("aria-required", "true");
    });

    it("fails the form's own validation until an option is chosen", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <SegmentedControl label="Billing (required)" name="billing" required>
            {options}
          </SegmentedControl>
        </form>,
      );
      const form = screen.getByTestId("form") as HTMLFormElement;
      expect(form.querySelectorAll("input[name=billing]")).toHaveLength(3);
      expect(form.checkValidity()).toBe(false);
      await user.click(getOption("Yearly"));
      expect(form.checkValidity()).toBe(true);
    });

    // Native validation stops the submit event, so a form that shows its own error turns it off with
    // noValidate, checks the value, and sets invalid and error. required still announces the control as required.
    function RequiredBilling() {
      const [value, setValue] = useState<string | null>(null);
      const [submitted, setSubmitted] = useState(false);
      return (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          <SegmentedControl
            label="Billing (required)"
            name="billing"
            required
            value={value}
            onValueChange={setValue}
            invalid={submitted && value === null}
            error="Choose how to pay."
          >
            {options}
          </SegmentedControl>
          <button type="submit">Continue</button>
        </form>
      );
    }

    it("shows the error on the group and every option when submitted with nothing chosen", async () => {
      const user = userEvent.setup();
      render(<RequiredBilling />);
      expect(getGroup()).toHaveAttribute("aria-required", "true");
      expect(screen.queryByText("Choose how to pay.")).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Continue" }));
      expect(getGroup()).toHaveAccessibleDescription("Choose how to pay.");
      for (const option of getOptions()) {
        expect(option).toHaveAttribute("aria-invalid", "true");
        expect(option).toHaveAccessibleDescription("Choose how to pay.");
      }
    });

    it("clears the error once an option is chosen", async () => {
      const user = userEvent.setup();
      render(<RequiredBilling />);
      await user.click(screen.getByRole("button", { name: "Continue" }));
      expect(screen.getByText("Choose how to pay.")).toBeInTheDocument();
      await user.click(getOption("Monthly"));
      expect(screen.queryByText("Choose how to pay.")).not.toBeInTheDocument();
      expect(getOption("Yearly")).not.toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("disabled", () => {
    it("disables every option, and marks the wrapper and the group", () => {
      const { container } = render(
        <SegmentedControl label="Billing" disabled>
          {options}
        </SegmentedControl>,
      );
      expect(container.firstElementChild).toHaveAttribute("data-disabled");
      expect(getGroup()).toHaveAttribute("aria-disabled", "true");
      for (const option of getOptions()) {
        expect(option).toHaveAttribute("aria-disabled", "true");
        expect(option).toHaveAttribute("data-disabled");
      }
    });

    it("blocks clicks on the options", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <SegmentedControl label="Billing" disabled defaultValue="monthly" onValueChange={onValueChange}>
          {options}
        </SegmentedControl>,
      );
      await user.click(getOption("Yearly"));
      await user.click(getOption("Lifetime"));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(chosen()).toEqual(["Monthly"]);
    });

    // Base UI keeps the chosen option of a disabled group in the tab order, announced as disabled, as RadioGroup
    // does. We keep that for now; docs/revisit.md records the question.
    it("still lets Tab reach the chosen option, announced as disabled", async () => {
      const user = userEvent.setup();
      render(
        <SegmentedControl label="Billing" disabled defaultValue="yearly">
          {options}
        </SegmentedControl>,
      );
      await user.tab();
      expect(getOption("Yearly")).toHaveFocus();
      expect(getOption("Yearly")).toHaveAttribute("aria-disabled", "true");
    });

    it("blocks the arrow keys and Space", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <SegmentedControl label="Billing" disabled defaultValue="monthly" onValueChange={onValueChange}>
          {options}
        </SegmentedControl>,
      );
      getOption("Monthly").focus();
      await user.keyboard("{ArrowRight} ");
      expect(onValueChange).not.toHaveBeenCalled();
      expect(chosen()).toEqual(["Monthly"]);
    });

    it("keeps the chosen option chosen, and isn't submitted", () => {
      render(
        <form data-testid="form">
          <SegmentedControl label="Billing" name="billing" disabled defaultValue="yearly">
            {options}
          </SegmentedControl>
        </form>,
      );
      const input = screen.getByTestId("form").querySelector<HTMLInputElement>("input[name=billing][value=yearly]");
      expect(chosen()).toEqual(["Yearly"]);
      expect(input).toBeChecked();
      expect(input).toBeDisabled();
      expect(submitted(screen.getByTestId("form") as HTMLFormElement)).toEqual([]);
    });
  });

  describe("read only", () => {
    it("marks the group read-only, and each option for styling", () => {
      render(
        <SegmentedControl label="Billing" readOnly>
          {options}
        </SegmentedControl>,
      );
      expect(getGroup()).toHaveAttribute("aria-readonly", "true");
      for (const option of getOptions()) expect(option).toHaveAttribute("data-readonly");
    });

    it("blocks changes from clicks", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <SegmentedControl label="Billing" readOnly defaultValue="monthly" onValueChange={onValueChange}>
          {options}
        </SegmentedControl>,
      );
      await user.click(getOption("Yearly"));
      await user.click(getOption("Lifetime"));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(chosen()).toEqual(["Monthly"]);
    });

    it("lets the arrow keys move focus without choosing, and ignores Space", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <SegmentedControl label="Billing" readOnly defaultValue="monthly" onValueChange={onValueChange}>
          {options}
        </SegmentedControl>,
      );
      await user.tab();
      expect(getOption("Monthly")).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(getOption("Yearly")).toHaveFocus();
      await user.keyboard(" ");
      expect(onValueChange).not.toHaveBeenCalled();
      expect(chosen()).toEqual(["Monthly"]);
    });

    it("is not read-only by default", () => {
      render(<SegmentedControl label="Billing">{options}</SegmentedControl>);
      expect(getOptions()).toHaveLength(3);
      expect(getGroup()).not.toHaveAttribute("aria-readonly", "true");
    });

    it("is still submitted", () => {
      render(
        <form data-testid="form">
          <SegmentedControl label="Billing" name="billing" readOnly defaultValue="yearly">
            {options}
          </SegmentedControl>
        </form>,
      );
      expect(submitted(screen.getByTestId("form") as HTMLFormElement)).toEqual(["yearly"]);
    });
  });

  describe("in a form", () => {
    it("submits the chosen option's value under the control's name", () => {
      render(
        <form data-testid="form">
          <SegmentedControl label="Billing" name="billing" defaultValue="lifetime">
            {options}
          </SegmentedControl>
        </form>,
      );
      expect(submitted(screen.getByTestId("form") as HTMLFormElement)).toEqual(["lifetime"]);
    });

    it("submits nothing when nothing is chosen", () => {
      render(
        <form data-testid="form">
          <SegmentedControl label="Billing" name="billing">
            {options}
          </SegmentedControl>
        </form>,
      );
      expect(screen.getByTestId("form").querySelectorAll("input[name=billing]")).toHaveLength(3);
      expect(submitted(screen.getByTestId("form") as HTMLFormElement)).toEqual([]);
    });

    it("submits the option the user chooses", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <SegmentedControl label="Billing" name="billing" defaultValue="monthly">
            {options}
          </SegmentedControl>
        </form>,
      );
      await user.click(getOption("Yearly"));
      expect(submitted(screen.getByTestId("form") as HTMLFormElement)).toEqual(["yearly"]);
    });

    it("submits with a form it sits outside of, through form", () => {
      render(
        <>
          <form id="checkout" data-testid="outside-form" />
          <SegmentedControl label="Billing" name="billing" form="checkout" defaultValue="yearly">
            {options}
          </SegmentedControl>
        </>,
      );
      expect(submitted(screen.getByTestId("outside-form") as HTMLFormElement)).toEqual(["yearly"]);
    });
  });

  describe("refs", () => {
    it("forwards ref to the group element", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <SegmentedControl label="Billing" ref={ref}>
          {options}
        </SegmentedControl>,
      );
      expect(ref.current).toBe(getGroup());
    });
  });

  describe("dev warnings", () => {
    it("warns when the label is empty and there's no aria-label", () => {
      render(<SegmentedControl label="">{options}</SegmentedControl>);
      expect(getGroup()).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        "[design-system] SegmentedControl: has no accessible name, so screen readers announce it without one. Give it a label or an aria-label.",
      ]);
    });

    it("stays quiet when aria-labelledby names it", () => {
      render(
        <>
          <h2 id="billing-heading">Billing</h2>
          <SegmentedControl aria-label="" aria-labelledby="billing-heading">
            {options}
          </SegmentedControl>
        </>,
      );
      expect(screen.getByRole("radiogroup", { name: "Billing" })).toBeInTheDocument();
      expect(takeWarnings()).toEqual([]);
    });
  });

  describe("types", () => {
    it("requires a visible label or an aria-label", () => {
      expectTypeOf<{ label: string }>().toExtend<SegmentedControlProps>();
      expectTypeOf<{ "aria-label": string }>().toExtend<SegmentedControlProps>();
      expectTypeOf<object>().not.toExtend<SegmentedControlProps>();
      expectTypeOf<{ description: string }>().not.toExtend<SegmentedControlProps>();
      expectTypeOf<{ label: undefined }>().not.toExtend<SegmentedControlProps>();
      expectTypeOf<{ label: null }>().not.toExtend<SegmentedControlProps>();
      expectTypeOf<{ label: false }>().not.toExtend<SegmentedControlProps>();
      expectTypeOf<{ label: string | undefined }>().not.toExtend<SegmentedControlProps>();
    });

    it("keeps Base UI's render and inputRef out of the public props, and takes className as a string", () => {
      expectTypeOf<SegmentedControlProps>().not.toHaveProperty("render");
      expectTypeOf<SegmentedControlProps>().not.toHaveProperty("inputRef");
      expectTypeOf<SegmentedControlProps["className"]>().toEqualTypeOf<string | undefined>();
    });

    it("takes one string value, with null for nothing chosen when controlled", () => {
      expectTypeOf<SegmentedControlProps["value"]>().toEqualTypeOf<string | null | undefined>();
      expectTypeOf<SegmentedControlProps["defaultValue"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<SegmentedControlProps["onValueChange"]>().parameter(0).toEqualTypeOf<string>();
    });

    it("takes the two sizes", () => {
      expectTypeOf<SegmentedControlProps["size"]>().toEqualTypeOf<"md" | "lg" | undefined>();
    });

    it("takes required, name, and form", () => {
      expectTypeOf<SegmentedControlProps["required"]>().toEqualTypeOf<boolean | undefined>();
      expectTypeOf<SegmentedControlProps["name"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<SegmentedControlProps["form"]>().toEqualTypeOf<string | undefined>();
    });
  });
});
