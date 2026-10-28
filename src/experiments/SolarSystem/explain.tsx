import { useMemo, useState } from "react";
import type { PointerEvent } from "react";
import { fixed, percent, Slider } from "../../how-it-works/demo";
import { PLANETS } from "./bodies";
import "./explain.css";
import { placeOnOrbit, solveKepler } from "./kepler";
import type { Elements } from "./kepler";
import { scaleDistance } from "./scale";
import type { DistanceScale } from "./scale";
import { OUTERMOST, RINGS } from "./SolarSystem";

/* Live demos for the "How it works" page. They call the real solveKepler(), placeOnOrbit(), and scaleDistance(), so what they show is what runs. */

const radians = (degrees: number) => (degrees * Math.PI) / 180;
const degrees = (radians: number) => (radians * 180) / Math.PI;

/** A flat orbit 1 AU across its long half, with its closest point to the Sun along x: only `e` changes its shape */
const flat = (e: number): Elements => ({ a: 1, e, inclination: 0, meanLongitude: 0, perihelion: 0, node: 0 });

interface Round {
  guess: number;
  error: number;
  slope: number;
  change: number;
}

/** Newton's method for Kepler's equation, worked the same way solveKepler() does it, keeping every round to show */
function rounds(meanAnomaly: number, e: number) {
  let eccentric = e < 0.8 ? meanAnomaly + e * Math.sin(meanAnomaly) : Math.PI;
  const done: Round[] = [];
  for (let step = 0; step < 50; step++) {
    const error = eccentric - e * Math.sin(eccentric) - meanAnomaly;
    const slope = 1 - e * Math.cos(eccentric);
    const change = error / slope;
    done.push({ guess: eccentric, error, slope, change });
    eccentric -= change;
    if (Math.abs(change) < 1e-12) break;
  }
  return done;
}

/** A tiny number written so it can be read: "0.0234", or "8.3 × 10⁻¹⁰" */
function small(value: number) {
  if (value === 0 || Math.abs(value) >= 0.0001) return fixed(value, 4).replace("-", "−");
  const power = Math.floor(Math.log10(Math.abs(value)));
  const superscript = String(power).replace(/-/g, "⁻").replace(/\d/g, (digit) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(digit)]!);
  return `${fixed(value / 10 ** power, 1).replace("-", "−")} × 10${superscript}`;
}

/** The diagram's size: the orbit's long half is R view units */
const R = 130;
const VIEW = { width: 2 * R + 80, height: 2 * R + 40 };

/**
 * Kepler's equation solved for your numbers, round by round, and drawn: the circle round the orbit, the angle E on
 * it, and the planet straight below or above it on the ellipse.
 */
