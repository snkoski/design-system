import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { Switch } from "./Switch";
import type { SwitchProps } from "./Switch";

const getSwitch = () => screen.getByRole("switch");
const getInput = (container: HTMLElement) => container.querySelector<HTMLInputElement>("input[type=checkbox]")!;

describe("Switch", () => {
  describe("rendering", () => {
    it("renders a switch named by its label", () => {
      render(<Switch>Email me about new projects</Switch>);
      expect(screen.getByRole("switch", { name: "Email me about new projects" })).toBeInTheDocument();
    });

    it("is off by default", () => {
      render(<Switch>Alerts</Switch>);
      expect(getSwitch()).toHaveAttribute("aria-checked", "false");
      expect(getSwitch()).not.toBeChecked();
    });

    it("wraps the label text so CSS can target it", () => {
      render(<Switch>Alerts</Switch>);
      expect(screen.getByText("Alerts")).toHaveClass("switch__label");
    });

    it("puts the switch and the label text inside one <label>", () => {
      render(<Switch>Alerts</Switch>);
      const label = screen.getByText("Alerts").closest("label");
      expect(label).toHaveClass("switch__row");
      expect(label).toContainElement(getSwitch());
    });

    it("puts the switch before the label text", () => {
      render(<Switch>Alerts</Switch>);
      const label = screen.getByText("Alerts");
      expect(getSwitch().compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("draws a track with a thumb inside it", () => {
      render(<Switch>Alerts</Switch>);
      expect(getSwitch()).toHaveClass("switch__track");
      expect(getSwitch().querySelector(".switch__thumb")).toBeInTheDocument();
    });

    it("can be named by aria-label alone, with no <label> element", () => {
      const { container } = render(<Switch aria-label="Dark mode" />);
      expect(screen.getByRole("switch", { name: "Dark mode" })).toBeInTheDocument();
      expect(container.querySelector("label")).toBeNull();
    });

    it("applies className to the outer wrapper, next to its own class", () => {
      const { container } = render(<Switch className="mt-4">Alerts</Switch>);
      expect(container.firstElementChild).toHaveClass("switch", "mt-4");
    });

    it("passes other props through to the switch element", () => {
      render(<Switch data-testid="alerts-switch">Alerts</Switch>);
      expect(screen.getByTestId("alerts-switch")).toBe(getSwitch());
    });

    it("never uses modifier classes", () => {
      const { container } = render(
        <Switch invalid disabled defaultChecked error="Required" description="More">Alerts</Switch>,
      );
      expect(container.querySelector(".switch__track")).toBeInTheDocument();
      expect(container.innerHTML).not.toMatch(/switch--/);
    });
  });

  describe("turning on and off", () => {
    it("turns on and off when clicked", async () => {
      const user = userEvent.setup();
      render(<Switch>Alerts</Switch>);
      await user.click(getSwitch());
      expect(getSwitch()).toBeChecked();
      await user.click(getSwitch());
      expect(getSwitch()).not.toBeChecked();
    });

    it("turns on when the label text is clicked", async () => {
      const user = userEvent.setup();
      render(<Switch>Alerts</Switch>);
      await user.click(screen.getByText("Alerts"));
      expect(getSwitch()).toBeChecked();
    });

    it("changes only once per click, even though the switch sits inside its label", async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();
      render(<Switch onCheckedChange={onCheckedChange}>Alerts</Switch>);
      await user.click(getSwitch());
      expect(onCheckedChange).toHaveBeenCalledOnce();
      await user.click(screen.getByText("Alerts"));
      expect(onCheckedChange).toHaveBeenCalledTimes(2);
    });

    it("calls onCheckedChange with the new value each time", async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();
      render(<Switch onCheckedChange={onCheckedChange}>Alerts</Switch>);
      await user.click(getSwitch());
      await user.click(getSwitch());
      expect(onCheckedChange.mock.calls.map(([checked]) => checked)).toEqual([true, false]);
    });

    it("starts on with defaultChecked", () => {
      render(<Switch defaultChecked>Alerts</Switch>);
      expect(getSwitch()).toBeChecked();
      expect(getSwitch()).toHaveAttribute("aria-checked", "true");
    });

    it("follows the checked prop when controlled, and doesn't change by itself", async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(<Switch checked={false} onCheckedChange={onCheckedChange}>Alerts</Switch>);
      await user.click(getSwitch());
      expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
      expect(getSwitch()).not.toBeChecked();
      rerender(<Switch checked onCheckedChange={onCheckedChange}>Alerts</Switch>);
      expect(getSwitch()).toBeChecked();
    });

    it("works as a controlled switch driven by state", async () => {
      function Controlled() {
        const [checked, setChecked] = useState(false);
        return (
          <>
            <Switch checked={checked} onCheckedChange={setChecked}>Alerts</Switch>
            <output>{checked ? "on" : "off"}</output>
          </>
        );
      }
      const user = userEvent.setup();
      render(<Controlled />);
      expect(screen.getByRole("status")).toHaveTextContent("off");
      await user.click(getSwitch());
      expect(screen.getByRole("status")).toHaveTextContent("on");
    });
  });

  describe("keyboard", () => {
    it("is reachable with Tab, and focus lands on the switch", async () => {
      const user = userEvent.setup();
      render(<Switch>Alerts</Switch>);
      await user.tab();
      expect(getSwitch()).toHaveFocus();
    });

    it("turns on and off with Space", async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();
      render(<Switch onCheckedChange={onCheckedChange}>Alerts</Switch>);
      await user.tab();
      await user.keyboard(" ");
      expect(getSwitch()).toBeChecked();
      await user.keyboard(" ");
      expect(getSwitch()).not.toBeChecked();
      expect(onCheckedChange).toHaveBeenCalledTimes(2);
    });

    // Unlike Checkbox, Enter toggles a switch too (Base UI's behavior, and allowed by the ARIA switch pattern)
    it("turns on and off with Enter, like a button", async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();
      render(<Switch onCheckedChange={onCheckedChange}>Alerts</Switch>);
      await user.tab();
      await user.keyboard("{Enter}");
      expect(getSwitch()).toBeChecked();
      await user.keyboard("{Enter}");
      expect(getSwitch()).not.toBeChecked();
      expect(onCheckedChange).toHaveBeenCalledTimes(2);
    });

    it("moves through several switches in source order", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Switch>One</Switch>
          <Switch>Two</Switch>
        </>,
      );
      await user.tab();
      expect(screen.getByRole("switch", { name: "One" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("switch", { name: "Two" })).toHaveFocus();
    });
  });

  describe("disabled", () => {
    it("blocks clicks on the switch and on the label", async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();
      render(<Switch disabled onCheckedChange={onCheckedChange}>Alerts</Switch>);
      await user.click(getSwitch());
      await user.click(screen.getByText("Alerts"));
      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(getSwitch()).not.toBeChecked();
    });

    it("is marked disabled for assistive technology and styling", () => {
      const { container } = render(<Switch disabled>Alerts</Switch>);
      expect(getSwitch()).toHaveAttribute("aria-disabled", "true");
      expect(getSwitch()).toHaveAttribute("data-disabled");
      expect(getInput(container)).toBeDisabled();
    });

    it("is skipped by Tab", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Switch disabled>Off</Switch>
          <Switch>On</Switch>
        </>,
      );
      await user.tab();
      expect(screen.getByRole("switch", { name: "On" })).toHaveFocus();
    });

    it("ignores Space", async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();
      render(<Switch disabled onCheckedChange={onCheckedChange}>Alerts</Switch>);
      getSwitch().focus();
      await user.keyboard(" ");
      expect(onCheckedChange).not.toHaveBeenCalled();
    });

    it("keeps its on state", () => {
      render(<Switch disabled defaultChecked>Alerts</Switch>);
      expect(getSwitch()).toBeChecked();
    });
  });

  describe("read only", () => {
    it("blocks changes from the switch and from the label", async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();
      render(<Switch readOnly defaultChecked onCheckedChange={onCheckedChange}>Alerts</Switch>);
      expect(getSwitch()).toHaveAttribute("aria-readonly", "true");
      await user.click(getSwitch());
      await user.click(screen.getByText("Alerts"));
      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(getSwitch()).toBeChecked();
    });

    it("blocks changes from the keyboard", async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();
      render(<Switch readOnly onCheckedChange={onCheckedChange}>Alerts</Switch>);
      await user.tab();
      await user.keyboard(" ");
      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(getSwitch()).not.toBeChecked();
    });

    it("stays in the tab order, so its value can be read", async () => {
      const user = userEvent.setup();
      render(<Switch readOnly defaultChecked>Alerts</Switch>);
      await user.tab();
      expect(getSwitch()).toHaveFocus();
    });
  });

  describe("required and invalid", () => {
    // jest-dom's toBeRequired doesn't recognize role="switch", so check the attributes directly
    it("is announced as required, and required by the form", () => {
      const { container } = render(<Switch required>Alerts (required)</Switch>);
      expect(getSwitch()).toHaveAttribute("aria-required", "true");
      expect(getInput(container)).toBeRequired();
    });

    it("is not required by default", () => {
      const { container } = render(<Switch>Alerts</Switch>);
      expect(getSwitch()).toBeInTheDocument();
      expect(getSwitch()).not.toHaveAttribute("aria-required", "true");
      expect(getInput(container)).not.toBeRequired();
    });

    it("is announced as invalid", () => {
      render(<Switch invalid>Alerts</Switch>);
      expect(getSwitch()).toBeInvalid();
      expect(getSwitch()).toHaveAttribute("aria-invalid", "true");
    });

    it("is valid by default", () => {
      render(<Switch>Alerts</Switch>);
      expect(getSwitch()).not.toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("description and error", () => {
    it("links the description to the switch", () => {
      render(<Switch description="About once a month.">Alerts</Switch>);
      expect(getSwitch()).toHaveAccessibleDescription("About once a month.");
    });

    it("keeps the description out of the accessible name", () => {
      render(<Switch description="About once a month.">Alerts</Switch>);
      expect(getSwitch()).toHaveAccessibleName("Alerts");
    });

    it("shows the error, linked to the switch, when invalid", () => {
      render(<Switch invalid error="Turn this on to continue.">Alerts</Switch>);
      expect(screen.getByText("Turn this on to continue.")).toBeInTheDocument();
      expect(getSwitch()).toHaveAccessibleDescription("Turn this on to continue.");
    });

    it("gives the error an icon that is hidden from screen readers", () => {
      render(<Switch invalid error="Turn this on to continue.">Alerts</Switch>);
      const error = screen.getByText("Turn this on to continue.").closest(".switch__error");
      expect(error).toBeInTheDocument();
      expect(error?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });

    it("hides the error when the switch is valid", () => {
      render(<Switch error="Turn this on to continue.">Alerts</Switch>);
      expect(screen.queryByText("Turn this on to continue.")).not.toBeInTheDocument();
      expect(getSwitch()).toHaveAccessibleDescription("");
    });

    it("reads the description and the error together", () => {
      render(
        <Switch invalid description="About once a month." error="Turn this on to continue.">
          Alerts
        </Switch>,
      );
      expect(getSwitch()).toHaveAccessibleDescription("About once a month. Turn this on to continue.");
    });

    it("shows the error again when invalid turns on later", () => {
      const { rerender } = render(<Switch error="Pick one.">Alerts</Switch>);
      expect(screen.queryByText("Pick one.")).not.toBeInTheDocument();
      rerender(<Switch invalid error="Pick one.">Alerts</Switch>);
      expect(screen.getByText("Pick one.")).toBeInTheDocument();
    });

    it("is invalid with no error text without breaking", () => {
      const { container } = render(<Switch invalid>Alerts</Switch>);
      expect(container.querySelector(".switch__error")).toBeNull();
      expect(getSwitch()).toBeInvalid();
    });

    it("renders a description for a switch named by aria-label", () => {
      render(<Switch aria-label="Dark mode" description="Follows your system until you choose" />);
      expect(getSwitch()).toHaveAccessibleName("Dark mode");
      expect(getSwitch()).toHaveAccessibleDescription("Follows your system until you choose");
    });
  });

  describe("in a form", () => {
    function submitted(form: HTMLFormElement) {
      return Object.fromEntries(new FormData(form).entries());
    }
    const getForm = () => screen.getByTestId("form") as HTMLFormElement;

    it("submits `on` under its name when on, with no value", () => {
      render(
        <form data-testid="form">
          <Switch name="alerts" defaultChecked>Alerts</Switch>
        </form>,
      );
      expect(submitted(getForm())).toEqual({ alerts: "on" });
    });

    it("submits its value when on", () => {
      render(
        <form data-testid="form">
          <Switch name="alerts" value="weekly" defaultChecked>Alerts</Switch>
        </form>,
      );
      expect(submitted(getForm())).toEqual({ alerts: "weekly" });
    });

    it("submits nothing when off, like a native checkbox", () => {
      render(
        <form data-testid="form">
          <Switch name="alerts">Alerts</Switch>
        </form>,
      );
      expect(getForm().querySelector("input[name=alerts]")).toBeInTheDocument();
      expect(submitted(getForm())).toEqual({});
    });

    it("submits uncheckedValue when off", () => {
      render(
        <form data-testid="form">
          <Switch name="alerts" value="yes" uncheckedValue="no">Alerts</Switch>
        </form>,
      );
      expect(submitted(getForm())).toEqual({ alerts: "no" });
    });

    it("submits its value, not uncheckedValue, when on", () => {
      render(
        <form data-testid="form">
          <Switch name="alerts" value="yes" uncheckedValue="no" defaultChecked>Alerts</Switch>
        </form>,
      );
      expect(submitted(getForm())).toEqual({ alerts: "yes" });
    });

    it("starts submitting after the user turns it on", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <Switch name="alerts">Alerts</Switch>
        </form>,
      );
      await user.click(getSwitch());
      expect(submitted(getForm())).toEqual({ alerts: "on" });
    });

    it("does not submit when disabled", () => {
      render(
        <form data-testid="form">
          <Switch name="alerts" defaultChecked disabled>Alerts</Switch>
        </form>,
      );
      const input = getForm().querySelector<HTMLInputElement>("input[name=alerts]");
      expect(input).toBeChecked();
      expect(input).toBeDisabled();
      expect(submitted(getForm())).toEqual({});
    });

    it("fails the form's own validation when required and off", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <Switch name="alerts" required>Alerts (required)</Switch>
        </form>,
      );
      expect(getForm().checkValidity()).toBe(false);
      await user.click(getSwitch());
      expect(getForm().checkValidity()).toBe(true);
    });
  });

  describe("id and form", () => {
    it("puts id on the hidden input, not on the visible switch", () => {
      const { container } = render(<Switch id="alerts-input">Alerts</Switch>);
      expect(getInput(container)).toHaveAttribute("id", "alerts-input");
      expect(getSwitch()).not.toHaveAttribute("id", "alerts-input");
    });

    it("can be toggled, but not named, by an outside label pointing at that id", async () => {
      const user = userEvent.setup();
      render(
        <>
          <label htmlFor="alerts-input">Outside label</label>
          <Switch id="alerts-input" aria-label="Inner name" />
        </>,
      );
      await user.click(screen.getByText("Outside label"));
      expect(getSwitch()).toBeChecked();
      expect(getSwitch()).toHaveAccessibleName("Inner name");
    });

    it("submits with a form it sits outside of, through form", () => {
      render(
        <>
          <form id="settings" data-testid="outside-form" />
          <Switch name="alerts" form="settings" defaultChecked>Alerts</Switch>
        </>,
      );
      const form = screen.getByTestId("outside-form") as HTMLFormElement;
      expect(Object.fromEntries(new FormData(form).entries())).toEqual({ alerts: "on" });
    });
  });

  describe("refs", () => {
    it("forwards ref to the switch element", () => {
      const ref = createRef<HTMLElement>();
      render(<Switch ref={ref}>Alerts</Switch>);
      expect(ref.current).toBe(getSwitch());
    });

    it("forwards inputRef to the hidden input", () => {
      const inputRef = createRef<HTMLInputElement>();
      const { container } = render(<Switch inputRef={inputRef}>Alerts</Switch>);
      expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
      expect(inputRef.current).toBe(getInput(container));
    });
  });

  describe("types", () => {
    it("requires visible label content or an aria-label", () => {
      expectTypeOf<{ children: string }>().toExtend<SwitchProps>();
      expectTypeOf<{ "aria-label": string }>().toExtend<SwitchProps>();
      expectTypeOf<object>().not.toExtend<SwitchProps>();
      expectTypeOf<{ description: string }>().not.toExtend<SwitchProps>();
      // Empty label content isn't a name, so it still needs an aria-label
      expectTypeOf<{ children: undefined }>().not.toExtend<SwitchProps>();
      expectTypeOf<{ children: null }>().not.toExtend<SwitchProps>();
      expectTypeOf<{ children: false }>().not.toExtend<SwitchProps>();
      expectTypeOf<{ children: string | undefined }>().not.toExtend<SwitchProps>();
    });

    it("has no mixed state", () => {
      expectTypeOf<SwitchProps>().not.toHaveProperty("indeterminate");
    });

    it("keeps Base UI's render and nativeButton out of the public props", () => {
      expectTypeOf<SwitchProps>().not.toHaveProperty("render");
      expectTypeOf<SwitchProps>().not.toHaveProperty("nativeButton");
      expectTypeOf<SwitchProps["className"]>().toEqualTypeOf<string | undefined>();
    });

    it("reports the new value as a boolean", () => {
      expectTypeOf<SwitchProps["onCheckedChange"]>().parameter(0).toEqualTypeOf<boolean>();
    });

    it("takes string ids", () => {
      expectTypeOf<SwitchProps["id"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<SwitchProps["form"]>().toEqualTypeOf<string | undefined>();
    });

    it("takes string form values", () => {
      expectTypeOf<SwitchProps["value"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<SwitchProps["uncheckedValue"]>().toEqualTypeOf<string | undefined>();
    });
  });
});
