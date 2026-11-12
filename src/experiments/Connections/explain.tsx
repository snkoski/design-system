import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import { Segment, SegmentedControl } from "@/components/SegmentedControl";
import { fixed, Slider } from "@/how-it-works/demo";
import { PAINT_STOPS } from "@/experiments/Connections/Connections";
import "@/experiments/Connections/explain.css";
import { gap, lines } from "@/experiments/Connections/lines";
import type { Box } from "@/experiments/Connections/lines";
import { gray, mixPaint, rgbFromRyb, rybFromRgb, toCss } from "@/experiments/Connections/paint";
import type { Rgb, Ryb } from "@/experiments/Connections/paint";

/* Live demos for the "How it works" page. They call the real gap(), lines(), and mixPaint(), so what they show is what runs. */

const WIDTH = 640;
const HEIGHT = 300;
/** The first box stays put; the second is yours to move */
const FIRST = { left: 140, top: 120 };

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

/** The two points, one on each box, that are nearest each other: the ends of the gap gap() measures */
function nearestPoints(a: Box, b: Box) {
  const axis = (aStart: number, aSize: number, bStart: number, bSize: number) => {
    if (aStart + aSize < bStart) return [aStart + aSize, bStart]; // b is after a
    if (bStart + bSize < aStart) return [aStart, bStart + bSize]; // b is before a
    const middle = (Math.max(aStart, bStart) + Math.min(aStart + aSize, bStart + bSize)) / 2; // they overlap this way
    return [middle, middle];
  };
  const [ax, bx] = axis(a.left, a.width, b.left, b.width);
  const [ay, by] = axis(a.top, a.height, b.top, b.height);
  return { from: { x: ax!, y: ay! }, to: { x: bx!, y: by! } };
}

/**
 * Two boxes and a distance, worked through gap() and lines() step by step. The dashed outline is everywhere within
 * the distance of the first box: the second box gets a line when any part of it is inside.
 */
