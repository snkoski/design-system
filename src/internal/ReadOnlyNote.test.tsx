import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReadOnlyNote } from "@/internal/ReadOnlyNote";

describe("ReadOnlyNote", () => {
  it("says \"Read only\" in words", () => {
    render(<ReadOnlyNote />);
    expect(screen.getByText("Read only")).toHaveClass("read-only-note");
  });

  it("is hidden from screen readers, which announce the control as read only already", () => {
    const { container } = render(<ReadOnlyNote />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("puts a lock before the words, hidden from screen readers and from keyboard focus", () => {
    render(<ReadOnlyNote />);
    const icon = screen.getByText("Read only").firstElementChild;
    expect(icon?.tagName.toLowerCase()).toBe("svg");
    expect(icon).toHaveClass("read-only-note__icon");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("focusable", "false");
  });

  it("draws the icon as a padlock: a body and a shackle", () => {
    render(<ReadOnlyNote />);
    const icon = screen.getByText("Read only").firstElementChild!;
    expect(icon.querySelector("rect")).toHaveAttribute("y", "11");
    expect(icon.querySelector("path")).toHaveAttribute("d", "M7 11V7a5 5 0 0 1 10 0v4");
  });

  it("is left out of the name of a label it sits in", () => {
    render(
      <label>
        Username
        <ReadOnlyNote />
        <input readOnly />
      </label>,
    );
    expect(screen.getByRole("textbox")).toHaveAccessibleName("Username");
  });

  it("adds className next to its own class", () => {
    render(<ReadOnlyNote className="extra" />);
    expect(screen.getByText("Read only")).toHaveClass("read-only-note", "extra");
  });
});
