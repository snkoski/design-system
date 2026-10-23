import type { Elements, Orbit } from "./kepler";

export interface Body {
  name: string;
  emoji: string;
  /** Its real radius, in km */
  radius: number;
}

export interface Planet extends Body {
  orbit: Orbit;
}

/** An orbit from a row of JPL's table and the row of rates under it, in the table's order: a, e, I, L, ϖ, Ω */
function orbit(at2000: number[], perCentury: number[]): Orbit {
  const elements = ([a, e, inclination, meanLongitude, perihelion, node]: number[]): Elements => ({
    a: a!, e: e!, inclination: inclination!, meanLongitude: meanLongitude!, perihelion: perihelion!, node: node!,
  });
  return { at2000: elements(at2000), perCentury: elements(perCentury) };
}

export const SUN: Body = { name: "Sun", emoji: "🍔", radius: 695_700 };

/**
 * The planets, and Pluto. Orbits are Table 1 of JPL's "Approximate Positions of the Planets" (E. M. Standish), good
 * from 1800 to 2050 (https://ssd.jpl.nasa.gov/planets/approx_pos.html). Earth's row is for the Earth and Moon's
 * center of mass, which is close enough. JPL has since dropped Pluto from the page; its row is from the same table's
 * earlier versions, and matches Pluto's orbit in JPL's Small-Body Database (perihelion on 5 September 1989, 29.66 AU
 * from the Sun).
 */
export const PLANETS: Planet[] = [
  {
    name: "Mercury", emoji: "🌭", radius: 2_440,
    orbit: orbit([0.38709927, 0.20563593, 7.00497902, 252.2503235, 77.45779628, 48.33076593], [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081]),
  },
  {
    name: "Venus", emoji: "🌭", radius: 6_052,
    orbit: orbit([0.72333566, 0.00677672, 3.39467605, 181.9790995, 131.60246718, 76.67984255], [0.0000039, -0.00004107, -0.0007889, 58517.81538729, 0.00268329, -0.27769418]),
  },
  {
    name: "Earth", emoji: "🌭", radius: 6_371,
    orbit: orbit([1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0], [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0]),
  },
  {
    name: "Mars", emoji: "🌭", radius: 3_390,
    orbit: orbit([1.52371034, 0.0933941, 1.84969142, -4.55343205, -23.94362959, 49.55953891], [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343]),
  },
  {
    name: "Jupiter", emoji: "🌭", radius: 69_911,
    orbit: orbit([5.202887, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909], [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106]),
  },
  {
    name: "Saturn", emoji: "🌭", radius: 58_232,
    orbit: orbit([9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448], [-0.0012506, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794]),
  },
  {
    name: "Uranus", emoji: "🌭", radius: 25_362,
    orbit: orbit([19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.9542763, 74.01692503], [-0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589]),
  },
  {
    name: "Neptune", emoji: "🌭", radius: 24_622,
    orbit: orbit([30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574], [0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664]),
  },
  {
    name: "Pluto", emoji: "🌭", radius: 1_188,
    orbit: orbit([39.48211675, 0.2488273, 17.14001206, 238.92903833, 224.06891629, 110.30393684], [-0.00031596, 0.0000517, 0.00004818, 145.20780515, -0.04062942, -0.01183482]),
  },
];

export interface Moon extends Body {
  /** The name of the planet it goes round */
  planet: string;
  /** Its average distance from the planet's middle, in km */
  distance: number;
  /** How long it takes to go round once, in days */
  period: number;
  /** Goes round the other way from the planets, as Triton does */
  retrograde?: boolean;
}

/**
 * Every round moon (the 19 big enough for their own gravity to pull them round), and both of Mars's. Distances and
 * periods are from JPL's planetary satellite mean elements (https://ssd.jpl.nasa.gov/sats/elem/), radii in km from
 * its physical parameters.
 */
export const MOONS: Moon[] = [
  { name: "Moon", emoji: "🌭", radius: 1_737, planet: "Earth", distance: 384_400, period: 27.322 },
  { name: "Phobos", emoji: "🌭", radius: 11, planet: "Mars", distance: 9_375, period: 0.3187 },
  { name: "Deimos", emoji: "🌭", radius: 6, planet: "Mars", distance: 23_457, period: 1.2625 },
  { name: "Io", emoji: "🌭", radius: 1_822, planet: "Jupiter", distance: 421_800, period: 1.762732 },
  { name: "Europa", emoji: "🌭", radius: 1_561, planet: "Jupiter", distance: 671_100, period: 3.525463 },
  { name: "Ganymede", emoji: "🌭", radius: 2_634, planet: "Jupiter", distance: 1_070_400, period: 7.155588 },
  { name: "Callisto", emoji: "🌭", radius: 2_410, planet: "Jupiter", distance: 1_882_700, period: 16.69044 },
  { name: "Mimas", emoji: "🌭", radius: 198, planet: "Saturn", distance: 186_000, period: 0.942422 },
  { name: "Enceladus", emoji: "🌭", radius: 252, planet: "Saturn", distance: 238_400, period: 1.370218 },
  { name: "Tethys", emoji: "🌭", radius: 531, planet: "Saturn", distance: 295_000, period: 1.887802 },
  { name: "Dione", emoji: "🌭", radius: 561, planet: "Saturn", distance: 377_700, period: 2.736916 },
  { name: "Rhea", emoji: "🌭", radius: 764, planet: "Saturn", distance: 527_200, period: 4.517503 },
  { name: "Titan", emoji: "🌭", radius: 2_575, planet: "Saturn", distance: 1_221_900, period: 15.945448 },
  { name: "Iapetus", emoji: "🌭", radius: 735, planet: "Saturn", distance: 3_561_700, period: 79.331002 },
  { name: "Miranda", emoji: "🌭", radius: 236, planet: "Uranus", distance: 129_846, period: 1.413479 },
  { name: "Ariel", emoji: "🌭", radius: 579, planet: "Uranus", distance: 190_929, period: 2.520379 },
  { name: "Umbriel", emoji: "🌭", radius: 585, planet: "Uranus", distance: 265_986, period: 4.144177 },
  { name: "Titania", emoji: "🌭", radius: 788, planet: "Uranus", distance: 436_298, period: 8.705869 },
  { name: "Oberon", emoji: "🌭", radius: 761, planet: "Uranus", distance: 583_511, period: 13.463237 },
  { name: "Triton", emoji: "🌭", radius: 1_353, planet: "Neptune", distance: 354_800, period: 5.8792, retrograde: true },
  { name: "Charon", emoji: "🌭", radius: 606, planet: "Pluto", distance: 19_600, period: 6.387222 },
];
