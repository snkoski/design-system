import { useId, useMemo, useState } from "react";
import type { PointerEvent } from "react";
import { Segment, SegmentedControl } from "../../components/SegmentedControl";
import { step } from "../Bounce/physics";
import { fixed, percent, Slider } from "../../how-it-works/demo";
import { collide, G, orbitVelocity, pulls, REST } from "./gravity";
import type { OrbitDirection } from "./gravity";
import "./explain.css";

/* Live demos for Orbits' "How it works" page. They call the real orbitVelocity(), pulls(), and collide() from
   gravity.ts, and Bounce's step(), so what they show is what runs. */

/** A number with thousands separators */
const grouped = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 1 });

const DIRECTIONS: { value: OrbitDirection; label: string }[] = [
  { value: "clockwise", label: "Clockwise" },
  { value: "counterclockwise", label: "Counterclockwise" },
];

/** The Launch picture: its size, and how many of its units a px of distance or a px/s of speed is drawn as */
const VIEW = 400;
const DISTANCE_SCALE = 0.5;
const SPEED_SCALE = 0.22;

/**
 * orbitVelocity() worked out with your numbers, for a planet some distance from a star: the speed a circular
 * orbit needs, and which way it points. The last line is what the real orbitVelocity() returned.
 */
export function Launch() {
  const [mass, setMass] = useState(100);
  const [distance, setDistance] = useState(200);
  const [angle, setAngle] = useState(0);
  const [direction, setDirection] = useState<OrbitDirection>("counterclockwise");
  const arrow = `launch-arrow-${useId().replace(/[^\w-]/g, "")}`;

  // The star at (0, 0) and the planet `distance` away, at `angle` degrees (0 is right, 90 is down), both 0 px across
  const radians = (angle * Math.PI) / 180;
  const star = { x: 0, y: 0, width: 0, height: 0, vx: 0, vy: 0, mass, fixed: true };
  const planet = { x: distance * Math.cos(radians), y: distance * Math.sin(radians), width: 0, height: 0, vx: 0, vy: 0, mass: 1, fixed: false };
  const result = orbitVelocity(planet, [star, planet], direction)!;

  const pull = (G * mass) / distance ** 2;
  const speed = Math.sqrt((G * mass) / distance);
  const [ux, uy] = [-Math.cos(radians), -Math.sin(radians)];
  const [tx, ty] = direction === "clockwise" ? [uy, -ux] : [-uy, ux];
  const period = (2 * Math.PI * distance) / speed;

  const center = VIEW / 2;
  const [px, py] = [center + planet.x * DISTANCE_SCALE, center + planet.y * DISTANCE_SCALE];

  return (
    <div className="explain">
      <div className="explain__controls">
        <Slider label="Star mass" value={mass} min={10} max={300} step={10} onChange={setMass} />
        <Slider label="Distance from the star" value={distance} min={50} max={300} step={5} unit="px" onChange={setDistance} />
        <Slider label="Where it is around the star" value={angle} min={0} max={355} step={5} unit="degrees" onChange={setAngle} />
        <div className="orbit-explain__wide">
          <SegmentedControl label="Direction" name="launch-direction" value={direction} onValueChange={(value) => setDirection(value as OrbitDirection)}>
            {DIRECTIONS.map(({ value, label }) => (
              <Segment key={value} value={value}>
                {label}
              </Segment>
            ))}
          </SegmentedControl>
        </div>
      </div>
      <p className="explain__note">An angle of 0 degrees puts the planet to the right of the star, and 90 degrees puts it below. Distances are center to center.</p>
      <div className="orbit-explain__launch">
        <ol className="explain__steps">
          <li>
            <strong>The pull.</strong>{" "}
            <code>
              G × mass / distance² = {grouped(G)} × {mass} / {distance}² = {fixed(pull, 1)}
            </code>{" "}
            px/s², towards the star.
          </li>
          <li>
            <strong>The speed.</strong> A circle needs exactly that pull to bend its path, so{" "}
            <code>
              speed = √({grouped(G)} × {mass} / {distance}) = {fixed(speed)}
            </code>{" "}
            px/s.
          </li>
          <li>
            <strong>Towards the star.</strong> <code>(ux, uy) = ({fixed(ux, 2)}, {fixed(uy, 2)})</code>
          </li>
          <li>
            <strong>A right angle, {direction}.</strong>{" "}
            <code>
              {direction === "clockwise" ? "(uy, −ux)" : "(−uy, ux)"} = ({fixed(tx, 2)}, {fixed(ty, 2)})
            </code>
          </li>
          <li>
            <strong>Velocity.</strong>{" "}
            <code>
              vx = {fixed(tx, 2)} × {fixed(speed)} = {fixed(tx * speed)}
            </code>
            , <code>
              vy = {fixed(ty, 2)} × {fixed(speed)} = {fixed(ty * speed)}
            </code>{" "}
            px/s.
          </li>
          <li>
            <strong>Once round</strong> takes <code>2π × {distance} / {fixed(speed)} = {fixed(period, 1)}</code> seconds.
          </li>
        </ol>
        <figure className="orbit-explain__view orbit-explain__small">
          <svg viewBox={`0 0 ${VIEW} ${VIEW}`} role="img" aria-label={`A planet ${distance} px from the star, about to go round it ${direction}`}>
            <defs>
              <marker id={arrow} viewBox="0 0 10 10" refX={8} refY={5} markerWidth={5} markerHeight={5} orient="auto-start-reverse">
                <path className="orbit-explain__head" d="M 0 0 L 10 5 L 0 10 z" />
              </marker>
            </defs>
            <circle className="orbit-explain__orbit" cx={center} cy={center} r={distance * DISTANCE_SCALE} />
            <line className="orbit-explain__radius" x1={center} y1={center} x2={px} y2={py} />
            <circle className="orbit-explain__star" cx={center} cy={center} r={14} />
            <line className="orbit-explain__arrow" x1={px} y1={py} x2={px + tx * speed * SPEED_SCALE} y2={py + ty * speed * SPEED_SCALE} markerEnd={`url(#${arrow})`} />
            <circle className="orbit-explain__planet" cx={px} cy={py} r={7} />
          </svg>
          <figcaption className="explain__note">The arrow is its velocity. The dashed circle is the orbit it starts.</figcaption>
        </figure>
      </div>
      <p className="explain__result">
        The real <code>orbitVelocity()</code> returned <code>vx = {fixed(result.vx)}</code> and <code>vy = {fixed(result.vy)}</code> px/s.
      </p>
    </div>
  );
}

