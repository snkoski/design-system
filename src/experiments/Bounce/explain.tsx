import { useMemo, useState } from "react";
import type { PointerEvent } from "react";
import { Segment, SegmentedControl } from "@/components/SegmentedControl";
import { fixed, percent, Slider } from "@/how-it-works/demo";
import { REST, step } from "@/experiments/Bounce/physics";

/* Live demos for the "How it works" page. Both call the real step() from physics.ts, so what they show is what runs. */

/** The floor's distance from the top of the room, in px */
const FLOOR = 300;
const RATES = ["120", "60", "30", "20"];

function FrameRate({ name, value, onChange }: { name: string; value: string; onChange: (value: string) => void }) {
  return (
    <SegmentedControl label="Frames per second" name={name} value={value} onValueChange={onChange}>
      {RATES.map((rate) => (
        <Segment key={rate} value={rate}>
          {rate}
        </Segment>
      ))}
    </SegmentedControl>
  );
}

/**
 * One call to step(), worked out with your numbers: a ball moving straight up or down near the floor. Each line is
 * one part of step(), in order, and the last line is what the real step() returned for the same numbers.
 */
export function OneFrame() {
  const [speed, setSpeed] = useState(900);
  const [distance, setDistance] = useState(10);
  const [gravity, setGravity] = useState(2000);
  const [friction, setFriction] = useState(0.5);
  const [bounciness, setBounciness] = useState(0.8);
  const [rate, setRate] = useState("60");

  const seconds = 1 / Number(rate);
  const y = FLOOR - distance;
  const slow = Math.exp(-friction * seconds);
  const slowed = speed * slow;
  const pulled = slowed + gravity * seconds;
  const moved = y + pulled * seconds;
  const landed = moved >= FLOOR && pulled > 0;
  const resting = landed && gravity > 0 && pulled < gravity * REST;
  const result = step({ x: 0, y, vx: 0, vy: speed }, { width: 0, height: FLOOR }, seconds, { gravity, bounciness, friction });

  return (
    <div className="explain">
      <div className="explain__controls">
        <Slider label="Speed (vy)" value={speed} min={-1500} max={1500} step={10} unit="px/s" onChange={setSpeed} />
        <Slider label="Distance to the floor" value={distance} min={0} max={100} step={1} unit="px" onChange={setDistance} />
        <Slider label="Gravity" value={gravity} min={0} max={4000} step={50} unit="px/s²" onChange={setGravity} />
        <Slider label="Friction" value={friction} min={0} max={3} step={0.05} digits={2} onChange={setFriction} />
        <Slider label="Bounciness" value={bounciness} min={0} max={1} step={0.05} digits={2} onChange={setBounciness} />
        <FrameRate name="one-frame-rate" value={rate} onChange={setRate} />
      </div>
      <p className="explain__note">
        Positive speed is down the screen, negative is up. The floor is at y = {FLOOR}, so the ball starts at y = {y}.
      </p>
      <ol className="explain__steps">
        <li>
          <strong>Frame length.</strong> <code>seconds = 1 / {rate} = {fixed(seconds, 4)}</code>
        </li>
        <li>
          <strong>Friction.</strong> <code>slow = e^(−{fixed(friction, 2)} × {fixed(seconds, 4)}) = {fixed(slow, 4)}</code>, so{" "}
          <code>vy = {fixed(speed)} × {fixed(slow, 4)} = {fixed(slowed)}</code> px/s
        </li>
        <li>
          <strong>Gravity.</strong> <code>vy = {fixed(slowed)} + {gravity} × {fixed(seconds, 4)} = {fixed(pulled)}</code> px/s
        </li>
        <li>
          <strong>Move.</strong> <code>y = {y} + {fixed(pulled)} × {fixed(seconds, 4)} = {fixed(moved)}</code> px
        </li>
        <li>
          <strong>Bounce.</strong>{" "}
          {!landed ? (
            <>It hasn't reached the floor (y = {FLOOR}) while moving down, so nothing else happens.</>
          ) : resting ? (
            <>
              It reached the floor, but at {fixed(pulled)} px/s, slower than <code>gravity × REST = {fixed(gravity * REST)}</code>{" "}
              px/s, so it rests: <code>y = {FLOOR}</code>, <code>vy = 0</code>, and no bounce is reported.
            </>
          ) : (
            <>
              It went past the floor while moving down, so it goes back to the floor and turns around, keeping{" "}
              {percent(Math.min(Math.max(bounciness, 0), 1))} of its speed: <code>y = {FLOOR}</code>,{" "}
              <code>vy = −{fixed(pulled)} × {fixed(bounciness, 2)} = {fixed(-pulled * bounciness)}</code> px/s.
            </>
          )}
        </li>
      </ol>
      <p className="explain__result">
        The real <code>step()</code> returned <code>y = {fixed(result.body.y)}</code>, <code>vy = {fixed(result.body.vy)}</code>, and{" "}
        <code>edges = [{result.edges.map((edge) => `"${edge}"`).join(", ")}]</code>.
      </p>
    </div>
  );
}

