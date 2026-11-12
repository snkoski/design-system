import { useId, useMemo, useState } from "react";
import type { PointerEvent } from "react";
import { Segment, SegmentedControl } from "@/components/SegmentedControl";
import { fixed, Slider } from "@/how-it-works/demo";
import { forces, PULL, separate } from "@/experiments/Magnets/forces";
import "@/experiments/Magnets/explain.css";

/* Live demos for Magnets' "How it works" page. They call the real forces() and separate() from forces.ts, so what
   they show is what runs. */

/** A number with thousands separators, for the big constants */
const grouped = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 1 });

/** The farthest distance the force chart shows, in px */
const FAR = 400;

const WIDTH = 640;
const HEIGHT = 170;
const MARGIN = { top: 12, right: 12, bottom: 26, left: 60 };
const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

/** A round number at or above `value`, for the top of an axis */
function ceiling(value: number) {
  const unit = 10 ** Math.floor(Math.log10(Math.max(value, 1)));
  return Math.ceil(value / unit) * unit;
}

interface Sample {
  /** Px between their centers */
  distance: number;
  /** The push (positive) or pull (negative) on each, in px/s² */
  apart: number;
}

/** What the real forces() does to two magnets `distance` px apart, center to center, on a line */
function pair(first: number, second: number, size: number, distance: number) {
  const [a, b] = forces([
    { x: 0, y: 0, width: size, height: size, charge: first },
    { x: distance, y: 0, width: size, height: size, charge: second },
  ]);
  return { a: a!, b: b! };
}

function ForceChart({ samples, current, hovered, onHover }: { samples: Sample[]; current: number; hovered: number | null; onHover: (index: number | null) => void }) {
  const top = ceiling(Math.max(...samples.map((sample) => Math.abs(sample.apart)), 100));
  const x = (distance: number) => MARGIN.left + (distance / FAR) * plotWidth;
  const y = (value: number) => MARGIN.top + plotHeight - (Math.min(Math.abs(value), top) / top) * plotHeight;
  const points = samples.map((sample) => `${x(sample.distance).toFixed(1)},${y(sample.apart).toFixed(1)}`).join(" ");
  const marked = samples[hovered ?? current];

  const hover = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const fraction = Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1);
    onHover(Math.round(fraction * (samples.length - 1)));
  };

  return (
    <figure className="explain-chart">
      <figcaption className="explain-chart__title">
        Push or pull on each magnet, by distance <span className="explain-chart__unit">(px/s²)</span>
      </figcaption>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`Push or pull on each magnet, from 0 to ${FAR} px apart`}>
        {[0, top / 2, top].map((value) => (
          <g key={value}>
            <line className="explain-chart__grid" x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y(value)} y2={y(value)} />
            <text className="explain-chart__tick" x={MARGIN.left - 8} y={y(value)} textAnchor="end" dominantBaseline="middle">
              {grouped(Math.round(value))}
            </text>
          </g>
        ))}
        {[0, 100, 200, 300, 400].map((distance) => (
          <text key={distance} className="explain-chart__tick" x={x(distance)} y={HEIGHT - 6} textAnchor="middle">
            {distance} px
          </text>
        ))}
        <polyline className="explain-chart__line" points={points} />
        {marked && (
          <g>
            <line className="explain-chart__cursor" x1={x(marked.distance)} x2={x(marked.distance)} y1={MARGIN.top} y2={MARGIN.top + plotHeight} />
            <circle className="explain-chart__point" cx={x(marked.distance)} cy={y(marked.apart)} r={4} />
          </g>
        )}
        <rect
          className="explain-chart__hit"
          x={MARGIN.left}
          y={MARGIN.top}
          width={plotWidth}
          height={plotHeight}
          onPointerMove={hover}
          onPointerLeave={() => onHover(null)}
        />
      </svg>
    </figure>
  );
}

/** Which way a push or pull of `apart` goes, in words */
const direction = (apart: number) => (apart > 0 ? "pushing them apart" : apart < 0 ? "pulling them together" : "neither way");

/**
 * The force between two magnets on a line, worked out with your numbers, then checked against the real forces().
 * The chart shows the same thing at every distance: flat while they'd overlap, then falling with the square of
 * the distance.
 */
