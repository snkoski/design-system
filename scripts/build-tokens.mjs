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

const staticFamilies = ["spacing", "radius", "size", "borderWidth"];
const staticLines = staticFamilies.flatMap((f) => (tokens[f]?.tokens ?? []).map((t) => `  --${t.name}: ${t.value};`));
for (const [k, v] of Object.entries(tokens.type.families)) staticLines.push(`  --font-${k}: ${v};`);

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
  --motion-scale: 0.85;
  --motion-decoration: 1; /* purely decorative motion: 0 turns it off */`;
// Reduced motion: no slides, no bounce, no scale, shorter durations
const motionReduced = `
  --motion-distance: 0rem;
  --motion-scale: 1;
  --motion-decoration: 0;
  --duration-base: 120ms;
  --duration-slow: 120ms;
  --duration-loop: 1600ms;
  --ease-bounce: var(--ease-out);`;

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
  --container-measure: ${tokens.size.tokens.find((t) => t.name === "measure").value};
  --container-content: ${tokens.size.tokens.find((t) => t.name === "content-max").value};
  --breakpoint-sm: 40em;
  --breakpoint-md: 48em;
  --breakpoint-lg: 64em;
  --breakpoint-xl: 80em;
  --breakpoint-2xl: 96em;
}
`;
writeFileSync(join(outDir, "tailwind-theme.css"), tw);

console.log(`Tokens built: ${tokens.color.tokens.length} colors × ${themes.length} themes → src/styles/tokens.css, src/styles/tailwind-theme.css`);