export function SolveKepler() {
  const [e, setE] = useState(0.4);
  const [mean, setMean] = useState(60);

  const M = radians(mean);
  const steps = rounds(M, e);
  const E = solveKepler(M, e);
  const place = placeOnOrbit(flat(e), E);
  const distance = Math.hypot(place.x, place.y);

  // Drawn with the orbit's middle in the middle of the picture. The Sun is a × e to the right of it.
  const middle = { x: VIEW.width / 2, y: VIEW.height / 2 };
  const sun = { x: middle.x + e * R, y: middle.y };
  const onCircle = (angle: number) => ({ x: middle.x + R * Math.cos(angle), y: middle.y - R * Math.sin(angle) });
  const circleE = onCircle(E);
  const circleM = onCircle(M);
  const planet = { x: sun.x + place.x * R, y: sun.y - place.y * R };

  return (
    <div className="explain">
      <div className="explain__controls">
        <Slider label="Eccentricity (e)" value={e} min={0} max={0.95} step={0.01} digits={2} onChange={setE} />
        <Slider label="Mean anomaly (M)" value={mean} min={-180} max={180} step={1} unit="°" onChange={setMean} />
      </div>
      <p className="explain__note">
        M is how far round the planet would be at a steady speed, from its closest point to the Sun. Earth&rsquo;s eccentricity is 0.017,
        Mercury&rsquo;s 0.21, and Pluto&rsquo;s 0.25. Halley&rsquo;s comet&rsquo;s is 0.97.
      </p>
      <div className="kepler-demo">
        <svg className="kepler-demo__view" viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} role="img" aria-label={`An ellipse with eccentricity ${fixed(e, 2)}, and the planet ${fixed(degrees(E))}° round its circle`}>
          <line className="kepler-demo__axis" x1={middle.x - R - 10} x2={middle.x + R + 10} y1={middle.y} y2={middle.y} />
          <circle className="kepler-demo__circle" cx={middle.x} cy={middle.y} r={R} />
          <ellipse className="kepler-demo__orbit" cx={middle.x} cy={middle.y} rx={R} ry={R * Math.sqrt(1 - e * e)} />
          <line className="kepler-demo__spoke" x1={middle.x} y1={middle.y} x2={circleM.x} y2={circleM.y} />
          <line className="kepler-demo__spoke" data-solved x1={middle.x} y1={middle.y} x2={circleE.x} y2={circleE.y} />
          <line className="kepler-demo__drop" x1={circleE.x} y1={circleE.y} x2={planet.x} y2={planet.y} />
          <line className="kepler-demo__radius" x1={sun.x} y1={sun.y} x2={planet.x} y2={planet.y} />
          <circle className="kepler-demo__middle" cx={middle.x} cy={middle.y} r={3} />
          <circle className="kepler-demo__sun" cx={sun.x} cy={sun.y} r={7} />
          <circle className="kepler-demo__mark" cx={circleM.x} cy={circleM.y} r={5} />
          <circle className="kepler-demo__mark" data-solved cx={circleE.x} cy={circleE.y} r={5} />
          <circle className="kepler-demo__planet" cx={planet.x} cy={planet.y} r={7} />
          <text className="kepler-demo__label" x={circleM.x + (circleM.x - middle.x) * 0.12} y={circleM.y + (circleM.y - middle.y) * 0.12}>
            M
          </text>
          <text className="kepler-demo__label" x={circleE.x + (circleE.x - middle.x) * 0.12} y={circleE.y + (circleE.y - middle.y) * 0.12}>
            E
          </text>
          <text className="kepler-demo__label" data-small x={sun.x} y={sun.y + 20}>
            Sun
          </text>
        </svg>
        <ul className="kepler-demo__key">
          <li>
            <span className="kepler-demo__swatch" data-shape="sun" aria-hidden="true" /> The Sun, {fixed(e, 2)} of the long half from the middle
          </li>
          <li>
            <span className="kepler-demo__swatch" data-shape="planet" aria-hidden="true" /> The planet, on the ellipse
          </li>
          <li>
            <span className="kepler-demo__swatch" data-shape="dashed" aria-hidden="true" /> The circle round the ellipse, and the angles M and E
            from its middle
          </li>
          <li>
            <span className="kepler-demo__swatch" data-shape="drop" aria-hidden="true" /> Straight down (or up) from E on the circle to the planet
          </li>
        </ul>
      </div>
      <ol className="explain__steps">
        <li>
          <strong>In radians.</strong> <code>M = {mean}° × π ÷ 180 = {fixed(M, 4)}</code>
        </li>
        <li>
          <strong>First guess.</strong>{" "}
          {e < 0.8 ? (
            <code>
              E = M + e sin M = {fixed(M, 4)} + {fixed(e, 2)} × {fixed(Math.sin(M), 4)} = {fixed(steps[0]!.guess, 4)}
            </code>
          ) : (
            <>
              With e of 0.8 or more, it starts from <code>E = π = 3.1416</code>.
            </>
          )}
        </li>
        {steps.map((round, index) => (
          <li key={index}>
            <strong>Round {index + 1}.</strong> How far off: <code>E − e sin E − M = {small(round.error)}</code>. The slope:{" "}
            <code>1 − e cos E = {fixed(round.slope, 4)}</code>. So{" "}
            <code>
              E = {fixed(round.guess, 6)} − {round.error < 0 ? `(${small(round.error)})` : small(round.error)} ÷ {fixed(round.slope, 4)} ={" "}
              {fixed(round.guess - round.change, 6)}
            </code>
            {Math.abs(round.change) < 1e-12 ? ". That changed it by less than a trillionth, so it stops." : "."}
          </li>
        ))}
        <li>
          <strong>The place.</strong>{" "}
          <code>
            x = cos E − e = {fixed(place.x, 3)}
          </code>{" "}
          and{" "}
          <code>
            y = √(1 − e²) sin E = {fixed(place.y, 3)}
          </code>
          , so the planet is {fixed(distance, 3)} AU from the Sun.
        </li>
      </ol>
      <p className="explain__result">
        The real <code>solveKepler()</code> returned <code>E = {fixed(E, 6)}</code> ({fixed(degrees(E))}°), after {steps.length}{" "}
        {steps.length === 1 ? "round" : "rounds"}. Check: <code>E − e sin E = {fixed(E - e * Math.sin(E), 6)}</code>, which is M.
      </p>
    </div>
  );
}

interface Sample {
  /** How far through one orbit, from 0 to 1 */
  time: number;
  /** From the Sun, in AU */
  distance: number;
  /** Degrees round from the closest point, 0 to 360 */
  angle: number;
}

const SAMPLES = 240;