/** The Orbit demo's box, star, and planet, in px, and how long it runs, in seconds */
const BOX = 600;
const STAR_SIZE = 64;
const STAR_MASS = 100;
const PLANET_SIZE = 20;
const DURATION = 10;
const RATES = ["120", "60", "30", "20"];

interface Sample {
  /** Seconds since it started */
  time: number;
  /** The planet's center, in px from the box's top left corner */
  x: number;
  y: number;
  /** Px from the star's center */
  distance: number;
  /** Px per second */
  speed: number;
  /** It bounced off a wall or the star this frame (resting on the star doesn't count) */
  bumped: boolean;
}

/**
 * One planet and a fixed star in a 600 px box, run frame by frame the way Bounce's loop runs it: pulls() before it
 * moves, step() to move it, and collide() after. It starts to the right of the star, sent off counterclockwise at
 * `share` of the speed orbitVelocity() gives.
 */
function simulate(share: number, distance: number, friction: number, rate: number) {
  const seconds = 1 / rate;
  const star = { x: BOX / 2 - STAR_SIZE / 2, y: BOX / 2 - STAR_SIZE / 2, width: STAR_SIZE, height: STAR_SIZE, vx: 0, vy: 0, mass: STAR_MASS, fixed: true };
  let planet = { x: BOX / 2 + distance - PLANET_SIZE / 2, y: BOX / 2 - PLANET_SIZE / 2, width: PLANET_SIZE, height: PLANET_SIZE, vx: 0, vy: 0, mass: 1, fixed: false };
  const launch = orbitVelocity(planet, [star, planet], "counterclockwise")!;
  planet = { ...planet, vx: launch.vx * share, vy: launch.vy * share };
  const room = { width: BOX - PLANET_SIZE, height: BOX - PLANET_SIZE };

  const sample = (time: number, bumped: boolean): Sample => {
    const [x, y] = [planet.x + PLANET_SIZE / 2, planet.y + PLANET_SIZE / 2];
    return { time, x, y, distance: Math.hypot(x - BOX / 2, y - BOX / 2), speed: Math.hypot(planet.vx, planet.vy), bumped };
  };
  const samples = [sample(0, false)];
  for (let frame = 1; frame <= DURATION * rate; frame++) {
    // Push: the star's pull changes the planet's velocity
    const [, pull] = pulls([star, planet]);
    const pushed = { x: planet.x, y: planet.y, vx: planet.vx + pull!.ax * seconds, vy: planet.vy + pull!.ay * seconds };
    // Move: Bounce's step() applies friction, moves it, and bounces it off the walls
    const { body, edges } = step(pushed, room, seconds, { gravity: 0, bounciness: 1, friction });
    // Settle: collide() keeps it out of the star
    const [, settled] = collide([star, { ...planet, ...body }]);
    // A bounce off the star, rather than resting on it: collide() moved it, and it was closing faster than REST
    const [dx, dy] = [body.x - star.x - (STAR_SIZE - PLANET_SIZE) / 2, body.y - star.y - (STAR_SIZE - PLANET_SIZE) / 2];
    const closing = -(body.vx * dx + body.vy * dy) / Math.hypot(dx, dy);
    const hit = (settled!.x !== body.x || settled!.y !== body.y) && closing >= REST;
    planet = settled!;
    samples.push(sample(frame * seconds, edges.length > 0 || hit));
  }
  return { samples, circular: Math.hypot(launch.vx, launch.vy) };
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
  field: "distance" | "speed";
  title: string;
  unit: string;
  hovered: number | null;
  onHover: (index: number | null) => void;
}

