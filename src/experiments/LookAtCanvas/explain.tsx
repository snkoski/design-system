import { useMemo, useState } from "react";
import type { PointerEvent } from "react";
import { Segment, SegmentedControl } from "@/components/SegmentedControl";
import { fixed, percent, Slider } from "@/how-it-works/demo";
import { colorAt } from "@/experiments/Proximity/tracker";
import "@/experiments/LookAtCanvas/explain.css";
import { catchUp, fadeAlpha, step } from "@/experiments/LookAtCanvas/field";
import { LEVELS } from "@/experiments/LookAtCanvas/LookAtCanvas";

/* Live demos for the "How it works" page. They call the real catchUp(), step(), and fadeAlpha() from field.ts, and
   colorAt() from Proximity, so what they show is what runs. */

const RATES = ["120", "60", "30"];

interface Sample {
  /** Ms since the pointer moved */
  time: number;
  /** The bar's angle, in degrees clockwise from up */
  angle: number;
}

/** The most frames to run, so a very long turn still ends */
const MOST_FRAMES = 2000;

/**
 * Runs the real step() on a one-bar field, frame by frame: the bar starts upright, and the pointer has just moved to
 * `turn` degrees round from it. Returns every frame's angle, and when step() said it had arrived.
 */
function simulate(turn: number, turnDuration: number, rate: number) {
  const elapsed = 1000 / rate;
  const angles = new Float32Array(1);
  const layout = { columns: 1, rows: 1, pitch: 20 };
  // The bar's center is (10, 10); the pointer is 100px away from it, `turn` degrees clockwise from straight up
  const radians = (turn * Math.PI) / 180;
  const pointer = { x: 10 + 100 * Math.sin(radians), y: 10 - 100 * Math.cos(radians) };
  const amount = catchUp(elapsed, turnDuration);
  const samples: Sample[] = [{ time: 0, angle: 0 }];
  let arrived: number | null = null;
  for (let frame = 1; frame <= MOST_FRAMES && arrived === null; frame++) {
    const settled = step(angles, layout, pointer, amount);
    samples.push({ time: frame * elapsed, angle: angles[0]! });
    if (settled) arrived = frame;
  }
  return { samples, amount, arrived, elapsed };
}

const WIDTH = 640;
const HEIGHT = 200;
const MARGIN = { top: 14, right: 12, bottom: 26, left: 44 };
const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

/**
 * One bar turning toward a pointer that has just moved, frame by frame, with the real catchUp() and step(). Each
 * frame turns it the same share of the way it has left, so it eases out. Hover the chart to read a frame.
 */
export function CatchUp() {
  const [turnDuration, setTurnDuration] = useState(120);
  const [rate, setRate] = useState("60");
  const [turn, setTurn] = useState(80);
  const [hovered, setHovered] = useState<number | null>(null);

  const { samples, amount, arrived, elapsed } = useMemo(() => simulate(turn, turnDuration, Number(rate)), [turn, turnDuration, rate]);
  const last = samples[samples.length - 1]!.time;
  const span = Math.max(200, Math.ceil(Math.max(last, turnDuration) / 100) * 100);
  const x = (time: number) => MARGIN.left + (time / span) * plotWidth;
  const y = (angle: number) => MARGIN.top + plotHeight - (angle / turn) * plotHeight;
  const points = samples.map((sample) => `${x(sample.time).toFixed(1)},${y(sample.angle).toFixed(1)}`).join(" ");
  const point = hovered === null ? null : samples[Math.min(hovered, samples.length - 1)]!;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((share) => Math.round(share * span));

  const hover = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const time = Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1) * span;
    setHovered(Math.min(Math.round(time / elapsed), samples.length - 1));
  };

  return (
    <div className="explain">
      <div className="explain__controls">
        <Slider label="Turn duration" value={turnDuration} min={0} max={1000} step={10} unit="ms" onChange={setTurnDuration} />
        <Slider label="Turn to make" value={turn} min={10} max={85} step={5} unit="°" onChange={setTurn} />
        <SegmentedControl label="Frames per second" name="catch-up-rate" value={rate} onValueChange={setRate}>
          {RATES.map((each) => (
            <Segment key={each} value={each}>
              {each}
            </Segment>
          ))}
        </SegmentedControl>
      </div>
      <ul className="explain__facts">
        <li>
          {turnDuration > 0 ? (
            <>
              <code>
                catchUp({fixed(elapsed)}, {turnDuration}) = 1 − e^(−3 × {fixed(elapsed)} / {turnDuration}) = {fixed(amount, 3)}
              </code>
              , so each frame turns the bar {percent(amount)} of the way it has left to go.
            </>
          ) : (
            <>
              <code>catchUp({fixed(elapsed)}, 0) = 1</code>, so the bar snaps straight round in one frame.
            </>
          )}
        </li>
        {turnDuration > 0 && <li>After {turnDuration} ms, the turn duration, it's 95% of the way round, whatever the frame rate.</li>}
        <li>
          {arrived === null
            ? `Still turning after ${MOST_FRAMES} frames.`
            : `Within 0.05° of the target after ${arrived} ${arrived === 1 ? "frame" : "frames"} (${fixed(arrived * elapsed, 0)} ms): step() returns true, and the loop stops drawing.`}
        </li>
      </ul>
      <p className="explain__readout" aria-live="polite">
        {point
          ? `Frame ${Math.round(point.time / elapsed)}, at ${fixed(point.time, 0)} ms: turned ${fixed(point.angle)}°, ${percent(point.angle / turn)} of the way.`
          : "Hover the chart to read the angle at any frame."}
      </p>
      <figure className="explain-chart">
        <figcaption className="explain-chart__title">
          The bar's angle <span className="explain-chart__unit">(degrees)</span>
        </figcaption>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`The bar's angle, turning ${turn} degrees`}>
          {[0, turn / 2, turn].map((value) => (
            <g key={value}>
              <line className="explain-chart__grid" x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y(value)} y2={y(value)} />
              <text className="explain-chart__tick" x={MARGIN.left - 8} y={y(value)} textAnchor="end" dominantBaseline="middle">
                {fixed(value, value % 1 ? 1 : 0)}
              </text>
            </g>
          ))}
          {ticks.map((time) => (
            <text key={time} className="explain-chart__tick" x={x(time)} y={HEIGHT - 6} textAnchor="middle">
              {time} ms
            </text>
          ))}
          {turnDuration > 0 && (
            <g>
              <line className="catch-up__mark" x1={x(turnDuration)} x2={x(turnDuration)} y1={MARGIN.top} y2={MARGIN.top + plotHeight} />
              <text className="explain-chart__tick" x={x(turnDuration) + 6} y={y(turn * 0.5)} dominantBaseline="middle">
                turn duration: 95%
              </text>
            </g>
          )}
          <polyline className="explain-chart__line" points={points} />
          {samples.length <= 60 &&
            samples.map((sample) => <circle key={sample.time} className="catch-up__frame" cx={x(sample.time)} cy={y(sample.angle)} r={2.5} />)}
          {point && (
            <g>
              <line className="explain-chart__cursor" x1={x(point.time)} x2={x(point.time)} y1={MARGIN.top} y2={MARGIN.top + plotHeight} />
              <circle className="explain-chart__point" cx={x(point.time)} cy={y(point.angle)} r={4} />
            </g>
          )}
          <rect
            className="explain-chart__hit"
            x={MARGIN.left}
            y={MARGIN.top}
            width={plotWidth}
            height={plotHeight}
            onPointerMove={hover}
            onPointerLeave={() => setHovered(null)}
          />
        </svg>
      </figure>
    </div>
  );
}