/** One whole orbit, at evenly spaced times, through the real solveKepler() and placeOnOrbit() */
function orbit(e: number) {
  return Array.from({ length: SAMPLES + 1 }, (_, index): Sample => {
    const time = index / SAMPLES;
    const M = 2 * Math.PI * time;
    const place = placeOnOrbit(flat(e), solveKepler(Math.atan2(Math.sin(M), Math.cos(M)), e));
    const angle = (degrees(Math.atan2(place.y, place.x)) + 360) % 360;
    return { time, distance: Math.hypot(place.x, place.y), angle: index === SAMPLES ? 360 : angle };
  });
}

const WIDTH = 640;
const HEIGHT = 170;
const MARGIN = { top: 12, right: 12, bottom: 26, left: 52 };
const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

interface ChartProps {
  samples: Sample[];
  field: "distance" | "angle";
  title: string;
  unit: string;
  top: number;
  ticks: number[];
  hovered: number | null;
  onHover: (index: number | null) => void;
}

function Chart({ samples, field, title, unit, top, ticks, hovered, onHover }: ChartProps) {
  const x = (time: number) => MARGIN.left + time * plotWidth;
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
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`${title}, over one orbit`}>
        {ticks.map((value) => (
          <g key={value}>
            <line className="explain-chart__grid" x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y(value)} y2={y(value)} />
            <text className="explain-chart__tick" x={MARGIN.left - 8} y={y(value)} textAnchor="end" dominantBaseline="middle">
              {value}
            </text>
          </g>
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map((time) => (
          <text key={time} className="explain-chart__tick" x={x(time)} y={HEIGHT - 6} textAnchor="middle">
            {percent(time)}
          </text>
        ))}
        {field === "angle" && <line className="orbit-chart__steady" x1={x(0)} y1={y(0)} x2={x(1)} y2={y(360)} />}
        <polyline className="explain-chart__line" points={points} />
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
 * One whole orbit of a planet 1 AU out on average, traced through the real solveKepler() and placeOnOrbit() at
 * evenly spaced times: how far it is from the Sun, and how far round it's got. Hover a chart to read a moment.
 */
export function OneOrbit() {
  const [e, setE] = useState(0.25);
  const [hovered, setHovered] = useState<number | null>(null);

  const samples = useMemo(() => orbit(e), [e]);
  const nearHalf = samples.slice(0, -1).filter((sample) => sample.angle < 90 || sample.angle > 270).length / SAMPLES;
  const point = hovered === null ? null : samples[hovered];

  return (
    <div className="explain">
      <div className="explain__controls">
        <Slider label="Eccentricity (e)" value={e} min={0} max={0.9} step={0.01} digits={2} onChange={setE} />
      </div>
      <ul className="explain__facts">
        <li>
          Closest to the Sun, it&rsquo;s <code>a × (1 − e) = {fixed(1 - e, 2)}</code> AU away, and furthest, <code>a × (1 + e) = {fixed(1 + e, 2)}</code>{" "}
          AU.
        </li>
        <li>
          It spends {percent(nearHalf)} of its time in the half of its orbit nearer the Sun, and {percent(1 - nearHalf)} in the further half,
          because it goes faster when it&rsquo;s closer.
        </li>
        <li>
          The planets&rsquo; eccentricities: {PLANETS.map((planet) => `${planet.name} ${fixed(planet.orbit.at2000.e, 3)}`).join(", ")}.
        </li>
      </ul>
      <p className="explain__readout" aria-live="polite">
        {point
          ? `${percent(point.time)} of the way through its year: ${fixed(point.distance, 2)} AU from the Sun, ${fixed(point.angle)}° round. At a steady speed it would be ${fixed(point.time * 360)}° round.`
          : "Hover a chart to read the distance and angle at any moment. On the angle chart, the dashed line is a steady speed."}
      </p>
      <Chart samples={samples} field="distance" title="Distance from the Sun" unit="AU" top={2} ticks={[0, 1, 2]} hovered={hovered} onHover={setHovered} />
      <Chart
        samples={samples}
        field="angle"
        title="Angle round from the closest point"
        unit="degrees"
        top={360}
        ticks={[0, 180, 360]}
        hovered={hovered}
        onHover={setHovered}
      />
    </div>
  );
}

const SCALES: DistanceScale[] = ["linear", "sqrt", "log", "even"];

/** Where each planet's average orbit is drawn under each scale, from the real scaleDistance(), as SolarSystem calls it */
export function ScaleTable() {
  const scales = SCALES.map((kind) => scaleDistance(kind, RINGS, OUTERMOST));
  return (
    <table>
      <thead>
        <tr>
          <th>Planet</th>
          <th>Average distance (AU)</th>
          {SCALES.map((kind) => (
            <th key={kind}>
              <code>{kind}</code>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {PLANETS.map((planet) => (
          <tr key={planet.name}>
            <td>{planet.name}</td>
            <td>{fixed(planet.orbit.at2000.a, 2)}</td>
            {scales.map((scale, index) => (
              <td key={SCALES[index]}>{fixed(scale(planet.orbit.at2000.a), 3)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
