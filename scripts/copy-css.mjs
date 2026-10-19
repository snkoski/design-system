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

// Inline relative @imports so the published styles.css is a single file
function flatten(file, seen = new Set()) {
  const abs = resolve(file);
  if (seen.has(abs)) return "";
  seen.add(abs);
  return readFileSync(abs, "utf8").replace(/^@import\s+"(\.{1,2}\/[^"]+)";\s*$/gm, (_, rel) =>
    flatten(join(dirname(abs), rel), seen),
  );
}

writeFileSync(join(dist, "styles.css"), flatten(join(root, "src/styles/index.css")));
for (const f of ["tokens.css", "tailwind-theme.css", "fonts.css"]) {
  writeFileSync(join(dist, f), readFileSync(join(root, "src/styles", f), "utf8"));
}
console.log("CSS written to dist/: styles.css, tokens.css, tailwind-theme.css, fonts.css");
