import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { takeWarnings } from "../../../tests/warnings";
import { Radio } from "./Radio";
import { RadioGroup } from "./RadioGroup";
import type { RadioGroupProps } from "./RadioGroup";

const options = (
  <>
    <Radio value="free">Free</Radio>
    <Radio value="team">Team</Radio>
    <Radio value="business">Business</Radio>
  </>
);

const getGroup = () => screen.getByRole("radiogroup");
const getRadio = (name: string) => screen.getByRole("radio", { name });
const getRadios = () => {
  const radios = screen.getAllByRole("radio");
  expect(radios.length).toBeGreaterThan(0);
  return radios;
};
/** The names of the selected radios, in order */
const selected = () =>
  ["Free", "Team", "Business"].filter((name) => screen.queryByRole("radio", { name })?.getAttribute("aria-checked") === "true");
const submitted = (form: HTMLFormElement) => new FormData(form).getAll("plan");

describe("RadioGroup", () => {
  describe("rendering", () => {
    it("renders a radio group named by its label, holding its radios", () => {
      render(<RadioGroup label="Plan">{options}</RadioGroup>);
      const group = screen.getByRole("radiogroup", { name: "Plan" });
      expect(group).toContainElement(getRadio("Free"));
      expect(group).toContainElement(getRadio("Business"));
    });

    it("renders the label as the group's legend, so CSS can target it", () => {
      render(<RadioGroup label="Plan">{options}</RadioGroup>);
      expect(screen.getByText("Plan")).toHaveClass("radio-group__label");
      expect(getGroup()).toContainElement(screen.getByText("Plan"));
    });

    it("can be named by aria-label alone, with no visible label", () => {
      const { container } = render(<RadioGroup aria-label="Plan">{options}</RadioGroup>);
      expect(screen.getByRole("radiogroup", { name: "Plan" })).toBeInTheDocument();
      expect(container.querySelector(".radio-group__label")).toBeNull();
      expect(getGroup()).not.toHaveAttribute("aria-labelledby");
    });

    it("selects nothing by default", () => {
      render(<RadioGroup label="Plan">{options}</RadioGroup>);
      for (const radio of getRadios()) expect(radio).toHaveAttribute("aria-checked", "false");
    });

    it("puts the options inside one options wrapper", () => {
      const { container } = render(<RadioGroup label="Plan">{options}</RadioGroup>);
      const wrapper = container.querySelector(".radio-group__options");
      expect(wrapper).toBeInTheDocument();
      for (const radio of getRadios()) expect(wrapper).toContainElement(radio);
    });

    it("puts the shared group classes next to its own, so choice-group.css and field.css draw what the groups share", () => {
      const { container } = render(
        <RadioGroup label="Choose" description="Pick what suits you.">
          {options}
        </RadioGroup>,
      );
      expect(container.firstElementChild).toHaveClass("choice-group", "radio-group");
      expect(getGroup()).toHaveClass("choice-group__group", "radio-group__group");
      expect(screen.getByText("Choose")).toHaveClass("field-label", "radio-group__label");
      expect(screen.getByText("Pick what suits you.")).toHaveClass("field-description", "radio-group__description");
      expect(container.querySelector(".radio-group__options")).toHaveClass("choice-group__options");
    });

    it("applies className to the outer wrapper, next to its own class", () => {
      const { container } = render(
        <RadioGroup label="Plan" className="mt-4">
          {options}
        </RadioGroup>,
      );
      expect(container.firstElementChild).toHaveClass("radio-group", "mt-4");
    });

    it("passes other props through to the group element", () => {
      render(
        <RadioGroup label="Plan" data-testid="plan">
          {options}
        </RadioGroup>,
      );
      expect(screen.getByTestId("plan")).toBe(getGroup());
    });

    it("never uses modifier classes", () => {
      const { container } = render(
        <RadioGroup label="Plan" invalid disabled readOnly required description="More" error="Choose a plan.">
          {options}
        </RadioGroup>,
      );
      expect(container.querySelector(".radio-group__options")).toBeInTheDocument();
      expect(container.innerHTML).not.toMatch(/radio-group--|radio--/);
    });
  });

  describe("choosing", () => {
    it("starts with the defaultValue option selected", () => {
      render(
        <RadioGroup label="Plan" defaultValue="team">
          {options}
        </RadioGroup>,
      );
      expect(selected()).toEqual(["Team"]);
    });

    it("selects nothing when defaultValue matches no option", () => {
      render(
        <RadioGroup label="Plan" defaultValue="enterprise">
          {options}
        </RadioGroup>,
      );
      expect(getRadios()).toHaveLength(3);
      expect(selected()).toEqual([]);
    });

    it("selects one option at a time, reporting the new value", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <RadioGroup label="Plan" defaultValue="free" onValueChange={onValueChange}>
          {options}
        </RadioGroup>,
      );
      await user.click(getRadio("Team"));
      expect(selected()).toEqual(["Team"]);
      await user.click(getRadio("Business"));
      expect(selected()).toEqual(["Business"]);
      expect(onValueChange.mock.calls.map(([value]) => value)).toEqual(["team", "business"]);
    });

    it("selects an option when its label text is clicked, once per click", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <RadioGroup label="Plan" onValueChange={onValueChange}>
          {options}
        </RadioGroup>,
      );
      await user.click(screen.getByText("Business"));
      expect(selected()).toEqual(["Business"]);
      expect(onValueChange).toHaveBeenCalledOnce();
    });

    it("keeps an option selected when it's clicked again", async () => {
      const user = userEvent.setup();
      render(
        <RadioGroup label="Plan" defaultValue="team">
          {options}
        </RadioGroup>,
      );
      await user.click(getRadio("Team"));
      expect(selected()).toEqual(["Team"]);
    });

    it("does nothing when the group's own label is clicked", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <RadioGroup label="Plan" onValueChange={onValueChange}>
          {options}
        </RadioGroup>,
      );
      await user.click(screen.getByText("Plan"));
      expect(getRadios()).toHaveLength(3);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("follows the value prop when controlled, and doesn't change by itself", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(
        <RadioGroup label="Plan" value="free" onValueChange={onValueChange}>
          {options}
        </RadioGroup>,
      );
      await user.click(getRadio("Team"));
      expect(onValueChange).toHaveBeenCalledWith("team", expect.anything());
      expect(selected()).toEqual(["Free"]);
      rerender(
        <RadioGroup label="Plan" value="business" onValueChange={onValueChange}>
          {options}
        </RadioGroup>,
      );
      expect(selected()).toEqual(["Business"]);
    });

    it("selects nothing when controlled with null, and clears when set back to null", async () => {
      function Controlled() {
        const [value, setValue] = useState<string | null>(null);
        return (
          <>
            <RadioGroup label="Plan" value={value} onValueChange={setValue}>
              {options}
            </RadioGroup>
            <button type="button" onClick={() => setValue(null)}>
              Clear
            </button>
          </>
        );
      }
      const user = userEvent.setup();
      render(<Controlled />);
      expect(getRadios()).toHaveLength(3);
      expect(selected()).toEqual([]);
      await user.click(getRadio("Team"));
      expect(selected()).toEqual(["Team"]);
      await user.click(screen.getByRole("button", { name: "Clear" }));
      expect(selected()).toEqual([]);
    });

    it("works as a controlled group driven by state", async () => {
      function Controlled() {
        const [value, setValue] = useState<string | null>(null);
        return (
          <>
            <RadioGroup label="Plan" value={value} onValueChange={setValue}>
              {options}
            </RadioGroup>
            <output>{value ?? "none"}</output>
          </>
        );
      }
      const user = userEvent.setup();
      render(<Controlled />);
      expect(screen.getByRole("status")).toHaveTextContent("none");
      await user.click(getRadio("Business"));
      expect(screen.getByRole("status")).toHaveTextContent("business");
    });
  });

  describe("keyboard", () => {
    it("is one Tab stop: Tab lands on the first radio when nothing is selected, and the next Tab leaves", async () => {
      const user = userEvent.setup();
      render(
        <>
          <RadioGroup label="Plan">{options}</RadioGroup>
          <button type="button">After</button>
        </>,
      );
      await user.tab();
      expect(getRadio("Free")).toHaveFocus();
      expect(selected()).toEqual([]);
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    });

    it("lands on the selected radio with Tab and Shift+Tab", async () => {
      const user = userEvent.setup();
      render(
        <>
          <RadioGroup label="Plan" defaultValue="team">
            {options}
          </RadioGroup>
          <button type="button">After</button>
        </>,
      );
      await user.tab();
      expect(getRadio("Team")).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
      await user.tab({ shift: true });
      expect(getRadio("Team")).toHaveFocus();
    });

    it("moves and selects with Down and Right, and Up and Left", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <RadioGroup label="Plan" defaultValue="free" onValueChange={onValueChange}>
          {options}
        </RadioGroup>,
      );
      await user.tab();
      await user.keyboard("{ArrowDown}");
      expect(getRadio("Team")).toHaveFocus();
      expect(selected()).toEqual(["Team"]);
      await user.keyboard("{ArrowRight}");
      expect(selected()).toEqual(["Business"]);
      await user.keyboard("{ArrowUp}");
      expect(selected()).toEqual(["Team"]);
      await user.keyboard("{ArrowLeft}");
      expect(getRadio("Free")).toHaveFocus();
      expect(selected()).toEqual(["Free"]);
      expect(onValueChange.mock.calls.map(([value]) => value)).toEqual(["team", "business", "team", "free"]);
    });

    it("wraps around at both ends", async () => {
      const user = userEvent.setup();
      render(
        <RadioGroup label="Plan" defaultValue="business">
          {options}
        </RadioGroup>,
      );
      await user.tab();
      await user.keyboard("{ArrowDown}");
      expect(getRadio("Free")).toHaveFocus();
      expect(selected()).toEqual(["Free"]);
      await user.keyboard("{ArrowUp}");
      expect(selected()).toEqual(["Business"]);
    });

    it("selects the focused radio with Space", async () => {
      const user = userEvent.setup();
      render(<RadioGroup label="Plan">{options}</RadioGroup>);
      await user.tab();
      expect(getRadio("Free")).toHaveFocus();
      expect(selected()).toEqual([]);
      await user.keyboard(" ");
      expect(selected()).toEqual(["Free"]);
    });

    it("doesn't select or submit the form with Enter", async () => {
      const onSubmit = vi.fn((event: Event) => event.preventDefault());
      const user = userEvent.setup();
      render(
        <form onSubmit={(event) => onSubmit(event.nativeEvent)}>
          <RadioGroup label="Plan" name="plan">
            {options}
          </RadioGroup>
          <button type="submit">Save</button>
        </form>,
      );
      await user.tab();
      expect(getRadio("Free")).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(selected()).toEqual([]);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("does nothing with Home or End", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <RadioGroup label="Plan" defaultValue="team" onValueChange={onValueChange}>
          {options}
        </RadioGroup>,
      );
      await user.tab();
      await user.keyboard("{Home}{End}");
      expect(getRadio("Team")).toHaveFocus();
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe("description and error", () => {
    it("links the description to the group", () => {
      render(
        <RadioGroup label="Plan" description="You can change it later.">
          {options}
        </RadioGroup>,
      );
      expect(getGroup()).toHaveAccessibleDescription("You can change it later.");
      expect(getGroup()).toHaveAccessibleName("Plan");
    });

    it("puts the description between the label and the options", () => {
      render(
        <RadioGroup label="Plan" description="You can change it later.">
          {options}
        </RadioGroup>,
      );
      const description = screen.getByText("You can change it later.");
      expect(description).toHaveClass("radio-group__description");
      expect(screen.getByText("Plan").compareDocumentPosition(description)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(description.compareDocumentPosition(getRadio("Free"))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it("also describes each radio with the group's description", () => {
      render(
        <RadioGroup label="Plan" description="You can change it later.">
          {options}
        </RadioGroup>,
      );
      for (const radio of getRadios()) expect(radio).toHaveAccessibleDescription("You can change it later.");
    });

    it("shows the error before the options, linked to the group, when invalid", () => {
      render(
        <RadioGroup label="Plan" invalid error="Choose a plan.">
          {options}
        </RadioGroup>,
      );
      const error = screen.getByText("Choose a plan.");
      expect(getGroup()).toHaveAccessibleDescription("Error: Choose a plan.");
      expect(error.compareDocumentPosition(getRadio("Free"))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it("gives the error an icon that is hidden from screen readers", () => {
      render(
        <RadioGroup label="Plan" invalid error="Choose a plan.">
          {options}
        </RadioGroup>,
      );
      const error = screen.getByText("Choose a plan.").closest(".radio-group__error");
      expect(error).toBeInTheDocument();
      expect(error?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });

    it("reads the description and the error together", () => {
      render(
        <RadioGroup label="Plan" invalid description="You can change it later." error="Choose a plan.">
          {options}
        </RadioGroup>,
      );
      expect(getGroup()).toHaveAccessibleDescription("You can change it later. Error: Choose a plan.");
    });

    it("hides the error when the group is valid", () => {
      render(
        <RadioGroup label="Plan" error="Choose a plan.">
          {options}
        </RadioGroup>,
      );
      expect(getRadios()).toHaveLength(3);
      expect(screen.queryByText("Choose a plan.")).not.toBeInTheDocument();
      expect(getGroup()).toHaveAccessibleDescription("");
    });

    it("shows the error again when invalid turns on later", () => {
      const { rerender } = render(
        <RadioGroup label="Plan" error="Choose a plan.">
          {options}
        </RadioGroup>,
      );
      expect(getRadios()).toHaveLength(3);
      expect(screen.queryByText("Choose a plan.")).not.toBeInTheDocument();
      rerender(
        <RadioGroup label="Plan" invalid error="Choose a plan.">
          {options}
        </RadioGroup>,
      );
      expect(screen.getByText("Choose a plan.")).toBeInTheDocument();
    });

    it("marks the group and every radio invalid when the group is", () => {
      render(
        <RadioGroup label="Plan" invalid>
          {options}
        </RadioGroup>,
      );
      expect(getGroup()).toHaveAttribute("aria-invalid", "true");
      for (const radio of getRadios()) expect(radio).toHaveAttribute("aria-invalid", "true");
    });

    it("is valid by default", () => {
      render(<RadioGroup label="Plan">{options}</RadioGroup>);
      expect(getGroup()).not.toHaveAttribute("aria-invalid", "true");
      for (const radio of getRadios()) expect(radio).not.toHaveAttribute("aria-invalid", "true");
    });

    it("is invalid with no error text without breaking", () => {
      const { container } = render(
        <RadioGroup label="Plan" invalid>
          {options}
        </RadioGroup>,
      );
      expect(getRadio("Free")).toHaveAttribute("aria-invalid", "true");
      expect(container.querySelector(".radio-group__error")).toBeNull();
    });
  });

  describe("required", () => {
    it("is announced as required", () => {
      render(
        <RadioGroup label="Plan (required)" required>
          {options}
        </RadioGroup>,
      );
      expect(getGroup()).toHaveAttribute("aria-required", "true");
    });

    it("is not required by default", () => {
      render(<RadioGroup label="Plan">{options}</RadioGroup>);
      expect(getRadios()).toHaveLength(3);
      expect(getGroup()).not.toHaveAttribute("aria-required", "true");
    });

    it("fails the form's own validation until an option is chosen", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <RadioGroup label="Plan (required)" name="plan" required>
            {options}
          </RadioGroup>
        </form>,
      );
      const form = screen.getByTestId("form") as HTMLFormElement;
      expect(form.querySelectorAll("input[name=plan]")).toHaveLength(3);
      expect(form.checkValidity()).toBe(false);
      await user.click(getRadio("Team"));
      expect(form.checkValidity()).toBe(true);
    });

    // Native validation stops the submit event, so a form that shows its own error turns it off with
    // noValidate, checks the value, and sets invalid and error. required still announces the group as required.
    function RequiredPlan() {
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
          <RadioGroup
            label="Plan (required)"
            name="plan"
            required
            value={value}
            onValueChange={setValue}
            invalid={submitted && value === null}
            error="Choose a plan."
          >
            {options}
          </RadioGroup>
          <button type="submit">Continue</button>
        </form>
      );
    }

    it("shows the error on the group and every radio when submitted with nothing chosen", async () => {
      const user = userEvent.setup();
      render(<RequiredPlan />);
      expect(getGroup()).toHaveAttribute("aria-required", "true");
      expect(screen.queryByText("Choose a plan.")).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Continue" }));
      expect(getGroup()).toHaveAccessibleDescription("Error: Choose a plan.");
      for (const radio of getRadios()) {
        expect(radio).toHaveAttribute("aria-invalid", "true");
        expect(radio).toHaveAccessibleDescription("Error: Choose a plan.");
      }
    });

    it("clears the error once an option is chosen", async () => {
      const user = userEvent.setup();
      render(<RequiredPlan />);
      await user.click(screen.getByRole("button", { name: "Continue" }));
      expect(screen.getByText("Choose a plan.")).toBeInTheDocument();
      await user.click(getRadio("Free"));
      expect(screen.queryByText("Choose a plan.")).not.toBeInTheDocument();
      expect(getRadio("Team")).not.toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("disabled", () => {
    it("disables the group and every radio, and marks the wrapper and each row", () => {
      const { container } = render(
        <RadioGroup label="Plan" disabled>
          {options}
        </RadioGroup>,
      );
      expect(container.firstElementChild).toHaveAttribute("data-disabled");
      expect(getGroup()).toHaveAttribute("aria-disabled", "true");
      for (const radio of getRadios()) {
        expect(radio).toHaveAttribute("aria-disabled", "true");
        expect(radio).toHaveAttribute("data-disabled");
        // The row's data-disabled is what dims the radio's label
        expect(radio.closest(".radio__row")).toHaveAttribute("data-disabled");
      }
    });

    it("blocks clicks on the radios and their labels", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <RadioGroup label="Plan" disabled defaultValue="free" onValueChange={onValueChange}>
          {options}
        </RadioGroup>,
      );
      await user.click(getRadio("Team"));
      await user.click(screen.getByText("Business"));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(selected()).toEqual(["Free"]);
    });

    it("blocks the arrow keys and Space", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <RadioGroup label="Plan" disabled defaultValue="free" onValueChange={onValueChange}>
          {options}
        </RadioGroup>,
      );
      getRadio("Free").focus();
      await user.keyboard("{ArrowDown} ");
      expect(onValueChange).not.toHaveBeenCalled();
      expect(selected()).toEqual(["Free"]);
    });

    // Base UI keeps the selected radio of a disabled group in the tab order, announced as disabled.
    // We keep that for now; docs/revisit.md records the question.
    it("still lets Tab reach the selected radio, announced as disabled", async () => {
      const user = userEvent.setup();
      render(
        <RadioGroup label="Plan" disabled defaultValue="team">
          {options}
        </RadioGroup>,
      );
      await user.tab();
      expect(getRadio("Team")).toHaveFocus();
      expect(getRadio("Team")).toHaveAttribute("aria-disabled", "true");
    });

    it("keeps the selected option selected, and isn't submitted", () => {
      render(
        <form data-testid="form">
          <RadioGroup label="Plan" name="plan" disabled defaultValue="team">
            {options}
          </RadioGroup>
        </form>,
      );
      const input = screen.getByTestId("form").querySelector<HTMLInputElement>("input[name=plan][value=team]");
      expect(selected()).toEqual(["Team"]);
      expect(input).toBeChecked();
      expect(input).toBeDisabled();
      expect(submitted(screen.getByTestId("form") as HTMLFormElement)).toEqual([]);
    });
  });

  describe("read only", () => {
    it("says \"Read only\" beside the label, hidden from screen readers and left out of the name", () => {
      render(<RadioGroup label="Plan" readOnly>{options}</RadioGroup>);
      const note = screen.getByText("Read only");
      expect(note).toHaveClass("read-only-note");
      expect(note).toHaveAttribute("aria-hidden", "true");
      expect(note.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      expect(note.closest(".radio-group__label")).toHaveTextContent("Plan");
      expect(getGroup()).toHaveAccessibleName("Plan");
    });

    it("has no note when it isn't read-only, or when it's disabled as well", () => {
      const { rerender } = render(<RadioGroup label="Plan">{options}</RadioGroup>);
      expect(getGroup()).toBeInTheDocument();
      expect(screen.queryByText("Read only")).toBeNull();
      rerender(<RadioGroup label="Plan" readOnly disabled>{options}</RadioGroup>);
      expect(getGroup()).toHaveAttribute("aria-readonly", "true");
      expect(screen.queryByText("Read only")).toBeNull();
    });

    it("marks the group read-only, and each radio for styling", () => {
      render(
        <RadioGroup label="Plan" readOnly>
          {options}
        </RadioGroup>,
      );
      expect(getGroup()).toHaveAttribute("aria-readonly", "true");
      for (const radio of getRadios()) expect(radio).toHaveAttribute("data-readonly");
    });

    it("blocks changes from clicks on the radios and their labels", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <RadioGroup label="Plan" readOnly defaultValue="free" onValueChange={onValueChange}>
          {options}
        </RadioGroup>,
      );
      await user.click(getRadio("Team"));
      await user.click(screen.getByText("Business"));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(selected()).toEqual(["Free"]);
    });

    it("lets the arrow keys move focus without selecting, and ignores Space", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <RadioGroup label="Plan" readOnly defaultValue="free" onValueChange={onValueChange}>
          {options}
        </RadioGroup>,
      );
      await user.tab();
      expect(getRadio("Free")).toHaveFocus();
      await user.keyboard("{ArrowDown}");
      expect(getRadio("Team")).toHaveFocus();
      await user.keyboard(" ");
      expect(onValueChange).not.toHaveBeenCalled();
      expect(selected()).toEqual(["Free"]);
    });

    it("is not read-only by default", () => {
      render(<RadioGroup label="Plan">{options}</RadioGroup>);
      expect(getRadios()).toHaveLength(3);
      expect(getGroup()).not.toHaveAttribute("aria-readonly", "true");
    });

    it("is still submitted", () => {
      render(
        <form data-testid="form">
          <RadioGroup label="Plan" name="plan" readOnly defaultValue="team">
            {options}
          </RadioGroup>
        </form>,
      );
      expect(submitted(screen.getByTestId("form") as HTMLFormElement)).toEqual(["team"]);
    });
  });

  describe("in a form", () => {
    it("submits the selected option's value under the group's name", () => {
      render(
        <form data-testid="form">
          <RadioGroup label="Plan" name="plan" defaultValue="business">
            {options}
          </RadioGroup>
        </form>,
      );
      expect(submitted(screen.getByTestId("form") as HTMLFormElement)).toEqual(["business"]);
    });

    it("submits nothing when nothing is selected", () => {
      render(
        <form data-testid="form">
          <RadioGroup label="Plan" name="plan">
            {options}
          </RadioGroup>
        </form>,
      );
      expect(screen.getByTestId("form").querySelectorAll("input[name=plan]")).toHaveLength(3);
      expect(submitted(screen.getByTestId("form") as HTMLFormElement)).toEqual([]);
    });

    it("submits the option the user chooses", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <RadioGroup label="Plan" name="plan" defaultValue="free">
            {options}
          </RadioGroup>
        </form>,
      );
      await user.click(getRadio("Team"));
      expect(submitted(screen.getByTestId("form") as HTMLFormElement)).toEqual(["team"]);
    });

    it("submits with a form it sits outside of, through form", () => {
      render(
        <>
          <form id="signup" data-testid="outside-form" />
          <RadioGroup label="Plan" name="plan" form="signup" defaultValue="team">
            {options}
          </RadioGroup>
        </>,
      );
      expect(submitted(screen.getByTestId("outside-form") as HTMLFormElement)).toEqual(["team"]);
    });
  });

  describe("refs", () => {
    it("forwards ref to the group element", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <RadioGroup label="Plan" ref={ref}>
          {options}
        </RadioGroup>,
      );
      expect(ref.current).toBe(getGroup());
    });
  });

  describe("dev warnings", () => {
    it("warns when the label is empty and there's no aria-label", () => {
      render(<RadioGroup label="">{options}</RadioGroup>);
      expect(getGroup()).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        "[design-system] RadioGroup: has no accessible name, so screen readers announce it without one. Give it a label or an aria-label.",
      ]);
    });

    it("stays quiet when aria-labelledby names it", () => {
      render(
        <>
          <h2 id="plan-heading">Plan</h2>
          <RadioGroup aria-label="" aria-labelledby="plan-heading">
            {options}
          </RadioGroup>
        </>,
      );
      expect(screen.getByRole("radiogroup", { name: "Plan" })).toBeInTheDocument();
      expect(takeWarnings()).toEqual([]);
    });
  });

  describe("types", () => {
    it("requires a visible label or an aria-label", () => {
      expectTypeOf<{ label: string }>().toExtend<RadioGroupProps>();
      expectTypeOf<{ "aria-label": string }>().toExtend<RadioGroupProps>();
      expectTypeOf<object>().not.toExtend<RadioGroupProps>();
      expectTypeOf<{ description: string }>().not.toExtend<RadioGroupProps>();
      expectTypeOf<{ label: undefined }>().not.toExtend<RadioGroupProps>();
      expectTypeOf<{ label: null }>().not.toExtend<RadioGroupProps>();
      expectTypeOf<{ label: false }>().not.toExtend<RadioGroupProps>();
      expectTypeOf<{ label: string | undefined }>().not.toExtend<RadioGroupProps>();
    });

    it("keeps Base UI's render and inputRef out of the public props, and takes className as a string", () => {
      expectTypeOf<RadioGroupProps>().not.toHaveProperty("render");
      expectTypeOf<RadioGroupProps>().not.toHaveProperty("inputRef");
      expectTypeOf<RadioGroupProps["className"]>().toEqualTypeOf<string | undefined>();
    });

    it("takes one string value, with null for nothing selected when controlled", () => {
      expectTypeOf<RadioGroupProps["value"]>().toEqualTypeOf<string | null | undefined>();
      expectTypeOf<RadioGroupProps["defaultValue"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<RadioGroupProps["onValueChange"]>().parameter(0).toEqualTypeOf<string>();
    });

    it("takes required, name, and form", () => {
      expectTypeOf<RadioGroupProps["required"]>().toEqualTypeOf<boolean | undefined>();
      expectTypeOf<RadioGroupProps["name"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<RadioGroupProps["form"]>().toEqualTypeOf<string | undefined>();
    });
  });
});
