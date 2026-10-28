import { Pause, Play } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { HTMLAttributes, Ref } from "react";
import { Button } from "../../components/Button";
import { cx } from "../../internal/cx";
import "../decoration.css";
import { MOONS, PLANETS, SUN } from "./bodies";
import type { Moon } from "./bodies";
import { orbitPath, positionAt } from "./kepler";
import type { Position } from "./kepler";
import { moonAngle, shownPeriod } from "./moons";
import { scaleDistance } from "./scale";
import type { DistanceScale } from "./scale";
import "./solar-system.css";

export type { DistanceScale };

/*
 * Everything is drawn in an SVG whose middle is the Sun and whose edge, at 1, is as far out as Pluto gets, so it
 * scales to whatever size the layout gives it. Sizes are in the same units.
 */
const DAY = 86_400_000; // ms
const EDGE = 1.12; // room past the outermost orbit for the labels
const SUN_SIZE = 0.26;
const INNER = 0.17; // the nearest anything is drawn to the Sun's middle, so the inner planets clear the burger
const LABEL_SIZE = 0.046;
/** How big to draw a planet: bigger for bigger, but squeezed, so Jupiter isn't 59 times as wide as Pluto. Earth is 0.065. */
const sizeOf = (radius: number) => 0.065 * (radius / 6_371) ** 0.3;

export const RINGS = PLANETS.map((planet) => planet.orbit.at2000.a);
export const OUTERMOST = Math.max(...PLANETS.map(({ orbit: { at2000 } }) => at2000.a * (1 + at2000.e)));
/** How big to draw a moon: smaller than a planet its size would be, but never too small to see */
const moonSizeOf = (radius: number) => Math.max(0.7 * sizeOf(radius), 0.028);
/** A moon going round more times a second than this is drawn as a blur round its planet, as it would look */
const FAST_TURNS = 2.5;
/** The furthest a planet's moons are drawn, as a multiple of the nearest's distance, so they keep near their planet */
const MOON_REACH = 2;

interface MoonLayout {
  moon: Moon;
  /** Its place in MOONS */
  index: number;
  size: number;
  /**
   * How far from its planet's middle to draw it: the nearest just clear of the planet, and the others out by the cube
   * root of their real distance, or squeezed more if that would take the furthest past MOON_REACH
   */
  orbit: number;
  /** Its shown period, in days */
  period: number;
}
const MOON_LAYOUT: MoonLayout[] = MOONS.map((moon, index) => {
  const planet = PLANETS.find((other) => other.name === moon.planet)!;
  const distances = MOONS.filter((other) => other.planet === moon.planet).map((other) => other.distance);
  const [nearest, furthest] = [Math.min(...distances), Math.max(...distances)];
  const power = furthest === nearest ? 1 / 3 : Math.min(1 / 3, Math.log(MOON_REACH) / Math.log(furthest / nearest));
  const clear = sizeOf(planet.radius) * 0.55 + 0.02;
  return { moon, index, size: moonSizeOf(moon.radius), orbit: clear * (moon.distance / nearest) ** power, period: shownPeriod(moon, MOONS) };
});

/** The ruler's marks, in AU */
const RULER_MARKS = [1, 2, 5, 10, 20, 30, 40, 50];
/** How far apart two marks must be, in view units, for both to be numbered: room for two numbers in a narrow picture */
const RULER_GAP = 0.16;
/** Redraw the orbits once the date has moved this far from when they were drawn, as they slowly turn */
const REDRAW_ORBITS = 10 * 365 * DAY;

/** The date as the caption shows it, such as "October 23, 2026" in American English */
export function formatDate(time: number) {
  return new Date(time).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

/** A date in each month, with a two-digit day and a four-digit year, as wide as a date can be in its month */
const MONTHS = Array.from({ length: 12 }, (_, month) => formatDate(Date.UTC(2000, month, 28)));

export interface SolarSystemProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** The date it starts on, from which everything is where it really was (or will be). Default: today. */
  date?: Date | number;
  /**
   * How many days go by each second. Negative runs it backwards. Default: 30, so a year takes about 12 seconds
   * (and Pluto's 248-year orbit about 50 minutes).
   */
  speed?: number;
  /** Hold still on the date. It starts paused under reduced motion too. The Pause button switches it either way. */
  paused?: boolean;
  /**
   * How to squeeze the distances to fit: `linear` (true to scale), `sqrt`, `log`, or `even` (each orbit evenly
   * spaced). The directions are always true. Default: `log`.
   */
  scale?: DistanceScale;
  /** Draw each orbit's path. Default: true. */
  orbits?: boolean;
  /**
   * Show the bigger moons as smaller hot dogs round their planets. Earth's Moon is where it really is, so it's
   * between Earth and the burger at a new moon. The others are slowed down to watch, so their places are for show.
   * A moon going round too fast to follow is drawn as a blur. Default: true.
   */
  moons?: boolean;
  /** Name each planet. Default: true. */
  labels?: boolean;
  /**
   * Draw a ruler under it, out from the Sun to the right, marked in AU (Earth's average distance from the Sun) at
   * the same scale as the picture. With any scale but `linear`, a step of 1 AU is longer near the Sun than far out,
   * and the ruler shows by how much. Default: false.
   */
  ruler?: boolean;
  /** Applied to the figure, so it's the place for layout classes such as width. */
  className?: string;
  ref?: Ref<HTMLElement>;
}

