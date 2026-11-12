import { useCallback, useEffect, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import { Button } from "@/components/Button";
import { Segment, SegmentedControl } from "@/components/SegmentedControl";
import { fixed, Slider } from "@/how-it-works/demo";
import "@/experiments/LookAt/explain.css";
import { nearest, targetAngle } from "@/experiments/LookAt/tracker";

/* Live demos for the "How it works" page. They call the real targetAngle() and nearest() from tracker.ts, so what
   they show is what runs. */

/** The element being aimed: a 40px square centered on (0, 0), so the pointer's position is also dx and dy */
const ELEMENT = new DOMRect(-20, -20, 40, 40);
const degrees = (radians: number) => (radians * 180) / Math.PI;

interface PadProps {
  /** Half the width and height, in the SVG's units; the center is (0, 0) */
  half: { x: number; y: number };
  dx: number;
  dy: number;
  onPoint: (dx: number, dy: number) => void;
  /** The arrow's rotation, clockwise from up, in degrees */
  rotation: number;
  /** Ease each change of rotation, so a long way round shows */
  turning?: boolean;
  label: string;
  children?: ReactNode;
}

/** A square with an arrow at its center, drawn pointing up and turned by `rotation`, and the pointer */
function Pad({ half, dx, dy, onPoint, rotation, turning, label, children }: PadProps) {
  const move = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = Math.round(-half.x + ((event.clientX - box.left) / box.width) * half.x * 2);
    const y = Math.round(-half.y + ((event.clientY - box.top) / box.height) * half.y * 2);
    onPoint(x, y);
  };
  return (
    <svg
      className="aim-pad"
      viewBox={`${-half.x} ${-half.y} ${half.x * 2} ${half.y * 2}`}
      role="img"
      aria-label={label}
      onPointerMove={move}
      onPointerDown={move}
    >
      <line className="aim-pad__axis" x1={-half.x} x2={half.x} y1={0} y2={0} />
      <line className="aim-pad__axis" x1={0} x2={0} y1={-half.y} y2={half.y} />
      {children}
      {(dx !== 0 || dy !== 0) && <line className="aim-pad__reach" x1={0} y1={0} x2={dx} y2={dy} />}
      <g className="aim-pad__arrow" data-turning={turning || undefined} style={{ transform: `rotate(${rotation}deg)` }}>
        <path d="M0 26 V-26 M-12 -14 L0 -26 L12 -14" />
      </g>
      <circle className="aim-pad__pointer" cx={dx} cy={dy} r={6} />
    </svg>
  );
}

const AIM_HALF = { x: 180, y: 110 };

/**
 * targetAngle() worked out for a pointer you move: atan2 gives the angle from pointing right, which becomes
 * degrees, then a turn from pointing up. The arc shows atan2's angle; the arrow is turned by the real result.
 */
