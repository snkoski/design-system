// Runs at the end of `pnpm build`: fails if anything published in dist/ still imports through one of the repo's
// aliases (@/, @docs/, @tokens/, @tests/). Those only mean something inside this repo, so an app that installs the
// package couldn't resolve them. tsc copies them into the .d.ts files as written; tsc-alias rewrites them, and this
// checks it did.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const ALIAS = /(?:\bfrom|\bimport|@import)\s*\(?\s*["'](@(?:docs|tokens|tests)?\/[^"']*)["']/g;
const problems = [];
for (const file of walk(dist).filter((file) => /\.(js|ts|css)$/.test(file))) {
  for (const match of readFileSync(file, "utf8").matchAll(ALIAS)) problems.push(`${relative(root, file)}: ${match[1]}`);
}
if (problems.length) {
  console.error(`dist/ imports through a repo alias, which apps can't resolve:\n${problems.join("\n")}`);
  process.exit(1);
}
console.log("dist/: no repo aliases left in the published files");
