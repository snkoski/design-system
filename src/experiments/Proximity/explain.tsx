import { useState } from "react";
import type { PointerEvent } from "react";
import { Segment, SegmentedControl } from "../../components/SegmentedControl";
import { fixed, Slider } from "../../how-it-works/demo";
import "./explain.css";
import { closeness, colorAt } from "./tracker";
import type { ColorSpace } from "./tracker";

/* Live demos for the "How it works" page. They call the real closeness() and colorAt() from tracker.ts, so what
   they show is what runs. */

/** Where a pointer is over an SVG, in the SVG's own units */
function pointIn(event: PointerEvent<SVGSVGElement>, view: { x: number; y: number; width: number; height: number }) {
  const box = event.currentTarget.getBoundingClientRect();
  return {
    x: Math.round(view.x + ((event.clientX - box.left) / box.width) * view.width),
    y: Math.round(view.y + ((event.clientY - box.top) / box.height) * view.height),
  };
}

const AREA = { x: 0, y: 0, width: 520, height: 360 };
/** A 40px square in the middle of the area, as tracker.ts sees an element: its edges */
const BOX = { left: 240, top: 160, right: 280, bottom: 200 };
const RINGS = [0.75, 0.5, 0.25, 0];

/**
 * How closeness() measures one pointer position against one box, worked out step by step. Rings mark where
 * closeness is 0.75, 0.5, 0.25, and 0: every point on a ring is the same distance from the box's nearest edge.
 */
export function Closeness() {
  const [x, setX] = useState(340);
  const [y, setY] = useState(80);
  const [reach, setReach] = useState(200);

  const dx = Math.max(BOX.left - x, 0, x - BOX.right);
  const dy = Math.max(BOX.top - y, 0, y - BOX.bottom);
  const distance = Math.hypot(dx, dy);
  const result = closeness(BOX, { x, y }, reach);
  // The point on the box nearest the pointer, where the distance is measured from
  const nearX = Math.min(Math.max(x, BOX.left), BOX.right);
  const nearY = Math.min(Math.max(y, BOX.top), BOX.bottom);
  const side = (gap: number, before: number, after: number, names: [string, string]) =>
    gap === 0 ? "level with the box" : before > 0 ? `${names[0]} the box` : after > 0 ? `${names[1]} the box` : "";

  const move = (event: PointerEvent<SVGSVGElement>) => {
    const point = pointIn(event, AREA);
    setX(Math.min(Math.max(point.x, 0), AREA.width));
    setY(Math.min(Math.max(point.y, 0), AREA.height));
  };

  return (
    <div className="explain">
      <div className="explain__controls">
        <Slider label="Pointer across" value={x} min={0} max={AREA.width} step={1} unit="px" onChange={setX} />
        <Slider label="Pointer down" value={y} min={0} max={AREA.height} step={1} unit="px" onChange={setY} />
        <Slider label="Reach" value={reach} min={0} max={300} step={10} unit="px" onChange={setReach} />
      </div>
      <p className="explain__note">
        Move the pointer over the area, or use the sliders. The box runs from {BOX.left} to {BOX.right} across and from {BOX.top} to {BOX.bottom}{" "}
        down.
      </p>
      <svg
        className="proximity-area"
        viewBox={`${AREA.x} ${AREA.y} ${AREA.width} ${AREA.height}`}
        role="img"
        aria-label={`The pointer ${fixed(distance)} px from the box, with closeness ${fixed(result, 3)}`}
        onPointerMove={move}
        onPointerDown={move}
      >
        {reach > 0 &&
          RINGS.map((ring) => {
            const gap = (1 - ring) * reach;
            return (
              <g key={ring}>
                <rect
                  className="proximity-area__ring"
                  x={BOX.left - gap}
                  y={BOX.top - gap}
                  width={BOX.right - BOX.left + 2 * gap}
                  height={BOX.bottom - BOX.top + 2 * gap}
                  rx={gap}
                />
                <text className="explain-chart__tick" x={BOX.right + gap + 4} y={(BOX.top + BOX.bottom) / 2} dominantBaseline="middle">
                  {ring}
                </text>
              </g>
            );
          })}
        <rect className="proximity-area__box" x={BOX.left} y={BOX.top} width={BOX.right - BOX.left} height={BOX.bottom - BOX.top} />
        {dx > 0 && dy > 0 && (
          <>
            <line className="proximity-area__leg" x1={nearX} y1={nearY} x2={x} y2={nearY} />
            <line className="proximity-area__leg" x1={x} y1={nearY} x2={x} y2={y} />
          </>
        )}
        {distance > 0 && <line className="proximity-area__distance" x1={nearX} y1={nearY} x2={x} y2={y} />}
        <circle className="proximity-area__pointer" cx={x} cy={y} r={6} />
      </svg>
      <ol className="explain__steps">
        <li>
          <strong>Across.</strong> <code>dx = max({BOX.left} − {x}, 0, {x} − {BOX.right}) = {dx}</code> px:{" "}
          {side(dx, BOX.left - x, x - BOX.right, ["left of", "right of"])}.
        </li>
        <li>
          <strong>Down.</strong> <code>dy = max({BOX.top} − {y}, 0, {y} − {BOX.bottom}) = {dy}</code> px:{" "}
          {side(dy, BOX.top - y, y - BOX.bottom, ["above", "below"])}.
        </li>
        <li>
          <strong>Distance.</strong> <code>Math.hypot({dx}, {dy}) = √({dx}² + {dy}²) = {fixed(distance)}</code> px from the nearest edge.
        </li>
        <li>
          <strong>Closeness.</strong>{" "}
          {reach <= 0 ? (
            <>
              With no reach, only being over the box counts: <code>{distance === 0 ? 1 : 0}</code>.
            </>
          ) : (
            <>
              <code>
                1 − {fixed(distance)} / {reach} = {fixed(1 - distance / reach, 3)}
              </code>
              {distance > reach ? ", below 0, so it's held at 0" : ""}.
            </>
          )}
        </li>
      </ol>
      <p className="explain__result">
        The real <code>closeness()</code> returned <code>{fixed(result, 3)}</code>, so <code>--proximity</code> is set to{" "}
        <code>{String(Math.round(result * 1000) / 1000)}</code>.
      </p>
    </div>
  );
}