export function Aim() {
  const [dx, setDx] = useState(100);
  const [dy, setDy] = useState(100);
  const [direction, setDirection] = useState("toward");
  const away = direction === "away";

  const radians = Math.atan2(dy, dx);
  const angle = degrees(radians);
  const result = targetAngle(ELEMENT, away, { x: dx, y: dy });
  // The arc from pointing right to the pointer's direction, which atan2 measures
  const radius = 44;
  const arc = `M ${radius} 0 A ${radius} ${radius} 0 0 ${radians >= 0 ? 1 : 0} ${radius * Math.cos(radians)} ${radius * Math.sin(radians)}`;
  const middle = radians / 2;

  return (
    <div className="explain">
      <div className="explain__controls">
        <Slider label="Pointer across (dx)" value={dx} min={-AIM_HALF.x} max={AIM_HALF.x} step={1} unit="px" onChange={setDx} />
        <Slider label="Pointer down (dy)" value={dy} min={-AIM_HALF.y} max={AIM_HALF.y} step={1} unit="px" onChange={setDy} />
        <SegmentedControl label="Direction" name="aim-direction" value={direction} onValueChange={setDirection}>
          <Segment value="toward">Toward</Segment>
          <Segment value="away">Away</Segment>
        </SegmentedControl>
      </div>
      <p className="explain__note">
        Move the pointer over the area, or use the sliders. The element's center is where the lines cross, so the pointer's position is dx and dy.
      </p>
      <Pad half={AIM_HALF} dx={dx} dy={dy} onPoint={(x, y) => {
          setDx(x);
          setDy(y);
        }} rotation={result ?? 0} label={`An arrow turned ${fixed(result ?? 0)} degrees`}>
        {(dx !== 0 || dy !== 0) && (
          <>
            <path className="aim-pad__arc" d={arc} />
            <text
              className="explain-chart__tick"
              x={(radius + 22) * Math.cos(middle)}
              y={(radius + 22) * Math.sin(middle)}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {fixed(angle)}°
            </text>
          </>
        )}
      </Pad>
      {result === null ? (
        <p className="explain__result">
          The pointer is right on the center, so there's no direction to face. The real <code>targetAngle()</code> returned <code>null</code>, and{" "}
          <code>aim()</code> leaves the angle as it was.
        </p>
      ) : (
        <>
          <ol className="explain__steps">
            <li>
              <strong>The angle from pointing right.</strong>{" "}
              <code>
                Math.atan2({dy}, {dx}) = {fixed(radians, 3)}
              </code>{" "}
              radians, {radians > 0 ? "clockwise" : radians < 0 ? "anticlockwise" : "straight along"} from pointing right.
            </li>
            <li>
              <strong>In degrees.</strong>{" "}
              <code>
                {fixed(radians, 3)} × 180 / π = {fixed(angle)}°
              </code>
            </li>
            <li>
              <strong>From pointing up.</strong>{" "}
              <code>
                {fixed(angle)} + 90 = {fixed(angle + 90)}°
              </code>
              , because the content is drawn pointing up, which is 90° anticlockwise of pointing right.
            </li>
            <li>
              <strong>Away.</strong>{" "}
              {away ? (
                <code>
                  {fixed(angle + 90)} + 180 = {fixed(angle + 270)}°
                </code>
              ) : (
                <>It faces toward the pointer, so nothing is added.</>
              )}
            </li>
          </ol>
          <p className="explain__result">
            The real <code>targetAngle()</code> returned <code>{fixed(result)}°</code>, and the arrow is turned by it.
          </p>
        </>
      )}
    </div>
  );
}

const DIAL_HALF = { x: 110, y: 110 };
/** How far from the center the pointer goes round in a circle, and how long one lap takes, in ms */
const CIRCLE = { radius: 80, lap: 2400 };

interface Turn {
  dx: number;
  dy: number;
  /** What targetAngle() returned, between -90 and 270 */
  target: number;
  /** The angle nearest() kept, which never wraps */
  kept: number;
  /** The angle kept before this move */
  previous: number;
}

/**
 * Two arrows aimed at the same pointer, both easing each turn as LookAt's CSS does. The first is turned by
 * targetAngle()'s result as it is; the second by nearest(), the way tracker.ts does it. Circle the pointer past
 * the left, where atan2 jumps, and the first spins back the long way.
 */