export function Pull() {
  const [first, setFirst] = useState(1);
  const [second, setSecond] = useState(-1);
  const [distance, setDistance] = useState(100);
  const [size, setSize] = useState(40);
  const [hovered, setHovered] = useState<number | null>(null);

  const touching = (size + size + size + size) / 4;
  const counted = Math.max(distance, touching);
  const apart = (PULL * first * second) / counted ** 2;
  const result = pair(first, second, size, distance);
  const neutral = first === 0 || second === 0;

  const samples = useMemo(
    () =>
      Array.from({ length: FAR / 2 + 1 }, (_, index) => {
        const at = index * 2;
        // The real forces() at every distance. At 0 it can't tell which way to push, so the chart uses the cap there.
        const { b } = pair(first, second, size, Math.max(at, 0.001));
        return { distance: at, apart: b.ax };
      }),
    [first, second, size],
  );
  const point = hovered === null ? null : samples[hovered]!;

  return (
    <div className="explain">
      <div className="explain__controls">
        <Slider label="Charge of A" value={first} min={-5} max={5} step={0.5} digits={1} onChange={setFirst} />
        <Slider label="Charge of B" value={second} min={-5} max={5} step={0.5} digits={1} onChange={setSecond} />
        <Slider label="Distance between centers" value={distance} min={0} max={FAR} step={1} unit="px" onChange={setDistance} />
        <Slider label="Size of each" value={size} min={10} max={80} step={2} unit="px" onChange={setSize} />
      </div>
      <p className="explain__note">A is on the left and B on the right, on the same line. Positive pushes apart, negative pulls together.</p>
      <ol className="explain__steps">
        <li>
          <strong>Charges.</strong>{" "}
          {neutral ? (
            <>One of them is neutral, so <code>forces()</code> skips the pair: nothing pushes or pulls.</>
          ) : (
            <>
              <code>
                {fixed(first)} × {fixed(second)} = {fixed(first * second, 2)}
              </code>
              . {first * second > 0 ? "Same sign, so they repel." : "Opposite signs, so they attract."}
            </>
          )}
        </li>
        <li>
          <strong>Touching distance.</strong> <code>(w + w + h + h) / 4 = {fixed(touching)}</code> px, center to center.
        </li>
        <li>
          <strong>Distance counted.</strong> <code>max({distance}, {fixed(touching)}) = {fixed(counted)}</code> px
          {distance < touching ? ": they'd overlap, so the force is worked out as if they just touched." : "."}
        </li>
        <li>
          <strong>Strength.</strong>{" "}
          <code>
            apart = {grouped(PULL)} × {fixed(first * second, 2)} / {fixed(counted)}² = {grouped(neutral ? 0 : apart)}
          </code>{" "}
          px/s², {direction(neutral ? 0 : apart)}.
        </li>
        <li>
          <strong>One frame.</strong> At 60 frames a second, each one&rsquo;s speed changes by{" "}
          <code>
            {grouped(Math.abs(neutral ? 0 : apart))} × 0.0167 = {fixed(Math.abs(neutral ? 0 : apart) / 60)}
          </code>{" "}
          px/s, the same for both, whatever their size.
        </li>
      </ol>
      <p className="explain__result">
        The real <code>forces()</code> returned <code>A.ax = {fixed(result.a.ax)}</code> and <code>B.ax = {fixed(result.b.ax)}</code> px/s²
        {distance === 0 ? ": exactly on top of each other, it can't tell which way to push, so it doesn't." : "."}
      </p>
      <p className="explain__readout" aria-live="polite">
        {point
          ? `At ${point.distance} px apart: ${grouped(Math.abs(point.apart))} px/s² on each, ${direction(point.apart)}.`
          : "Hover the chart to read the force at any distance. The dot marks the distance above."}
      </p>
      <ForceChart samples={samples} current={Math.round(distance / 2)} hovered={hovered} onHover={setHovered} />
    </div>
  );
}

/** Both magnets in the separate() demo are this many px across */
const SIZE = 40;
/** How the picture scales px to its own units */
const SCALE = 2;
const HELD = ["Neither", "A", "B"] as const;
type Held = (typeof HELD)[number];

interface Ball {
  x: number;
  vx: number;
  fixed: boolean;
}

/** Two magnets in a row of the separate() picture, with arrows for their speeds, B's a little lower so they don't overlap */
function Row({ title, balls, top, arrow }: { title: string; balls: [Ball, Ball]; top: number; arrow: string }) {
  const radius = (SIZE / 2) * SCALE;
  const left = 170;
  return (
    <g>
      <text className="explain-picture__title" x={0} y={top + 14}>
        {title}
      </text>
      {balls.map((ball, index) => {
        const cx = left + (ball.x + SIZE / 2) * SCALE;
        const cy = top + 30 + radius;
        const length = ball.vx * 0.4;
        return (
          <g key={index}>
            <circle className="explain-picture__ball" data-fixed={ball.fixed || undefined} cx={cx} cy={cy} r={radius} />
            <text className="explain-picture__label" x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
              {index === 0 ? "A" : "B"}
            </text>
            {Math.abs(length) >= 1 && (
              <line className="explain-picture__arrow" x1={cx} x2={cx + length} y1={cy + radius + 10 + index * 12} y2={cy + radius + 10 + index * 12} markerEnd={`url(#${arrow})`} />
            )}
          </g>
        );
      })}
    </g>
  );
}

