import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Checkbox } from "@/components/Checkbox";
import { Segment, SegmentedControl } from "@/components/SegmentedControl";
import { fixed, Slider } from "@/how-it-works/demo";
import { Spin } from "@/experiments/Spin/Spin";
import type { SpinDirection } from "@/experiments/Spin/Spin";

/* A live demo for the "How it works" page. It's the real Spin, so what it shows is what runs. */

interface Click {
  /** The angle it was heading for before the click */
  from: number;
  sign: number;
  turns: number;
  /** from + the spin, before rounding */
  raw: number;
  upright: boolean;
  /** What this page's working says --spin-angle should become */
  worked: number;
}

/** The angle in an element's --spin-angle, in degrees */
const angleOf = (element: HTMLElement | null) => Number.parseFloat(element?.style.getPropertyValue("--spin-angle") ?? "0") || 0;

/** Which way the content faces right now, from 0 to 359 degrees, read from its computed transform */
function facing(button: HTMLElement | null) {
  const content = button?.querySelector(".spin__content");
  if (!content) return 0;
  const transform = getComputedStyle(content).transform;
  if (transform === "none") return 0;
  const [a, b] = transform.match(/-?[\d.e-]+/g)!.map(Number);
  return Math.round(((Math.atan2(b!, a!) * 180) / Math.PI + 360) % 360);
}

/**
 * The real Spin, with the working for each click: where it was heading, how far the click adds, and the rounding.
 * The last line is what the real Spin set, and a live readout shows which way it faces while the transition runs.
 */
export function Clicks() {
  const [speed, setSpeed] = useState(1.5);
  const [duration, setDuration] = useState(1000);
  const [direction, setDirection] = useState<SpinDirection>("clockwise");
  const [upright, setUpright] = useState(true);
  const [click, setClick] = useState<Click | null>(null);
  const [real, setReal] = useState(0);
  const [now, setNow] = useState(0);
  const button = useRef<HTMLButtonElement>(null);

  // After each render, read the angle the real Spin set
  useLayoutEffect(() => setReal(angleOf(button.current)));

  // Each frame, read which way it faces, so the readout follows the transition
  useEffect(() => {
    let frame = requestAnimationFrame(function read() {
      setNow(facing(button.current));
      frame = requestAnimationFrame(read);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const onClick = () => {
    // Spin's own click handler has already asked React for the new angle, but it hasn't rendered yet, so the
    // element still holds the angle from before
    const from = angleOf(button.current);
    const sign = direction === "clockwise" ? 1 : -1;
    const turns = Math.max(speed, 0) * (Math.max(duration, 0) / 1000);
    const raw = from + sign * turns * 360;
    const worked = !upright ? raw : (sign > 0 ? Math.ceil(raw / 360) : Math.floor(raw / 360)) * 360;
    setClick({ from, sign, turns, raw, upright, worked });
  };

  return (
    <div className="explain">
      <div className="explain__controls">
        <Slider label="Speed" value={speed} min={0.25} max={5} step={0.25} digits={2} unit="turns/s" onChange={setSpeed} />
        <Slider label="Duration" value={duration} min={100} max={4000} step={100} unit="ms" onChange={setDuration} />
        <SegmentedControl label="Direction" name="spin-clicks-direction" value={direction} onValueChange={(value) => setDirection(value as SpinDirection)}>
          <Segment value="clockwise">Clockwise</Segment>
          <Segment value="counterclockwise">Counterclockwise</Segment>
        </SegmentedControl>
        <Checkbox checked={upright} onCheckedChange={setUpright}>
          Land upright
        </Checkbox>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <Spin ref={button} speed={speed} duration={duration} direction={direction} upright={upright} label="Spin the arrow" onClick={onClick} className="size-16">
          <ArrowUp size={40} strokeWidth={2.5} />
        </Spin>
        <p className="explain__readout">
          Heading for <code>{fixed(real, 0)}°</code>. Facing <code>{now}°</code> now.
        </p>
      </div>
      {click ? (
        <ol className="explain__steps">
          <li>
            <strong>Where it was heading.</strong> <code>current = {fixed(click.from, 0)}°</code>
          </li>
          <li>
            <strong>Turns.</strong>{" "}
            <code>
              {fixed(speed, 2)} turns/s × {duration / 1000} s = {fixed(click.turns, 3)} turns
            </code>
            , or <code>{fixed(click.turns * 360, 1)}°</code>
          </li>
          <li>
            <strong>Add them, {click.sign > 0 ? "clockwise (+)" : "counterclockwise (−)"}.</strong>{" "}
            <code>
              next = {fixed(click.from, 0)} {click.sign > 0 ? "+" : "−"} {fixed(click.turns * 360, 1)} = {fixed(click.raw, 1)}°
            </code>
          </li>
          <li>
            <strong>Round.</strong>{" "}
            {click.upright ? (
              <>
                <code>
                  Math.{click.sign > 0 ? "ceil" : "floor"}({fixed(click.raw, 1)} / 360) × 360 = {fixed(click.worked, 0)}°
                </code>
                , the next whole turn {click.sign > 0 ? "up" : "down"}, so it lands upright
              </>
            ) : (
              <>Land upright is off, so it stays at {fixed(click.worked, 1)}°.</>
            )}
          </li>
        </ol>
      ) : (
        <p className="explain__note">Click the arrow, or Tab to it and press Space, to see the working for that click.</p>
      )}
      {click && (
        <p className="explain__result">
          The real Spin set <code>--spin-angle: {fixed(real, Number.isInteger(real) ? 0 : 1)}deg</code>. Click again before it stops, and the next spin
          starts from {fixed(real, 0)}°, not from where it's facing.
        </p>
      )}
    </div>
  );
}
