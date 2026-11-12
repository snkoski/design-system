// Writes the published CSS into dist/ after `vite build`:
//   styles.css          tokens + base + every component's CSS, flattened into one file
//   tokens.css          tokens only
//   tailwind-theme.css  for apps that use Tailwind for layout
//   fonts.css           self-hosted Geist (resolved by the app's bundler)

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
mkdirSync(dist, { recursive: true });

// Inline the @imports of our own files ("@/internal/field.css", from src) so the published styles.css is a single
// file. A relative one would be left in as it is and break in the app, so it stops the build.
function flatten(file, seen = new Set()) {
  const abs = resolve(file);
  if (seen.has(abs)) return "";
  seen.add(abs);
  const css = readFileSync(abs, "utf8");
  const relative = css.match(/^@import\s+"\.{1,2}\/[^"]+";/m);
  if (relative) throw new Error(`${abs}: ${relative[0]} — import from src with @/ instead`);
  return css.replace(/^@import\s+"@\/([^"]+)";\s*$/gm, (_, path) => flatten(join(root, "src", path), seen));
}

writeFileSync(join(dist, "styles.css"), flatten(join(root, "src/styles/index.css")));
for (const f of ["tokens.css", "tailwind-theme.css", "fonts.css"]) {
  writeFileSync(join(dist, f), readFileSync(join(root, "src/styles", f), "utf8"));
}
console.log("CSS written to dist/: styles.css, tokens.css, tailwind-theme.css, fonts.css");
