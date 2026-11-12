/**
 * Where each moon is round its planet. Earth's Moon is real: its direction comes from a short lunar theory, so new
 * moons, full moons, and eclipses fall on the right dates. The others go round too fast to watch (Phobos circles
 * Mars three times a day), so each planet's moons are slowed until the fastest takes MIN_PERIOD days, keeping the
 * inner ones faster than the outer. Their directions are for show, and every moon's orbit is drawn flat and round.
 */
import type { Moon } from "@/experiments/SolarSystem/bodies";
import { centuriesSince2000 } from "@/experiments/SolarSystem/kepler";

/** The shortest time a moon takes to go round, as shown, in days: half a second at a month a second */
export const MIN_PERIOD = 15;

const DAY = 86_400_000; // ms
const J2000 = Date.UTC(2000, 0, 1, 12);
const radians = (degrees: number) => (degrees * Math.PI) / 180;

/**
 * The Moon's direction from Earth on `date`: its ecliptic longitude, in degrees from 0 to 360, the same way round as
 * the planets'. The main terms of Meeus's low-precision lunar theory, good to about half a degree.
 */
export function moonLongitude(date: Date | number) {
  const T = centuriesSince2000(date);
  const L = 218.3165 + 481_267.8813 * T; // mean longitude
  const Mm = radians(134.9634 + 477_198.8676 * T); // the Moon's mean anomaly
  const M = radians(357.5291 + 35_999.0503 * T); // the Sun's mean anomaly
  const D = radians(297.8502 + 445_267.1115 * T); // mean elongation from the Sun
  const F = radians(93.2721 + 483_202.0175 * T); // argument of latitude
  const longitude =
    L + 6.289 * Math.sin(Mm) + 1.274 * Math.sin(2 * D - Mm) + 0.658 * Math.sin(2 * D) + 0.214 * Math.sin(2 * Mm) - 0.186 * Math.sin(M) - 0.114 * Math.sin(2 * F);
  return ((longitude % 360) + 360) % 360;
}

/**
 * How long `moon` takes to go round as shown, in days. A planet whose fastest moon takes MIN_PERIOD days or more
 * keeps its moons' real periods. Otherwise the fastest takes MIN_PERIOD and the rest by the square root of how much
 * longer they really take, so Callisto, which takes 9.5 times as long as Io, is shown taking about 3 times as long.
 */
export function shownPeriod(moon: Moon, moons: Moon[]) {
  const fastest = Math.min(...moons.filter((other) => other.planet === moon.planet).map((other) => other.period));
  if (fastest >= MIN_PERIOD) return moon.period;
  return MIN_PERIOD * Math.sqrt(moon.period / fastest);
}

/**
 * Which way from its planet `moon` is on `date`, in degrees, counterclockwise from the direction the planets'
 * longitudes start from. Earth's Moon is real; the others start spread out and go round at their shown period.
 */
export function moonAngle(moon: Moon, moons: Moon[], date: Date | number) {
  if (moon.name === "Moon") return moonLongitude(date);
  const start = moons.indexOf(moon) * 137.5; // spread out, a golden angle apart
  const turns = (Number(date) - J2000) / DAY / shownPeriod(moon, moons);
  const angle = start + (moon.retrograde ? -360 : 360) * turns;
  return ((angle % 360) + 360) % 360;
}
