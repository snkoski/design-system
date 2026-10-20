import { Field } from "@base-ui/react/field";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FieldError } from "./FieldError";

function Email({ invalid, className }: { invalid?: boolean; className?: string }) {
  return (
    <Field.Root invalid={invalid}>
      <Field.Control aria-label="Email" />
      <FieldError className={className} match={invalid}>
        Enter an email address.
      </FieldError>
    </Field.Root>
  );
}

describe("FieldError", () => {
  it("shows the message when match is true", () => {
    render(<Email invalid />);
    expect(screen.getByText("Enter an email address.")).toBeInTheDocument();
  });

  it("links the message to the field's control", () => {
    render(<Email invalid />);
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAccessibleDescription("Enter an email address.");
  });

  it("puts an icon before the words, hidden from screen readers", () => {
    render(<Email invalid />);
    const error = screen.getByText("Enter an email address.").closest(".field-error");
    const icon = error?.firstElementChild;
    expect(icon?.tagName.toLowerCase()).toBe("svg");
    expect(icon).toHaveClass("field-error__icon");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("focusable", "false");
  });

  it("adds the component's own class next to field-error", () => {
    render(<Email invalid className="checkbox__error" />);
    expect(screen.getByText("Enter an email address.").closest(".field-error")).toHaveClass("field-error", "checkbox__error");
  });

  it("hides the message when match is false, and links nothing", () => {
    render(<Email invalid={false} />);
    const control = screen.getByRole("textbox", { name: "Email" });
    expect(screen.queryByText("Enter an email address.")).not.toBeInTheDocument();
    expect(control).toHaveAccessibleDescription("");
  });
});
