import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { fixed, percent, Slider } from "../../how-it-works/demo";
import { FocusSheen } from "./FocusSheen";
import "./explain.css";

/* A live demo for the "How it works" page. It's the real FocusSheen wrapper, focus-sheen.css's real ::before and
   @keyframes sheen, held still at a moment you choose, and the values the browser computes there. */

interface Moment {
  /** background-position's first value, as a share from 0 to 1 */
  position: number;
  opacity: number;
  /** The animation's length, in ms */
  duration: number;
}

/** The band's middle sits at 50% of the gradient image, which is 2.5 times the box's width */
const IMAGE = 2.5;

/** Where the band's middle is, as a share of the box's width from its left edge, for a background-position share */
const bandMiddle = (position: number) => IMAGE * 0.5 - (IMAGE - 1) * position;

/** A diagram of the gradient image sliding behind the box, in units of the box's width */
function Strip({ position }: { position: number }) {
  const scale = 100;
  const left = -(IMAGE - 1) * position * scale;
  return (
    <svg className="sheen-explain__strip" viewBox="-170 -14 440 82" role="img" aria-label={`The band's middle is at ${percent(bandMiddle(position))} of the box's width`}>
      <rect className="sheen-explain__image" x={left} y={6} width={IMAGE * scale} height={44} />
      <polygon
        className="sheen-explain__band"
        points={`${left + 0.4 * IMAGE * scale + 8},6 ${left + 0.6 * IMAGE * scale + 8},6 ${left + 0.6 * IMAGE * scale - 8},50 ${left + 0.4 * IMAGE * scale - 8},50`}
      />
      <line className="sheen-explain__middle" x1={left + 0.5 * IMAGE * scale} x2={left + 0.5 * IMAGE * scale} y1={2} y2={54} />
      <rect className="sheen-explain__box" x={0} y={0} width={scale} height={56} rx={6} />
      <text className="sheen-explain__label" x={scale / 2} y={-4} textAnchor="middle">
        the control
      </text>
      <text className="sheen-explain__label" x={left + (IMAGE * scale) / 2} y={66} textAnchor="middle">
        the gradient image, 250% as wide
      </text>
    </svg>
  );
}

/** Holds the real sheen animation still at a chosen moment, and shows what the browser computes there */
export function Scrub() {
  const [progress, setProgress] = useState(0.5);
  const [moment, setMoment] = useState<Moment | null>(null);
  const button = useRef<HTMLSpanElement>(null);

  // Read what the browser computes for the ::before at this moment of the animation
  useLayoutEffect(() => {
    const style = getComputedStyle(button.current!, "::before");
    setMoment({
      position: Number.parseFloat(style.backgroundPosition) / 100,
      opacity: Number(style.opacity),
      duration: Number.parseFloat(style.animationDuration) * (style.animationDuration.endsWith("ms") ? 1 : 1000),
    });
  }, [progress]);

  return (
    <div className="explain">
      <div className="explain__controls">
        <Slider label="Time through the sweep" value={progress * 100} min={0} max={100} step={1} unit="%" onChange={(value) => setProgress(value / 100)} />
      </div>
      <FocusSheen className="sheen-explain__stage" style={{ "--sheen-explain-progress": progress } as CSSProperties}>
        {/* A picture of a button: the real button classes, but not a control */}
        <span ref={button} className="button sheen-explain__button" data-variant="primary" aria-hidden="true">
          Save changes
        </span>
      </FocusSheen>
      {moment && (
        <>
          <Strip position={moment.position} />
          <ul className="explain__facts">
            <li>
              Time: <code>{fixed(progress * moment.duration, 0)} ms</code> of <code>{fixed(moment.duration, 0)} ms</code>.
            </li>
            <li>
              The browser computes <code>background-position: {fixed(moment.position * 100, 1)}% 0%</code>, so the band&rsquo;s middle is{" "}
              <code>
                {IMAGE * 0.5} − {IMAGE - 1} × {fixed(moment.position, 3)} = {fixed(bandMiddle(moment.position), 3)}
              </code>{" "}
              box widths from the left edge ({bandMiddle(moment.position) < 0 ? "off the left edge" : bandMiddle(moment.position) > 1 ? "off the right edge" : "over the control"}).
            </li>
            <li>
              It computes <code>opacity: {fixed(moment.opacity, 3)}</code>
              {moment.opacity === 0 && progress > 0 && progress < 1 ? ", so reduced motion is on, and the band never shows." : "."}
            </li>
          </ul>
        </>
      )}
    </div>
  );
}