// The same plain blue and red as the stories, rather than the palette's tokens: the point is to see them mix
const BLUE = "hsl(220 90% 55%)";
const RED = "hsl(0 85% 55%)";

/**
 * The LEVELS steps of closeness a frame is drawn in: each one's color, from the real colorAt(), and opacity, from
 * the real fadeAlpha(). Pick a bar's closeness to see which step it's drawn in.
 */
export function Steps() {
  const [level, setLevel] = useState(0.47);
  const [fade, setFade] = useState("none");
  const [faintest, setFaintest] = useState(0.2);
  const fading = fade === "none" ? undefined : (fade as "in" | "out");

  const bucket = Math.round(level * (LEVELS - 1));
  const share = bucket / (LEVELS - 1);
  const alpha = fadeAlpha(share, fading, faintest);

  return (
    <div className="explain">
      <div className="explain__controls">
        <Slider label="A bar's closeness" value={level} min={0} max={1} step={0.01} digits={2} onChange={setLevel} />
        <SegmentedControl label="Fade" name="steps-fade" value={fade} onValueChange={setFade}>
          <Segment value="none">None</Segment>
          <Segment value="in">In</Segment>
          <Segment value="out">Out</Segment>
        </SegmentedControl>
        <Slider label="Faintest" value={faintest} min={0} max={1} step={0.05} digits={2} onChange={setFaintest} />
      </div>
      <ol className="explain__steps">
        <li>
          <strong>Its step.</strong>{" "}
          <code>
            Math.round({fixed(level, 2)} × {LEVELS - 1}) = {bucket}
          </code>
          , so the bar is added to path {bucket}, with every other bar at that step.
        </li>
        <li>
          <strong>The step's color.</strong>{" "}
          <code>
            colorAt(colors, {bucket} / {LEVELS - 1})
          </code>{" "}
          is <code>{colorAt([BLUE, RED], share, "srgb")}</code>, worked out once for all {LEVELS} steps, not once per bar.
        </li>
        <li>
          <strong>The step's opacity.</strong>{" "}
          <code>
            fadeAlpha({fixed(share, 3)}, {fading ? `"${fading}"` : "undefined"}, {fixed(faintest, 2)}) = {fixed(alpha, 2)}
          </code>
          {alpha < 1 / 256 ? ", too faint to see, so the path isn't drawn at all." : "."}
        </li>
      </ol>
      <div className="level-strip" role="img" aria-label={`${LEVELS} steps from blue to red, step ${bucket} picked`}>
        {Array.from({ length: LEVELS }, (_, index) => {
          const each = index / (LEVELS - 1);
          return (
            <span key={index} className="level-strip__step" data-current={index === bucket || undefined}>
              <span style={{ background: colorAt([BLUE, RED], each, "srgb")!, opacity: fadeAlpha(each, fading, faintest) }} />
            </span>
          );
        })}
      </div>
      <p className="explain__note">
        Closeness {fixed(Math.max((bucket - 0.5) / (LEVELS - 1), 0), 3)} to {fixed(Math.min((bucket + 0.5) / (LEVELS - 1), 1), 3)} all rounds to step {bucket}. However many bars
        there are, a frame is at most {LEVELS} strokes.
      </p>
    </div>
  );
}
