/**
 * Where a planet is on a given date, from its orbit's six numbers, by JPL's method in "Approximate Positions of the
 * Planets" (E. M. Standish, https://ssd.jpl.nasa.gov/planets/approx_pos.html). Nothing here simulates gravity: each
 * orbit is an ellipse that drifts very slowly, and a planet's place on it follows from the date alone. So it's the
 * same every time, never drifts off, and can jump straight to any date.
 */

/** An orbit's shape and position, the way JPL's table lists them */
export interface Elements {
  /** Semi-major axis: half the ellipse's long side, in AU (Earth's average distance from the Sun) */
  a: number;
  /** Eccentricity: 0 is a circle, and the nearer 1, the longer and thinner the ellipse */
  e: number;
  /** Inclination: the tilt from Earth's orbit, in degrees */
  inclination: number;
  /** Mean longitude, in degrees: where the planet would be if its orbit were a circle */
  meanLongitude: number;
  /** Longitude of perihelion, in degrees: which way the orbit's closest point to the Sun faces */
  perihelion: number;
  /** Longitude of the ascending node, in degrees: where the orbit crosses Earth's going north */
  node: number;
}

export interface Orbit {
  /** At J2000, noon on 1 January 2000 */
  at2000: Elements;
  /** How much each changes in a century */
  perCentury: Elements;
}

/** A place around the Sun, in AU. x points where the Sun is at the March equinox, as seen from Earth, and z north. */
export interface Position {
  x: number;
  y: number;
  z: number;
}

const DAY = 86_400_000; // ms
const J2000 = Date.UTC(2000, 0, 1, 12);
const radians = (degrees: number) => (degrees * Math.PI) / 180;

/** Centuries since J2000, which the table's rates are given in */
export function centuriesSince2000(date: Date | number) {
  return (Number(date) - J2000) / DAY / 36_525;
}

/** The orbit's elements `centuries` after J2000 */
export function elementsAt({ at2000, perCentury }: Orbit, centuries: number): Elements {
  const now = {} as Elements;
  for (const key of Object.keys(at2000) as (keyof Elements)[]) now[key] = at2000[key] + perCentury[key] * centuries;
  return now;
}

/**
 * Solves Kepler's equation, M = E - e sin E, for E (the eccentric anomaly, how far round the ellipse a planet is)
 * from M (the mean anomaly, how far round it would be at a steady speed), both in radians, by Newton's method
 */
export function solveKepler(meanAnomaly: number, e: number) {
  let eccentric = e < 0.8 ? meanAnomaly + e * Math.sin(meanAnomaly) : Math.PI; // a long, thin orbit converges from π
  for (let step = 0; step < 50; step++) {
    const change = (eccentric - e * Math.sin(eccentric) - meanAnomaly) / (1 - e * Math.cos(eccentric));
    eccentric -= change;
    if (Math.abs(change) < 1e-12) break;
  }
  return eccentric;
}

/** The place on an orbit `eccentric` radians round its ellipse from perihelion, turned to face the right way */
export function placeOnOrbit({ a, e, inclination, perihelion, node }: Elements, eccentric: number): Position {
  // In the orbit's own plane, with the Sun at the origin and perihelion along x
  const px = a * (Math.cos(eccentric) - e);
  const py = a * Math.sqrt(1 - e * e) * Math.sin(eccentric);
  // Then turned by the argument of perihelion, tilted by the inclination, and turned by the node
  const w = radians(perihelion - node);
  const [cw, sw] = [Math.cos(w), Math.sin(w)];
  const [cn, sn] = [Math.cos(radians(node)), Math.sin(radians(node))];
  const [ci, si] = [Math.cos(radians(inclination)), Math.sin(radians(inclination))];
  return {
    x: (cw * cn - sw * sn * ci) * px + (-sw * cn - cw * sn * ci) * py,
    y: (cw * sn + sw * cn * ci) * px + (-sw * sn + cw * cn * ci) * py,
    z: sw * si * px + cw * si * py,
  };
}

/** Where a planet on `orbit` is on `date`, around the Sun, in AU */
export function positionAt(orbit: Orbit, date: Date | number): Position {
  const now = elementsAt(orbit, centuriesSince2000(date));
  const meanAnomaly = radians(now.meanLongitude - now.perihelion);
  const wrapped = Math.atan2(Math.sin(meanAnomaly), Math.cos(meanAnomaly)); // between -π and π
  return placeOnOrbit(now, solveKepler(wrapped, now.e));
}

/** `points` places evenly round the whole orbit as it is on `date`, to draw it */
export function orbitPath(orbit: Orbit, date: Date | number, points = 180): Position[] {
  const now = elementsAt(orbit, centuriesSince2000(date));
  return Array.from({ length: points }, (_, index) => placeOnOrbit(now, (index / points) * 2 * Math.PI));
}
