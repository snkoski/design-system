import { Planet } from "@/experiments/Orbits/Planet";
import type { PlanetProps } from "@/experiments/Orbits/Planet";

/** A star never moves by itself, so the props for moving don't apply */
export type StarProps = Omit<
  PlanetProps,
  "orbit" | "trail" | "trailColor" | "speed" | "angle" | "gravity" | "bounciness" | "friction" | "paused" | "throwable" | "squash" | "onBounce"
> & {
  /** How heavy it is: how hard it pulls the planets around it. Default: 100. */
  mass?: number;
  /** Let people drag it somewhere else. It stays where it's dropped, and its planets follow. Default: `true`. */
  grabbable?: boolean;
};

/**
 * Something heavy that stays where it is and pulls planets towards it, for them to orbit or fall into. It never
 * moves by itself, but it can be dragged somewhere else. Decorative, like Bounce. An experiment: not exported
 * from the package (see CLAUDE.md, Experiments).
 */
export function Star({ mass = 100, grabbable = true, ...rest }: StarProps) {
  return <Planet {...rest} mass={mass} grabbable={grabbable} paused speed={0} throwable={false} squash={false} />;
}
