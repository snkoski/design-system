import { useState } from "react";
import { TextArea } from "@/components/TextArea";
import { fixed, percent, Slider } from "@/how-it-works/demo";
import { closeness, colorAt } from "@/experiments/Proximity/tracker";
import { parseDrawing } from "@/experiments/TextDrawing/drawing";
import "@/experiments/TextDrawing/explain.css";

/* Live demos for the "How it works" page. They call the real parseDrawing(), and Proximity's real closeness() and
   colorAt(), so what they show is what runs. */

const SAMPLE = ["-=-", "=.=", "-= x"].join("\n");

/** What each kind of cell becomes in the picture */
const DRAWN = {
  glow: "A Proximity span: changes color near the mouse",
  still: "A plain span, filled with muted ink",
  gap: "Nothing: the space stays empty",
  unknown: "A plain span with a dashed outline, and a title saying it draws nothing",
} as const;

/** How a character reads in the table, so a space is visible */
const shown = (character: string) => (character === " " ? "space" : character);

/** Type a small drawing and see what the real parseDrawing() makes of it, cell by cell */
export function Cells() {
  const [text, setText] = useState(SAMPLE);
  const drawing = parseDrawing(text);

  return (
    <div className="explain">
      <TextArea
        className="text-drawing-explain__editor"
        label="A small drawing"
        description="Keep it small: every character gets a row in the table."
        rows={4}
        spellCheck={false}
        autoComplete="off"
        value={text}
        onValueChange={setText}
      />
      <p className="explain__result">
        <code>rows: {drawing.rows}</code>, <code>columns: {drawing.columns}</code>, so the picture is{" "}
        <code>
          grid-template-columns: repeat({drawing.columns}, var(--text-drawing-cell))
        </code>{" "}
        and <code>grid-template-rows: repeat({drawing.rows}, var(--text-drawing-cell))</code>.
      </p>
      {drawing.cells.length > 0 ? (
        <div className="text-drawing-explain__scroll">
          <table className="text-drawing-explain__table">
            <thead>
              <tr>
                <th scope="col">Character</th>
                <th scope="col">kind</th>
                <th scope="col">row, column</th>
                <th scope="col">Placed at</th>
                <th scope="col">Drawn as</th>
              </tr>
            </thead>
            <tbody>
              {drawing.cells.slice(0, 40).map((cell) => (
                <tr key={`${cell.row}-${cell.column}`}>
                  <td>
                    <code>{shown(cell.character)}</code>
                  </td>
                  <td>
                    <code>{cell.kind}</code>
                  </td>
                  <td>
                    {cell.row}, {cell.column}
                  </td>
                  <td>{cell.kind === "gap" ? "Not rendered" : <code>grid-row: {cell.row + 1}; grid-column: {cell.column + 1}</code>}</td>
                  <td>{DRAWN[cell.kind]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="explain__note">No characters, so no cells.</p>
      )}
      {drawing.cells.length > 40 && <p className="explain__note">Showing the first 40 of {drawing.cells.length} cells.</p>}
    </div>
  );
}

/** A 20 px cell at the left of a line, and the mouse somewhere to its right on the same line */
const CELL = { left: 0, top: 0, right: 20, bottom: 20 };

/** How far the mouse is from an `=` cell, worked through Proximity's real closeness() and colorAt() */
export function Nearness() {
  const [distance, setDistance] = useState(30);
  const [reach, setReach] = useState(120);
  const at = { x: CELL.right + distance, y: 10 };
  const amount = closeness(CELL, at, reach);
  const color = colorAt(["var(--border)", "var(--brand)"], amount, "srgb");

  return (
    <div className="explain">
      <div className="explain__controls">
        <Slider label="Mouse to the cell's edge" value={distance} min={0} max={200} step={5} unit="px" onChange={setDistance} />
        <Slider label="Reach" value={reach} min={0} max={200} step={10} unit="px" onChange={setReach} />
      </div>
      <ol className="explain__steps">
        <li>
          <strong>Closeness.</strong>{" "}
          {reach <= 0 ? (
            <>
              With no reach, it counts only when the mouse is over the cell: <code>{fixed(amount, 2)}</code>
            </>
          ) : (
            <code>
              1 − {distance} ÷ {reach} = {fixed(1 - distance / reach, 3)}
            </code>
          )}
          {reach > 0 && 1 - distance / reach < 0 && (
            <>
              , held at <code>0</code>: the mouse is out of reach
            </>
          )}
        </li>
        <li>
          <strong>Color.</strong> {percent(amount)} of the way from <code>--border</code> to <code>--brand</code>
        </li>
      </ol>
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-drawing-explain__swatch" style={{ background: color ?? undefined }} />
        <p className="explain__result">
          The real <code>closeness()</code> returned <code>{fixed(amount, 3)}</code>, and <code>colorAt()</code> returned{" "}
          <code>{color}</code>.
        </p>
      </div>
    </div>
  );
}