interface Sample {
  /** Seconds since it started */
  time: number;
  /** Px above the floor */
  height: number;
  /** Px per second, either way */
  speed: number;
  bounced: boolean;
}

/** How long the trace runs, in seconds */
const DURATION = 5;

/** Runs the real step() for DURATION seconds: a ball dropped from the top of the room, falling straight down */
function simulate(physics: { gravity: number; bounciness: number; friction: number }, start: number, rate: number) {
  const seconds = 1 / rate;
  let body = { x: 0, y: 0, vx: 0, vy: start };
  const samples: Sample[] = [{ time: 0, height: FLOOR, speed: Math.abs(start), bounced: false }];
  for (let frame = 1; frame <= DURATION * rate; frame++) {
    const next = step(body, { width: 0, height: FLOOR }, seconds, physics);
    body = next.body;
    samples.push({ time: frame * seconds, height: FLOOR - body.y, speed: Math.abs(body.vy), bounced: next.edges.length > 0 });
  }
  return samples;
}

const WIDTH = 640;
const HEIGHT = 170;
const MARGIN = { top: 12, right: 12, bottom: 26, left: 52 };
const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

/** A round number at or above `value`, for the top of an axis */
function ceiling(value: number) {
  const unit = 10 ** Math.floor(Math.log10(Math.max(value, 1)));
  return Math.ceil(value / unit) * unit;
}

interface ChartProps {
  samples: Sample[];
  field: "height" | "speed";
  title: string;
  unit: string;
  hovered: number | null;
  onHover: (index: number | null) => void;
}

