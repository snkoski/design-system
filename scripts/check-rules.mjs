// Checks the mechanical rules from CLAUDE.md that are easy to break by accident.
// Run with `pnpm check:rules`. It reads files and prints `file:line rule: message` for each break.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const problems = [];
const report = (file, line, rule, message) =>
  problems.push(`${relative(root, file)}${line ? `:${line}` : ""}  ${rule}: ${message}`);

const read = (file) => readFileSync(file, "utf8");
const listDir = (dir) => (existsSync(dir) ? readdirSync(dir) : []);
const walk = (dir) =>
  listDir(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
// Blank out comments but keep newlines, so line numbers stay right
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, " "));
const lineOf = (text, index) => text.slice(0, index).split("\n").length;

// CSS named colors. System colors (Canvas, ButtonText, Highlight, and so on) are not listed, so they're allowed.
const NAMED_COLORS = new Set(
  `aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood
  cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray
  darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen
  darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue
  firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew
  hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan
  lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray
  lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue
  mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred
  midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid
  palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple
  rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue
  slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white
  whitesmoke yellow yellowgreen`.split(/\s+/),
);
const COLOR_PROPS = /^(color|background(-color|-image)?|border(-[a-z]+)*|outline(-color)?|fill|stroke|box-shadow|text-shadow|text-decoration(-color)?|caret-color|accent-color|column-rule(-color)?)$/;

// --- 1. Component CSS ---------------------------------------------------------------------------
const definedProps = new Set();
for (const file of [join(root, "src/styles/tokens.css"), join(root, "src/styles/base.css")]) {
  if (existsSync(file)) for (const match of read(file).matchAll(/(--[\w-]+)\s*:/g)) definedProps.add(match[1]);
}
// The Tailwind theme file maps tokens into Tailwind and is generated; its names are valid too
const twTheme = join(root, "src/styles/tailwind-theme.css");
if (existsSync(twTheme)) for (const match of read(twTheme).matchAll(/(--[\w-]+)\s*:/g)) definedProps.add(match[1]);

const tokens = JSON.parse(read(join(root, "tokens/tokens.json")));
const primitives = tokens.color.tokens.filter((token) => /^Primitive\./.test(token.usage)).map((token) => token.name);