export function Gap() {
  const [distance, setDistance] = useState(100);
  const [firstSize, setFirstSize] = useState(60);
  const [secondSize, setSecondSize] = useState(40);
  const [second, setSecond] = useState({ left: 250, top: 70 });
  const grab = useRef<{ x: number; y: number } | null>(null);

  const a: Box = { ...FIRST, width: firstSize, height: firstSize };
  const b: Box = { left: clamp(second.left, 0, WIDTH - secondSize), top: clamp(second.top, 0, HEIGHT - secondSize), width: secondSize, height: secondSize };
  const centerA = { x: a.left + a.width / 2, y: a.top + a.height / 2 };
  const centerB = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  const halves = (a.width + b.width) / 2;
  const across = Math.abs(centerA.x - centerB.x);
  const down = Math.abs(centerA.y - centerB.y);
  const dx = Math.max(0, across - halves);
  const dy = Math.max(0, down - (a.height + b.height) / 2);
  const between = Math.hypot(dx, dy);
  const realGap = gap(a, b);
  const found = lines([a, b], distance);
  const line = found[0];
  const ends = nearestPoints(a, b);

  /** A pointer's place in the picture's own units */
  const toPicture = (event: PointerEvent<SVGElement>) => {
    const matrix = event.currentTarget.ownerSVGElement?.getScreenCTM()?.inverse();
    if (!matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix);
    return { x: point.x, y: point.y };
  };
  const press = (event: PointerEvent<SVGRectElement>) => {
    const at = toPicture(event);
    if (!at) return;
    event.preventDefault(); // no text selection while dragging
    event.currentTarget.setPointerCapture(event.pointerId);
    grab.current = { x: at.x - b.left, y: at.y - b.top };
  };
  const drag = (event: PointerEvent<SVGRectElement>) => {
    const at = toPicture(event);
    if (!grab.current || !at) return;
    setSecond({ left: Math.round(at.x - grab.current.x), top: Math.round(at.y - grab.current.y) });
  };

  return (
    <div className="explain">
      <div className="explain__controls">
        <Slider label="Distance" value={distance} min={0} max={300} step={5} unit="px" onChange={setDistance} />
        <Slider label="Second box, across" value={b.left} min={0} max={WIDTH - secondSize} step={1} unit="px" onChange={(left) => setSecond({ ...second, left })} />
        <Slider label="Second box, down" value={b.top} min={0} max={HEIGHT - secondSize} step={1} unit="px" onChange={(top) => setSecond({ ...second, top })} />
        <Slider label="First box's size" value={firstSize} min={10} max={120} step={5} unit="px" onChange={setFirstSize} />
        <Slider label="Second box's size" value={secondSize} min={10} max={120} step={5} unit="px" onChange={setSecondSize} />
      </div>
      <p className="explain__note">Drag the second box, or use the sliders. Positions are each box's top left corner, in px.</p>
      <svg className="gap-demo" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`Two boxes ${fixed(realGap)} px apart, ${line ? "joined by a line" : "with no line"}`}>
        <rect className="gap-demo__room" x={0} y={0} width={WIDTH} height={HEIGHT} />
        {distance > 0 && (
          <rect
            className="gap-demo__reach"
            x={a.left - distance}
            y={a.top - distance}
            width={a.width + 2 * distance}
            height={a.height + 2 * distance}
            rx={distance}
          />
        )}
        {line && <line className="gap-demo__line" x1={line.from.x} y1={line.from.y} x2={line.to.x} y2={line.to.y} strokeOpacity={line.strength} />}
        {realGap > 0 && (
          <g className="gap-demo__gap">
            {dx > 0 && dy > 0 && (
              <>
                <line className="gap-demo__leg" x1={ends.from.x} y1={ends.from.y} x2={ends.to.x} y2={ends.from.y} />
                <line className="gap-demo__leg" x1={ends.to.x} y1={ends.from.y} x2={ends.to.x} y2={ends.to.y} />
              </>
            )}
            <line x1={ends.from.x} y1={ends.from.y} x2={ends.to.x} y2={ends.to.y} />
            <circle cx={ends.from.x} cy={ends.from.y} r={3} />
            <circle cx={ends.to.x} cy={ends.to.y} r={3} />
          </g>
        )}
        <rect className="gap-demo__box" x={a.left} y={a.top} width={a.width} height={a.height} />
        <text className="gap-demo__name" x={centerA.x} y={centerA.y}>
          A
        </text>
        <rect className="gap-demo__box" data-grab x={b.left} y={b.top} width={b.width} height={b.height} onPointerDown={press} onPointerMove={drag} onPointerUp={() => (grab.current = null)} />
        <text className="gap-demo__name" x={centerB.x} y={centerB.y}>
          B
        </text>
      </svg>
      <ol className="explain__steps">
        <li>
          <strong>Centers.</strong> A&rsquo;s middle is at <code>({fixed(centerA.x)}, {fixed(centerA.y)})</code> and B&rsquo;s at{" "}
          <code>({fixed(centerB.x)}, {fixed(centerB.y)})</code>.
        </li>
        <li>
          <strong>Across.</strong> The middles are <code>{fixed(across)}</code> px apart across, and half of each width together is{" "}
          <code>({a.width} + {b.width}) ÷ 2 = {fixed(halves)}</code>, so <code>dx = max(0, {fixed(across)} − {fixed(halves)}) = {fixed(dx)}</code>
          {dx === 0 ? ": they overlap across, so only the gap down counts." : "."}
        </li>
        <li>
          <strong>Down.</strong> <code>dy = max(0, {fixed(down)} − ({a.height} + {b.height}) ÷ 2) = {fixed(dy)}</code>
          {dy === 0 ? ": they overlap down, so only the gap across counts." : "."}
        </li>
        <li>
          <strong>Gap.</strong> <code>√({fixed(dx)}² + {fixed(dy)}²) = {fixed(between)}</code> px
          {between === 0 ? ": they touch or overlap." : "."}
        </li>
        <li>
          <strong>Line.</strong>{" "}
          {line ? (
            <>
              {fixed(between)} is less than the distance, {distance}, so they&rsquo;re joined, at a strength of{" "}
              <code>1 − {fixed(between)} ÷ {distance} = {fixed(line.strength, 2)}</code>. With <code>fade</code> on, that&rsquo;s the
              line&rsquo;s opacity.
            </>
          ) : (
            <>
              {fixed(between)} isn&rsquo;t less than the distance, {distance}, so there&rsquo;s no line.
            </>
          )}
        </li>
      </ol>
      <p className="explain__result">
        The real <code>gap()</code> returned <code>{fixed(realGap, 2)}</code>, and <code>lines()</code> returned{" "}
        {line ? (
          <code>
            [&#123; strength: {fixed(line.strength, 3)}, between: [0, 1] &#125;]
          </code>
        ) : (
          <code>[]</code>
        )}
        .
      </p>
    </div>
  );
}

/** The paints to choose from: the paint cube's corners, from the real rgbFromRyb(), and plain black */
const PAINTS: Record<string, Rgb> = {
  Red: rgbFromRyb([1, 0, 0]),
  Yellow: rgbFromRyb([0, 1, 0]),
  Blue: rgbFromRyb([0, 0, 1]),
  Orange: rgbFromRyb([1, 1, 0]),
  Green: rgbFromRyb([0, 1, 1]),
  Purple: rgbFromRyb([1, 0, 1]),
  White: rgbFromRyb([0, 0, 0]),
  Black: [0, 0, 0],
};

function PaintChoice({ label, name, value, onChange }: { label: string; name: string; value: string; onChange: (value: string) => void }) {
  return (
    <SegmentedControl label={label} name={name} value={value} onValueChange={onChange}>
      {Object.keys(PAINTS).map((paint) => (
        <Segment key={paint} value={paint}>
          {paint}
        </Segment>
      ))}
    </SegmentedControl>
  );
}