function Chart({ samples, field, title, unit, hovered, onHover }: ChartProps) {
  const top = field === "height" ? FLOOR : ceiling(Math.max(...samples.map((sample) => sample.speed), 100));
  const x = (time: number) => MARGIN.left + (time / DURATION) * plotWidth;
  const y = (value: number) => MARGIN.top + plotHeight - (Math.min(value, top) / top) * plotHeight;
  const points = samples.map((sample) => `${x(sample.time).toFixed(1)},${y(sample[field]).toFixed(1)}`).join(" ");
  const point = hovered === null ? null : samples[hovered];

  const hover = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const fraction = Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1);
    onHover(Math.round(fraction * (samples.length - 1)));
  };

  return (
    <figure className="explain-chart">
      <figcaption className="explain-chart__title">
        {title} <span className="explain-chart__unit">({unit})</span>
      </figcaption>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`${title}, over ${DURATION} seconds`}>
        {[0, top / 2, top].map((value) => (
          <g key={value}>
            <line className="explain-chart__grid" x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y(value)} y2={y(value)} />
            <text className="explain-chart__tick" x={MARGIN.left - 8} y={y(value)} textAnchor="end" dominantBaseline="middle">
              {Math.round(value)}
            </text>
          </g>
        ))}
        {Array.from({ length: DURATION + 1 }, (_, second) => (
          <text key={second} className="explain-chart__tick" x={x(second)} y={HEIGHT - 6} textAnchor="middle">
            {second} s
          </text>
        ))}
        <polyline className="explain-chart__line" points={points} />
        {field === "height" &&
          samples
            .filter((sample) => sample.bounced)
            .map((sample) => <circle key={sample.time} className="explain-chart__bounce" cx={x(sample.time)} cy={y(sample.height)} r={4} />)}
        {point && (
          <g>
            <line className="explain-chart__cursor" x1={x(point.time)} x2={x(point.time)} y1={MARGIN.top} y2={MARGIN.top + plotHeight} />
            <circle className="explain-chart__point" cx={x(point.time)} cy={y(point[field])} r={4} />
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

/**
 * A ball dropped from the top of a 300px room, traced for five seconds with the real step(): its height above the
 * floor and its speed, frame by frame. Dots mark each bounce. Hover a chart to read a moment.
 */
export function Trace() {
  const [gravity, setGravity] = useState(2000);
  const [bounciness, setBounciness] = useState(0.8);
  const [friction, setFriction] = useState(0);
  const [start, setStart] = useState(0);
  const [rate, setRate] = useState("60");
  const [hovered, setHovered] = useState<number | null>(null);

  const samples = useMemo(() => simulate({ gravity, bounciness, friction }, start, Number(rate)), [gravity, bounciness, friction, start, rate]);
  const bounces = samples.filter((sample) => sample.bounced).length;
  const restingFrom = samples.findIndex((_, index) => samples.slice(index).every((sample) => sample.speed === 0 && sample.height === 0));
  const point = hovered === null ? null : samples[Math.min(hovered, samples.length - 1)];

  return (
    <div className="explain">
      <div className="explain__controls">
        <Slider label="Gravity" value={gravity} min={0} max={4000} step={50} unit="px/s²" onChange={setGravity} />
        <Slider label="Bounciness" value={bounciness} min={0} max={1} step={0.05} digits={2} onChange={setBounciness} />
        <Slider label="Friction" value={friction} min={0} max={3} step={0.05} digits={2} onChange={setFriction} />
        <Slider label="Starting speed, down" value={start} min={0} max={1500} step={10} unit="px/s" onChange={setStart} />
        <FrameRate name="trace-rate" value={rate} onChange={setRate} />
      </div>
      <ul className="explain__facts">
        <li>
          Each bounce keeps {percent(bounciness)} of the speed, so with gravity the ball rises {percent(bounciness ** 2)} as high as the bounce
          before (height grows with speed squared).
        </li>
        <li>
          {friction > 0
            ? `Friction leaves ${percent(Math.exp(-friction))} of the speed after each second, whether or not it bounces.`
            : "No friction: only the bounces take speed away."}
        </li>
        <li>
          {gravity === 0 && start === 0
            ? "With no gravity and no starting speed, nothing moves."
            : `${bounces} ${bounces === 1 ? "bounce" : "bounces"} in ${DURATION} seconds${restingFrom > 0 ? `, resting on the floor from ${fixed(samples[restingFrom]!.time, 2)} s` : ""}.`}
        </li>
      </ul>
      <p className="explain__readout" aria-live="polite">
        {point
          ? `At ${fixed(point.time, 2)} s: ${fixed(point.height)} px above the floor, moving at ${fixed(point.speed)} px/s.`
          : "Hover a chart to read the height and speed at any moment."}
      </p>
      <Chart samples={samples} field="height" title="Height above the floor" unit="px" hovered={hovered} onHover={setHovered} />
      <Chart samples={samples} field="speed" title="Speed" unit="px/s" hovered={hovered} onHover={setHovered} />
    </div>
  );
}
