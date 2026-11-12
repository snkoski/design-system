import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { takeWarnings } from "@tests/warnings";
import { CheckboxGroup } from "@/components/CheckboxGroup";
import { Checkbox } from "@/components/Checkbox/Checkbox";
import type { CheckboxProps } from "@/components/Checkbox/Checkbox";

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

    it("puts the shared choice classes next to its own, so choice.css and field.css draw what Checkbox, Radio, and Switch share", () => {
      const { container } = render(<Checkbox description="You can change this later." defaultChecked>Accept terms</Checkbox>);
      expect(container.firstElementChild).toHaveClass("choice", "checkbox");
      expect(screen.getByText("Accept terms")).toHaveClass("choice__label", "checkbox__label");
      expect(screen.getByText("Accept terms").closest("label")).toHaveClass("choice__row", "checkbox__row");
      expect(getBox()).toHaveClass("choice__control", "checkbox__box");
      expect(getBox().firstElementChild).toHaveClass("choice__indicator", "checkbox__indicator");
      expect(screen.getByText("You can change this later.")).toHaveClass("field-description", "checkbox__description");
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
      expect(container.querySelector(".checkbox__box")).toBeInTheDocument();
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
    it("says \"Read only\" beside the label, hidden from screen readers and left out of the name", () => {
      render(<Checkbox readOnly>Accept terms</Checkbox>);
      const note = screen.getByText("Read only");
      expect(note).toHaveClass("read-only-note");
      expect(note).toHaveAttribute("aria-hidden", "true");
      expect(note.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      expect(note.closest("label")).toHaveTextContent("Accept terms");
      expect(getBox()).toHaveAccessibleName("Accept terms");
    });

    it("has no note when it isn't read-only, or when it's disabled as well", () => {
      const { rerender } = render(<Checkbox>Accept terms</Checkbox>);
      expect(getBox()).toBeInTheDocument();
      expect(screen.queryByText("Read only")).toBeNull();
      rerender(<Checkbox readOnly disabled>Accept terms</Checkbox>);
      expect(getBox()).toHaveAttribute("aria-readonly", "true");
      expect(screen.queryByText("Read only")).toBeNull();
    });

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
      expect(getBox()).toHaveAccessibleDescription("Error: You must accept the terms.");
    });

    it("puts the error above the row, before the box and its label", () => {
      render(
        <Checkbox invalid description="We will email you a copy." error="You must accept the terms.">
          Accept terms
        </Checkbox>,
      );
      const error = screen.getByText("You must accept the terms.");
      expect(error.compareDocumentPosition(getBox())).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(error.compareDocumentPosition(screen.getByText("Accept terms"))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
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
      expect(getBox()).toHaveAccessibleDescription("Error: You must accept the terms. We will email you a copy.");
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
      expect(screen.getByTestId("form").querySelector("input[name=terms]")).toBeInTheDocument();
      expect(submitted(screen.getByTestId("form") as HTMLFormElement)).toEqual({});
    });

    it("submits uncheckedValue when unticked", () => {
      render(
        <form data-testid="form">
          <Checkbox name="newsletter" value="yes" uncheckedValue="no">Newsletter</Checkbox>
        </form>,
      );
      expect(submitted(screen.getByTestId("form") as HTMLFormElement)).toEqual({ newsletter: "no" });
    });

    it("submits its value, not uncheckedValue, when ticked", () => {
      render(
        <form data-testid="form">
          <Checkbox name="newsletter" value="yes" uncheckedValue="no" defaultChecked>Newsletter</Checkbox>
        </form>,
      );
      expect(submitted(screen.getByTestId("form") as HTMLFormElement)).toEqual({ newsletter: "yes" });
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
      const input = screen.getByTestId("form").querySelector<HTMLInputElement>("input[name=terms]");
      expect(input).toBeChecked();
      expect(input).toBeDisabled();
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

  describe("id and form", () => {
    it("puts id on the hidden input, not on the visible checkbox", () => {
      const { container } = render(<Checkbox id="terms-input">Accept terms</Checkbox>);
      expect(getInput(container)).toHaveAttribute("id", "terms-input");
      expect(getBox()).not.toHaveAttribute("id", "terms-input");
    });

    it("can be toggled, but not named, by an outside label pointing at that id", async () => {
      const user = userEvent.setup();
      render(
        <>
          <label htmlFor="terms-input">Outside label</label>
          <Checkbox id="terms-input" aria-label="Inner name" />
        </>,
      );
      await user.click(screen.getByText("Outside label"));
      expect(getBox()).toBeChecked();
      expect(getBox()).toHaveAccessibleName("Inner name");
    });

    it("submits with a form it sits outside of, through form", () => {
      render(
        <>
          <form id="settings" data-testid="outside-form" />
          <Checkbox name="terms" form="settings" defaultChecked>Accept terms</Checkbox>
        </>,
      );
      const form = screen.getByTestId("outside-form") as HTMLFormElement;
      expect(Object.fromEntries(new FormData(form).entries())).toEqual({ terms: "on" });
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
      expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
      expect(inputRef.current).toBe(getInput(container));
    });
  });

  describe("inside a CheckboxGroup", () => {
    const warning = (message: string) => `[design-system] Checkbox: ${message}`;

    function submitted(form: HTMLFormElement, name: string) {
      return new FormData(form).getAll(name);
    }

    it("takes its name from the group and ignores its own", () => {
      render(
        <form data-testid="form">
          <CheckboxGroup label="Services" name="services" defaultValue={["design"]}>
            <Checkbox name="other" value="design">Design</Checkbox>
          </CheckboxGroup>
        </form>,
      );
      const form = screen.getByTestId("form") as HTMLFormElement;
      expect(submitted(form, "services")).toEqual(["design"]);
      expect(submitted(form, "other")).toEqual([]);
      expect(takeWarnings()).toEqual([
        warning('the option "design" in a CheckboxGroup ignores name (set it on the CheckboxGroup).'),
      ]);
    });

    it("is ticked by the group's value, not its own checked or defaultChecked", () => {
      render(
        <CheckboxGroup label="Services" defaultValue={["writing"]}>
          <Checkbox value="design" defaultChecked>Design</Checkbox>
          <Checkbox value="writing" checked={false}>Writing</Checkbox>
        </CheckboxGroup>,
      );
      expect(screen.getByRole("checkbox", { name: "Design" })).not.toBeChecked();
      expect(screen.getByRole("checkbox", { name: "Writing" })).toBeChecked();
      expect(takeWarnings()).toEqual([
        warning(`the option "design" in a CheckboxGroup ignores defaultChecked (use the CheckboxGroup's defaultValue).`),
        warning(`the option "writing" in a CheckboxGroup ignores checked (use the CheckboxGroup's value).`),
      ]);
    });

    it("ignores its own invalid and error, which belong to the group", () => {
      render(
        <CheckboxGroup label="Services">
          <Checkbox value="design" invalid error="Not this one.">Design</Checkbox>
        </CheckboxGroup>,
      );
      expect(getBox()).toHaveAccessibleName("Design");
      expect(getBox()).not.toHaveAttribute("aria-invalid", "true");
      expect(screen.queryByText("Not this one.")).not.toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        warning('the option "design" in a CheckboxGroup ignores invalid (set it on the CheckboxGroup), error (set it on the CheckboxGroup).'),
      ]);
    });

    it("ignores its own required", () => {
      const { container } = render(
        <CheckboxGroup label="Services" name="services">
          <Checkbox value="design" required>Design</Checkbox>
        </CheckboxGroup>,
      );
      expect(getInput(container)).toHaveAttribute("name", "services");
      expect(getInput(container)).not.toBeRequired();
      expect(getBox()).not.toHaveAttribute("aria-required", "true");
      expect(takeWarnings()).toEqual([
        warning('the option "design" in a CheckboxGroup ignores required (a group has none: use invalid and error on the CheckboxGroup).'),
      ]);
    });

    it("ignores uncheckedValue, so an unticked option submits nothing", () => {
      render(
        <form data-testid="form">
          <CheckboxGroup label="Services" name="services">
            <Checkbox value="design" uncheckedValue="no">Design</Checkbox>
          </CheckboxGroup>
        </form>,
      );
      expect(screen.getByTestId("form").querySelector("input[name=services]")).toBeInTheDocument();
      expect([...new FormData(screen.getByTestId("form") as HTMLFormElement).values()]).toEqual([]);
      expect(takeWarnings()).toEqual([
        warning('the option "design" in a CheckboxGroup ignores uncheckedValue (a group submits only ticked options).'),
      ]);
    });

    it("needs a value: without one, it's listed under the group's name and submits `on`", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <CheckboxGroup label="Services" name="services" onValueChange={onValueChange}>
            <Checkbox>No value</Checkbox>
          </CheckboxGroup>
        </form>,
      );
      await user.click(getBox());
      expect(onValueChange).toHaveBeenCalledWith(["services"], expect.anything());
      expect(submitted(screen.getByTestId("form") as HTMLFormElement, "services")).toEqual(["on"]);
      expect(takeWarnings()).toEqual([
        warning(`an option in a CheckboxGroup has no value, so it submits "on" and is listed under the group's name. Give each option a value.`),
      ]);
    });

    it("still calls its own onCheckedChange", async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();
      render(
        <CheckboxGroup label="Services">
          <Checkbox value="design" onCheckedChange={onCheckedChange}>Design</Checkbox>
        </CheckboxGroup>,
      );
      await user.click(getBox());
      expect(onCheckedChange).toHaveBeenCalledOnce();
      expect(onCheckedChange.mock.calls[0]?.[0]).toBe(true);
    });

    it("can be disabled on its own, dimming its label row too", async () => {
      const user = userEvent.setup();
      render(
        <CheckboxGroup label="Services">
          <Checkbox value="design" disabled>Design</Checkbox>
          <Checkbox value="writing">Writing</Checkbox>
        </CheckboxGroup>,
      );
      const design = screen.getByRole("checkbox", { name: "Design" });
      expect(design).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByText("Design").closest(".checkbox__row")).toHaveAttribute("data-disabled");
      expect(screen.getByText("Writing").closest(".checkbox__row")).not.toHaveAttribute("data-disabled");
      await user.click(design);
      await user.click(screen.getByRole("checkbox", { name: "Writing" }));
      expect(design).not.toBeChecked();
      expect(screen.getByRole("checkbox", { name: "Writing" })).toBeChecked();
    });

    it("can be read-only on its own while the others still change", async () => {
      const user = userEvent.setup();
      render(
        <CheckboxGroup label="Services">
          <Checkbox value="design" readOnly>Design</Checkbox>
          <Checkbox value="writing">Writing</Checkbox>
        </CheckboxGroup>,
      );
      expect(screen.getByRole("checkbox", { name: "Design" })).toHaveAttribute("aria-readonly", "true");
      await user.click(screen.getByRole("checkbox", { name: "Design" }));
      await user.click(screen.getByRole("checkbox", { name: "Writing" }));
      expect(screen.getByRole("checkbox", { name: "Design" })).not.toBeChecked();
      expect(screen.getByRole("checkbox", { name: "Writing" })).toBeChecked();
    });

    it("leaves the \"Read only\" note to the group's label when the group is read-only", () => {
      render(
        <CheckboxGroup label="Services" readOnly>
          <Checkbox value="design" readOnly>Design</Checkbox>
          <Checkbox value="writing">Writing</Checkbox>
        </CheckboxGroup>,
      );
      expect(screen.getAllByText("Read only")).toHaveLength(1);
      expect(screen.getByText("Read only").closest(".checkbox-group__label")).toHaveTextContent("Services");
    });

    it("shows its own \"Read only\" note when it's read-only in a group that isn't", () => {
      render(
        <CheckboxGroup label="Services">
          <Checkbox value="design" readOnly>Design</Checkbox>
          <Checkbox value="writing">Writing</Checkbox>
        </CheckboxGroup>,
      );
      expect(screen.getAllByText("Read only")).toHaveLength(1);
      expect(screen.getByText("Read only").closest(".checkbox__label")).toHaveTextContent("Design");
      expect(screen.getByRole("checkbox", { name: "Design" })).toBeInTheDocument();
    });

    it("is read-only when the group is, even if it says readOnly={false}", () => {
      render(
        <CheckboxGroup label="Services" readOnly>
          <Checkbox value="design" readOnly={false}>Design</Checkbox>
        </CheckboxGroup>,
      );
      expect(getBox()).toHaveAttribute("aria-readonly", "true");
    });

    it("keeps its description, id, and inputRef", () => {
      const inputRef = createRef<HTMLInputElement>();
      const { container } = render(
        <CheckboxGroup aria-label="Services">
          <Checkbox value="design" id="design-input" inputRef={inputRef} description="Logos and layouts">
            Design
          </Checkbox>
        </CheckboxGroup>,
      );
      expect(getBox()).toHaveAccessibleDescription("Logos and layouts");
      expect(getInput(container)).toHaveAttribute("id", "design-input");
      expect(inputRef.current).toBe(getInput(container));
    });

    it("applies className to its own wrapper", () => {
      render(
        <CheckboxGroup label="Services">
          <Checkbox value="design" className="mt-4">Design</Checkbox>
        </CheckboxGroup>,
      );
      expect(screen.getByText("Design").closest(".checkbox")).toHaveClass("checkbox", "mt-4");
    });

    it("marks a parent box's wrapper with data-parent, and no other", () => {
      render(
        <CheckboxGroup label="Services" allValues={["design"]}>
          <Checkbox parent>All services</Checkbox>
          <Checkbox value="design">Design</Checkbox>
        </CheckboxGroup>,
      );
      expect(screen.getByText("All services").closest(".checkbox")).toHaveAttribute("data-parent");
      expect(screen.getByText("Design").closest(".checkbox")).not.toHaveAttribute("data-parent");
    });

    it("shows the mark the group gives a parent box: a dash when mixed, a tick when all", async () => {
      const user = userEvent.setup();
      render(
        <CheckboxGroup label="Services" allValues={["design", "writing"]} defaultValue={["design"]}>
          <Checkbox parent>All services</Checkbox>
          <Checkbox value="design">Design</Checkbox>
          <Checkbox value="writing">Writing</Checkbox>
        </CheckboxGroup>,
      );
      const parent = screen.getByRole("checkbox", { name: "All services" });
      expect(parent.querySelector("svg path")).toHaveAttribute("d", "M3.5 8h9");
      await user.click(screen.getByRole("checkbox", { name: "Writing" }));
      expect(parent).toHaveAttribute("aria-checked", "true");
      expect(parent.querySelector("svg path")).toHaveAttribute("d", expect.stringContaining("m3 8.5"));
    });
  });

  describe("outside a group", () => {
    it("has no data-parent on its wrapper", () => {
      const { container } = render(<Checkbox>Accept terms</Checkbox>);
      expect(container.firstElementChild).toHaveClass("checkbox");
      expect(container.firstElementChild).not.toHaveAttribute("data-parent");
    });
  });

  describe("types", () => {
    it("takes parent as a boolean", () => {
      expectTypeOf<CheckboxProps["parent"]>().toEqualTypeOf<boolean | undefined>();
    });

    it("requires visible label content or an aria-label", () => {
      expectTypeOf<{ children: string }>().toExtend<CheckboxProps>();
      expectTypeOf<{ "aria-label": string }>().toExtend<CheckboxProps>();
      expectTypeOf<object>().not.toExtend<CheckboxProps>();
      expectTypeOf<{ description: string }>().not.toExtend<CheckboxProps>();
      // Empty label content isn't a name, so it still needs an aria-label
      expectTypeOf<{ children: undefined }>().not.toExtend<CheckboxProps>();
      expectTypeOf<{ children: null }>().not.toExtend<CheckboxProps>();
      expectTypeOf<{ children: false }>().not.toExtend<CheckboxProps>();
      expectTypeOf<{ children: string | undefined }>().not.toExtend<CheckboxProps>();
    });

    it("keeps Base UI's render and nativeButton out of the public props", () => {
      expectTypeOf<CheckboxProps>().not.toHaveProperty("render");
      expectTypeOf<CheckboxProps>().not.toHaveProperty("nativeButton");
      expectTypeOf<CheckboxProps["className"]>().toEqualTypeOf<string | undefined>();
    });

    it("reports the new value as a boolean", () => {
      expectTypeOf<CheckboxProps["onCheckedChange"]>().parameter(0).toEqualTypeOf<boolean>();
    });

    it("takes string ids", () => {
      expectTypeOf<CheckboxProps["id"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<CheckboxProps["form"]>().toEqualTypeOf<string | undefined>();
    });

    it("takes string form values", () => {
      expectTypeOf<CheckboxProps["value"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<CheckboxProps["uncheckedValue"]>().toEqualTypeOf<string | undefined>();
    });
  });

  describe("dev warnings", () => {
    it("warns when the label text is empty and there's no aria-label", () => {
      render(<Checkbox aria-label=" ">{""}</Checkbox>);
      expect(getBox()).toBeInTheDocument();
      expect(takeWarnings()).toEqual(["[design-system] Checkbox: has no accessible name, so screen readers announce it without one. Give it label text (children) or an aria-label."]);
    });

    it("warns once, however often it renders", () => {
      const { rerender } = render(<Checkbox>{"  "}</Checkbox>);
      rerender(<Checkbox disabled>{"  "}</Checkbox>);
      expect(takeWarnings()).toHaveLength(1);
    });

    it("stays quiet when aria-labelledby names it", () => {
      render(
        <>
          <h2 id="terms-heading">Terms</h2>
          <Checkbox aria-labelledby="terms-heading">{""}</Checkbox>
        </>,
      );
      expect(getBox()).toHaveAccessibleName("Terms");
      expect(takeWarnings()).toEqual([]);
    });

    it("warns when parent is used outside a CheckboxGroup", () => {
      render(<Checkbox parent>All services</Checkbox>);
      expect(getBox()).toBeInTheDocument();
      expect(takeWarnings()).toEqual(["[design-system] Checkbox: parent only works inside a CheckboxGroup that has allValues."]);
    });

    it("stays quiet about group props set to values that change nothing", () => {
      render(
        <CheckboxGroup label="Services">
          <Checkbox value="design" invalid={false} required={false} defaultChecked={false} name="" error={null}>
            Design
          </Checkbox>
        </CheckboxGroup>,
      );
      expect(getBox()).toBeInTheDocument();
      expect(takeWarnings()).toEqual([]);
    });

    it("names the parent box when it ignores a group prop", () => {
      render(
        <CheckboxGroup label="Services" allValues={["design"]}>
          <Checkbox parent invalid>All services</Checkbox>
          <Checkbox value="design">Design</Checkbox>
        </CheckboxGroup>,
      );
      expect(screen.getByRole("checkbox", { name: "All services" })).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        "[design-system] Checkbox: the parent box in a CheckboxGroup ignores invalid (set it on the CheckboxGroup).",
      ]);
    });
  });
});