const amounts = (paint: Ryb) => `[${paint.map((amount) => fixed(amount, 2)).join(", ")}]`;
const channels = (color: Rgb) => `[${color.map((value) => fixed(value, 2)).join(", ")}]`;

/** A small square of a color, beside the numbers that make it */
function Swatch({ color }: { color: Rgb }) {
  return <span className="paint-demo__swatch" style={{ background: toCss(color) }} aria-hidden="true" />;
}

/**
 * Two colors mixed like paint, worked through mixPaint() step by step, with the line Connections would draw between
 * them both ways: like paint and like light.
 */
export function PaintMix() {
  const [first, setFirst] = useState("Blue");
  const [second, setSecond] = useState("Yellow");
  const [t, setT] = useState(0.5);

  const a = PAINTS[first]!;
  const b = PAINTS[second]!;
  const real = mixPaint(a, b, t);
  const grays = gray(a) && gray(b);
  const from = rybFromRgb(a);
  const to = rybFromRgb(b);
  const mixed = from.map((value, channel) => value + (to[channel]! - value) * t) as Ryb;
  const strength = Math.max(...from) + (Math.max(...to) - Math.max(...from)) * t;
  const most = Math.max(...mixed);
  const scaled = (most > 0 ? mixed.map((value) => (value * strength) / most) : mixed) as Ryb;
  const paintStops = Array.from({ length: PAINT_STOPS + 1 }, (_, stop) => `${toCss(mixPaint(a, b, stop / PAINT_STOPS))} ${fixed((stop / PAINT_STOPS) * 100)}%`);
  const marker = `${t * 100}%`;

  return (
    <div className="explain">
      <div className="paint-demo__choices">
        <PaintChoice label="First color" name="paint-first" value={first} onChange={setFirst} />
        <PaintChoice label="Second color" name="paint-second" value={second} onChange={setSecond} />
      </div>
      <div className="explain__controls">
        <Slider label="How far along the line (t)" value={t} min={0} max={1} step={0.05} digits={2} onChange={setT} />
      </div>
      <div className="paint-demo__strips">
        <figure className="paint-demo__strip">
          <figcaption>
            <code>blend=&quot;paint&quot;</code>: {PAINT_STOPS + 1} stops, each from <code>mixPaint()</code>
          </figcaption>
          <div className="paint-demo__bar" style={{ background: `linear-gradient(to right, ${paintStops.join(", ")})` }}>
            <span className="paint-demo__marker" style={{ left: marker }} />
          </div>
        </figure>
        <figure className="paint-demo__strip">
          <figcaption>
            <code>blend=&quot;light&quot;</code>: two stops, mixed by the browser
          </figcaption>
          <div className="paint-demo__bar" style={{ background: `linear-gradient(to right, ${toCss(a)}, ${toCss(b)})` }}>
            <span className="paint-demo__marker" style={{ left: marker }} />
          </div>
        </figure>
      </div>
      {grays ? (
        <ol className="explain__steps">
          <li>
            <strong>Two grays.</strong> {first} <code>{channels(a)}</code> and {second} <code>{channels(b)}</code> are both grays, so they mix
            straight, in RGB: <code>{channels(a)} + ({channels(b)} − {channels(a)}) × {fixed(t, 2)}</code>.
          </li>
        </ol>
      ) : (
        <ol className="explain__steps">
          <li>
            <strong>Into paint.</strong> <code>rybFromRgb()</code> finds {first.toLowerCase()} is <code>{amounts(from)}</code> red, yellow, and
            blue paint, and {second.toLowerCase()} is <code>{amounts(to)}</code>.
          </li>
          <li>
            <strong>Mix the paint.</strong> {fixed(t, 2)} of the way from one to the other, channel by channel:{" "}
            <code>{amounts(mixed)}</code>.
          </li>
          <li>
            <strong>Keep it strong.</strong> The strongest channel of each is {fixed(Math.max(...from), 2)} and {fixed(Math.max(...to), 2)}, so the
            mix should be <code>{fixed(strength, 2)}</code> strong. Its strongest channel is {fixed(most, 2)}, so every channel is multiplied by{" "}
            <code>
              {fixed(strength, 2)} ÷ {fixed(most, 2)}
            </code>
            : <code>{amounts(scaled)}</code>.
          </li>
          <li>
            <strong>Back to a color.</strong> <code>rgbFromRyb({amounts(scaled)})</code> = <code>{channels(rgbFromRyb(scaled))}</code>{" "}
            <Swatch color={rgbFromRyb(scaled)} />
          </li>
        </ol>
      )}
      <p className="explain__result">
        The real <code>mixPaint()</code> returned <code>{toCss(real)}</code> <Swatch color={real} />. Mixed like light, it would be{" "}
        <code>{toCss(a.map((value, channel) => value + (b[channel]! - value) * t) as Rgb)}</code>{" "}
        <Swatch color={a.map((value, channel) => value + (b[channel]! - value) * t) as Rgb} />.
      </p>
    </div>
  );
}
