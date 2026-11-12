import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SpinnerGraphic } from "@/internal/SpinnerGraphic";

describe("SpinnerGraphic", () => {
  it("draws a faint track and an arc in the text color", () => {
    const { container } = render(<SpinnerGraphic />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("spinner-graphic");
    expect(svg?.querySelector("circle")).toHaveAttribute("stroke", "currentColor");
    expect(svg?.querySelector("circle")).toHaveAttribute("opacity", "0.25");
    expect(svg?.querySelector("path")).toHaveAttribute("stroke", "currentColor");
  });

  it("is hidden from screen readers and can't take focus", () => {
    const { container } = render(<SpinnerGraphic />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
  });

  it("adds the part's own class after the shared one", () => {
    const { container } = render(<SpinnerGraphic className="button__spinner" />);
    expect(container.querySelector("svg")?.getAttribute("class")).toBe("spinner-graphic button__spinner");
  });
});
