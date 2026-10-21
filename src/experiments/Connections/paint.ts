/**
 * Mixing colors like paint rather than light: blue and yellow make green, not gray. Colors are converted to the
 * painter's red-yellow-blue (RYB) color wheel, mixed there, and converted back. RYB to RGB is the color cube from
 * Gossett and Chen, "Paint Inspired Color Compositing" (2004): each corner of the cube is a paint color, and
 * everything else is blended between the corners.
 */

/** A color as red, green, and blue, each from 0 to 1 */
export type Rgb = [number, number, number];
/** A color as amounts of red, yellow, and blue paint, each from 0 to 1. No paint is white; all of it is near black. */
export type Ryb = [number, number, number];

/** The cube's corners, indexed by red * 4 + yellow * 2 + blue */
const CORNERS: Rgb[] = [
  [1, 1, 1], // no paint: white
  [0.163, 0.373, 0.6], // blue
  [1, 1, 0], // yellow
  [0, 0.66, 0.2], // yellow and blue: green
  [1, 0, 0], // red
  [0.5, 0, 0.5], // red and blue: purple
  [1, 0.5, 0], // red and yellow: orange
  [0.13, 0.07, 0.03], // all three: a warm near-black
];

/** The RGB color of an amount of each paint, blended between the cube's corners */
export function rgbFromRyb([r, y, b]: Ryb): Rgb {
  const result: Rgb = [0, 0, 0];
  CORNERS.forEach((corner, index) => {
    const weight = (index & 4 ? r : 1 - r) * (index & 2 ? y : 1 - y) * (index & 1 ? b : 1 - b);
    corner.forEach((value, channel) => (result[channel]! += weight * value));
  });
  return result;
}

const distance = (a: Rgb, b: Rgb) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
const remembered = new Map<string, Ryb>();

/**
 * The amounts of paint whose color is closest to `rgb`. There's no formula going this way, so it searches: a coarse
 * grid first, then smaller and smaller steps. Exact for the cube's corners; colors no paint can make get the
 * nearest one. Remembered, since a page has only a few colors.
 */
export function rybFromRgb(rgb: Rgb): Ryb {
  const key = rgb.join(",");
  const known = remembered.get(key);
  if (known) return known;
  let best: Ryb = [0, 0, 0];
  let error = Infinity;
  const steps = 8;
  for (let r = 0; r <= steps; r++)
    for (let y = 0; y <= steps; y++)
      for (let b = 0; b <= steps; b++) {
        const guess: Ryb = [r / steps, y / steps, b / steps];
        const off = distance(rgbFromRyb(guess), rgb);
        if (off < error) [best, error] = [guess, off];
      }
  for (let step = 1 / steps / 2; step > 1e-4; ) {
    let improved = false;
    for (let channel = 0; channel < 3; channel++)
      for (const direction of [step, -step]) {
        const guess = [...best] as Ryb;
        guess[channel] = Math.min(Math.max(guess[channel]! + direction, 0), 1);
        const off = distance(rgbFromRyb(guess), rgb);
        if (off < error) [best, error, improved] = [guess, off, true];
      }
    if (!improved) step /= 2;
  }
  remembered.set(key, best);
  return best;
}

/** Whether a color has no hue to speak of */
const gray = ([r, g, b]: Rgb) => Math.max(r, g, b) - Math.min(r, g, b) < 0.03;

/**
 * `a` and `b` mixed like paint, `t` of the way from `a` (0) to `b` (1). Halfway between red and blue is purple.
 * Two full-strength paints mix at full strength (red and blue make a strong purple, not a pale one), while
 * white, which is no paint, lightens. Two grays (white, black, or between) mix as gray: the paint cube's middle
 * is a warm brown, which is right for mixing complementary colors but not for black and white.
 */
export function mixPaint(a: Rgb, b: Rgb, t: number): Rgb {
  if (gray(a) && gray(b)) return a.map((value, channel) => value + (b[channel]! - value) * t) as Rgb;
  const from = rybFromRgb(a);
  const to = rybFromRgb(b);
  const mixed = from.map((value, channel) => value + (to[channel]! - value) * t) as Ryb;
  const strength = Math.max(...from) + (Math.max(...to) - Math.max(...from)) * t;
  const most = Math.max(...mixed);
  return rgbFromRyb(most > 0 ? (mixed.map((value) => (value * strength) / most) as Ryb) : mixed);
}

/** Reads `#rrggbb`, `rgb(r, g, b)`, or `rgba(r, g, b, a)`, the forms a canvas gives back. Anything else is null. */
export function parseRgb(css: string): Rgb | null {
  const hex = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(css.trim());
  if (hex) return [hex[1]!, hex[2]!, hex[3]!].map((part) => parseInt(part, 16) / 255) as Rgb;
  const functional = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(css.trim());
  if (functional) return [functional[1]!, functional[2]!, functional[3]!].map((part) => Number(part) / 255) as Rgb;
  return null;
}

/** As a CSS color */
export function toCss([r, g, b]: Rgb) {
  const channel = (value: number) => Math.round(Math.min(Math.max(value, 0), 1) * 255);
  return `rgb(${channel(r)} ${channel(g)} ${channel(b)})`;
}