export function ShortWay() {
  // Start just after the pointer has passed the left, from just below it to just above it, where atan2 jumps
  const [turn, setTurn] = useState<Turn>(() => {
    const previous = targetAngle(ELEMENT, false, { x: -100, y: 2 })!;
    const target = targetAngle(ELEMENT, false, { x: -100, y: -2 })!;
    return { dx: -100, dy: -2, target, kept: nearest(previous, target), previous };
  });
  const [circling, setCircling] = useState(false);

  const point = useCallback((dx: number, dy: number) => {
    setTurn((before) => {
      const target = targetAngle(ELEMENT, false, { x: dx, y: dy });
      if (target === null) return { ...before, dx, dy };
      return { dx, dy, target, kept: nearest(before.kept, target), previous: before.kept };
    });
  }, []);

  // Move the pointer once round the circle, clockwise from the top, one step a frame
  useEffect(() => {
    if (!circling) return;
    let frame = 0;
    const began = performance.now();
    const tick = (now: number) => {
      const done = Math.min((now - began) / CIRCLE.lap, 1);
      const around = -Math.PI / 2 + done * 2 * Math.PI;
      point(Math.round(CIRCLE.radius * Math.cos(around)), Math.round(CIRCLE.radius * Math.sin(around)));
      if (done < 1) frame = requestAnimationFrame(tick);
      else setCircling(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [circling, point]);

  const { dx, dy, target, kept, previous } = turn;
  const difference = target - previous;
  const remainder = difference % 360;
  const shifted = (remainder + 540) % 360;
  const delta = shifted - 180;

  return (
    <div className="explain">
      <div className="explain__controls">
        <Slider label="Pointer across (dx)" value={dx} min={-DIAL_HALF.x} max={DIAL_HALF.x} step={1} unit="px" onChange={(x) => point(x, dy)} />
        <Slider label="Pointer down (dy)" value={dy} min={-DIAL_HALF.y} max={DIAL_HALF.y} step={1} unit="px" onChange={(y) => point(dx, y)} />
        <div>
          <Button variant="secondary" onClick={() => setCircling(true)} disabled={circling}>
            Circle the pointer once
          </Button>
        </div>
      </div>
      <p className="explain__note">
        Move the pointer round either arrow, or press the button. With the sliders, set dx to −100, then take dy from 20 to −20.
      </p>
      <div className="aim-pair">
        <figure className="aim-pair__item">
          <Pad half={DIAL_HALF} dx={dx} dy={dy} onPoint={point} rotation={target} turning label={`Turned by the target as it is, ${fixed(target)} degrees`} />
          <figcaption>
            <strong>Without nearest()</strong>
            <br />
            <code>rotate({fixed(target)}deg)</code>
          </figcaption>
        </figure>
        <figure className="aim-pair__item">
          <Pad half={DIAL_HALF} dx={dx} dy={dy} onPoint={point} rotation={kept} turning label={`Turned the short way, ${fixed(kept)} degrees`} />
          <figcaption>
            <strong>With nearest()</strong>
            <br />
            <code>rotate({fixed(kept)}deg)</code>
          </figcaption>
        </figure>
      </div>
      <ol className="explain__steps">
        <li>
          <strong>The whole difference.</strong>{" "}
          <code>
            {fixed(target)} − {fixed(previous)} = {fixed(difference)}
          </code>
          °, from the angle kept last time to the new target.
        </li>
        <li>
          <strong>Whole turns off.</strong>{" "}
          <code>
            {fixed(difference)} % 360 = {fixed(remainder)}
          </code>
          {remainder < 0 ? ". JavaScript's % keeps the minus sign." : "."}
        </li>
        <li>
          <strong>Into 0 to 360, half a turn on.</strong>{" "}
          <code>
            ({fixed(remainder)} + 540) % 360 = {fixed(shifted)}
          </code>
        </li>
        <li>
          <strong>Back half a turn.</strong>{" "}
          <code>
            {fixed(shifted)} − 180 = {fixed(delta)}
          </code>
          °: the shortest turn, always between −180° and 180°.
        </li>
      </ol>
      <p className="explain__result">
        The real <code>nearest()</code> returned{" "}
        <code>
          {fixed(previous)} + {fixed(delta)} = {fixed(kept)}
        </code>
        °, which faces the same way as {fixed(target)}°{Math.abs(kept - target) >= 359.95 ? `, ${Math.round((kept - target) / 360)} whole turn${Math.abs(Math.round((kept - target) / 360)) === 1 ? "" : "s"} on` : ""}.
      </p>
    </div>
  );
}
