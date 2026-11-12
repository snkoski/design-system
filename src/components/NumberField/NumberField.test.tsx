import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import type { ReactElement, Ref } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, expectTypeOf, it, onTestFinished, vi } from "vitest";
import { takeWarnings } from "@tests/warnings";
import { NumberField } from "@/components/NumberField/NumberField";
import type { NumberFieldProps, NumberFieldSize } from "@/components/NumberField/NumberField";

const getInput = () => screen.getByRole<HTMLInputElement>("textbox");
const getIncrease = () => screen.getByRole("button", { name: "Increase" });
const getDecrease = () => screen.getByRole("button", { name: "Decrease" });
const getBox = (container: HTMLElement) => container.querySelector<HTMLElement>(".number-field__box")!;
/** Base UI's hidden input: the one the form submits. */
const getHidden = (container: HTMLElement) => container.querySelector<HTMLInputElement>('input[type="number"]')!;
/** The latest value onValueChange was called with. */
const lastValue = (fn: ReturnType<typeof vi.fn>) => fn.mock.calls.at(-1)?.[0];
/**
 * Every entry a form sends, as name to list of values. A plain object would keep only the last value of a name, so a
 * second input with the same name (the visible one, with the formatted text) would go unnoticed.
 */
const submitted = (form: HTMLFormElement) => {
  const entries: Record<string, FormDataEntryValue[]> = {};
  for (const [name, value] of new FormData(form)) (entries[name] ??= []).push(value);
  return entries;
};

/** Server-rendered HTML, before any JavaScript runs, attached to the page until the test ends. */
function serverHtml(element: ReactElement) {
  const host = document.createElement("div");
  host.innerHTML = renderToString(element);
  document.body.append(host);
  onTestFinished(() => host.remove());
  return host;
}

