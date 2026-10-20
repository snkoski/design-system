// Checks every foreground/background pair in tokens/contrast.json against WCAG contrast,
// in all three themes. Run with `pnpm check:contrast`; add `--all` to print passing pairs too.
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const tokens = JSON.parse(readFileSync(new URL("tokens/tokens.json", root), "utf8"));
const { pairs } = JSON.parse(readFileSync(new URL("tokens/contrast.json", root), "utf8"));
const showAll = process.argv.includes("--all");

const byName = new Map(tokens.color.tokens.map((token) => [token.name, token.value]));
const themes = tokens.color.themes.map((theme) => theme.id);

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
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

let failures = 0;
for (const theme of themes) {
  const lines = [];
  for (const { fg, bg, min, use } of pairs) {
    const value = ratio(hslToRgb(resolve(fg, theme)), hslToRgb(resolve(bg, theme)));
    const ok = value >= min;
    if (!ok) failures += 1;
    if (!ok || showAll) {
      lines.push(`  ${ok ? "ok  " : "FAIL"} ${fg} on ${bg}: ${value.toFixed(2)}:1 (needs ${min}:1) ${use}`);
    }
  }
  if (lines.length) console.log(`${theme}\n${lines.join("\n")}`);
}

if (failures) {
  console.error(`\n${failures} contrast pair${failures === 1 ? "" : "s"} below the minimum.`);
  process.exit(1);
}
console.log(`Contrast: ${pairs.length} pairs pass in ${themes.length} themes.`);
