// Turns tokens/tokens.json into two CSS files:
//   src/styles/tokens.css          every token as a CSS custom property, per theme
//   src/styles/tailwind-theme.css  Tailwind's @theme, limited to spacing, sizing, and layout
// Run with `pnpm tokens`. Both files are generated: edit tokens.json, not the CSS.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tokens = JSON.parse(readFileSync(join(root, "tokens/tokens.json"), "utf8"));
const outDir = join(root, "src/styles");
mkdirSync(outDir, { recursive: true });

const themes = tokens.color.themes.map((t) => t.id);
const [firstTheme] = themes;
const header = "/* Generated from tokens/tokens.json by scripts/build-tokens.mjs. Do not edit by hand. */\n";

// "{name}" aliases become var(--name)
const value = (v) => (typeof v === "string" && /^\{.+\}$/.test(v) ? `var(--${v.slice(1, -1)})` : v);
const forTheme = (v, theme) => (typeof v === "string" ? (theme === firstTheme ? v : undefined) : v[theme]);

// Each theme's color-scheme, so native controls and scrollbars match
const colorScheme = { light: "light", dark: "dark", hotdog: "light" };

function themeBlock(theme) {
  const lines = [];
  for (const t of tokens.color.tokens) {
    const v = forTheme(t.value, theme);
    if (v !== undefined) lines.push(`  --${t.name}: ${value(v)};`);
  }
  for (const t of tokens.shadow?.tokens ?? []) {
    const v = forTheme(t.value, theme);
    if (v !== undefined) lines.push(`  --${t.name}: ${v};`);
  }
  lines.push(`  color-scheme: ${colorScheme[theme] ?? "light"};`);
  return lines.join("\n");
}

const staticFamilies = ["spacing", "radius", "size", "iconStroke", "borderWidth"];
const staticLines = staticFamilies.flatMap((f) => (tokens[f]?.tokens ?? []).map((t) => `  --${t.name}: ${t.value};`));
for (const [k, v] of Object.entries(tokens.type.families)) staticLines.push(`  --font-${k}: ${v};`);
for (const t of tokens.type.leading?.tokens ?? []) staticLines.push(`  --${t.name}: ${t.value};`);

// Motion tokens live here because tokens.json has no motion family
const motionFull = `
  --duration-fast: 120ms;
  --duration-base: 200ms;
  --duration-slow: 320ms;
  --duration-loop: 700ms;
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --motion-distance: 0.5rem;
  --motion-scale: 0.85;`;
// Reduced motion: no slides, no bounce, no scale, shorter durations
const motionReduced = `
  --motion-distance: 0rem;
  --motion-scale: 1;
  --duration-base: 120ms;
  --duration-slow: 120ms;
  --duration-loop: 1600ms;
  --ease-bounce: var(--ease-out);`;

// Pointer and density sizing. A size token's value is for a mouse or trackpad; "touch" replaces it when a touch
// screen is present, and "compact" under compact density, but never below target-min, so a text field (which
// can't have an invisible hit area) stays a full target on a touchscreen laptop.
const sizeValue = (name) => tokens.size.tokens.find((t) => t.name === name).value;
const declarations = (list, pick) => list.map((t) => `\n  --${t.name}: ${pick(t)};`).join("");
const touchSized = tokens.size.tokens.filter((t) => t.touch);
const pointerCoarse = declarations(touchSized, (t) => t.touch);
const pointerFine = declarations(touchSized, (t) => t.value);
const densityCompact = declarations(
  tokens.size.tokens.filter((t) => t.compact),
  (t) => `max(${t.compact}, var(--target-min))`,
);