describe("NumberField", () => {
  describe("rendering", () => {
    it("renders a text field named by its label, described to screen readers as a number field", () => {
      render(<NumberField label="Salary" />);
      const input = screen.getByRole("textbox", { name: "Salary" });
      expect(input.tagName).toBe("INPUT");
      expect(input).toHaveAttribute("type", "text");
      expect(input).toHaveAttribute("aria-roledescription", "Number field");
    });

    it("renders the input with the shared and its own class, inside the box, inside Base UI's root", () => {
      const { container } = render(<NumberField label="Salary" />);
      expect(getInput()).toHaveClass("text-field__control", "number-field__control");
      expect(getBox(container)).toContainElement(getInput());
      expect(getBox(container)).toHaveAttribute("role", "group");
      expect(container.querySelector(".number-field__root")).toContainElement(getBox(container));
    });

    it("renders the label as a <label> pointing at the input", () => {
      render(<NumberField label="Salary" />);
      const label = screen.getByText("Salary");
      expect(label.tagName).toBe("LABEL");
      expect(label).toHaveClass("field-label", "number-field__label");
      expect(label).toHaveAttribute("for", getInput().id);
    });

    it("defaults to the md size, on the outer element with the shared text field class", () => {
      const { container } = render(<NumberField label="Salary" />);
      expect(container.firstElementChild).toHaveClass("text-field", "number-field");
      expect(container.firstElementChild).toHaveAttribute("data-size", "md");
    });

    it.each(["md", "lg"] as const)("maps size=%s to data-size on the outer element", (size) => {
      const { container } = render(<NumberField label="Salary" size={size} />);
      expect(container.firstElementChild).toHaveClass("number-field");
      expect(container.firstElementChild).toHaveAttribute("data-size", size);
    });

    it("never sets the native size attribute", () => {
      render(<NumberField label="Salary" size="lg" />);
      expect(getInput()).toBeInTheDocument();
      expect(getInput()).not.toHaveAttribute("size");
    });

    it("can be named by aria-label alone, with no <label> element", () => {
      const { container } = render(<NumberField aria-label="Quantity" />);
      expect(screen.getByRole("textbox", { name: "Quantity" })).toBeInTheDocument();
      expect(container.querySelector("label")).toBeNull();
    });

    it("puts the description and then the error between the label and the field", () => {
      const { container } = render(
        <NumberField label="Salary" description="Before tax, per year." invalid error="Enter a salary." />,
      );
      const parts = ["number-field__label", "number-field__description", "number-field__error", "number-field__root"];
      const order = [...container.querySelectorAll(parts.map((part) => `.${part}`).join(", "))].map((el) =>
        parts.find((part) => el.classList.contains(part)),
      );
      expect(order).toEqual(parts);
    });

    it("puts the shared field classes next to its own", () => {
      render(<NumberField label="Salary" description="Before tax, per year." />);
      expect(screen.getByText("Before tax, per year.")).toHaveClass("field-description", "number-field__description");
    });

    it("applies className to the outer wrapper, next to its own class", () => {
      const { container } = render(<NumberField label="Salary" className="mt-4" />);
      expect(container.firstElementChild).toHaveClass("number-field", "mt-4");
    });

    it("passes other props through to the input", () => {
      render(<NumberField label="Salary" placeholder="85,000" data-testid="salary" title="Salary" />);
      expect(screen.getByTestId("salary")).toBe(getInput());
      expect(getInput()).toHaveAttribute("placeholder", "85,000");
      expect(getInput()).toHaveAttribute("title", "Salary");
    });

    it("turns autocomplete off by default, and lets autoComplete replace it", () => {
      const { rerender } = render(<NumberField label="Amount" />);
      expect(getInput()).toHaveAttribute("autocomplete", "off");
      rerender(<NumberField label="Amount" autoComplete="transaction-amount" />);
      expect(getInput()).toHaveAttribute("autocomplete", "transaction-amount");
    });

    // Base UI picks the keyboard: numeric, except on iOS, whose numeric keyboard has no minus or decimal key, where it's
    // decimal when min is 0 or more and text otherwise. jsdom isn't iOS.
    it("asks for a numeric keyboard", () => {
      render(<NumberField label="Count" min={0} />);
      expect(getInput()).toHaveAttribute("inputmode", "numeric");
    });

    it("never uses modifier classes", () => {
      const { container } = render(
        <NumberField label="Salary" size="lg" invalid disabled error="Bad" description="More" defaultValue={5} />,
      );
      expect(getBox(container)).toBeInTheDocument();
      expect(container.innerHTML).not.toMatch(/number-field--/);
    });
  });

  describe("steppers", () => {
    it("renders Decrease and then Increase after the input, as plain buttons", () => {
      const { container } = render(<NumberField label="Guests" />);
      const parts = [...getBox(container).children];
      expect(parts).toEqual([getInput(), getDecrease(), getIncrease()]);
      for (const button of [getDecrease(), getIncrease()]) {
        expect(button.tagName).toBe("BUTTON");
        expect(button).toHaveAttribute("type", "button");
        expect(button).toHaveClass("number-field__step");
      }
    });

    it("keeps the steppers out of the Tab order, and points them at the input they change", () => {
      render(<NumberField label="Guests" />);
      for (const button of [getDecrease(), getIncrease()]) {
        expect(button).toHaveAttribute("tabindex", "-1");
        expect(button).toHaveAttribute("aria-controls", getInput().id);
      }
    });

    it("draws each stepper's icon hidden from screen readers, so its name is only Base UI's word", () => {
      render(<NumberField label="Guests" />);
      for (const button of [getDecrease(), getIncrease()]) {
        const icon = button.querySelector("svg");
        expect(icon).toHaveClass("number-field__icon");
        expect(icon).toHaveAttribute("aria-hidden", "true");
        expect(icon).toHaveAttribute("focusable", "false");
      }
      expect(getDecrease()).toHaveAccessibleName("Decrease");
      expect(getIncrease()).toHaveAccessibleName("Increase");
    });

    it("marks the box so the input makes room for the steppers", () => {
      const { container } = render(<NumberField label="Guests" />);
      expect(getBox(container)).toHaveAttribute("data-steppers");
    });

    it("leaves the steppers out, and the box unmarked, with steppers={false}", () => {
      const { container } = render(<NumberField label="Salary" steppers={false} />);
      expect(getInput()).toBeInTheDocument();
      expect(screen.queryAllByRole("button")).toEqual([]);
      expect(getBox(container)).not.toHaveAttribute("data-steppers");
    });

    it("steps by step when pressed", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<NumberField label="Salary" defaultValue={85000} step={1000} onValueChange={onValueChange} locale="en-US" />);
      await user.click(getIncrease());
      expect(lastValue(onValueChange)).toBe(86000);
      expect(getInput()).toHaveValue("86,000");
      await user.click(getDecrease());
      await user.click(getDecrease());
      expect(lastValue(onValueChange)).toBe(84000);
    });

    it("focuses the input when a stepper is pressed with a mouse", async () => {
      const user = userEvent.setup();
      render(<NumberField label="Guests" defaultValue={2} />);
      await user.click(getIncrease());
      expect(getInput()).toHaveFocus();
    });

    it("calls onValueCommitted when a stepper is released", async () => {
      const onValueCommitted = vi.fn();
      const user = userEvent.setup();
      render(<NumberField label="Guests" defaultValue={2} onValueCommitted={onValueCommitted} />);
      await user.click(getIncrease());
      expect(onValueCommitted).toHaveBeenCalledWith(3, expect.anything());
    });

    it("disables Increase at max", () => {
      render(<NumberField label="Guests" min={0} max={10} defaultValue={10} />);
      expect(getIncrease()).toBeDisabled();
      expect(getIncrease()).toHaveAttribute("data-disabled");
      expect(getDecrease()).toBeEnabled();
      expect(getDecrease()).not.toHaveAttribute("data-disabled");
    });

    it("disables Decrease at min", () => {
      render(<NumberField label="Guests" min={0} max={10} defaultValue={0} />);
      expect(getDecrease()).toBeDisabled();
      expect(getDecrease()).toHaveAttribute("data-disabled");
      expect(getIncrease()).toBeEnabled();
      expect(getIncrease()).not.toHaveAttribute("data-disabled");
    });

    it("re-enables a stepper when the value moves off the limit", async () => {
      const user = userEvent.setup();
      render(<NumberField label="Guests" min={0} max={10} defaultValue={10} />);
      expect(getIncrease()).toBeDisabled();
      await user.click(getDecrease());
      expect(getInput()).toHaveValue("9");
      expect(getIncrease()).toBeEnabled();
    });
  });

  describe("typing and value", () => {
    it("reads separators and symbols as they're typed, and formats the number on leaving the field", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <NumberField
          label="Salary"
          format={{ style: "currency", currency: "USD" }}
          locale="en-US"
          onValueChange={onValueChange}
        />,
      );
      await user.type(getInput(), "$1,234.5");
      expect(lastValue(onValueChange)).toBe(1234.5);
      expect(getInput()).toHaveValue("$1,234.5");
      await user.tab();
      expect(getInput()).toHaveValue("$1,234.50");
    });

    it("rejects letters", async () => {
      const user = userEvent.setup();
      render(<NumberField label="Guests" />);
      await user.type(getInput(), "4a");
      expect(getInput()).toHaveValue("4");
    });

    it("takes a minus sign even when min is 0, since a typed value outside the range is kept", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<NumberField label="Guests" min={0} onValueChange={onValueChange} />);
      await user.type(getInput(), "-5");
      await user.tab();
      expect(getInput()).toHaveValue("-5");
      expect(lastValue(onValueChange)).toBe(-5);
    });

    it("starts with defaultValue, formatted", () => {
      render(<NumberField label="Salary" defaultValue={85000} format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} locale="en-US" />);
      expect(getInput()).toHaveValue("$85,000");
    });

    it.each([
      [{ style: "percent" } as const, 0.25, "25%"],
      [{ style: "unit", unit: "minute", unitDisplay: "long" } as const, 30, "30 minutes"],
    ])("formats with %o", (format, value, shown) => {
      render(<NumberField label="Amount" defaultValue={value} format={format} locale="en-US" />);
      expect(getInput()).toHaveValue(shown);
    });

    it("formats for the given locale", () => {
      render(<NumberField label="Amount" defaultValue={1234.5} locale="de-DE" />);
      expect(getInput()).toHaveValue("1.234,5");
    });

    it("calls onValueChange with a number as each keystroke reads as one, and null when emptied", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<NumberField label="Guests" onValueChange={onValueChange} />);
      await user.type(getInput(), "12");
      expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([1, 12]);
      await user.clear(getInput());
      expect(lastValue(onValueChange)).toBeNull();
    });

    it("calls onValueCommitted on leaving the field after typing, not on each keystroke", async () => {
      const onValueCommitted = vi.fn();
      const user = userEvent.setup();
      render(<NumberField label="Guests" onValueCommitted={onValueCommitted} />);
      await user.type(getInput(), "12");
      expect(onValueCommitted).not.toHaveBeenCalled();
      await user.tab();
      expect(onValueCommitted).toHaveBeenCalledWith(12, expect.anything());
    });

    it("still calls a native onChange", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<NumberField label="Guests" onChange={onChange} />);
      await user.type(getInput(), "4");
      expect(onChange).toHaveBeenCalled();
    });

    it("follows the value prop when controlled, and doesn't change by itself", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(<NumberField label="Guests" value={4} onValueChange={onValueChange} />);
      await user.click(getIncrease());
      expect(onValueChange).toHaveBeenCalledWith(5, expect.anything());
      expect(getInput()).toHaveValue("4");
      rerender(<NumberField label="Guests" value={7} onValueChange={onValueChange} />);
      expect(getInput()).toHaveValue("7");
    });

    it("is empty when controlled with null", () => {
      const { rerender } = render(<NumberField label="Guests" value={4} />);
      expect(getInput()).toHaveValue("4");
      rerender(<NumberField label="Guests" value={null} />);
      expect(getInput()).toHaveValue("");
    });

    it("works as a controlled field driven by state", async () => {
      function Controlled() {
        const [value, setValue] = useState<number | null>(2);
        return (
          <>
            <NumberField label="Guests" value={value} onValueChange={setValue} />
            <output>{value === null ? "None" : `${value * 2} plates`}</output>
          </>
        );
      }
      const user = userEvent.setup();
      render(<Controlled />);
      await user.click(getIncrease());
      expect(getInput()).toHaveValue("3");
      expect(screen.getByRole("status")).toHaveTextContent("6 plates");
    });

    it("focuses the input when the label is clicked", async () => {
      const user = userEvent.setup();
      render(<NumberField label="Guests" />);
      await user.click(screen.getByText("Guests"));
      expect(getInput()).toHaveFocus();
    });
  });

  describe("keyboard", () => {
    it("is one Tab stop: Tab skips the steppers", async () => {
      const user = userEvent.setup();
      render(
        <>
          <NumberField label="Guests" defaultValue={2} />
          <button type="button">Next</button>
        </>,
      );
      await user.tab();
      expect(getInput()).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    });

    it("steps by step with the up and down arrows", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<NumberField label="Salary" defaultValue={85000} step={1000} onValueChange={onValueChange} />);
      await user.click(getInput());
      await user.keyboard("{ArrowUp}");
      expect(lastValue(onValueChange)).toBe(86000);
      await user.keyboard("{ArrowDown}{ArrowDown}");
      expect(lastValue(onValueChange)).toBe(84000);
    });

    it("steps by ten times step with Shift, so a large step is never smaller than a plain one", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<NumberField label="Salary" defaultValue={85000} step={1000} onValueChange={onValueChange} />);
      await user.click(getInput());
      await user.keyboard("{Shift>}{ArrowUp}{/Shift}");
      expect(lastValue(onValueChange)).toBe(95000);
    });

    it("rounds the default large step, so 0.07 steps by 0.7 exactly", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<NumberField label="Rate" defaultValue={0} step={0.07} onValueChange={onValueChange} />);
      await user.click(getInput());
      await user.keyboard("{Shift>}{ArrowUp}{/Shift}");
      expect(lastValue(onValueChange)).toBe(0.7);
    });

    it("steps by step with Alt, so a whole-number field stays whole", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<NumberField label="Guests" defaultValue={15} onValueChange={onValueChange} />);
      await user.click(getInput());
      await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
      expect(lastValue(onValueChange)).toBe(16);
    });

    it("uses smallStep and largeStep when given", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<NumberField label="Hours" defaultValue={8} step={1} smallStep={0.25} largeStep={4} onValueChange={onValueChange} />);
      await user.click(getInput());
      await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
      expect(lastValue(onValueChange)).toBe(8.25);
      await user.keyboard("{Shift>}{ArrowUp}{/Shift}");
      expect(lastValue(onValueChange)).toBe(12.25);
    });

    it("snaps to a multiple of step with snapOnStep", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<NumberField label="Minutes" defaultValue={3} step={5} snapOnStep onValueChange={onValueChange} />);
      await user.click(getInput());
      await user.keyboard("{ArrowUp}");
      expect(lastValue(onValueChange)).toBe(5);
    });

    it("jumps to min with Home and max with End", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<NumberField label="Score" defaultValue={50} min={0} max={100} onValueChange={onValueChange} />);
      await user.click(getInput());
      await user.keyboard("{End}");
      expect(lastValue(onValueChange)).toBe(100);
      await user.keyboard("{Home}");
      expect(lastValue(onValueChange)).toBe(0);
    });

    it("stops at max and min", async () => {
      const user = userEvent.setup();
      render(<NumberField label="Score" defaultValue={99} min={98} max={100} />);
      await user.click(getInput());
      await user.keyboard("{ArrowUp}{ArrowUp}{ArrowUp}");
      expect(getInput()).toHaveValue("100");
      await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}");
      expect(getInput()).toHaveValue("98");
    });

    it("calls onValueCommitted on each arrow key", async () => {
      const onValueCommitted = vi.fn();
      const user = userEvent.setup();
      render(<NumberField label="Guests" defaultValue={2} onValueCommitted={onValueCommitted} />);
      await user.click(getInput());
      await user.keyboard("{ArrowUp}{ArrowUp}");
      expect(onValueCommitted.mock.calls.map(([value]) => value)).toEqual([3, 4]);
    });

    it("submits the surrounding form with Enter", async () => {
      const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
      const user = userEvent.setup();
      render(
        <form onSubmit={onSubmit} noValidate>
          <NumberField label="Guests" name="guests" />
          <button type="submit">Save guests</button>
        </form>,
      );
      await user.type(getInput(), "4{Enter}");
      expect(onSubmit).toHaveBeenCalledOnce();
    });
  });

  describe("outside min and max", () => {
    it("keeps a typed value above max, so the page can show an error", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <form data-testid="form" noValidate>
          <NumberField label="Score" name="score" min={0} max={100} />
        </form>,
      );
      await user.type(getInput(), "150");
      await user.tab();
      expect(getInput()).toHaveValue("150");
      expect(getHidden(container)).toHaveValue(150);
      expect(submitted(screen.getByTestId("form") as HTMLFormElement)).toEqual({ score: ["150"] });
    });

    it("still stops the steppers and arrows at the limits: Down from 150 goes to 100", async () => {
      const user = userEvent.setup();
      render(<NumberField label="Score" min={0} max={100} defaultValue={150} />);
      expect(getInput()).toHaveValue("150");
      expect(getIncrease()).toBeDisabled();
      await user.click(getInput());
      await user.keyboard("{ArrowDown}");
      expect(getInput()).toHaveValue("100");
    });

    it("fails the form's own validation, as a hint for forms that don't check it themselves", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <NumberField label="Score" name="score" min={0} max={100} />
        </form>,
      );
      const form = screen.getByTestId("form") as HTMLFormElement;
      await user.type(getInput(), "150");
      expect(form.checkValidity()).toBe(false);
      await user.clear(getInput());
      await user.type(getInput(), "50");
      expect(form.checkValidity()).toBe(true);
    });
  });

  describe("disabled", () => {
    it("blocks typing, stepping, and the arrow keys, and is marked disabled", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      const { container } = render(<NumberField label="Guests" disabled defaultValue={2} onValueChange={onValueChange} />);
      expect(getInput()).toBeDisabled();
      // The CSS dims the label from these
      expect(container.firstElementChild).toHaveAttribute("data-disabled");
      expect(screen.getByText("Guests")).toHaveAttribute("data-disabled");
      expect(getIncrease()).toBeDisabled();
      expect(getIncrease()).toHaveAttribute("data-disabled");
      expect(getDecrease()).toBeDisabled();
      expect(getDecrease()).toHaveAttribute("data-disabled");
      await user.type(getInput(), "5");
      await user.click(getIncrease());
      fireEvent.keyDown(getInput(), { key: "ArrowUp" });
      expect(getInput()).toHaveValue("2");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("is skipped by Tab", async () => {
      const user = userEvent.setup();
      render(
        <>
          <NumberField label="Off" disabled />
          <NumberField label="On" />
        </>,
      );
      await user.tab();
      expect(screen.getByRole("textbox", { name: "On" })).toHaveFocus();
    });
  });

  describe("read only", () => {
    it("says \"Read only\" beside the label, hidden from screen readers and left out of the name", () => {
      render(<NumberField label="Salary" readOnly defaultValue={85000} />);
      const note = screen.getByText("Read only");
      expect(note).toHaveClass("read-only-note");
      expect(note).toHaveAttribute("aria-hidden", "true");
      expect(note.closest("label")).toHaveTextContent("Salary");
      expect(getInput()).toHaveAccessibleName("Salary");
    });

    it("has no note when it isn't read-only, or when it's disabled as well", () => {
      const { rerender } = render(<NumberField label="Salary" defaultValue={85000} />);
      expect(getInput()).toBeInTheDocument();
      expect(screen.queryByText("Read only")).toBeNull();
      rerender(<NumberField label="Salary" readOnly disabled defaultValue={85000} />);
      expect(getInput()).toHaveAttribute("readonly");
      expect(screen.queryByText("Read only")).toBeNull();
    });

    it("leaves out the steppers, which can't be used, and the box's mark, even when disabled too", () => {
      const { container, rerender } = render(<NumberField label="Salary" readOnly defaultValue={85000} />);
      expect(getInput()).toHaveAttribute("readonly");
      expect(screen.queryAllByRole("button")).toEqual([]);
      expect(getBox(container)).not.toHaveAttribute("data-steppers");
      rerender(<NumberField label="Salary" readOnly disabled defaultValue={85000} />);
      expect(getInput()).toBeDisabled();
      expect(screen.queryAllByRole("button")).toEqual([]);
      expect(getBox(container)).not.toHaveAttribute("data-steppers");
    });

    it("blocks typing and the arrow keys but keeps its value", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<NumberField label="Guests" readOnly defaultValue={2} onValueChange={onValueChange} />);
      await user.type(getInput(), "5");
      await user.keyboard("{ArrowUp}");
      expect(getInput()).toHaveValue("2");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("stays in the tab order, so its value can be read and copied", async () => {
      const user = userEvent.setup();
      render(<NumberField label="Guests" readOnly defaultValue={2} />);
      await user.tab();
      expect(getInput()).toHaveFocus();
    });
  });

  describe("required and invalid", () => {
    it("is required for assistive technology and the form", () => {
      render(<NumberField label="Guests (required)" required />);
      expect(getInput()).toBeRequired();
    });

    it("is not required by default", () => {
      render(<NumberField label="Guests" />);
      expect(getInput()).toBeInTheDocument();
      expect(getInput()).not.toBeRequired();
    });

    it("is announced as invalid", () => {
      render(<NumberField label="Guests" invalid />);
      expect(getInput()).toBeInvalid();
      expect(getInput()).toHaveAttribute("aria-invalid", "true");
    });

    it("is valid by default", () => {
      render(<NumberField label="Guests" />);
      expect(getInput()).toBeInTheDocument();
      expect(getInput()).not.toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("description and error", () => {
    it("links the description to the input, outside its name", () => {
      render(<NumberField label="Score" description="From 0 to 100." />);
      expect(getInput()).toHaveAccessibleDescription("From 0 to 100.");
      expect(getInput()).toHaveAccessibleName("Score");
    });

    it("shows the error, linked to the input, when invalid", () => {
      render(<NumberField label="Score" invalid error="Enter a number from 0 to 100." />);
      expect(screen.getByText("Enter a number from 0 to 100.")).toBeInTheDocument();
      expect(getInput()).toHaveAccessibleDescription("Error: Enter a number from 0 to 100.");
    });

    it("gives the error an icon that is hidden from screen readers", () => {
      render(<NumberField label="Score" invalid error="Enter a number from 0 to 100." />);
      const error = screen.getByText("Enter a number from 0 to 100.").closest(".number-field__error");
      expect(error).toBeInTheDocument();
      expect(error?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });

    it("hides the error when the field is valid", () => {
      render(<NumberField label="Score" error="Enter a number from 0 to 100." />);
      expect(getInput()).toBeInTheDocument();
      expect(screen.queryByText("Enter a number from 0 to 100.")).not.toBeInTheDocument();
      expect(getInput()).toHaveAccessibleDescription("");
    });

    it("reads the description and the error together", () => {
      render(<NumberField label="Score" invalid description="From 0 to 100." error="Enter a number from 0 to 100." />);
      expect(getInput()).toHaveAccessibleDescription("From 0 to 100. Error: Enter a number from 0 to 100.");
    });

    it("keeps its own description and error linked when given an aria-describedby", () => {
      render(
        <>
          <p id="hint">You can change it later.</p>
          <NumberField label="Score" description="From 0 to 100." invalid error="Enter a number from 0 to 100." aria-describedby="hint" />
        </>,
      );
      expect(getInput()).toHaveAccessibleDescription(
        "You can change it later. From 0 to 100. Error: Enter a number from 0 to 100.",
      );
    });

    it("renders a description for a field named by aria-label", () => {
      render(<NumberField aria-label="Quantity" description="Up to 10." />);
      expect(getInput()).toHaveAccessibleName("Quantity");
      expect(getInput()).toHaveAccessibleDescription("Up to 10.");
    });
  });

  describe("in a form", () => {
    const getForm = () => screen.getByTestId("form") as HTMLFormElement;

    it("submits the plain number under its name, not the formatted text", () => {
      render(
        <form data-testid="form">
          <NumberField label="Salary" name="salary" defaultValue={85000} format={{ style: "currency", currency: "USD" }} locale="en-US" />
        </form>,
      );
      expect(getInput()).toHaveValue("$85,000.00");
      expect(getInput()).not.toHaveAttribute("name");
      expect(submitted(getForm())).toEqual({ salary: ["85000"] });
    });

    it("submits what was typed", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <NumberField label="Salary" name="salary" locale="en-US" />
        </form>,
      );
      await user.type(getInput(), "1,234.5");
      expect(submitted(getForm())).toEqual({ salary: ["1234.5"] });
    });

    it("submits an empty string when empty", () => {
      const { container } = render(
        <form data-testid="form">
          <NumberField label="Salary" name="salary" />
        </form>,
      );
      expect(getHidden(container)).toHaveAttribute("name", "salary");
      expect(submitted(getForm())).toEqual({ salary: [""] });
    });

    it("submits a read-only value", () => {
      render(
        <form data-testid="form">
          <NumberField label="Salary" name="salary" readOnly defaultValue={85000} />
        </form>,
      );
      expect(submitted(getForm())).toEqual({ salary: ["85000"] });
    });

    it("does not submit when disabled", () => {
      const { container } = render(
        <form data-testid="form">
          <NumberField label="Salary" name="salary" defaultValue={85000} disabled />
        </form>,
      );
      expect(getHidden(container)).toHaveAttribute("name", "salary");
      expect(getInput()).toBeDisabled();
      expect(submitted(getForm())).toEqual({});
    });

    it("fails the form's own validation when required and empty", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <NumberField label="Guests (required)" name="guests" required />
        </form>,
      );
      expect(getForm().checkValidity()).toBe(false);
      await user.type(getInput(), "4");
      expect(getForm().checkValidity()).toBe(true);
    });

    it("never limits what can be typed to steps: the hidden input's step is \"any\", even after step changes", () => {
      const { container, rerender } = render(
        <form data-testid="form">
          <NumberField label="Salary" name="salary" min={0} step={1000} defaultValue={85500} />
        </form>,
      );
      expect(getHidden(container)).toHaveAttribute("name", "salary");
      expect(getHidden(container)).toHaveAttribute("step", "any");
      expect(getHidden(container).validity.stepMismatch).toBe(false);
      expect(getForm().checkValidity()).toBe(true);
      rerender(
        <form data-testid="form">
          <NumberField label="Salary" name="salary" min={0} step={500} defaultValue={85500} />
        </form>,
      );
      expect(getHidden(container)).toHaveAttribute("step", "any");
      expect(getHidden(container).validity.stepMismatch).toBe(false);
    });

    it("still steps by step from a value between steps", async () => {
      const user = userEvent.setup();
      render(<NumberField label="Salary" min={0} step={1000} defaultValue={85500} locale="en-US" />);
      await user.click(getIncrease());
      expect(getInput()).toHaveValue("86,500");
    });
  });

  describe("id and form", () => {
    it("puts id on the input, and the label points to it", () => {
      render(<NumberField label="Salary" id="salary" />);
      expect(getInput()).toHaveAttribute("id", "salary");
      expect(screen.getByText("Salary")).toHaveAttribute("for", "salary");
    });

    it("can be labelled by an outside <label htmlFor>, because id is on the input", () => {
      render(
        <>
          <label htmlFor="qty">Outside label</label>
          <NumberField id="qty" aria-label="Inner name" />
        </>,
      );
      expect(screen.getByLabelText("Outside label")).toBe(getInput());
    });

    it("submits with a form it sits outside of, and Enter in it submits that form", async () => {
      const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
      const user = userEvent.setup();
      render(
        <>
          <form id="pay" data-testid="outside-form" onSubmit={onSubmit} noValidate>
            <button type="submit">Save salary</button>
          </form>
          <NumberField label="Salary" name="salary" form="pay" defaultValue={85000} />
        </>,
      );
      const form = screen.getByTestId("outside-form") as HTMLFormElement;
      expect(submitted(form)).toEqual({ salary: ["85000"] });
      expect(getInput()).toHaveAttribute("form", "pay");
      await user.type(getInput(), "{Enter}");
      expect(onSubmit).toHaveBeenCalledOnce();
    });
  });

  describe("refs", () => {
    it("forwards ref to the visible input", () => {
      const ref = createRef<HTMLInputElement>();
      render(<NumberField label="Guests" ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current).toBe(getInput());
    });

    it("lets the ref focus and select the text", () => {
      const ref = createRef<HTMLInputElement>();
      render(<NumberField label="Guests" ref={ref} defaultValue={123} />);
      ref.current?.focus();
      ref.current?.select();
      expect(getInput()).toHaveFocus();
      expect(ref.current?.selectionStart).toBe(0);
      expect(ref.current?.selectionEnd).toBe(3);
    });
  });

  describe("server rendering", () => {
    const field = () => (
      <form>
        <NumberField label="Salary" name="salary" min={0} step={1000} defaultValue={85500} format={{ style: "currency", currency: "USD" }} locale="en-US" />
      </form>
    );

    it("sends the label, the formatted value, and the plain number in the server HTML", () => {
      const host = serverHtml(field());
      expect(host.querySelector("label")).toHaveTextContent("Salary");
      expect(host.querySelector<HTMLInputElement>(".number-field__control")).toHaveValue("$85,500.00");
      expect(getHidden(host)).toHaveAttribute("name", "salary");
      expect(getHidden(host)).toHaveValue(85500);
    });

    it("hydrates the server HTML without a mismatch, then sets the hidden input's step to \"any\"", () => {
      const host = serverHtml(field());
      const errors = vi.spyOn(console, "error").mockImplementation(() => {});
      let root: ReturnType<typeof hydrateRoot> | undefined;
      act(() => {
        root = hydrateRoot(host, field());
      });
      onTestFinished(() => act(() => root?.unmount()));
      expect(errors).not.toHaveBeenCalled();
      expect(getHidden(host)).toHaveAttribute("step", "any");
      expect(getHidden(host).validity.stepMismatch).toBe(false);
    });
  });

  describe("props it leaves out", () => {
    // Each is kept out of the props type; these check that passing one anyway from JavaScript changes nothing.
    const untyped = (props: Record<string, unknown>) => props as unknown as Partial<NumberFieldProps>;

    it.each([
      ["type", "number", "type", "text"],
      ["inputMode", "email", "inputmode", "numeric"],
    ])("drops %s, so Base UI's own stays", (prop, given, attribute, kept) => {
      render(<NumberField label="Guests" min={0} {...untyped({ [prop]: given })} />);
      expect(getInput()).toHaveAttribute(attribute, kept);
    });

    it.each([
      ["pattern", "[0-9]*", "pattern"],
      ["maxLength", 3, "maxlength"],
      ["minLength", 1, "minlength"],
      ["list", "suggestions", "list"],
      ["multiple", true, "multiple"],
    ])("drops %s, which would check the formatted text", (prop, given, attribute) => {
      render(<NumberField label="Guests" {...untyped({ [prop]: given })} />);
      expect(getInput()).toBeInTheDocument();
      expect(getInput()).not.toHaveAttribute(attribute);
    });

    it("drops render, so the input stays Base UI's", () => {
      render(<NumberField label="Guests" {...untyped({ render: <textarea data-testid="swapped" /> })} />);
      expect(getInput().tagName).toBe("INPUT");
      expect(screen.queryByTestId("swapped")).toBeNull();
    });

    it("drops children", () => {
      render(<NumberField label="Guests" {...untyped({ children: <span data-testid="child" /> })} />);
      expect(getInput()).toBeInTheDocument();
      expect(screen.queryByTestId("child")).toBeNull();
    });

    it("drops allowOutOfRange={false}: a typed value is always kept", async () => {
      const user = userEvent.setup();
      render(<NumberField label="Score" min={0} max={100} {...untyped({ allowOutOfRange: false })} />);
      await user.type(getInput(), "150");
      await user.tab();
      expect(getInput()).toHaveValue("150");
      expect(getInput()).not.toHaveAttribute("allowoutofrange");
    });

    it("drops allowWheelScrub: the wheel never changes the number", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<NumberField label="Guests" defaultValue={2} onValueChange={onValueChange} {...untyped({ allowWheelScrub: true })} />);
      await user.click(getInput());
      fireEvent.wheel(getInput(), { deltaY: -100 });
      expect(getInput()).toHaveValue("2");
      expect(onValueChange).not.toHaveBeenCalled();
      expect(getInput()).not.toHaveAttribute("allowwheelscrub");
    });

    it("drops inputRef, so the hidden input's step stays \"any\"", () => {
      const inputRef = createRef<HTMLInputElement>();
      const { container } = render(<NumberField label="Guests" min={0} step={5} {...untyped({ inputRef })} />);
      expect(getHidden(container)).toHaveAttribute("step", "any");
      expect(inputRef.current).toBeNull();
      expect(getInput()).not.toHaveAttribute("inputref");
    });
  });

  describe("types", () => {
    it("requires a visible label or an aria-label", () => {
      expectTypeOf<{ label: string }>().toExtend<NumberFieldProps>();
      expectTypeOf<{ "aria-label": string }>().toExtend<NumberFieldProps>();
      expectTypeOf<object>().not.toExtend<NumberFieldProps>();
      expectTypeOf<{ description: string }>().not.toExtend<NumberFieldProps>();
      expectTypeOf<{ label: undefined }>().not.toExtend<NumberFieldProps>();
      expectTypeOf<{ label: null }>().not.toExtend<NumberFieldProps>();
      expectTypeOf<{ label: string | undefined }>().not.toExtend<NumberFieldProps>();
    });

    it("takes numbers, and reports a number or null", () => {
      expectTypeOf<NumberFieldProps["value"]>().toEqualTypeOf<number | null | undefined>();
      expectTypeOf<NumberFieldProps["defaultValue"]>().toEqualTypeOf<number | undefined>();
      expectTypeOf<NumberFieldProps["min"]>().toEqualTypeOf<number | undefined>();
      expectTypeOf<NumberFieldProps["max"]>().toEqualTypeOf<number | undefined>();
      expectTypeOf<NonNullable<NumberFieldProps["onValueChange"]>>().parameter(0).toEqualTypeOf<number | null>();
      expectTypeOf<NonNullable<NumberFieldProps["onValueCommitted"]>>().parameter(0).toEqualTypeOf<number | null>();
    });

    it("takes a number step, never \"any\"", () => {
      expectTypeOf<NumberFieldProps["step"]>().toEqualTypeOf<number | undefined>();
      expectTypeOf<{ label: string; step: "any" }>().not.toExtend<NumberFieldProps>();
    });

    it("only accepts the two sizes", () => {
      expectTypeOf<NumberFieldProps["size"]>().toEqualTypeOf<NumberFieldSize | undefined>();
      expectTypeOf<NumberFieldSize>().toEqualTypeOf<"md" | "lg">();
    });

    it("leaves out the input attributes that would break a number field", () => {
      expectTypeOf<NumberFieldProps>().not.toHaveProperty("type");
      expectTypeOf<NumberFieldProps>().not.toHaveProperty("inputMode");
      expectTypeOf<NumberFieldProps>().not.toHaveProperty("pattern");
      expectTypeOf<NumberFieldProps>().not.toHaveProperty("maxLength");
      expectTypeOf<NumberFieldProps>().not.toHaveProperty("minLength");
      expectTypeOf<NumberFieldProps>().not.toHaveProperty("list");
      expectTypeOf<NumberFieldProps>().not.toHaveProperty("multiple");
      expectTypeOf<NumberFieldProps>().not.toHaveProperty("children");
      expectTypeOf<NumberFieldProps>().not.toHaveProperty("render");
    });

    it("leaves out the Base UI props it decides itself", () => {
      expectTypeOf<NumberFieldProps>().not.toHaveProperty("allowWheelScrub");
      expectTypeOf<NumberFieldProps>().not.toHaveProperty("allowOutOfRange");
      expectTypeOf<NumberFieldProps>().not.toHaveProperty("inputRef");
    });

    it("types className as a string, steppers as a boolean, and the ref as an input", () => {
      expectTypeOf<NumberFieldProps["className"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<NumberFieldProps["steppers"]>().toEqualTypeOf<boolean | undefined>();
      expectTypeOf<NumberFieldProps["format"]>().toEqualTypeOf<Intl.NumberFormatOptions | undefined>();
      expectTypeOf<NumberFieldProps["ref"]>().toEqualTypeOf<Ref<HTMLInputElement> | undefined>();
    });
  });

  describe("dev warnings", () => {
    it("warns when the label is empty and there's no aria-label", () => {
      render(<NumberField label="" />);
      expect(getInput()).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        "[design-system] NumberField: has no accessible name, so screen readers announce it without one. Give it a label or an aria-label.",
      ]);
    });

    it("warns when min is greater than max", () => {
      render(<NumberField label="Score" min={10} max={5} />);
      expect(getInput()).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        "[design-system] NumberField: min (10) is greater than max (5), so no value can be within both. Swap them.",
      ]);
    });
  });
});
