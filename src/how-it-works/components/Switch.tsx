import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Button } from "@/components/Button";
import { Switch } from "@/components/Switch";
import { fixed, Slider } from "@/how-it-works/demo";
import "@/how-it-works/components/switch.css";

/* Live demos for Switch's "How it works" page. They render the real Switch, so what they show is what ships. */

/**
 * Two switches in a real form, one with `uncheckedValue` and one without, and what the form sends. Put it inside
 * <Inspect> to watch Base UI's hidden inputs change as the switches turn on and off.
 */
export function SettingsForm() {
  const [sent, setSent] = useState<string>();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const entries = [...new FormData(event.currentTarget)].map(([key, value]) => `${key}=${String(value)}`);
    setSent(entries.length > 0 ? `The form sent ${entries.join(", ")}.` : "The form sent nothing.");
  };

  return (
    <form className="grid justify-items-start gap-3" onSubmit={submit}>
      <Switch name="newsletter" value="yes" uncheckedValue="no">
        Newsletter
      </Switch>
      <Switch name="alerts" value="yes" defaultChecked>
        Project alerts
      </Switch>
      <Button type="submit" variant="secondary">
        Save settings
      </Button>
      <output>{sent}</output>
    </form>
  );
}

const MODES = ["full", "reduced"] as const;
type Mode = (typeof MODES)[number];

/** Where the thumb was, in px from where it sits when off, at a time in ms since the switch changed */
interface Sample {
  time: number;
  x: number;
}

/** What one column's thumb is doing, read from the browser */
interface Reading {
  easing: string;
  samples: Sample[];
}

/** The first value of a computed list such as "cubic-bezier(…), cubic-bezier(…)": the one for `transform` */
const firstOf = (list: string) => list.match(/^[a-z-]+\([^)]*\)|^[^,]+/)?.[0] ?? list;

/** How far the thumb has been moved by its transform: where it is now, less where layout put it */
function offset(track: HTMLElement, thumb: HTMLElement) {
  return thumb.getBoundingClientRect().left - track.getBoundingClientRect().left - track.clientLeft - thumb.offsetLeft;
}

/** How far the thumb can go: the track's inside, less its padding, less the thumb */
function travel(track: HTMLElement, thumb: HTMLElement) {
  const style = getComputedStyle(track);
  return track.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - thumb.offsetWidth;
}

const WIDTH = 600;
const HEIGHT = 220;
const PAD = { left: 52, right: 12, top: 12, bottom: 32 };

/**
 * The same switch with motion set to full and to reduced, side by side and turned on and off together. Each frame
 * of the slide, the thumb's position is read from the page and plotted, so the overshoot `--ease-bounce` gives it
 * (and its absence under reduced motion) can be seen.
 */