// Plain blue, green, and red, the same as the stories use: the point is to see them mix
const BLUE = "hsl(220 90% 55%)";
const GREEN = "hsl(140 75% 40%)";
const RED = "hsl(0 85% 55%)";

const PRESETS: Record<string, { colors: string[]; names: string[] }> = {
  "blue to red": { colors: [BLUE, RED], names: ["blue", "red"] },
  "blue, green, red": { colors: [BLUE, GREEN, RED], names: ["blue", "green", "red"] },
  "red to green": { colors: [RED, GREEN], names: ["red", "green"] },
};
const SPACES: ColorSpace[] = ["srgb", "oklch", "hsl"];
/** How many swatches each strip has */
const SWATCHES = 41;

/**
 * What colorAt() makes of a closeness, worked out, and the same colors mixed in each of the three color spaces.
 * Every swatch is the real colorAt() result, drawn by the browser exactly as Proximity's CSS draws it.
 */
export function Mixing() {
  const [preset, setPreset] = useState("blue to red");
  const [amount, setAmount] = useState(0.5);
  const [space, setSpace] = useState<string>("srgb");
  const { colors, names } = PRESETS[preset]!;

  const along = amount * (colors.length - 1);
  const from = Math.min(Math.floor(along), colors.length - 2);
  const toward = Math.round((along - from) * 1000) / 10;

  const slide = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    setAmount(Math.round(Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1) * 100) / 100);
  };

  return (
    <div className="explain">
      <SegmentedControl label="Colors" name="mixing-colors" value={preset} onValueChange={setPreset}>
        {Object.keys(PRESETS).map((key) => (
          <Segment key={key} value={key}>
            {key[0]!.toUpperCase() + key.slice(1)}
          </Segment>
        ))}
      </SegmentedControl>
      <div className="explain__controls">
        <Slider label="Closeness" value={amount} min={0} max={1} step={0.01} digits={2} onChange={setAmount} />
        <SegmentedControl label="Color space" name="mixing-space" value={space} onValueChange={setSpace}>
          {SPACES.map((key) => (
            <Segment key={key} value={key}>
              {key}
            </Segment>
          ))}
        </SegmentedControl>
      </div>
      <ol className="explain__steps">
        <li>
          <strong>How far along the list.</strong>{" "}
          <code>
            along = {fixed(amount, 2)} × ({colors.length} − 1) = {fixed(along, 2)}
          </code>
          {colors.length === 2 ? ": there's one gap between two colors." : `: there are ${colors.length - 1} gaps between ${colors.length} colors.`}
        </li>
        <li>
          <strong>Which two colors.</strong>{" "}
          <code>
            from = min(floor({fixed(along, 2)}), {colors.length - 2}) = {from}
          </code>
          , so it mixes color {from} ({names[from]}) with color {from + 1} ({names[from + 1]}).
          {along === colors.length - 1 ? " At the very end, floor() would point past the last pair, so it's held to the last one." : ""}
        </li>
        <li>
          <strong>How far between them.</strong>{" "}
          <code>
            toward = ({fixed(along, 2)} − {from}) × 100 = {fixed(toward, 1)}%
          </code>{" "}
          of the way to {names[from + 1]}.
        </li>
      </ol>
      <p className="explain__result">
        The real <code>colorAt()</code> returned <code>{colorAt(colors, amount, space as ColorSpace)}</code>
      </p>
      <p className="explain__note">The same colors mixed in each space. Every swatch is a colorAt() result. Move along a strip to pick a closeness.</p>
      <div className="mix-rows">
        {SPACES.map((each) => (
          <div key={each} className="mix-row" data-current={each === space || undefined}>
            <span className="mix-row__name">{each}</span>
            <div
              className="mix-row__strip"
              role="img"
              aria-label={`${names.join(" to ")}, mixed in ${each}`}
              onPointerMove={slide}
              onPointerDown={slide}
            >
              {Array.from({ length: SWATCHES }, (_, index) => (
                <span key={index} style={{ background: colorAt(colors, index / (SWATCHES - 1), each)! }} />
              ))}
              <span className="mix-row__marker" style={{ left: `${amount * 100}%` }} />
            </div>
            <span className="mix-row__now" style={{ background: colorAt(colors, amount, each)! }} />
          </div>
        ))}
      </div>
    </div>
  );
}