function Chart({ samples, field, title, unit, hovered, onHover }: ChartProps) {
  const top = ceiling(Math.max(...samples.map((sample) => sample[field]), 100));
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
        {Array.from({ length: DURATION / 2 + 1 }, (_, index) => (
          <text key={index} className="explain-chart__tick" x={x(index * 2)} y={HEIGHT - 6} textAnchor="middle">
            {index * 2} s
          </text>
        ))}
        <polyline className="explain-chart__line" points={points} />
        {samples
          .filter((sample) => sample.bumped)
          .map((sample) => (
            <circle key={sample.time} className="explain-chart__bounce" cx={x(sample.time)} cy={y(sample[field])} r={4} />
          ))}
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

/** Where the planet went, seen from above: the box, the star, the circle it would follow at full speed, and its path */
function Path({ samples, distance, hovered }: { samples: Sample[]; distance: number; hovered: number | null }) {
  const point = samples[hovered ?? samples.length - 1]!;
  const points = samples.map((sample) => `${sample.x.toFixed(1)},${sample.y.toFixed(1)}`).join(" ");
  return (
    <figure className="orbit-explain__view">
      <svg viewBox={`0 0 ${BOX} ${BOX}`} role="img" aria-label={`The planet's path over ${DURATION} seconds, seen from above`}>
        <rect className="orbit-explain__box" x={0} y={0} width={BOX} height={BOX} />
        <circle className="orbit-explain__orbit" cx={BOX / 2} cy={BOX / 2} r={distance} />
        <circle className="orbit-explain__star" cx={BOX / 2} cy={BOX / 2} r={STAR_SIZE / 2} />
        <polyline className="explain-chart__line" points={points} />
        <circle className="orbit-explain__planet" cx={point.x} cy={point.y} r={PLANET_SIZE / 2} />
      </svg>
      <figcaption className="explain__note">
        Seen from above. The dashed circle is the orbit at full speed. The dot is the planet {hovered === null ? `after ${DURATION} seconds` : `at ${fixed(point.time, 2)} s`}.
      </figcaption>
    </figure>
  );
}

/** Where a planet sent off sideways at `share` of circular speed, `distance` from the star, turns round: the other end of its orbit */
const turnsAt = (share: number, distance: number) => (distance * share ** 2) / (2 - share ** 2);

/**
 * A planet sent off from beside a fixed star at a share of the speed a circle needs, traced for ten seconds with
 * the real pulls(), step(), and collide(): its path, its distance from the star, and its speed. Hover a chart to
 * read a moment.
 */
export function Orbit() {
  const [share, setShare] = useState(80);
  const [distance, setDistance] = useState(150);
  const [friction, setFriction] = useState(0);
  const [rate, setRate] = useState("60");
  const [hovered, setHovered] = useState<number | null>(null);

  const { samples, circular } = useMemo(() => simulate(share / 100, distance, friction, Number(rate)), [share, distance, friction, rate]);
  const point = hovered === null ? null : samples[Math.min(hovered, samples.length - 1)];
  const bumps = samples.filter((sample) => sample.bumped).length;
  const fraction = share / 100;
  const touching = (STAR_SIZE + PLANET_SIZE) / 2;
  const wall = BOX / 2 - PLANET_SIZE / 2;

  let shape: string;
  if (fraction === 0) shape = "It starts still, so it falls straight into the star.";
  else if (fraction === 1) shape = `At exactly circular speed, it keeps ${distance} px from the star all the way round.`;
  else if (fraction ** 2 >= 2) shape = `At √2 (about 141%) of circular speed or more, it's fast enough to escape the star altogether, so it carries on until it hits a wall.`;
  else {
    const other = turnsAt(fraction, distance);
    const where = fraction < 1 ? "falls inwards" : "swings outwards";
    const end =
      other <= touching
        ? `, which is closer than ${touching} px, where it touches the star, so it hits the star`
        : other >= wall
          ? `, but the walls are only ${wall} px away, so it hits a wall first`
          : "";
    shape = `It ${where} on an ellipse, turning round ${fixed(other)} px from the star${end}.`;
  }

  return (
    <div className="explain">
      <div className="explain__controls">
        <Slider label="Launch speed" value={share} min={0} max={160} step={5} unit="percent of circular" onChange={setShare} />
        <Slider label="Distance from the star" value={distance} min={80} max={250} step={5} unit="px" onChange={setDistance} />
        <Slider label="Friction" value={friction} min={0} max={0.5} step={0.01} digits={2} onChange={setFriction} />
        <SegmentedControl label="Frames per second" name="orbit-rate" value={rate} onValueChange={setRate}>
          {RATES.map((option) => (
            <Segment key={option} value={option}>
              {option}
            </Segment>
          ))}
        </SegmentedControl>
      </div>
      <ul className="explain__facts">
        <li>
          A circle at {distance} px from a star of mass {STAR_MASS} needs {fixed(circular)} px/s, so it starts at {percent(fraction)} of that: {fixed(circular * fraction)} px/s.
        </li>
        <li>{shape}</li>
        <li>
          {friction > 0
            ? `Friction takes ${percent(1 - Math.exp(-friction))} of its speed every second, so it can't keep up the speed an orbit needs, and it spirals in.`
            : "No friction: nothing slows it down, so an orbit keeps its size."}
        </li>
        <li>
          {bumps === 0 ? "It never touches the star or a wall." : `It bounces off the star or a wall ${bumps === 1 ? "once" : bumps === 2 ? "twice" : `${bumps} times`}, marked with dots.`}
        </li>
      </ul>
      <p className="explain__readout" aria-live="polite">
        {point
          ? `At ${fixed(point.time, 2)} s: ${fixed(point.distance)} px from the star, moving at ${fixed(point.speed)} px/s.`
          : "Hover a chart to read the distance and speed at any moment, and to see where the planet was."}
      </p>
      <div className="orbit-explain__trace">
        <Path samples={samples} distance={distance} hovered={hovered} />
        <div className="orbit-explain__charts">
          <Chart samples={samples} field="distance" title="Distance from the star" unit="px" hovered={hovered} onHover={setHovered} />
          <Chart samples={samples} field="speed" title="Speed" unit="px/s" hovered={hovered} onHover={setHovered} />
        </div>
      </div>
    </div>
  );
}
