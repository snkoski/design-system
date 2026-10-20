// Flags tests that were deleted, skipped, or weakened, by comparing test and story files against git.
//
//   pnpm check:tests                  compare the working tree with HEAD (uncommitted changes)
//   pnpm check:tests -- --base main   compare with another ref, for example before opening a pull request
//
// It also runs as a Claude Code hook (see .claude/settings.json) with --hook, where it reads the tool
// call from stdin and exits with code 2, which sends the message back to Claude.
//
// "Weakened" is approximate: it counts tests, stories, play functions, and assertions, so it can't see a
// loosened assertion. It catches the obvious cases. Removing tests is allowed only when the user says so.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const hookMode = args.includes("--hook");
const baseIndex = args.indexOf("--base");
const base = baseIndex === -1 ? "HEAD" : args[baseIndex + 1];
const root = new URL("../", import.meta.url).pathname;

const git = (...gitArgs) => execFileSync("git", gitArgs, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const isTestFile = (file) => /\.(test|stories)\.[jt]sx?$/.test(file);

if (hookMode) {
  let call = {};
  try {
    call = JSON.parse(readFileSync(0, "utf8"));
  } catch {
    process.exit(0);
  }
  const input = call.tool_input ?? {};
  const touchesTests =
    (input.file_path && isTestFile(input.file_path)) ||
    (call.tool_name === "Bash" &&
      /\b(rm|mv|sed|perl|git\s+(rm|checkout|restore|stash|reset))\b/.test(input.command ?? "") &&
      /(\.test\.|\.stories\.|test|stories)/.test(input.command ?? ""));
  if (!touchesTests) process.exit(0);
}

const changed = new Set();
for (const line of git("diff", "--no-renames", "--name-only", base).split("\n")) if (line) changed.add(line);
for (const line of git("ls-files", "--others", "--exclude-standard").split("\n")) if (line) changed.add(line);

const strip = (source) => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
function measure(source) {
  const code = strip(source);
  const count = (pattern) => (code.match(pattern) ?? []).length;
  return {
    tests: count(/\b(?:it|test)(?:\.each)?\s*\(/g),
    stories: count(/^export const [A-Z]\w*/gm),
    plays: count(/\bplay\s*:/g),
    assertions: count(/\bexpect\w*\s*[(<.]/g),
    skips: count(/\b(?:it|test|describe)\.(?:skip|todo|fails)\b|\b(?:xit|xtest|xdescribe)\s*\(|\.only\s*\(/g),
  };
}
const empty = measure("");
const sum = (a, b) => Object.fromEntries(Object.keys(a).map((key) => [key, a[key] + b[key]]));

let before = empty;
let after = empty;
const files = [];
for (const file of [...changed].filter(isTestFile)) {
  let old = "";
  try {
    old = git("show", `${base}:${file}`);
  } catch {
    // New file
  }
  const current = existsSync(join(root, file)) ? readFileSync(join(root, file), "utf8") : "";
  const b = measure(old);
  const a = measure(current);
  before = sum(before, b);
  after = sum(after, a);
  if (a.tests < b.tests || a.stories < b.stories || a.plays < b.plays || a.assertions < b.assertions || a.skips > b.skips) {
    files.push(`  ${file}: tests ${b.tests} -> ${a.tests}, stories ${b.stories} -> ${a.stories}, play functions ${b.plays} -> ${a.plays}, assertions ${b.assertions} -> ${a.assertions}, skipped ${b.skips} -> ${a.skips}`);
  }
}

const problems = [];
if (after.tests < before.tests) problems.push(`tests ${before.tests} -> ${after.tests}`);
if (after.stories < before.stories) problems.push(`stories ${before.stories} -> ${after.stories}`);
if (after.plays < before.plays) problems.push(`play functions ${before.plays} -> ${after.plays}`);
if (after.assertions < before.assertions) problems.push(`assertions ${before.assertions} -> ${after.assertions}`);
if (after.skips > before.skips) problems.push(`skipped tests ${before.skips} -> ${after.skips}`);

if (problems.length) {
  console.error(
    [
      `Tests were removed, skipped, or weakened compared with ${base}: ${problems.join(", ")}.`,
      ...files,
      "",
      "Never delete, skip, or weaken a test to make something pass. Only remove a test if the user explicitly said to.",
      "If a test fails, fix the component, or tell the user why you think the test is wrong and let them decide.",
      "If you are moving tests to another file, add them there now: the totals across files must not drop.",
    ].join("\n"),
  );
  process.exit(hookMode ? 2 : 1);
}
if (!hookMode) console.log(`Tests kept: no tests removed, skipped, or weakened compared with ${base}.`);