export function ThumbTravel() {
  const [on, setOn] = useState(false);
  const [slower, setSlower] = useState(6);
  const [fast, setFast] = useState(120);
  const [distance, setDistance] = useState(0);
  const [readings, setReadings] = useState<Record<Mode, Reading>>({
    full: { easing: "", samples: [] },
    reduced: { easing: "", samples: [] },
  });
  const columns = useRef<Partial<Record<Mode, HTMLDivElement | null>>>({});
  const started = useRef(false);

  // --duration-fast as the page sets it (120ms), so the demo slows down the real value rather than a copy of it
  useLayoutEffect(() => {
    const value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--duration-fast"));
    if (value > 0) setFast(value);
  }, []);

  const duration = fast * slower;

  useLayoutEffect(() => {
    const parts = (mode: Mode) => {
      const column = columns.current[mode];
      const track = column?.querySelector<HTMLElement>(".switch__track");
      const thumb = column?.querySelector<HTMLElement>(".switch__thumb");
      return track && thumb ? { track, thumb } : undefined;
    };
    const full = parts("full");
    if (full) setDistance(travel(full.track, full.thumb));
    const easing = (mode: Mode) => {
      const found = parts(mode);
      return found ? firstOf(getComputedStyle(found.thumb).transitionTimingFunction) : "";
    };

    // Nothing has moved yet on the first render: read the easings, but don't trace
    if (!started.current) {
      started.current = true;
      setReadings({ full: { easing: easing("full"), samples: [] }, reduced: { easing: easing("reduced"), samples: [] } });
      return;
    }

    const samples: Record<Mode, Sample[]> = { full: [], reduced: [] };
    const start = performance.now();
    const length = duration * 1.5;
    let frame = 0;
    const sample = () => {
      const time = performance.now() - start;
      for (const mode of MODES) {
        const found = parts(mode);
        if (found) samples[mode].push({ time, x: offset(found.track, found.thumb) });
      }
      setReadings({
        full: { easing: easing("full"), samples: [...samples.full] },
        reduced: { easing: easing("reduced"), samples: [...samples.reduced] },
      });
      if (time < length) frame = requestAnimationFrame(sample);
    };
    sample();
    return () => cancelAnimationFrame(frame);
    // Only turning it on or off starts a trace. A new slow-down applies to the next one.
  }, [on]);

  const length = duration * 1.5;
  const low = -0.25 * (distance || 18);
  const high = 1.25 * (distance || 18);
  const x = (time: number) => PAD.left + (Math.min(time, length) / length) * (WIDTH - PAD.left - PAD.right);
  const y = (value: number) => PAD.top + ((high - value) / (high - low)) * (HEIGHT - PAD.top - PAD.bottom);
  const path = (samples: Sample[]) =>
    samples.map((point, index) => `${index === 0 ? "M" : "L"}${fixed(x(point.time))} ${fixed(y(point.x))}`).join(" ");
  const furthest = (samples: Sample[]) =>
    samples.length === 0 ? undefined : on ? Math.max(...samples.map((point) => point.x)) : Math.min(...samples.map((point) => point.x));

  return (
    <div className="explain">
      <div className="explain__controls">
        <Slider label="Slow it down" value={slower} min={1} max={10} step={1} unit="×" onChange={setSlower} />
      </div>
      <p className="explain__note">
        Turn either switch on or off: both follow, so the two slides start together. The slider multiplies{" "}
        <code>--duration-fast</code> ({fast} ms) for this demo only, so the slide is slow enough to see. It's{" "}
        {fixed(duration, 0)} ms now.
      </p>
      <div className="how-switch__columns">
        {MODES.map((mode) => {
          const reading = readings[mode];
          const edge = furthest(reading.samples);
          return (
            <div
              key={mode}
              className="how-switch__column"
              data-motion={mode}
              style={{ "--duration-fast": `${duration}ms` } as CSSProperties}
              ref={(element) => {
                columns.current[mode] = element;
              }}
            >
              <p className="how-switch__heading">
                <code>data-motion="{mode}"</code>
              </p>
              <Switch checked={on} onCheckedChange={setOn}>
                Alerts ({mode} motion)
              </Switch>
              <p className="explain__readout">
                Easing: <code>{reading.easing}</code>
                <br />
                {edge === undefined
                  ? "Turn it on to trace the slide."
                  : on
                    ? `Furthest: ${fixed(edge)} px, then settles at ${fixed(distance)} px.`
                    : `Furthest: ${fixed(edge)} px, then settles at 0 px.`}
              </p>
            </div>
          );
        })}
      </div>
      <figure className="explain-chart">
        <figcaption className="explain-chart__title">
          Where the thumb is <span className="explain-chart__unit">(px from off, against time in ms, read from the page each frame)</span>
        </figcaption>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`The thumb's position over time. With full motion it overshoots the end and springs back; with reduced motion it slows into place without overshooting.`}
        >
          {[0, distance].map((value, index) => (
            <g key={index}>
              <line className="explain-chart__grid" x1={PAD.left} x2={WIDTH - PAD.right} y1={y(value)} y2={y(value)} />
              <text className="explain-chart__tick" x={PAD.left - 8} y={y(value) + 4} textAnchor="end">
                {index === 0 ? "off 0" : `on ${fixed(value, 0)}`}
              </text>
            </g>
          ))}
          {[0, duration, length].map((time) => (
            <text key={time} className="explain-chart__tick" x={x(time)} y={HEIGHT - 10} textAnchor={time === 0 ? "start" : time === length ? "end" : "middle"}>
              {fixed(time, 0)} ms
            </text>
          ))}
          <line className="explain-chart__cursor" x1={x(duration)} x2={x(duration)} y1={PAD.top} y2={HEIGHT - PAD.bottom} />
          {MODES.map((mode) => (
            <path key={mode} className="explain-chart__line how-switch__line" data-motion-line={mode} d={path(readings[mode].samples)} />
          ))}
        </svg>
      </figure>
      <p className="explain__note">
        Solid line: full motion. Dashed line: reduced motion. The upright line marks where the transition's duration ends.
      </p>
    </div>
  );
}