/**
 * One call to separate() for two overlapping magnets on a line, worked out with your numbers: how far each moves
 * so they just touch, and how much of their speed towards each other is taken away. The last line is what the
 * real separate() returned.
 */
export function Touch() {
  const [distance, setDistance] = useState(30);
  const [first, setFirst] = useState(100);
  const [second, setSecond] = useState(-20);
  const [held, setHeld] = useState<Held>("Neither");
  const arrow = `touch-arrow-${useId().replace(/[^\w-]/g, "")}`;

  const solid = (x: number, vx: number, fixed: boolean) => ({ x, y: 0, width: SIZE, height: SIZE, vx, vy: 0, charge: 1, fixed });
  const before: [Ball, Ball] = [
    { x: 0, vx: first, fixed: held === "A" },
    { x: distance, vx: second, fixed: held === "B" },
  ];
  const [a, b] = separate([solid(0, first, held === "A"), solid(distance, second, held === "B")]);
  const after: [Ball, Ball] = [
    { x: a!.x, vx: a!.vx, fixed: held === "A" },
    { x: b!.x, vx: b!.vx, fixed: held === "B" },
  ];

  const overlap = SIZE - distance;
  const [shareA, shareB] = held === "A" ? [0, 1] : held === "B" ? [1, 0] : [0.5, 0.5];
  const closing = first - second;

  return (
    <div className="explain">
      <div className="explain__controls">
        <Slider label="Distance between centers" value={distance} min={1} max={60} step={1} unit="px" onChange={setDistance} />
        <Slider label="Speed of A" value={first} min={-300} max={300} step={10} unit="px/s" onChange={setFirst} />
        <Slider label="Speed of B" value={second} min={-300} max={300} step={10} unit="px/s" onChange={setSecond} />
        <SegmentedControl label="Held in place" name="touch-held" value={held} onValueChange={(value) => setHeld(value as Held)}>
          {HELD.map((option) => (
            <Segment key={option} value={option}>
              {option}
            </Segment>
          ))}
        </SegmentedControl>
      </div>
      <p className="explain__note">
        Both are {SIZE} px across, so they touch at {SIZE} px apart. Positive speed is to the right. A starts at x = 0 and B at x = {distance}.
      </p>
      <ol className="explain__steps">
        <li>
          <strong>Overlap.</strong> <code>{SIZE} − {distance} = {overlap}</code> px
          {overlap <= 0 ? ": they don't overlap, so separate() leaves them alone." : "."}
        </li>
        {overlap > 0 && (
          <>
            <li>
              <strong>Shares.</strong>{" "}
              {held === "Neither" ? (
                <>Neither is held, so each moves half the overlap.</>
              ) : (
                <>{held} is held in place, so the other one moves all of it.</>
              )}{" "}
              A takes <code>{shareA}</code> and B takes <code>{shareB}</code>.
            </li>
            <li>
              <strong>Move apart.</strong> <code>A.x = 0 − {overlap} × {shareA} = {fixed(a!.x)}</code> and{" "}
              <code>
                B.x = {distance} + {overlap} × {shareB} = {fixed(b!.x)}
              </code>
              , so they&rsquo;re {fixed(b!.x - a!.x)} px apart: just touching.
            </li>
            <li>
              <strong>Closing speed.</strong> <code>{first} − ({second}) = {closing}</code> px/s
              {closing <= 0 ? ": they're already moving apart, so their speeds are left alone." : ", towards each other."}
            </li>
            {closing > 0 && (
              <li>
                <strong>Take it away.</strong> <code>A.vx = {first} − {closing} × {shareA} = {fixed(a!.vx)}</code> and{" "}
                <code>
                  B.vx = {second} + {closing} × {shareB} = {fixed(b!.vx)}
                </code>{" "}
                px/s.{" "}
                {held === "Neither"
                  ? "Both now move at the same speed, their average: neither moves into the other any more."
                  : `The free one stops moving into ${held}.`}
              </li>
            )}
          </>
        )}
      </ol>
      <p className="explain__result">
        The real <code>separate()</code> returned <code>A.x = {fixed(a!.x)}</code>, <code>A.vx = {fixed(a!.vx)}</code>, <code>B.x = {fixed(b!.x)}</code>, and{" "}
        <code>B.vx = {fixed(b!.vx)}</code>.
      </p>
      <figure className="explain-picture">
        <svg viewBox="0 0 520 290" role="img" aria-label="The two magnets before and after separate(), with arrows for their speeds">
          <defs>
            <marker id={arrow} viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
              <path className="explain-picture__head" d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
          </defs>
          <Row title="Before" balls={before} top={0} arrow={arrow} />
          <Row title="After" balls={after} top={145} arrow={arrow} />
        </svg>
      </figure>
    </div>
  );
}
