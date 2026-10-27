import { useState } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import { TextArea } from "../../components/TextArea";
import { cx } from "../../internal/cx";
import { Proximity } from "../Proximity/Proximity";
import { parseDrawing } from "./drawing";
import type { Cell } from "./drawing";
import "./text-drawing.css";

/** A heart of `=` in a frame of `-`, so there's something to move the mouse over straight away */
export const HEART = [
  "-------------",
  "-..==...==..-",
  "-.====.====.-",
  "-===========-",
  "-===========-",
  "-.=========.-",
  "-..=======..-",
  "-...=====...-",
  "-....===....-",
  "-.....=.....-",
  "-------------",
].join("\n");

interface OwnProps {
  /** The drawing it starts with. Default: a heart in a frame. */
  defaultText?: string;
  /** How far from the mouse an `=` starts to change color, in px from its nearest edge. Default: 120. */
  reach?: number;
  /**
   * The colors an `=` goes through as the mouse comes near, from far to near. Any CSS colors.
   * Default: the border color to the brand color.
   */
  colors?: string[];
  /** Each cell's width and height, in rem. Default: 1.25. */
  cellSize?: number;
  /** Applied to the outer element, so it's the place for layout classes. */
  className?: string;
}

export type TextDrawingProps = OwnProps & Omit<HTMLAttributes<HTMLDivElement>, keyof OwnProps>;

const DEFAULT_COLORS = ["var(--border)", "var(--brand)"];

/**
 * Draw by typing: a text area on the left, and on the right a picture with one cell for each character, in the
 * row and column it was typed in. `=` changes color as the mouse comes near, `-` stays as it is, and `.` leaves a
 * gap. Any other character, a space included, shows as a dashed outline, so a stray one is easy to spot. An
 * experiment: not exported from the package (see CLAUDE.md, Experiments).
 */
export function TextDrawing({ defaultText = HEART, reach = 120, colors = DEFAULT_COLORS, cellSize = 1.25, className, style, ...rest }: TextDrawingProps) {
  const [text, setText] = useState(defaultText);
  const drawing = parseDrawing(text);
  const count = (kind: Cell["kind"]) => drawing.cells.filter((cell) => cell.kind === kind).length;
  const label =
    drawing.columns === 0
      ? "Nothing drawn yet"
      : `A drawing ${drawing.columns} cells wide and ${drawing.rows} tall: ${count("glow")} that change color near the mouse, and ${count("still")} that stay still`;

  return (
    <div {...rest} className={cx("text-drawing", className)} style={{ ...style, "--text-drawing-cell": `${cellSize}rem` } as CSSProperties}>
      <TextArea
        className="text-drawing__editor"
        label="Drawing"
        description="Type = for a cell that changes color near the mouse, - for one that stays still, and . for a gap."
        rows={12}
        spellCheck={false}
        autoComplete="off"
        value={text}
        onValueChange={setText}
      />
      <div
        className="text-drawing__picture"
        role="img"
        aria-label={label}
        style={{ gridTemplateColumns: `repeat(${drawing.columns}, var(--text-drawing-cell))`, gridTemplateRows: `repeat(${drawing.rows}, var(--text-drawing-cell))` }}
      >
        {drawing.cells.map((cell) => {
          if (cell.kind === "gap") return null;
          const key = `${cell.row}-${cell.column}`;
          const props = {
            className: "text-drawing__cell",
            "data-kind": cell.kind,
            style: { gridRow: cell.row + 1, gridColumn: cell.column + 1 },
          };
          if (cell.kind === "glow") return <Proximity key={key} {...props} reach={reach} colors={colors} />;
          return <span key={key} {...props} title={cell.kind === "unknown" ? `"${cell.character}" doesn't draw anything` : undefined} />;
        })}
      </div>
    </div>
  );
}
