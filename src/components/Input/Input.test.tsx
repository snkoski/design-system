import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import type { ReactNode, Ref } from "react";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { takeWarnings } from "@tests/warnings";
import { Input } from "@/components/Input/Input";
import type { InputProps, InputSize, InputType } from "@/components/Input/Input";

const getInput = () => screen.getByRole("textbox");
const getBox = (container: HTMLElement) => container.querySelector<HTMLElement>(".input__box")!;
const Icon = ({ id }: { id: string }) => <svg data-testid={id} />;

describe("Input", () => {
  describe("rendering", () => {
    it("renders a text field named by its label", () => {
      render(<Input label="Full name" />);
      expect(screen.getByRole("textbox", { name: "Full name" })).toBeInTheDocument();
    });

    it("renders a native input with its own class, inside the box", () => {
      const { container } = render(<Input label="Full name" />);
      expect(getInput().tagName).toBe("INPUT");
      expect(getInput()).toHaveClass("input__control");
      expect(getBox(container)).toContainElement(getInput());
    });

    it("renders the label as a <label> pointing at the input", () => {
      render(<Input label="Full name" />);
      const label = screen.getByText("Full name");
      expect(label.tagName).toBe("LABEL");
      expect(label).toHaveClass("input__label");
      expect(label).toHaveAttribute("for", getInput().id);
    });

    it("defaults to type text and the md size", () => {
      const { container } = render(<Input label="Full name" />);
      expect(getInput()).toHaveAttribute("type", "text");
      expect(container.firstElementChild).toHaveClass("input");
      expect(container.firstElementChild).toHaveAttribute("data-size", "md");
    });

    it.each(["md", "lg"] as const)("maps size=%s to data-size on the outer element", (size) => {
      const { container } = render(<Input label="Full name" size={size} />);
      expect(container.firstElementChild).toHaveClass("input");
      expect(container.firstElementChild).toHaveAttribute("data-size", size);
    });

    it("never sets the native size attribute", () => {
      render(<Input label="Full name" size="lg" />);
      expect(getInput()).not.toHaveAttribute("size");
    });

    it.each(["text", "email", "tel", "url"] as const)("renders type=%s as a text field", (type) => {
      render(<Input label="Field" type={type} />);
      expect(getInput()).toHaveAttribute("type", type);
    });

    it("renders type=search as a search box", () => {
      render(<Input label="Search projects" type="search" />);
      expect(screen.getByRole("searchbox", { name: "Search projects" })).toHaveAttribute("type", "search");
    });

    it("renders type=password, which has no role, findable by its label", () => {
      render(<Input label="Password" type="password" />);
      expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    });

    it("can be named by aria-label alone, with no <label> element", () => {
      const { container } = render(<Input aria-label="Search" />);
      expect(screen.getByRole("textbox", { name: "Search" })).toBeInTheDocument();
      expect(container.querySelector("label")).toBeNull();
    });

    it("puts the description and then the error between the label and the box", () => {
      const { container } = render(<Input label="Email" description="We never share it." invalid error="Enter an email." />);
      const parts = ["input__label", "input__description", "input__error", "input__box"];
      const order = [...container.querySelectorAll(parts.map((part) => `.${part}`).join(", "))].map((el) =>
        parts.find((part) => el.classList.contains(part)),
      );
      expect(order).toEqual(parts);
    });

    it("puts the shared text field classes next to its own, so text-field.css and field.css draw what Input and TextArea share", () => {
      const { container } = render(<Input label="Email" description="We reply within a day." />);
      expect(container.firstElementChild).toHaveClass("text-field", "input");
      expect(screen.getByText("Email")).toHaveClass("field-label", "input__label");
      expect(screen.getByText("We reply within a day.")).toHaveClass("field-description", "input__description");
      expect(getInput()).toHaveClass("text-field__control", "input__control");
    });

    it("applies className to the outer wrapper, next to its own class", () => {
      const { container } = render(<Input label="Full name" className="mt-4" />);
      expect(container.firstElementChild).toHaveClass("input", "mt-4");
    });

    it("passes autoComplete and inputMode to the input", () => {
      render(<Input label="Phone" autoComplete="tel" inputMode="tel" />);
      expect(getInput()).toHaveAttribute("autocomplete", "tel");
      expect(getInput()).toHaveAttribute("inputmode", "tel");
    });

    it("passes other props through to the input", () => {
      render(
        <Input label="Email" placeholder="you@example.com" autoComplete="email" inputMode="email" data-testid="email" />,
      );
      expect(screen.getByTestId("email")).toBe(getInput());
      expect(getInput()).toHaveAttribute("placeholder", "you@example.com");
      expect(getInput()).toHaveAttribute("autocomplete", "email");
      expect(getInput()).toHaveAttribute("inputmode", "email");
    });

    it("never uses modifier classes", () => {
      const { container } = render(
        <Input label="Email" size="lg" invalid disabled error="Bad" description="More" iconStart={<Icon id="s" />} />,
      );
      expect(getBox(container)).toBeInTheDocument();
      expect(container.innerHTML).not.toMatch(/input--/);
    });
  });

  describe("icons", () => {
    it("renders a start and an end icon, hidden from screen readers", () => {
      render(<Input label="Search" iconStart={<Icon id="start" />} iconEnd={<Icon id="end" />} />);
      for (const id of ["start", "end"]) {
        const wrapper = screen.getByTestId(id).parentElement;
        expect(wrapper).toHaveClass("input__icon");
        expect(wrapper).toHaveAttribute("aria-hidden", "true");
      }
    });

    it("marks the box so the input makes room for each icon", () => {
      const { container } = render(<Input label="Search" iconStart={<Icon id="start" />} iconEnd={<Icon id="end" />} />);
      expect(getBox(container)).toHaveAttribute("data-icon-start");
      expect(getBox(container)).toHaveAttribute("data-icon-end");
    });

    it("leaves the box unmarked with no icons", () => {
      const { container } = render(<Input label="Search" />);
      expect(getBox(container)).toBeInTheDocument();
      expect(getBox(container)).not.toHaveAttribute("data-icon-start");
      expect(getBox(container)).not.toHaveAttribute("data-icon-end");
    });

    it("hides even a named icon from screen readers, and keeps it out of the input's name", () => {
      render(<Input label="Search" iconStart={<svg role="img" aria-label="magnifier" />} />);
      expect(screen.getByRole("img", { name: "magnifier", hidden: true })).toBeInTheDocument();
      expect(screen.queryByRole("img", { name: "magnifier" })).toBeNull();
      expect(getInput()).toHaveAccessibleName("Search");
    });

    // Clicks passing through an icon to the input need real CSS and layout, so the WithIcons story
    // tests that in Chromium with a hit-test; jsdom has neither.
  });

  describe("typing and value", () => {
    it("takes typed text when uncontrolled", async () => {
      const user = userEvent.setup();
      render(<Input label="Full name" />);
      await user.type(getInput(), "Ada");
      expect(getInput()).toHaveValue("Ada");
    });

    it("starts with defaultValue", () => {
      render(<Input label="Full name" defaultValue="Ada" />);
      expect(getInput()).toHaveValue("Ada");
    });

    it("calls onValueChange with the new string on every change", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Input label="Full name" onValueChange={onValueChange} />);
      await user.type(getInput(), "Ada");
      expect(onValueChange.mock.calls.map(([value]) => value)).toEqual(["A", "Ad", "Ada"]);
    });

    it("still calls a native onChange", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<Input label="Full name" onChange={onChange} />);
      await user.type(getInput(), "A");
      expect(onChange).toHaveBeenCalledOnce();
    });

    it("follows the value prop when controlled, and doesn't change by itself", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(<Input label="Full name" value="Ada" onValueChange={onValueChange} />);
      await user.type(getInput(), "m");
      expect(onValueChange).toHaveBeenCalledWith("Adam", expect.anything());
      expect(getInput()).toHaveValue("Ada");
      rerender(<Input label="Full name" value="Grace" onValueChange={onValueChange} />);
      expect(getInput()).toHaveValue("Grace");
    });

    it("works as a controlled input driven by state", async () => {
      function Controlled() {
        const [value, setValue] = useState("");
        return (
          <>
            <Input label="Full name" value={value} onValueChange={setValue} />
            <output>{value.length} characters</output>
          </>
        );
      }
      const user = userEvent.setup();
      render(<Controlled />);
      await user.type(getInput(), "Ada");
      expect(getInput()).toHaveValue("Ada");
      expect(screen.getByRole("status")).toHaveTextContent("3 characters");
    });

    it("focuses the input when the label is clicked", async () => {
      const user = userEvent.setup();
      render(<Input label="Full name" />);
      await user.click(screen.getByText("Full name"));
      expect(getInput()).toHaveFocus();
    });
  });

  describe("keyboard", () => {
    it("is reachable with Tab", async () => {
      const user = userEvent.setup();
      render(<Input label="Full name" />);
      await user.tab();
      expect(getInput()).toHaveFocus();
    });

    it("moves through several inputs in source order", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Input label="First" />
          <Input label="Second" />
        </>,
      );
      await user.tab();
      expect(screen.getByRole("textbox", { name: "First" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("textbox", { name: "Second" })).toHaveFocus();
    });

    it("submits the surrounding form with Enter", async () => {
      const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
      const user = userEvent.setup();
      render(
        <form onSubmit={onSubmit}>
          <Input label="Search" name="q" />
          <button type="submit">Search</button>
        </form>,
      );
      await user.type(getInput(), "cats{Enter}");
      expect(onSubmit).toHaveBeenCalledOnce();
    });
  });

  describe("disabled", () => {
    it("blocks typing and is marked disabled", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      const { container } = render(<Input label="Full name" disabled defaultValue="Ada" onValueChange={onValueChange} />);
      expect(getInput()).toBeDisabled();
      expect(getInput()).toHaveAttribute("data-disabled");
      // The CSS dims the label from these
      expect(container.firstElementChild).toHaveAttribute("data-disabled");
      expect(screen.getByText("Full name")).toHaveAttribute("data-disabled");
      await user.type(getInput(), "x");
      expect(getInput()).toHaveValue("Ada");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("is skipped by Tab", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Input label="Off" disabled />
          <Input label="On" />
        </>,
      );
      await user.tab();
      expect(screen.getByRole("textbox", { name: "On" })).toHaveFocus();
    });
  });

  describe("read only", () => {
    it("says \"Read only\" beside the label, hidden from screen readers and left out of the name", () => {
      render(<Input label="Username" readOnly defaultValue="ada" />);
      const note = screen.getByText("Read only");
      expect(note).toHaveClass("read-only-note");
      expect(note).toHaveAttribute("aria-hidden", "true");
      expect(note.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      expect(note.closest("label")).toHaveTextContent("Username");
      expect(getInput()).toHaveAccessibleName("Username");
    });

    it("has no note when it isn't read-only, or when it's disabled as well", () => {
      const { rerender } = render(<Input label="Username" defaultValue="ada" />);
      expect(getInput()).toBeInTheDocument();
      expect(screen.queryByText("Read only")).toBeNull();
      rerender(<Input label="Username" readOnly disabled defaultValue="ada" />);
      expect(getInput()).toHaveAttribute("readonly");
      expect(screen.queryByText("Read only")).toBeNull();
    });

    it("blocks typing but keeps its value", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Input label="Username" readOnly defaultValue="ada" onValueChange={onValueChange} />);
      expect(getInput()).toHaveAttribute("readonly");
      await user.type(getInput(), "x");
      expect(getInput()).toHaveValue("ada");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("stays in the tab order, so its value can be read and copied", async () => {
      const user = userEvent.setup();
      render(<Input label="Username" readOnly defaultValue="ada" />);
      await user.tab();
      expect(getInput()).toHaveFocus();
    });
  });

  describe("required and invalid", () => {
    it("is required for assistive technology and the form", () => {
      render(<Input label="Email (required)" required />);
      expect(getInput()).toBeRequired();
    });

    it("is not required by default", () => {
      render(<Input label="Email" />);
      expect(getInput()).toBeInTheDocument();
      expect(getInput()).not.toBeRequired();
    });

    it("is announced as invalid", () => {
      render(<Input label="Email" invalid />);
      expect(getInput()).toBeInvalid();
      expect(getInput()).toHaveAttribute("aria-invalid", "true");
    });

    it("is valid by default", () => {
      render(<Input label="Email" />);
      expect(getInput()).toBeInTheDocument();
      expect(getInput()).not.toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("description and error", () => {
    it("links the description to the input", () => {
      render(<Input label="Email" description="We never share it." />);
      expect(getInput()).toHaveAccessibleDescription("We never share it.");
      expect(screen.getByText("We never share it.")).toHaveClass("input__description");
    });

    it("keeps the description out of the accessible name", () => {
      render(<Input label="Email" description="We never share it." />);
      expect(getInput()).toHaveAccessibleName("Email");
    });

    it("shows the error, linked to the input, when invalid", () => {
      render(<Input label="Email" invalid error="Enter an email address." />);
      expect(screen.getByText("Enter an email address.")).toBeInTheDocument();
      expect(getInput()).toHaveAccessibleDescription("Error: Enter an email address.");
    });

    it("gives the error an icon that is hidden from screen readers", () => {
      render(<Input label="Email" invalid error="Enter an email address." />);
      const error = screen.getByText("Enter an email address.").closest(".input__error");
      expect(error).toBeInTheDocument();
      expect(error?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });

    it("hides the error when the input is valid", () => {
      render(<Input label="Email" error="Enter an email address." />);
      expect(getInput()).toBeInTheDocument();
      expect(screen.queryByText("Enter an email address.")).not.toBeInTheDocument();
      expect(getInput()).toHaveAccessibleDescription("");
    });

    it("reads the description and the error together", () => {
      render(<Input label="Email" invalid description="We never share it." error="Enter an email address." />);
      expect(getInput()).toHaveAccessibleDescription("We never share it. Error: Enter an email address.");
    });

    it("shows the error again when invalid turns on later", () => {
      const { rerender } = render(<Input label="Email" error="Enter an email address." />);
      expect(screen.queryByText("Enter an email address.")).not.toBeInTheDocument();
      rerender(<Input label="Email" invalid error="Enter an email address." />);
      expect(screen.getByText("Enter an email address.")).toBeInTheDocument();
    });

    it("is invalid with no error text without breaking", () => {
      const { container } = render(<Input label="Email" invalid />);
      expect(container.querySelector(".input__error")).toBeNull();
      expect(getInput()).toBeInvalid();
    });

    it("renders a description for an input named by aria-label", () => {
      render(<Input aria-label="Search" description="Search titles and tags" />);
      expect(getInput()).toHaveAccessibleName("Search");
      expect(getInput()).toHaveAccessibleDescription("Search titles and tags");
    });
  });

  describe("in a form", () => {
    const submitted = (form: HTMLFormElement) => Object.fromEntries(new FormData(form).entries());
    const getForm = () => screen.getByTestId("form") as HTMLFormElement;

    it("submits what was typed under its name", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <Input label="Full name" name="fullName" />
        </form>,
      );
      await user.type(getInput(), "Ada Lovelace");
      expect(submitted(getForm())).toEqual({ fullName: "Ada Lovelace" });
    });

    it("submits its defaultValue untouched", () => {
      render(
        <form data-testid="form">
          <Input label="Full name" name="fullName" defaultValue="Ada" />
        </form>,
      );
      expect(submitted(getForm())).toEqual({ fullName: "Ada" });
    });

    it("submits a read-only value", () => {
      render(
        <form data-testid="form">
          <Input label="Username" name="username" readOnly defaultValue="ada" />
        </form>,
      );
      expect(submitted(getForm())).toEqual({ username: "ada" });
    });

    it("does not submit when disabled", () => {
      render(
        <form data-testid="form">
          <Input label="Full name" name="fullName" defaultValue="Ada" disabled />
        </form>,
      );
      expect(getInput()).toHaveValue("Ada");
      expect(getInput()).toBeDisabled();
      expect(submitted(getForm())).toEqual({});
    });

    it("fails the form's own validation when required and empty", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <Input label="Full name (required)" name="fullName" required />
        </form>,
      );
      expect(getForm().checkValidity()).toBe(false);
      await user.type(getInput(), "Ada");
      expect(getForm().checkValidity()).toBe(true);
    });

    it("uses the browser's email check for type=email", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <Input label="Email" name="email" type="email" />
        </form>,
      );
      await user.type(getInput(), "not an email");
      expect(getForm().checkValidity()).toBe(false);
      await user.clear(getInput());
      await user.type(getInput(), "ada@example.com");
      expect(getForm().checkValidity()).toBe(true);
    });
  });

  describe("id and form", () => {
    it("puts id on the input, and the label points to it", () => {
      render(<Input label="Full name" id="full-name" />);
      expect(getInput()).toHaveAttribute("id", "full-name");
      expect(screen.getByText("Full name")).toHaveAttribute("for", "full-name");
    });

    it("can be labelled by an outside <label htmlFor>, because id is on the input", () => {
      render(
        <>
          <label htmlFor="search-field">Outside label</label>
          <Input id="search-field" aria-label="Inner name" />
        </>,
      );
      expect(screen.getByLabelText("Outside label")).toBe(getInput());
    });

    it("submits with a form it sits outside of, through form", () => {
      render(
        <>
          <form id="profile" data-testid="outside-form" />
          <Input label="Full name" name="fullName" form="profile" defaultValue="Ada" />
        </>,
      );
      const form = screen.getByTestId("outside-form") as HTMLFormElement;
      expect(Object.fromEntries(new FormData(form).entries())).toEqual({ fullName: "Ada" });
    });
  });

  describe("refs", () => {
    it("forwards ref to the input element", () => {
      const ref = createRef<HTMLInputElement>();
      render(<Input label="Full name" ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current).toBe(getInput());
    });

    it("lets the ref focus and select the text", () => {
      const ref = createRef<HTMLInputElement>();
      render(<Input label="Full name" ref={ref} defaultValue="Ada" />);
      ref.current?.focus();
      ref.current?.select();
      expect(getInput()).toHaveFocus();
      expect(ref.current?.selectionStart).toBe(0);
      expect(ref.current?.selectionEnd).toBe(3);
    });
  });

  describe("types", () => {
    it("requires a visible label or an aria-label", () => {
      expectTypeOf<{ label: string }>().toExtend<InputProps>();
      expectTypeOf<{ "aria-label": string }>().toExtend<InputProps>();
      expectTypeOf<object>().not.toExtend<InputProps>();
      expectTypeOf<{ description: string }>().not.toExtend<InputProps>();
      // Empty label content isn't a name, so it still needs an aria-label
      expectTypeOf<{ label: undefined }>().not.toExtend<InputProps>();
      expectTypeOf<{ label: null }>().not.toExtend<InputProps>();
      expectTypeOf<{ label: string | undefined }>().not.toExtend<InputProps>();
    });

    it("takes no children, since an input has none", () => {
      expectTypeOf<InputProps>().not.toHaveProperty("children");
    });

    it("only accepts text-like types and the two sizes", () => {
      expectTypeOf<InputProps["type"]>().toEqualTypeOf<InputType | undefined>();
      expectTypeOf<InputType>().toEqualTypeOf<"text" | "email" | "password" | "search" | "tel" | "url">();
      expectTypeOf<InputProps["size"]>().toEqualTypeOf<InputSize | undefined>();
      expectTypeOf<InputSize>().toEqualTypeOf<"md" | "lg">();
    });

    it("takes string values and reports strings", () => {
      expectTypeOf<InputProps["value"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<InputProps["defaultValue"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<InputProps["onValueChange"]>().parameter(0).toEqualTypeOf<string>();
    });

    it("keeps Base UI's render out of the public props, and types the ref as an input", () => {
      expectTypeOf<InputProps>().not.toHaveProperty("render");
      expectTypeOf<InputProps["className"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<InputProps["ref"]>().toEqualTypeOf<Ref<HTMLInputElement> | undefined>();
      expectTypeOf<InputProps["iconStart"]>().toEqualTypeOf<ReactNode>();
    });
  });

  describe("dev warnings", () => {
    it("warns when the label is empty and there's no aria-label", () => {
      render(<Input label="" />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(takeWarnings()).toEqual(["[design-system] Input: has no accessible name, so screen readers announce it without one. Give it a label or an aria-label."]);
    });
  });
});