/**
 * The solar system, with a hamburger for the Sun and hot dogs for the planets (and Pluto). Each one is where it
 * really is on the date, from JPL's table of their orbits, and moves on from there: no gravity is simulated. An
 * experiment: not exported from the package (see CLAUDE.md, Experiments).
 */
export function SolarSystem({ date, speed = 30, paused = false, scale = "log", orbits = true, moons = true, labels = true, ruler = false, className, ref, ...rest }: SolarSystemProps) {
  const [running, setRunning] = useState(!paused);
  const figure = useRef<HTMLElement | null>(null);
  const planets = useRef<(SVGGElement | null)[]>([]);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const moonGroups = useRef<(SVGGElement | null)[]>([]);
  const moonBodies = useRef<(SVGGElement | null)[]>([]);
  const caption = useRef<HTMLTimeElement | null>(null);
  const time = useRef(0);
  const orbitsDrawnAt = useRef<number | null>(null);
  const toScreen = useRef(scaleDistance(scale, RINGS, OUTERMOST));
  const settings = useRef({ speed, running });
  settings.current = { speed, running };

  /** Where to draw a place around the Sun: in the same direction, at the squeezed distance, with north up */
  const project = ({ x, y }: Position) => {
    const distance = Math.hypot(x, y);
    if (distance === 0) return [0, 0] as const;
    const drawn = INNER + (1 - INNER) * toScreen.current(distance);
    return [(x / distance) * drawn, (-y / distance) * drawn] as const; // SVG's y points down
  };

  const draw = () => {
    const now = time.current;
    PLANETS.forEach((planet, index) => {
      const [x, y] = project(positionAt(planet.orbit, now));
      planets.current[index]?.setAttribute("transform", `translate(${x.toFixed(4)} ${y.toFixed(4)})`);
    });
    const { speed, running } = settings.current;
    MOON_LAYOUT.forEach(({ moon, index, orbit, period }) => {
      const angle = (moonAngle(moon, MOONS, now) * Math.PI) / 180;
      moonBodies.current[index]?.setAttribute("transform", `translate(${(orbit * Math.cos(angle)).toFixed(4)} ${(-orbit * Math.sin(angle)).toFixed(4)})`);
      moonGroups.current[index]?.toggleAttribute("data-fast", running && Math.abs(speed) / period > FAST_TURNS);
    });
    if (orbitsDrawnAt.current === null || Math.abs(now - orbitsDrawnAt.current) > REDRAW_ORBITS) {
      orbitsDrawnAt.current = now;
      PLANETS.forEach((planet, index) => {
        const points = orbitPath(planet.orbit, now).map(project);
        paths.current[index]?.setAttribute("d", `M${points.map(([x, y]) => `${x.toFixed(4)} ${y.toFixed(4)}`).join("L")}Z`);
      });
    }
    const text = formatDate(now);
    if (caption.current && caption.current.textContent !== text) {
      caption.current.textContent = text;
      caption.current.dateTime = new Date(now).toISOString().slice(0, 10);
    }
  };

  const start = date === undefined ? undefined : Number(date);
  useLayoutEffect(() => {
    time.current = start ?? Date.now();
    orbitsDrawnAt.current = null;
    draw();
  }, [start]);

  useLayoutEffect(() => {
    toScreen.current = scaleDistance(scale, RINGS, OUTERMOST);
    orbitsDrawnAt.current = null;
    draw();
  }, [scale, orbits, moons]);

  // A moon too fast to follow blurs only while it's going round
  useLayoutEffect(draw, [running, speed]);

  useEffect(() => setRunning(!paused), [paused]);

  // Under reduced motion it starts still, on its date, until someone presses Play
  useEffect(() => {
    if (figure.current && getComputedStyle(figure.current).getPropertyValue("--experiment-decoration").trim() === "0") setRunning(false);
  }, []);

  useEffect(() => {
    let frame = 0;
    let last: number | null = null;
    const tick = (now: number) => {
      // A frame late by more than a quarter of a second (a hidden tab, say) counts as a quarter, so nothing leaps
      const seconds = last === null ? 0 : Math.min((now - last) / 1000, 0.25);
      last = now;
      const { speed, running } = settings.current;
      if (running && speed !== 0 && seconds > 0) {
        time.current += seconds * speed * DAY;
        draw();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const setRef = (node: HTMLElement | null) => {
    figure.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <figure {...rest} ref={setRef} className={cx("solar-system", className)}>
      <svg
        className="solar-system__view"
        viewBox={`${-EDGE} ${-EDGE} ${2 * EDGE} ${2 * EDGE}`}
        role="img"
        aria-label={`The solar system, with a hamburger for the Sun and hot dogs for the planets: ${PLANETS.map((planet) => planet.name).join(", ")}${moons ? ". Smaller hot dogs go round them as moons" : ""}${ruler ? ". A ruler underneath marks distances from the Sun." : ""}`}
      >
        {orbits && (
          <g className="solar-system__orbits">
            {PLANETS.map((planet, index) => (
              <path key={planet.name} ref={(node) => void (paths.current[index] = node)} data-planet={planet.name} />
            ))}
          </g>
        )}
        <text className="solar-system__body" fontSize={SUN_SIZE} data-body="Sun">
          {SUN.emoji}
        </text>
        {PLANETS.map((planet, index) => {
          const size = sizeOf(planet.radius);
          return (
            <g key={planet.name} ref={(node) => void (planets.current[index] = node)} data-planet={planet.name}>
              <title>{planet.name}</title>
              <text className="solar-system__body" fontSize={size}>
                {planet.emoji}
              </text>
              {labels && (
                <text className="solar-system__label" fontSize={LABEL_SIZE} y={size * 0.55 + LABEL_SIZE}>
                  {planet.name}
                </text>
              )}
              {moons &&
                MOON_LAYOUT.filter(({ moon }) => moon.planet === planet.name).map(({ moon, index, size, orbit }) => (
                  <g key={moon.name} ref={(node) => void (moonGroups.current[index] = node)} className="solar-system__moon" data-moon={moon.name}>
                    <circle className="solar-system__moon-blur" r={orbit} strokeWidth={size * 0.5} />
                    <g ref={(node) => void (moonBodies.current[index] = node)}>
                      <title>{moon.name}</title>
                      <text className="solar-system__body" fontSize={size}>
                        {moon.emoji}
                      </text>
                    </g>
                  </g>
                ))}
            </g>
          );
        })}
      </svg>
      {ruler && <Ruler scale={scale} />}
      <figcaption className="solar-system__caption">
        <span className="solar-system__date">
          <time ref={caption} />
          {/* Invisible, under the date: a date in each month, so it always has room for the widest month's name
              and the Pause button beside it stays put as the date changes */}
          {MONTHS.map((month) => (
            <span key={month} className="solar-system__date-room" aria-hidden="true">
              {month}
            </span>
          ))}
        </span>
        <Button variant="secondary" size="sm" iconStart={running ? <Pause /> : <Play />} onClick={() => setRunning(!running)}>
          {/* The other word, invisible, under this one, so the button is as wide as the wider and doesn't change size */}
          <span className="solar-system__toggle">
            <span>{running ? "Pause" : "Play"}</span>
            <span className="solar-system__toggle-room" aria-hidden="true">
              {running ? "Play" : "Pause"}
            </span>
          </span>
        </Button>
      </figcaption>
    </figure>
  );
}

/** Where a point `x` view units right of the Sun is, as a percentage of the picture's width */
const across = (x: number) => `${((x + EDGE) / (2 * EDGE)) * 100}%`;

/**
 * A ruler under the picture, starting below the Sun's middle and running out to the right, with a mark at each of
 * RULER_MARKS placed just as a planet that far out would be. It's HTML, placed by percentages, so it lines up with
 * the picture at any size while its numbers stay a readable size. Marks too close to the next one out for both
 * numbers to fit still show, unnumbered.
 */
function Ruler({ scale }: { scale: DistanceScale }) {
  const toScreen = scaleDistance(scale, RINGS, OUTERMOST);
  const marks = RULER_MARKS.map((distance) => ({ distance, x: INNER + (1 - INNER) * toScreen(distance) }));
  // Number them from the outside in, so the furthest always has its number
  const numbered = new Set<number>();
  let lastX = Infinity;
  for (const mark of [...marks].reverse()) {
    if (lastX - mark.x >= RULER_GAP) {
      numbered.add(mark.distance);
      lastX = mark.x;
    }
  }
  const outermost = marks[marks.length - 1]!;
  return (
    <div className="solar-system__ruler" data-scale={scale} aria-hidden="true">
      <span className="solar-system__ruler-line" style={{ left: "50%", width: `${(outermost.x / (2 * EDGE)) * 100}%` }} />
      <span className="solar-system__ruler-start">AU from the Sun</span>
      {marks.map(({ distance, x }) => (
        <span key={distance} className="solar-system__ruler-mark" data-distance={distance} data-numbered={numbered.has(distance) || undefined} style={{ left: across(x) }}>
          {numbered.has(distance) && <span className="solar-system__ruler-number">{distance}</span>}
        </span>
      ))}
    </div>
  );
}
