import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import type { ChangeEvent, Ref } from "react";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { takeWarnings } from "@tests/warnings";
import { TextArea } from "@/components/TextArea/TextArea";
import type { TextAreaProps, TextAreaResize, TextAreaSize } from "@/components/TextArea/TextArea";

const getTextArea = () => screen.getByRole("textbox") as HTMLTextAreaElement;

describe("TextArea", () => {
  describe("rendering", () => {
    it("renders a text field named by its label", () => {
      render(<TextArea label="Message" />);
      expect(screen.getByRole("textbox", { name: "Message" })).toBeInTheDocument();
    });

    it("renders a native textarea with its own class", () => {
      render(<TextArea label="Message" />);
      expect(getTextArea().tagName).toBe("TEXTAREA");
      expect(getTextArea()).toHaveClass("text-area__control");
    });

    it("renders the label as a <label> pointing at the textarea", () => {
      render(<TextArea label="Message" />);
      const label = screen.getByText("Message");
      expect(label.tagName).toBe("LABEL");
      expect(label).toHaveClass("text-area__label");
      expect(label).toHaveAttribute("for", getTextArea().id);
    });

    it("defaults to four rows, the md size, and resizing taller", () => {
      const { container } = render(<TextArea label="Message" />);
      expect(getTextArea()).toHaveAttribute("rows", "4");
      expect(container.firstElementChild).toHaveClass("text-area");
      expect(container.firstElementChild).toHaveAttribute("data-size", "md");
      expect(container.firstElementChild).toHaveAttribute("data-resize", "vertical");
    });

    it.each(["md", "lg"] as const)("maps size=%s to data-size on the outer element", (size) => {
      const { container } = render(<TextArea label="Message" size={size} />);
      expect(container.firstElementChild).toHaveAttribute("data-size", size);
    });

    it.each(["vertical", "none"] as const)("maps resize=%s to data-resize on the outer element", (resize) => {
      const { container } = render(<TextArea label="Message" resize={resize} />);
      expect(container.firstElementChild).toHaveAttribute("data-resize", resize);
    });

    it("passes rows to the textarea", () => {
      render(<TextArea label="Message" rows={8} />);
      expect(getTextArea()).toHaveAttribute("rows", "8");
    });

    it("never sets the native size or cols attributes", () => {
      render(<TextArea label="Message" size="lg" />);
      expect(getTextArea()).toHaveAttribute("rows");
      expect(getTextArea()).not.toHaveAttribute("size");
      expect(getTextArea()).not.toHaveAttribute("cols");
    });

    it("can be named by aria-label alone, with no <label> element", () => {
      const { container } = render(<TextArea aria-label="Notes" />);
      expect(screen.getByRole("textbox", { name: "Notes" })).toBeInTheDocument();
      expect(container.querySelector("label")).toBeNull();
    });

    it("puts the description and then the error between the label and the field", () => {
      const { container } = render(<TextArea label="Message" description="Keep it short." invalid error="Write a message." />);
      const parts = ["text-area__label", "text-area__description", "text-area__error", "text-area__control"];
      const order = [...container.querySelectorAll(parts.map((part) => `.${part}`).join(", "))].map((el) =>
        parts.find((part) => el.classList.contains(part)),
      );
      expect(order).toEqual(parts);
    });

    it("puts the shared text field classes next to its own, so text-field.css and field.css draw what Input and TextArea share", () => {
      const { container } = render(<TextArea label="Message" description="Keep it short." />);
      expect(container.firstElementChild).toHaveClass("text-field", "text-area");
      expect(screen.getByText("Message")).toHaveClass("field-label", "text-area__label");
      expect(screen.getByText("Keep it short.")).toHaveClass("field-description", "text-area__description");
      expect(getTextArea()).toHaveClass("text-field__control", "text-area__control");
    });

    it("applies className to the outer wrapper, next to its own class", () => {
      const { container } = render(<TextArea label="Message" className="mt-4" />);
      expect(container.firstElementChild).toHaveClass("text-area", "mt-4");
    });

    it("passes textarea attributes and other props through to the textarea", () => {
      render(
        <TextArea
          label="Address"
          placeholder="Street, town"
          autoComplete="street-address"
          maxLength={200}
          minLength={5}
          spellCheck={false}
          wrap="hard"
          inputMode="text"
          data-testid="address"
        />,
      );
      expect(screen.getByTestId("address")).toBe(getTextArea());
      expect(getTextArea()).toHaveAttribute("placeholder", "Street, town");
      expect(getTextArea()).toHaveAttribute("autocomplete", "street-address");
      expect(getTextArea()).toHaveAttribute("maxlength", "200");
      expect(getTextArea()).toHaveAttribute("minlength", "5");
      expect(getTextArea()).toHaveAttribute("spellcheck", "false");
      expect(getTextArea()).toHaveAttribute("wrap", "hard");
      expect(getTextArea()).toHaveAttribute("inputmode", "text");
    });

    it("never uses modifier classes", () => {
      const { container } = render(
        <TextArea label="Message" size="lg" resize="none" invalid disabled error="Bad" description="More" />,
      );
      expect(getTextArea()).toBeInTheDocument();
      expect(container.innerHTML).not.toMatch(/text-area--/);
    });
  });

  describe("typing and value", () => {
    it("takes typed text when uncontrolled, across lines", async () => {
      const user = userEvent.setup();
      render(<TextArea label="Message" />);
      await user.type(getTextArea(), "Hello{Enter}there");
      expect(getTextArea()).toHaveValue("Hello\nthere");
    });

    it("starts with defaultValue", () => {
      render(<TextArea label="Message" defaultValue={"One\nTwo"} />);
      expect(getTextArea()).toHaveValue("One\nTwo");
    });

    it("calls onValueChange with the new string on every change", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<TextArea label="Message" onValueChange={onValueChange} />);
      await user.type(getTextArea(), "Hi{Enter}");
      expect(onValueChange.mock.calls.map(([value]) => value)).toEqual(["H", "Hi", "Hi\n"]);
    });

    it("still calls a native onChange", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<TextArea label="Message" onChange={onChange} />);
      await user.type(getTextArea(), "A");
      expect(onChange).toHaveBeenCalledOnce();
    });

    it("follows the value prop when controlled, and doesn't change by itself", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(<TextArea label="Message" value="Hi" onValueChange={onValueChange} />);
      await user.type(getTextArea(), "!");
      expect(onValueChange).toHaveBeenCalledWith("Hi!", expect.anything());
      expect(getTextArea()).toHaveValue("Hi");
      rerender(<TextArea label="Message" value="Bye" onValueChange={onValueChange} />);
      expect(getTextArea()).toHaveValue("Bye");
    });

    it("works as a controlled text area driven by state", async () => {
      function Controlled() {
        const [value, setValue] = useState("");
        return (
          <>
            <TextArea label="Message" value={value} onValueChange={setValue} />
            <output>{value.length} characters</output>
          </>
        );
      }
      const user = userEvent.setup();
      render(<Controlled />);
      await user.type(getTextArea(), "Hi{Enter}you");
      expect(getTextArea()).toHaveValue("Hi\nyou");
      expect(screen.getByRole("status")).toHaveTextContent("6 characters");
    });

    it("stops taking text at maxLength", async () => {
      const user = userEvent.setup();
      render(<TextArea label="Message" maxLength={5} />);
      await user.type(getTextArea(), "Hello there");
      expect(getTextArea()).toHaveValue("Hello");
    });

    it("focuses the textarea when the label is clicked", async () => {
      const user = userEvent.setup();
      render(<TextArea label="Message" />);
      await user.click(screen.getByText("Message"));
      expect(getTextArea()).toHaveFocus();
    });
  });

  describe("keyboard", () => {
    it("is reachable with Tab", async () => {
      const user = userEvent.setup();
      render(<TextArea label="Message" />);
      await user.tab();
      expect(getTextArea()).toHaveFocus();
    });

    it("moves on with Tab rather than typing a tab", async () => {
      const user = userEvent.setup();
      render(
        <>
          <TextArea label="First" />
          <TextArea label="Second" />
        </>,
      );
      await user.tab();
      expect(screen.getByRole("textbox", { name: "First" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("textbox", { name: "Second" })).toHaveFocus();
      expect(screen.getByRole("textbox", { name: "First" })).toHaveValue("");
    });

    it("adds a new line with Enter instead of submitting the form", async () => {
      const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
      const user = userEvent.setup();
      render(
        <form onSubmit={onSubmit}>
          <TextArea label="Message" name="message" />
          <button type="submit">Send message</button>
        </form>,
      );
      await user.type(getTextArea(), "Hi{Enter}");
      expect(getTextArea()).toHaveValue("Hi\n");
      expect(onSubmit).not.toHaveBeenCalled();
      await user.click(screen.getByRole("button", { name: "Send message" }));
      expect(onSubmit).toHaveBeenCalledOnce();
    });
  });

  describe("disabled", () => {
    it("blocks typing and is marked disabled", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      const { container } = render(<TextArea label="Message" disabled defaultValue="Hi" onValueChange={onValueChange} />);
      expect(getTextArea()).toBeDisabled();
      expect(getTextArea()).toHaveAttribute("data-disabled");
      // The CSS dims the label, and turns off resizing, from these
      expect(container.firstElementChild).toHaveAttribute("data-disabled");
      expect(screen.getByText("Message")).toHaveAttribute("data-disabled");
      await user.type(getTextArea(), "x");
      expect(getTextArea()).toHaveValue("Hi");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("is skipped by Tab", async () => {
      const user = userEvent.setup();
      render(
        <>
          <TextArea label="Off" disabled />
          <TextArea label="On" />
        </>,
      );
      await user.tab();
      expect(screen.getByRole("textbox", { name: "On" })).toHaveFocus();
    });
  });

  describe("read only", () => {
    it("says \"Read only\" beside the label, hidden from screen readers and left out of the name", () => {
      render(<TextArea label="Notes" readOnly defaultValue="Kept" />);
      const note = screen.getByText("Read only");
      expect(note).toHaveClass("read-only-note");
      expect(note).toHaveAttribute("aria-hidden", "true");
      expect(note.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      expect(note.closest("label")).toHaveTextContent("Notes");
      expect(getTextArea()).toHaveAccessibleName("Notes");
    });

    it("has no note when it isn't read-only, or when it's disabled as well", () => {
      const { rerender } = render(<TextArea label="Notes" defaultValue="Kept" />);
      expect(getTextArea()).toBeInTheDocument();
      expect(screen.queryByText("Read only")).toBeNull();
      rerender(<TextArea label="Notes" readOnly disabled defaultValue="Kept" />);
      expect(getTextArea()).toHaveAttribute("readonly");
      expect(screen.queryByText("Read only")).toBeNull();
    });

    it("blocks typing but keeps its value", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<TextArea label="Notes" readOnly defaultValue="Kept" onValueChange={onValueChange} />);
      expect(getTextArea()).toHaveAttribute("readonly");
      await user.type(getTextArea(), "x");
      expect(getTextArea()).toHaveValue("Kept");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("stays in the tab order, so its text can be read and copied", async () => {
      const user = userEvent.setup();
      render(<TextArea label="Notes" readOnly defaultValue="Kept" />);
      await user.tab();
      expect(getTextArea()).toHaveFocus();
    });
  });

  describe("required and invalid", () => {
    it("is required for assistive technology and the form", () => {
      render(<TextArea label="Message (required)" required />);
      expect(getTextArea()).toBeRequired();
    });

    it("is not required by default", () => {
      render(<TextArea label="Message" />);
      expect(getTextArea()).toBeInTheDocument();
      expect(getTextArea()).not.toBeRequired();
    });

    it("is announced as invalid", () => {
      render(<TextArea label="Message" invalid />);
      expect(getTextArea()).toBeInvalid();
      expect(getTextArea()).toHaveAttribute("aria-invalid", "true");
    });

    it("is valid by default", () => {
      render(<TextArea label="Message" />);
      expect(getTextArea()).toBeInTheDocument();
      expect(getTextArea()).not.toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("description and error", () => {
    it("links the description to the textarea", () => {
      render(<TextArea label="Message" description="Keep it short." />);
      expect(getTextArea()).toHaveAccessibleDescription("Keep it short.");
      expect(screen.getByText("Keep it short.")).toHaveClass("text-area__description");
    });

    it("keeps the description out of the accessible name", () => {
      render(<TextArea label="Message" description="Keep it short." />);
      expect(getTextArea()).toHaveAccessibleName("Message");
    });

    it("shows the error, linked to the textarea, when invalid", () => {
      render(<TextArea label="Message" invalid error="Write a message." />);
      expect(screen.getByText("Write a message.")).toBeInTheDocument();
      expect(getTextArea()).toHaveAccessibleDescription("Error: Write a message.");
    });

    it("gives the error an icon that is hidden from screen readers", () => {
      render(<TextArea label="Message" invalid error="Write a message." />);
      const error = screen.getByText("Write a message.").closest(".text-area__error");
      expect(error).toBeInTheDocument();
      expect(error?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });

    it("hides the error when the textarea is valid", () => {
      render(<TextArea label="Message" error="Write a message." />);
      expect(getTextArea()).toBeInTheDocument();
      expect(screen.queryByText("Write a message.")).not.toBeInTheDocument();
      expect(getTextArea()).toHaveAccessibleDescription("");
    });

    it("reads the description and the error together", () => {
      render(<TextArea label="Message" invalid description="Keep it short." error="Write a message." />);
      expect(getTextArea()).toHaveAccessibleDescription("Keep it short. Error: Write a message.");
    });

    it("shows the error again when invalid turns on later", () => {
      const { rerender } = render(<TextArea label="Message" error="Write a message." />);
      expect(screen.queryByText("Write a message.")).not.toBeInTheDocument();
      rerender(<TextArea label="Message" invalid error="Write a message." />);
      expect(screen.getByText("Write a message.")).toBeInTheDocument();
    });

    it("is invalid with no error text without breaking", () => {
      const { container } = render(<TextArea label="Message" invalid />);
      expect(container.querySelector(".text-area__error")).toBeNull();
      expect(getTextArea()).toBeInvalid();
    });

    it("keeps its own description and error linked when given an aria-describedby", () => {
      render(
        <>
          <p id="hint">Markdown works.</p>
          <TextArea label="Message" description="Keep it short." invalid error="Write a message." aria-describedby="hint" />
        </>,
      );
      expect(getTextArea()).toHaveAccessibleDescription("Markdown works. Keep it short. Error: Write a message.");
      expect(getTextArea()).toHaveAttribute("aria-invalid", "true");
    });

    it("renders a description for a text area named by aria-label", () => {
      render(<TextArea aria-label="Notes" description="Only you can see these." />);
      expect(getTextArea()).toHaveAccessibleName("Notes");
      expect(getTextArea()).toHaveAccessibleDescription("Only you can see these.");
    });
  });

  describe("in a form", () => {
    const submitted = (form: HTMLFormElement) => Object.fromEntries(new FormData(form).entries());
    const getForm = () => screen.getByTestId("form") as HTMLFormElement;

    it("submits what was typed under its name, line breaks included", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <TextArea label="Message" name="message" />
        </form>,
      );
      await user.type(getTextArea(), "Hello{Enter}there");
      expect(submitted(getForm())).toEqual({ message: "Hello\nthere" });
    });

    it("submits its defaultValue untouched", () => {
      render(
        <form data-testid="form">
          <TextArea label="Message" name="message" defaultValue="Hi" />
        </form>,
      );
      expect(submitted(getForm())).toEqual({ message: "Hi" });
    });

    it("submits a read-only value", () => {
      render(
        <form data-testid="form">
          <TextArea label="Notes" name="notes" readOnly defaultValue="Kept" />
        </form>,
      );
      expect(submitted(getForm())).toEqual({ notes: "Kept" });
    });

    it("does not submit when disabled", () => {
      render(
        <form data-testid="form">
          <TextArea label="Message" name="message" defaultValue="Hi" disabled />
        </form>,
      );
      expect(getTextArea()).toHaveValue("Hi");
      expect(getTextArea()).toBeDisabled();
      expect(submitted(getForm())).toEqual({});
    });

    it("fails the form's own validation when required and empty", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <TextArea label="Message (required)" name="message" required />
        </form>,
      );
      expect(getForm().checkValidity()).toBe(false);
      await user.type(getTextArea(), "Hi");
      expect(getForm().checkValidity()).toBe(true);
    });
  });

  describe("id and form", () => {
    it("puts id on the textarea, and the label points to it", () => {
      render(<TextArea label="Message" id="message" />);
      expect(getTextArea()).toHaveAttribute("id", "message");
      expect(screen.getByText("Message")).toHaveAttribute("for", "message");
    });

    it("can be labelled by an outside <label htmlFor>, because id is on the textarea", () => {
      render(
        <>
          <label htmlFor="notes-field">Outside label</label>
          <TextArea id="notes-field" aria-label="Inner name" />
        </>,
      );
      expect(screen.getByLabelText("Outside label")).toBe(getTextArea());
    });

    it("submits with a form it sits outside of, through form", () => {
      render(
        <>
          <form id="contact" data-testid="outside-form" />
          <TextArea label="Message" name="message" form="contact" defaultValue="Hi" />
        </>,
      );
      const form = screen.getByTestId("outside-form") as HTMLFormElement;
      expect(Object.fromEntries(new FormData(form).entries())).toEqual({ message: "Hi" });
    });
  });

  describe("refs", () => {
    it("forwards ref to the textarea element", () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<TextArea label="Message" ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
      expect(ref.current).toBe(getTextArea());
    });

    it("lets the ref focus and select the text", () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<TextArea label="Message" ref={ref} defaultValue="Hi you" />);
      ref.current?.focus();
      ref.current?.select();
      expect(getTextArea()).toHaveFocus();
      expect(ref.current?.selectionStart).toBe(0);
      expect(ref.current?.selectionEnd).toBe(6);
    });
  });

  describe("types", () => {
    it("requires a visible label or an aria-label", () => {
      expectTypeOf<{ label: string }>().toExtend<TextAreaProps>();
      expectTypeOf<{ "aria-label": string }>().toExtend<TextAreaProps>();
      expectTypeOf<object>().not.toExtend<TextAreaProps>();
      expectTypeOf<{ description: string }>().not.toExtend<TextAreaProps>();
      // Empty label content isn't a name, so it still needs an aria-label
      expectTypeOf<{ label: undefined }>().not.toExtend<TextAreaProps>();
      expectTypeOf<{ label: null }>().not.toExtend<TextAreaProps>();
      expectTypeOf<{ label: string | undefined }>().not.toExtend<TextAreaProps>();
    });

    it("takes no children, since its text is its value", () => {
      expectTypeOf<TextAreaProps>().not.toHaveProperty("children");
    });

    it("takes the textarea's own attributes, not an input's, and no width in columns", () => {
      expectTypeOf<{ label: string; rows: number; wrap: "hard"; maxLength: number }>().toExtend<TextAreaProps>();
      expectTypeOf<TextAreaProps>().not.toHaveProperty("type");
      expectTypeOf<TextAreaProps>().not.toHaveProperty("pattern");
      expectTypeOf<TextAreaProps>().not.toHaveProperty("cols");
      expectTypeOf<NonNullable<TextAreaProps["onChange"]>>().parameter(0).toEqualTypeOf<ChangeEvent<HTMLTextAreaElement>>();
    });

    it("only accepts the two sizes and the two resize settings", () => {
      expectTypeOf<TextAreaProps["size"]>().toEqualTypeOf<TextAreaSize | undefined>();
      expectTypeOf<TextAreaSize>().toEqualTypeOf<"md" | "lg">();
      expectTypeOf<TextAreaProps["resize"]>().toEqualTypeOf<TextAreaResize | undefined>();
      expectTypeOf<TextAreaResize>().toEqualTypeOf<"vertical" | "none">();
      expectTypeOf<TextAreaProps["rows"]>().toEqualTypeOf<number | undefined>();
    });

    it("takes string values and reports strings", () => {
      expectTypeOf<TextAreaProps["value"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<TextAreaProps["defaultValue"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<TextAreaProps["onValueChange"]>().parameter(0).toEqualTypeOf<string>();
    });

    it("keeps Base UI's render out of the public props, and types the ref as a textarea", () => {
      expectTypeOf<TextAreaProps>().not.toHaveProperty("render");
      expectTypeOf<TextAreaProps["className"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<TextAreaProps["ref"]>().toEqualTypeOf<Ref<HTMLTextAreaElement> | undefined>();
    });
  });

  describe("dev warnings", () => {
    it("warns when the label is empty and there's no aria-label", () => {
      render(<TextArea label="" />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(takeWarnings()).toEqual(["[design-system] TextArea: has no accessible name, so screen readers announce it without one. Give it a label or an aria-label."]);
    });
  });
});
