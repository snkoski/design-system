// Checks every foreground/background pair in tokens/contrast.json against WCAG contrast,
// in all three themes. Run with `pnpm check:contrast`; add `--all` to print passing pairs too.
//
// To try pairs without adding them to contrast.json, pass them with --probe, as fg:bg:min:
//   pnpm check:contrast --probe ink-muted:track:4.5 border-strong:surface-hover:3
// Only the probed pairs are checked, and every result is printed. To check a part dimmed with
// `opacity` (disabled, read-only), add --opacity and the page color it's drawn over (default bg):
//   pnpm check:contrast --probe ink:surface:4.5 --opacity 0.5 --page bg
// Both colors are blended with the page color at that opacity, as the browser composites them.
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const tokens = JSON.parse(readFileSync(new URL("tokens/tokens.json", root), "utf8"));
const { pairs } = JSON.parse(readFileSync(new URL("tokens/contrast.json", root), "utf8"));
const args = process.argv.slice(2);
const showAll = args.includes("--all");

function option(name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (value === undefined || value.startsWith("--")) fail(`${name} needs a value.`);
  return value;
}

function fail(message) {
  console.error(message);
  process.exit(2);
}

function probePairs() {
  const index = args.indexOf("--probe");
  if (index === -1) return undefined;
  const specs = [];
  for (const arg of args.slice(index + 1)) {
    if (arg.startsWith("--")) break;
    specs.push(arg);
  }
  if (!specs.length) fail("--probe needs at least one pair, written fg:bg:min (for example ink-muted:track:4.5).");
  return specs.map((spec) => {
    const [fg, bg, min, extra] = spec.split(":");
    if (!fg || !bg || !min || extra !== undefined || !(Number(min) > 0)) {
      fail(`Can't read "${spec}": write each pair as fg:bg:min, for example ink-muted:track:4.5.`);
    }
    const listed = pairs.some((pair) => pair.fg === fg && pair.bg === bg);
    return { fg, bg, min: Number(min), use: listed ? "(already in contrast.json)" : "(not in contrast.json)" };
  });
}

const probes = probePairs();
const opacityOption = option("--opacity");
const pageOption = option("--page");
if ((opacityOption !== undefined || pageOption !== undefined) && !probes) fail("--opacity and --page only work with --probe.");
const opacity = opacityOption === undefined ? 1 : Number(opacityOption);
if (!(opacity > 0 && opacity <= 1)) fail(`--opacity must be more than 0 and at most 1, got "${opacityOption}".`);
const page = pageOption ?? "bg";

const byName = new Map(tokens.color.tokens.map((token) => [token.name, token.value]));
const themes = tokens.color.themes.map((theme) => theme.id);

for (const name of [...new Set((probes ?? []).flatMap(({ fg, bg }) => [fg, bg]).concat(probes ? [page] : []))]) {
  if (!byName.has(name)) fail(`There's no color token "${name}". Use a name from tokens/tokens.json, such as ink-muted.`);
}

function resolve(name, theme, trail = []) {
  if (trail.includes(name)) throw new Error(`Circular token alias: ${[...trail, name].join(" -> ")}`);
  if (!byName.has(name)) throw new Error(`Unknown color token "${name}"`);
  const raw = byName.get(name);
  const value = typeof raw === "string" ? raw : raw[theme];
  const alias = value.match(/^\{(.+)\}$/);
  return alias ? resolve(alias[1], theme, [...trail, name]) : value;
}

function hslToRgb(value) {
  const match = value.match(/^hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)$/);
  if (!match) throw new Error(`Expected hsl(H S% L%), got "${value}"`);
  const [h, s, l] = [Number(match[1]) / 360, Number(match[2]) / 100, Number(match[3]) / 100];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t) => {
    const x = (t + 1) % 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return [channel(h + 1 / 3), channel(h), channel(h - 1 / 3)];
}

const luminance = (rgb) => {
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
// Blend a color with the page color at an opacity, in sRGB, as the browser composites them.
const blend = (rgb, under, alpha) => rgb.map((c, i) => alpha * c + (1 - alpha) * under[i]);

const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const checked = probes ?? pairs;
const dimmed = opacity < 1 ? ` at ${opacity * 100}% opacity over ${page}` : "";
let failures = 0;
for (const theme of themes) {
  const lines = [];
  for (const { fg, bg, min, use } of checked) {
    let [fgRgb, bgRgb] = [hslToRgb(resolve(fg, theme)), hslToRgb(resolve(bg, theme))];
    if (opacity < 1) {
      const pageRgb = hslToRgb(resolve(page, theme));
      [fgRgb, bgRgb] = [blend(fgRgb, pageRgb, opacity), blend(bgRgb, pageRgb, opacity)];
    }
    const value = ratio(fgRgb, bgRgb);
    const ok = value >= min;
    if (!ok) failures += 1;
    if (!ok || showAll || probes) {
      lines.push(`  ${ok ? "ok  " : "FAIL"} ${fg} on ${bg}${dimmed}: ${value.toFixed(2)}:1 (needs ${min}:1) ${use}`);
    }
  }
  if (lines.length) console.log(`${theme}\n${lines.join("\n")}`);
}

if (failures) {
  console.error(`\n${failures} contrast ${probes ? "probe" : "pair"}${failures === 1 ? "" : "s"} below the minimum.`);
  process.exit(1);
}
console.log(
  probes
    ? `Probe: ${probes.length} pair${probes.length === 1 ? "" : "s"} pass in ${themes.length} themes${dimmed}.`
    : `Contrast: ${pairs.length} pairs pass in ${themes.length} themes.`,
);
