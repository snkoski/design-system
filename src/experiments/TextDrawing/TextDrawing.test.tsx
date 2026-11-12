import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { forgetPointer } from "@/experiments/Proximity/tracker";
import { parseDrawing } from "@/experiments/TextDrawing/drawing";
import { HEART, TextDrawing } from "@/experiments/TextDrawing/TextDrawing";

afterEach(forgetPointer);

const picture = () => screen.getByRole("img");
const cells = (kind: string) => picture().querySelectorAll<HTMLElement>(`[data-kind="${kind}"]`);
const at = (row: number, column: number) =>
  [...picture().querySelectorAll<HTMLElement>(".text-drawing__cell")].find(
    (cell) => cell.style.gridRow === String(row + 1) && cell.style.gridColumn === String(column + 1),
  );

describe("parseDrawing", () => {
  it("gives each character its row and column, and what it draws", () => {
    expect(parseDrawing("=-\n.=")).toEqual({
      rows: 2,
      columns: 2,
      cells: [
        { character: "=", kind: "glow", row: 0, column: 0 },
        { character: "-", kind: "still", row: 0, column: 1 },
        { character: ".", kind: "gap", row: 1, column: 0 },
        { character: "=", kind: "glow", row: 1, column: 1 },
      ],
    });
  });

  it("is as wide as the longest line", () => {
    expect(parseDrawing("=\n===\n==")).toMatchObject({ rows: 3, columns: 3 });
  });

  it("marks a space, and any other character it doesn't know, as unknown rather than a gap", () => {
    expect(parseDrawing("= x").cells.map((cell) => cell.kind)).toEqual(["glow", "unknown", "unknown"]);
  });

  it("takes Windows line endings", () => {
    expect(parseDrawing("==\r\n--")).toMatchObject({ rows: 2, columns: 2 });
  });

  it("is empty for no text", () => {
    expect(parseDrawing("")).toEqual({ rows: 1, columns: 0, cells: [] });
  });
});

describe("TextDrawing", () => {
  it("starts with the heart in the text area and in the picture", () => {
    render(<TextDrawing />);
    expect(screen.getByRole("textbox", { name: "Drawing" })).toHaveValue(HEART);
    expect(cells("glow")).toHaveLength(59);
    expect(cells("still")).toHaveLength(44);
    expect(picture()).toHaveAccessibleName("A drawing 13 cells wide and 11 tall: 59 that change color near the mouse, and 44 that stay still");
  });

  it("puts each cell in the row and column it was typed in, leaving gaps empty", () => {
    render(<TextDrawing defaultText={"=-\n.="} />);
    expect(at(0, 0)).toHaveAttribute("data-kind", "glow");
    expect(at(0, 1)).toHaveAttribute("data-kind", "still");
    expect(at(1, 1)).toHaveAttribute("data-kind", "glow");
    expect(at(1, 0)).toBeUndefined();
    expect(picture().style.gridTemplateColumns).toBe("repeat(2, var(--text-drawing-cell))");
    expect(picture().style.gridTemplateRows).toBe("repeat(2, var(--text-drawing-cell))");
  });

  it("redraws as you type", async () => {
    const user = userEvent.setup();
    render(<TextDrawing defaultText="=" />);
    expect(cells("glow")).toHaveLength(1);
    await user.type(screen.getByRole("textbox", { name: "Drawing" }), "-{Enter}..=");
    expect(cells("glow")).toHaveLength(2);
    expect(cells("still")).toHaveLength(1);
    expect(at(1, 2)).toHaveAttribute("data-kind", "glow");
  });

  it("draws a space as an unknown cell, with a title saying it draws nothing", () => {
    render(<TextDrawing defaultText="= =" />);
    expect(cells("unknown")).toHaveLength(1);
    expect(at(0, 1)).toHaveAttribute("title", `" " doesn't draw anything`);
  });

  it("colors an = by how close the mouse is, and leaves a - alone", () => {
    render(<TextDrawing defaultText="=-" colors={["blue", "red"]} />);
    // jsdom has no layout, so every cell is at (0, 0) and the mouse there is right over them
    act(() => {
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 0, clientY: 0 }));
    });
    expect(at(0, 0)!.style.getPropertyValue("--proximity-color")).toBe("color-mix(in srgb, blue, red 100%)");
    expect(at(0, 1)!.style.getPropertyValue("--proximity-color")).toBe("");
  });

  it("names an empty picture", () => {
    render(<TextDrawing defaultText="" />);
    expect(picture()).toHaveAccessibleName("Nothing drawn yet");
  });

  it("sets the cell size, and passes className and other props to the outer element", () => {
    const { container } = render(<TextDrawing cellSize={2} className="mt-4" data-testid="drawing" />);
    const outer = container.firstElementChild as HTMLElement;
    expect(outer).toHaveClass("text-drawing", "mt-4");
    expect(outer).toHaveAttribute("data-testid", "drawing");
    expect(outer.style.getPropertyValue("--text-drawing-cell")).toBe("2rem");
  });
});