const cssFiles = walk(join(root, "src/components")).filter((file) => file.endsWith(".css"));
for (const file of cssFiles) {
  const raw = read(file);
  const css = stripComments(raw);
  const localProps = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]));

  if (!/^\s*@layer\s+components\s*\{/.test(css)) {
    report(file, 1, "layer", "component CSS must be wrapped in `@layer components { ... }`");
  }

  for (const match of css.matchAll(/\.[A-Za-z][\w-]*--[\w-]+/g)) {
    report(file, lineOf(css, match.index), "modifier-class", `${match[0]}: use a data-* attribute for variants, not a modifier class`);
  }
  for (const match of css.matchAll(/sherbet/gi)) {
    report(file, lineOf(css, match.index), "palette-name", "never put the palette name in class names or CSS variables");
  }
  for (const match of css.matchAll(/!important/g)) {
    report(file, lineOf(css, match.index), "important", "avoid !important; attribute selectors already override cleanly");
  }
  for (const match of css.matchAll(/@media\s*([^{]+)\{/g)) {
    if (/\d\s*px/.test(match[1])) report(file, lineOf(css, match.index), "media-units", "media queries use em, not px");
  }
  for (const match of css.matchAll(/var\(\s*(--[\w-]+)\s*([,)])/g)) {
    const [, name, next] = match;
    if (next === ")" && !definedProps.has(name) && !localProps.has(name)) {
      report(file, lineOf(css, match.index), "unknown-token", `${name} is not defined in tokens.css (typo, or a token to add)`);
    }
  }
  for (const primitive of primitives) {
    for (const match of css.matchAll(new RegExp(`var\\(\\s*--${primitive}\\s*[,)]`, "g"))) {
      report(file, lineOf(css, match.index), "primitive-token", `--${primitive} is a primitive; components use semantic tokens only`);
    }
  }

  for (const match of css.matchAll(/([a-z-]+)\s*:\s*([^;{}]+?)\s*(?=;|\})/g)) {
    const [, prop, value] = match;
    if (prop.startsWith("--")) continue;
    const line = lineOf(css, match.index);
    const bare = value.replace(/var\([^)]*\)/g, "");

    if (/#[0-9a-fA-F]{3,8}\b/.test(bare)) report(file, line, "hex-color", `${prop}: hex colors are not allowed; use a semantic token (colors are HSL only)`);
    if (/\b(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\(/i.test(bare)) report(file, line, "raw-color", `${prop}: raw color values are not allowed; use a semantic token`);
    if (COLOR_PROPS.test(prop)) {
      for (const word of bare.toLowerCase().match(/[a-z]+/g) ?? []) {
        if (NAMED_COLORS.has(word)) report(file, line, "named-color", `${prop}: "${word}" is a named color; use a semantic token`);
      }
    }
    for (const px of bare.matchAll(/(-?[\d.]+)px/g)) {
      if (Number(px[1]) === 0 || /translate/.test(bare)) continue;
      report(file, line, "px-unit", `${prop}: ${px[0]} — use rem (px is only for borders, focus rings, and shadow offsets, through tokens)`);
    }
    for (const time of bare.matchAll(/(?<![\w.-])([\d.]+)(ms|s)\b/g)) {
      if (Number(time[1]) === 0) continue;
      report(file, line, "raw-duration", `${prop}: ${time[0]} — use a --duration-* token`);
    }
    if (/^outline(-style)?$/.test(prop) && /^(none|0)$/.test(value.trim())) {
      report(file, line, "focus-outline", "do not remove an outline without replacing it");
    }
  }
}

// --- 2. Component structure ---------------------------------------------------------------------
const stylesIndex = existsSync(join(root, "src/styles/index.css")) ? read(join(root, "src/styles/index.css")) : "";
const packageIndex = existsSync(join(root, "src/index.ts")) ? read(join(root, "src/index.ts")) : "";
const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const componentsDir = join(root, "src/components");

for (const name of listDir(componentsDir)) {
  const dir = join(componentsDir, name);
  if (!statSync(dir).isDirectory()) continue;
  const files = listDir(dir);

  const cssName = [kebab(name) + ".css", name.toLowerCase() + ".css"].find((candidate) => files.includes(candidate));
  for (const required of [`${name}.tsx`, `${name}.test.tsx`, `${name}.stories.tsx`, "index.ts"]) {
    if (!files.includes(required)) report(join(dir, required), 0, "missing-file", `every component needs ${required}`);
  }
  if (!cssName) report(join(dir, `${kebab(name)}.css`), 0, "missing-file", "every component needs its CSS file");
  else if (!stylesIndex.includes(`../components/${name}/${cssName}`)) {
    report(join(root, "src/styles/index.css"), 0, "css-import", `import ../components/${name}/${cssName}`);
  }
  if (!packageIndex.includes(`./components/${name}`)) {
    report(join(root, "src/index.ts"), 0, "export", `export ./components/${name}`);
  }

  // A sibling component in the same folder (such as ButtonLink) needs its own tests and stories
  for (const file of files) {
    const sibling = file.match(/^([A-Z]\w*)\.tsx$/);
    if (!sibling || sibling[1] === name) continue;
    for (const required of [`${sibling[1]}.test.tsx`, `${sibling[1]}.stories.tsx`]) {
      if (!files.includes(required)) report(join(dir, required), 0, "missing-file", `${file} needs ${required}`);
    }
  }

  for (const file of files.filter((file) => file.endsWith(".stories.tsx"))) {
    const stories = read(join(dir, file));
    for (const story of ["Playground", "AllThemes"]) {
      if (!new RegExp(`export const ${story}\\b`).test(stories)) {
        report(join(dir, file), 0, "story", `needs a ${story} story`);
      }
    }
  }

  for (const file of files.filter((file) => /\.tsx?$/.test(file) && !/\.(test|stories)\./.test(file))) {
    const source = read(join(dir, file));
    if (/class-variance-authority|\bcva\(/.test(source)) report(join(dir, file), 0, "cva", "do not use cva; variants are data-* attributes");
  }
}

// --- 3. Palette name in file names ---------------------------------------------------------------
for (const file of [...walk(join(root, "src")), ...walk(join(root, "scripts"))]) {
  if (/sherbet/i.test(file)) report(file, 0, "palette-name", "never put the palette name in file names");
}
if (/sherbet/i.test(JSON.stringify(JSON.parse(read(join(root, "package.json"))).name))) {
  report(join(root, "package.json"), 0, "palette-name", "never put the palette name in the package name");
}
for (const token of tokens.color.tokens) {
  if (/sherbet/i.test(token.name)) report(join(root, "tokens/tokens.json"), 0, "palette-name", `token ${token.name} contains the palette name`);
}

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} rule break${problems.length === 1 ? "" : "s"}.`);
  process.exit(1);
}
console.log(`Rules: ${cssFiles.length} component CSS files and ${listDir(componentsDir).length} component folders pass.`);
