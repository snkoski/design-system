import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { Checkbox } from "./Checkbox";
import type { CheckboxProps } from "./Checkbox";

const getBox = () => screen.getByRole("checkbox");
const getInput = (container: HTMLElement) => container.querySelector<HTMLInputElement>("input[type=checkbox]")!;

describe("Checkbox", () => {
  describe("rendering", () => {
    it("renders a checkbox named by its label", () => {
      render(<Checkbox>Accept terms</Checkbox>);
      expect(screen.getByRole("checkbox", { name: "Accept terms" })).toBeInTheDocument();
    });

    it("is unticked by default", () => {
      render(<Checkbox>Accept terms</Checkbox>);
      expect(getBox()).toHaveAttribute("aria-checked", "false");
      expect(getBox()).not.toBeChecked();
    });

    it("wraps the label text so CSS can target it", () => {
      render(<Checkbox>Accept terms</Checkbox>);
      expect(screen.getByText("Accept terms")).toHaveClass("checkbox__label");
    });

    it("puts the box and the label text inside one <label>", () => {
      render(<Checkbox>Accept terms</Checkbox>);
      const label = screen.getByText("Accept terms").closest("label");
      expect(label).toHaveClass("checkbox__row");
      expect(label).toContainElement(getBox());
    });

    it("can be named by aria-label alone, with no <label> element", () => {
      const { container } = render(<Checkbox aria-label="Select row 3" />);
      expect(screen.getByRole("checkbox", { name: "Select row 3" })).toBeInTheDocument();
      expect(container.querySelector("label")).toBeNull();
    });

    it("applies className to the outer wrapper, next to its own class", () => {
      const { container } = render(<Checkbox className="mt-4">Accept terms</Checkbox>);
      expect(container.firstElementChild).toHaveClass("checkbox", "mt-4");
    });

    it("passes other props through to the checkbox element", () => {
      render(<Checkbox data-testid="terms-box">Accept terms</Checkbox>);
      expect(screen.getByTestId("terms-box")).toBe(getBox());
    });

    it("never uses modifier classes", () => {
      const { container } = render(
        <Checkbox invalid indeterminate disabled error="Required" description="More">Accept terms</Checkbox>,
      );
      expect(container.innerHTML).not.toMatch(/checkbox--/);
    });
  });

  describe("the mark", () => {
    it("shows no mark when unticked", () => {
      render(<Checkbox>Accept terms</Checkbox>);
      expect(getBox().querySelector("svg")).toBeNull();
    });

    it("shows a tick when ticked, hidden from screen readers", () => {
      render(<Checkbox defaultChecked>Accept terms</Checkbox>);
      const mark = getBox().querySelector("svg");
      expect(mark).toBeInTheDocument();
      expect(mark).toHaveAttribute("aria-hidden", "true");
      expect(mark?.querySelector("path")).toHaveAttribute("d", expect.stringContaining("m3 8.5"));
    });

    it("shows a dash when indeterminate, so the state isn't only a color", () => {
      render(<Checkbox indeterminate>Select all</Checkbox>);
      const mark = getBox().querySelector("svg");
      expect(mark).toBeInTheDocument();
      expect(mark?.querySelector("path")).toHaveAttribute("d", "M3.5 8h9");
    });
  });

  describe("ticking and unticking", () => {
    it("ticks and unticks when clicked", async () => {
      const user = userEvent.setup();
      render(<Checkbox>Accept terms</Checkbox>);
      await user.click(getBox());
      expect(getBox()).toBeChecked();
      await user.click(getBox());
      expect(getBox()).not.toBeChecked();
    });

    it("ticks when the label text is clicked", async () => {
      const user = userEvent.setup();
      render(<Checkbox>Accept terms</Checkbox>);
      await user.click(screen.getByText("Accept terms"));
      expect(getBox()).toBeChecked();
    });

    it("ticks only once per click, even though the box sits inside its label", async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();
      render(<Checkbox onCheckedChange={onCheckedChange}>Accept terms</Checkbox>);
      await user.click(getBox());
      expect(onCheckedChange).toHaveBeenCalledOnce();
      await user.click(screen.getByText("Accept terms"));
      expect(onCheckedChange).toHaveBeenCalledTimes(2);
    });

    it("calls onCheckedChange with the new value each time", async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();
      render(<Checkbox onCheckedChange={onCheckedChange}>Accept terms</Checkbox>);
      await user.click(getBox());
      await user.click(getBox());
      expect(onCheckedChange.mock.calls.map(([checked]) => checked)).toEqual([true, false]);
    });

    it("starts ticked with defaultChecked", () => {
      render(<Checkbox defaultChecked>Accept terms</Checkbox>);
      expect(getBox()).toBeChecked();
    });

    it("follows the checked prop when controlled, and doesn't change by itself", async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(<Checkbox checked={false} onCheckedChange={onCheckedChange}>Accept terms</Checkbox>);
      await user.click(getBox());
      expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
      expect(getBox()).not.toBeChecked();
      rerender(<Checkbox checked onCheckedChange={onCheckedChange}>Accept terms</Checkbox>);
      expect(getBox()).toBeChecked();
    });

    it("works as a controlled checkbox driven by state", async () => {
      function Controlled() {
        const [checked, setChecked] = useState(false);
        return (
          <>
            <Checkbox checked={checked} onCheckedChange={setChecked}>Accept terms</Checkbox>
            <output>{checked ? "on" : "off"}</output>
          </>
        );
      }
      const user = userEvent.setup();
      render(<Controlled />);
      expect(screen.getByRole("status")).toHaveTextContent("off");
      await user.click(getBox());
      expect(screen.getByRole("status")).toHaveTextContent("on");
    });
  });

  describe("keyboard", () => {
    it("is reachable with Tab, and focus lands on the checkbox", async () => {
      const user = userEvent.setup();
      render(<Checkbox>Accept terms</Checkbox>);
      await user.tab();
      expect(getBox()).toHaveFocus();
    });

    it("ticks and unticks with Space", async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();
      render(<Checkbox onCheckedChange={onCheckedChange}>Accept terms</Checkbox>);
      await user.tab();
      await user.keyboard(" ");
      expect(getBox()).toBeChecked();
      await user.keyboard(" ");
      expect(getBox()).not.toBeChecked();
      expect(onCheckedChange).toHaveBeenCalledTimes(2);
    });

    it("does not tick with Enter, like a native checkbox", async () => {
      const user = userEvent.setup();
      render(<Checkbox>Accept terms</Checkbox>);
      await user.tab();
      await user.keyboard("{Enter}");
      expect(getBox()).not.toBeChecked();
    });

    it("moves through several checkboxes in source order", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Checkbox>One</Checkbox>
          <Checkbox>Two</Checkbox>
        </>,
      );
      await user.tab();
      expect(screen.getByRole("checkbox", { name: "One" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("checkbox", { name: "Two" })).toHaveFocus();
    });
  });

  describe("indeterminate", () => {
    it("is announced as mixed", () => {
      render(<Checkbox indeterminate>Select all</Checkbox>);
      expect(getBox()).toHaveAttribute("aria-checked", "mixed");
      expect(getBox()).toBePartiallyChecked();
    });

    it("still reports the click, and the consumer decides the next state", async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();
      render(<Checkbox indeterminate onCheckedChange={onCheckedChange}>Select all</Checkbox>);
      await user.click(getBox());
      expect(onCheckedChange).toHaveBeenCalledOnce();
      expect(onCheckedChange.mock.calls[0]?.[0]).toBe(true);
    });

    it("returns to a normal checkbox when indeterminate ends", () => {
      const { rerender } = render(<Checkbox indeterminate checked={false}>Select all</Checkbox>);
      rerender(<Checkbox checked>Select all</Checkbox>);
      expect(getBox()).toHaveAttribute("aria-checked", "true");
      expect(getBox()).not.toHaveAttribute("data-indeterminate");
    });
  });

  describe("disabled", () => {
    it("blocks clicks on the box and on the label", async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();
      render(<Checkbox disabled onCheckedChange={onCheckedChange}>Accept terms</Checkbox>);
      await user.click(getBox());
      await user.click(screen.getByText("Accept terms"));
      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(getBox()).not.toBeChecked();
    });

    it("is marked disabled for assistive technology and styling", () => {
      const { container } = render(<Checkbox disabled>Accept terms</Checkbox>);
      expect(getBox()).toHaveAttribute("aria-disabled", "true");
      expect(getBox()).toHaveAttribute("data-disabled");
      expect(getInput(container)).toBeDisabled();
    });

    it("is skipped by Tab", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Checkbox disabled>Off</Checkbox>
          <Checkbox>On</Checkbox>
        </>,
      );
      await user.tab();
      expect(screen.getByRole("checkbox", { name: "On" })).toHaveFocus();
    });

    it("ignores Space", async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();
      render(<Checkbox disabled onCheckedChange={onCheckedChange}>Accept terms</Checkbox>);
      getBox().focus();
      await user.keyboard(" ");
      expect(onCheckedChange).not.toHaveBeenCalled();
    });

    it("keeps its ticked state", () => {
      render(<Checkbox disabled defaultChecked>Accept terms</Checkbox>);
      expect(getBox()).toBeChecked();
    });
  });

  describe("read only", () => {
    it("blocks changes from the box and from the label", async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();
      render(<Checkbox readOnly defaultChecked onCheckedChange={onCheckedChange}>Accept terms</Checkbox>);
      expect(getBox()).toHaveAttribute("aria-readonly", "true");
      await user.click(getBox());
      await user.click(screen.getByText("Accept terms"));
      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(getBox()).toBeChecked();
    });

    it("blocks changes from the keyboard", async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();
      render(<Checkbox readOnly onCheckedChange={onCheckedChange}>Accept terms</Checkbox>);
      await user.tab();
      await user.keyboard(" ");
      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(getBox()).not.toBeChecked();
    });

    it("stays in the tab order, so its value can be read", async () => {
      const user = userEvent.setup();
      render(<Checkbox readOnly defaultChecked>Accept terms</Checkbox>);
      await user.tab();
      expect(getBox()).toHaveFocus();
    });
  });

  describe("required and invalid", () => {
    it("is announced as required", () => {
      render(<Checkbox required>Accept terms (required)</Checkbox>);
      expect(getBox()).toBeRequired();
    });

    it("is not required by default", () => {
      render(<Checkbox>Accept terms</Checkbox>);
      expect(getBox()).not.toBeRequired();
    });

    it("is announced as invalid", () => {
      render(<Checkbox invalid>Accept terms</Checkbox>);
      expect(getBox()).toBeInvalid();
      expect(getBox()).toHaveAttribute("aria-invalid", "true");
    });

    it("is valid by default", () => {
      render(<Checkbox>Accept terms</Checkbox>);
      expect(getBox()).not.toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("description and error", () => {
    it("links the description to the checkbox", () => {
      render(<Checkbox description="We will email you a copy.">Accept terms</Checkbox>);
      expect(getBox()).toHaveAccessibleDescription("We will email you a copy.");
    });

    it("keeps the description out of the accessible name", () => {
      render(<Checkbox description="We will email you a copy.">Accept terms</Checkbox>);
      expect(getBox()).toHaveAccessibleName("Accept terms");
    });

    it("shows the error, linked to the checkbox, when invalid", () => {
      render(<Checkbox invalid error="You must accept the terms.">Accept terms</Checkbox>);
      expect(screen.getByText("You must accept the terms.")).toBeInTheDocument();
      expect(getBox()).toHaveAccessibleDescription("You must accept the terms.");
    });

    it("gives the error an icon that is hidden from screen readers", () => {
      render(<Checkbox invalid error="You must accept the terms.">Accept terms</Checkbox>);
      const error = screen.getByText("You must accept the terms.").closest(".checkbox__error");
      expect(error).toBeInTheDocument();
      const icon = error?.querySelector("svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("hides the error when the checkbox is valid", () => {
      render(<Checkbox error="You must accept the terms.">Accept terms</Checkbox>);
      expect(screen.queryByText("You must accept the terms.")).not.toBeInTheDocument();
      expect(getBox()).toHaveAccessibleDescription("");
    });

    it("reads the description and the error together", () => {
      render(
        <Checkbox invalid description="We will email you a copy." error="You must accept the terms.">
          Accept terms
        </Checkbox>,
      );
      expect(getBox()).toHaveAccessibleDescription("We will email you a copy. You must accept the terms.");
    });

    it("shows the error again when invalid turns on later", () => {
      const { rerender } = render(<Checkbox error="Pick one.">Accept terms</Checkbox>);
      expect(screen.queryByText("Pick one.")).not.toBeInTheDocument();
      rerender(<Checkbox invalid error="Pick one.">Accept terms</Checkbox>);
      expect(screen.getByText("Pick one.")).toBeInTheDocument();
    });

    it("is invalid with no error text without breaking", () => {
      const { container } = render(<Checkbox invalid>Accept terms</Checkbox>);
      expect(container.querySelector(".checkbox__error")).toBeNull();
      expect(getBox()).toBeInvalid();
    });

    it("renders a description for a checkbox named by aria-label", () => {
      render(<Checkbox aria-label="Select row 3" description="Row 3 of 10" />);
      expect(getBox()).toHaveAccessibleName("Select row 3");
      expect(getBox()).toHaveAccessibleDescription("Row 3 of 10");
    });
  });

  describe("in a form", () => {
    function submitted(form: HTMLFormElement) {
      return Object.fromEntries(new FormData(form).entries());
    }

    it("submits `on` under its name when ticked, with no value", () => {
      render(
        <form data-testid="form">
          <Checkbox name="terms" defaultChecked>Accept terms</Checkbox>
        </form>,
      );
      expect(submitted(screen.getByTestId("form") as HTMLFormElement)).toEqual({ terms: "on" });
    });

    it("submits its value when ticked", () => {
      render(
        <form data-testid="form">
          <Checkbox name="plan" value="newsletter" defaultChecked>Newsletter</Checkbox>
        </form>,
      );
      expect(submitted(screen.getByTestId("form") as HTMLFormElement)).toEqual({ plan: "newsletter" });
    });

    it("submits nothing when unticked, like a native checkbox", () => {
      render(
        <form data-testid="form">
          <Checkbox name="terms">Accept terms</Checkbox>
        </form>,
      );
      expect(submitted(screen.getByTestId("form") as HTMLFormElement)).toEqual({});
    });

    it("starts submitting after the user ticks it", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <Checkbox name="terms">Accept terms</Checkbox>
        </form>,
      );
      await user.click(getBox());
      expect(submitted(screen.getByTestId("form") as HTMLFormElement)).toEqual({ terms: "on" });
    });

    it("does not submit when disabled", () => {
      render(
        <form data-testid="form">
          <Checkbox name="terms" defaultChecked disabled>Accept terms</Checkbox>
        </form>,
      );
      expect(submitted(screen.getByTestId("form") as HTMLFormElement)).toEqual({});
    });

    it("fails the form's own validation when required and unticked", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <Checkbox name="terms" required>Accept terms (required)</Checkbox>
        </form>,
      );
      const form = screen.getByTestId("form") as HTMLFormElement;
      expect(form.checkValidity()).toBe(false);
      await user.click(getBox());
      expect(form.checkValidity()).toBe(true);
    });
  });

  describe("refs", () => {
    it("forwards ref to the checkbox element", () => {
      const ref = createRef<HTMLElement>();
      render(<Checkbox ref={ref}>Accept terms</Checkbox>);
      expect(ref.current).toBe(getBox());
    });

    it("forwards inputRef to the hidden input", () => {
      const inputRef = createRef<HTMLInputElement>();
      const { container } = render(<Checkbox inputRef={inputRef}>Accept terms</Checkbox>);
      expect(inputRef.current).toBe(getInput(container));
    });
  });

  describe("types", () => {
    it("requires visible label content or an aria-label", () => {
      expectTypeOf<{ children: string }>().toExtend<CheckboxProps>();
      expectTypeOf<{ "aria-label": string }>().toExtend<CheckboxProps>();
      expectTypeOf<object>().not.toExtend<CheckboxProps>();
      expectTypeOf<{ description: string }>().not.toExtend<CheckboxProps>();
    });

    it("keeps Base UI's render and nativeButton out of the public props", () => {
      expectTypeOf<CheckboxProps>().not.toHaveProperty("render");
      expectTypeOf<CheckboxProps>().not.toHaveProperty("nativeButton");
      expectTypeOf<CheckboxProps["className"]>().toEqualTypeOf<string | undefined>();
    });

    it("reports the new value as a boolean", () => {
      expectTypeOf<CheckboxProps["onCheckedChange"]>().parameter(0).toEqualTypeOf<boolean>();
    });
  });
});