// Fluid heading sizes (the token file stores the widest-screen size)
const fluid = {
  display: "clamp(2.441rem, 1.749rem + 3.075vw, 4.209rem)",
  "heading-xl": "clamp(1.953rem, 1.482rem + 2.094vw, 3.157rem)",
  "heading-lg": "clamp(1.563rem, 1.248rem + 1.402vw, 2.369rem)",
  "heading-md": "clamp(1.25rem, 1.044rem + 0.917vw, 1.777rem)",
  "heading-sm": "clamp(1.125rem, 1.044rem + 0.362vw, 1.333rem)",
};
const typeLines = [];
const typeClasses = [];
for (const g of tokens.type.groups) {
  for (const s of g.styles) {
    const size = fluid[s.name] ?? s.fontSize;
    typeLines.push(`  --text-${s.name}: ${size};`);
    const props = [
      `font-family: var(--font-${s.family ?? g.family})`,
      `font-size: var(--text-${s.name})`,
      `line-height: ${s.lineHeight}`,
      `font-weight: ${s.fontWeight}`,
    ];
    if (s.letterSpacing) props.push(`letter-spacing: ${s.letterSpacing}`);
    if (s.name === "label") props.push("text-transform: uppercase");
    if (g.name === "Headings") props.push("text-wrap: balance");
    typeClasses.push(`  .text-${s.name} { ${props.join("; ")}; }`);
  }
}

const css = `${header}
@layer theme {
  :root,
  [data-theme="${firstTheme}"] {
${themeBlock(firstTheme)}
  }

  /* With no data-theme, dark follows the visitor's system setting */
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme]) {
${themeBlock("dark").replace(/^/gm, "  ")}
    }
  }
${themes
  .slice(1)
  .map((t) => `\n  [data-theme="${t}"] {\n${themeBlock(t)}\n  }`)
  .join("\n")}

  :root {
${staticLines.join("\n")}
${typeLines.join("\n")}
  }

  /* Motion follows the visitor's system setting. data-motion="full" or "reduced" on any
     element overrides it for that element and everything inside it. */
  :root,
  [data-motion="full"] {${motionFull}
  }

  @media (prefers-reduced-motion: reduce) {
    :root:not([data-motion="full"]) {${motionReduced.replace(/\n/g, "\n  ")}
    }
  }

  [data-motion="reduced"] {${motionReduced}
  }

  /* Touch: bigger targets and controls whenever any touch input exists (any-pointer, so a
     touchscreen laptop counts). data-pointer="coarse" or "fine" overrides it for a subtree. */
  @media (any-pointer: coarse) {
    :root:not([data-pointer="fine"]) {${pointerCoarse.replace(/\n/g, "\n  ")}
    }
  }

  [data-pointer="coarse"] {${pointerCoarse}
  }

  [data-pointer="fine"] {${pointerFine}
  }

  /* Opt-in compact density for data-heavy screens. Controls never get shorter than target-min. */
  [data-density="compact"] {${densityCompact}
  }

  @media (prefers-contrast: more) {
    :root,
    [data-theme] {
      --ink-muted: var(--ink);
      --border: var(--border-strong);
      --focus-width: 3px;
    }
  }
}

@layer base {
${typeClasses.join("\n")}
}
`;
writeFileSync(join(outDir, "tokens.css"), css);

// Tailwind is for layout only: keep its spacing scale (identical to space-N) and our
// sizes, and switch off its colors, fonts, and shadows so they can't be used by accident.
const tw = `${header}
@theme {
  --color-*: initial;
  --font-*: initial;
  --shadow-*: initial;
  --inset-shadow-*: initial;
  --drop-shadow-*: initial;
  --text-shadow-*: initial;
  --radius-*: initial;
  --text-*: initial;
  --font-weight-*: initial;
  --tracking-*: initial;
  --leading-*: initial;
  --ease-*: initial;
  --animate-*: initial;

  --spacing: 0.25rem;
  --container-measure: ${sizeValue("measure")};
  --container-content: ${sizeValue("content-max")};
${tokens.breakpoint.tokens.map((t) => `  --${t.name}: ${t.value};`).join("\n")}
}
`;
writeFileSync(join(outDir, "tailwind-theme.css"), tw);

console.log(`Tokens built: ${tokens.color.tokens.length} colors × ${themes.length} themes → src/styles/tokens.css, src/styles/tailwind-theme.css`);
