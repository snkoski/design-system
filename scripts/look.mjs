// Looks at one component in the built Storybook, for the checks tests can't make.
//
//   pnpm build-storybook
//   pnpm look <Name> [--out <folder>]
//
// <Name> is the stories file's name (Switch, ButtonLink, LookAt), in src/components or src/experiments.
// It serves storybook-static on a free port (so worktrees don't collide, and nothing is left running), then:
//   1. Loads every story and reports its phase and any page or console error. Each must reach "finished"
//      with no error (a play function that throws still reaches "finished", but logs one). "completing"
//      after the wait means the story keeps changing on its own (a simulated upload), which isn't a failure.
//   2. Screenshots the AllThemes story in each theme, the light theme with data-pointer="coarse" and with
//      data-density="compact", the light theme in forced colors, and the first focusable control in each
//      theme with keyboard focus.
//   3. Prints the fill and top edge of every state (checked, invalid, selected, disabled, and so on) in the
//      light theme, at rest and hovered, in normal mode and forced colors, beside forced colors' Canvas.
// Then open the screenshots and judge them: this script finds them, it doesn't decide what looks right.
// It writes only to the output folder. Exit code 1 means a story failed or a page logged an error.
import { createServer } from "node:http";
import { readFileSync, readdirSync, statSync, mkdirSync, existsSync } from "node:fs";
import { join, extname, normalize, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { chromium } from "playwright";

const root = resolve(new URL("..", import.meta.url).pathname);
const staticDir = join(root, "storybook-static");
const args = process.argv.slice(2);
const outIndex = args.indexOf("--out");
const name = args.filter((arg, i) => !arg.startsWith("--") && i !== outIndex + 1 || (outIndex === -1 && !arg.startsWith("--")))[0];
if (outIndex !== -1 && !args[outIndex + 1]) stop("--out needs a folder.");
const out = resolve(outIndex === -1 ? join(tmpdir(), "design-system-look", name ?? "") : args[outIndex + 1]);

if (!name) stop("Say which component to look at: pnpm look <Name> [--out <folder>].");
if (!existsSync(join(staticDir, "index.json"))) stop("There's no built Storybook. Run pnpm build-storybook first.");

const index = JSON.parse(readFileSync(join(staticDir, "index.json"), "utf8"));
const stories = Object.values(index.entries).filter(
  (entry) => entry.type === "story" && /\/src\/(components|experiments)\//.test(entry.importPath) && entry.importPath.endsWith(`/${name}.stories.tsx`),
);
if (!stories.length) {
  const names = new Set(
    Object.values(index.entries)
      .map((entry) => entry.importPath.match(/\/src\/(?:components|experiments)\/.+\/(\w+)\.stories\.tsx$/)?.[1])
      .filter(Boolean),
  );
  stop(`No stories for "${name}" in the built Storybook. Names it has: ${[...names].sort().join(", ")}.`);
}
const folder = stories[0].importPath.replace(/^\.\//, "").replace(/\/[^/]+$/, "");

warnIfStale();
mkdirSync(out, { recursive: true });

const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".woff": "font/woff", ".ico": "image/x-icon", ".txt": "text/plain" };
const server = createServer((request, response) => {
  const path = normalize(decodeURIComponent(new URL(request.url, "http://x").pathname)).replace(/^([/\\])+/, "");
  let file = join(staticDir, path || "index.html");
  if (!file.startsWith(staticDir + sep) && file !== staticDir) return send(response, 403);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) return send(response, 404);
  response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
  response.end(readFileSync(file));
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
let failed = false;
try {
  const page = await browser.newPage({ viewport: { width: 700, height: 900 } });
  const problems = [];
  // A play function that throws still ends in the phase "finished", so errors are what catch it.
  const firstLine = (text) => text.split("\n")[0];
  page.on("pageerror", (error) => problems.push(`page error: ${firstLine(error.message)}`));
  page.on("console", (message) => message.type() === "error" && problems.push(`console error: ${firstLine(message.text())}`));

  // 1. Every story's phase.
  console.log(`${name}: ${stories.length} stories in ${folder}\n\nStory phases`);
  for (const story of stories) {
    problems.length = 0;
    const phase = await open(page, story.id);
    const ok = phase === "finished" || phase === "completing";
    if (!ok || problems.length) failed = true;
    const note = phase === "completing" ? " (still changing on its own; not a failure)" : "";
    console.log(`  ${ok && !problems.length ? "ok  " : "FAIL"} ${story.name}: ${phase}${note}`);
    for (const problem of [...new Set(problems)]) console.log(`       ${problem}`);
  }

  const allThemes = stories.find((story) => story.id.endsWith("--all-themes"));
  if (!allThemes) {
    console.log("\nNo AllThemes story, so no screenshots or state colors.");
  } else {
    // 2. Screenshots.
    console.log(`\nScreenshots in ${out}`);
    await open(page, allThemes.id);
    const section = (theme) => page.locator(`section[data-theme=${theme}]`).first();
    const themes = await page.locator("section[data-theme]").evaluateAll((all) => [...new Set(all.map((el) => el.dataset.theme))]);
    if (!themes.length) console.log("  AllThemes has no section[data-theme], so only #storybook-root is shot.");
    const shot = async (locator, file) => {
      await locator.screenshot({ path: join(out, file), animations: "disabled" });
      console.log(`  ${file}`);
    };
    for (const theme of themes) await shot(section(theme), `${name}-${theme}.png`);
    if (!themes.length) await shot(page.locator("#storybook-root"), `${name}.png`);
    const light = themes.includes("light") ? section("light") : page.locator("#storybook-root");
    for (const [key, value, file] of [["pointer", "coarse", "coarse"], ["density", "compact", "compact"]]) {
      await light.evaluate((el, [k, v]) => (el.dataset[k] = v), [key, value]);
      await page.waitForTimeout(100);
      await shot(light, `${name}-light-${file}.png`);
      await light.evaluate((el, k) => delete el.dataset[k], key);
    }

    const focused = [];
    for (const theme of themes.length ? themes : [null]) {
      const scope = theme ? section(theme) : page.locator("#storybook-root");
      const target = await firstFocusable(scope);
      if (!target) {
        focused.push("nothing focusable");
        break;
      }
      // Keyboard focus, so :focus-visible matches: focus it, Tab away, and Shift+Tab back.
      await target.focus();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Shift+Tab");
      await page.waitForTimeout(200);
      const where = await page.evaluate(() => describe(document.activeElement));
      focused.push(`${theme ?? "page"}: ${where}`);
      await shot(scope, `${name}-focus${theme ? `-${theme}` : ""}.png`);
    }
    console.log(`  Focused: ${focused.join("; ")}`);

    await page.emulateMedia({ forcedColors: "active" });
    await open(page, allThemes.id);
    await shot(light, `${name}-forced.png`);

    // 3. State colors, at rest and hovered, in normal mode and forced colors.
    await page.emulateMedia({ forcedColors: "none" });
    await open(page, allThemes.id);
    const normal = await stateColors(page, light);
    await page.emulateMedia({ forcedColors: "active" });
    await open(page, allThemes.id);
    const forced = await stateColors(page, light);
    const canvas = await page.evaluate(() => {
      const probe = document.body.appendChild(document.createElement("div"));
      probe.style.backgroundColor = "Canvas";
      const color = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return color;
    });

    console.log(`\nStates in the light theme (fill | top edge). Forced colors' Canvas is ${canvas}.`);
    if (!normal.length) console.log("  No element in it has a state attribute.");
    for (const state of normal) {
      const inForced = forced.find((item) => item.selector === state.selector);
      console.log(`  ${state.selector} on ${state.element}`);
      console.log(`    normal  rest ${state.rest}   hovered ${state.hovered}${state.rest === state.hovered ? "" : "   (hover changes it: check the state still shows)"}`);
      if (!inForced) continue;
      console.log(`    forced  rest ${inForced.rest}   hovered ${inForced.hovered}${inForced.rest === inForced.hovered ? "" : "   (hover changes it: check the state still shows)"}`);
      if (inForced.rest === `${canvas} | ${canvas}`) {
        console.log(`    WARN  at rest in forced colors, fill and edge are both Canvas: check the forced screenshot that it doesn't vanish.`);
      }
    }
  }
} finally {
  await browser.close();
  server.close();
}
process.exit(failed ? 1 : 0);

async function open(page, id) {
  await page.goto(`${base}/iframe.html?id=${id}&viewMode=story`);
  await page.addScriptTag({ content: `window.describe = ${describeElement.toString()};` });
  const done = ["finished", "errored", "aborted"];
  const until = Date.now() + 15000;
  let phase;
  while (Date.now() < until) {
    phase = await page.evaluate(() => window.__STORYBOOK_PREVIEW__?.storyRenders?.[0]?.phase);
    if (done.includes(phase)) return phase;
    await page.waitForTimeout(100);
  }
  return phase ?? "never rendered";
}

async function firstFocusable(scope) {
  const found = await scope.evaluate((el) => {
    for (const marked of document.querySelectorAll("[data-look-focus]")) marked.removeAttribute("data-look-focus");
    const query = 'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';
    const target = [...el.querySelectorAll(query)].find((candidate) => !candidate.matches(":disabled") && candidate.getClientRects().length > 0);
    target?.setAttribute("data-look-focus", "");
    return Boolean(target);
  });
  return found ? scope.locator("[data-look-focus]") : null;
}

async function stateColors(page, scope) {
  const selectors = ['[aria-checked="true"]', '[aria-checked="mixed"]', '[aria-selected="true"]', '[aria-pressed="true"]', '[aria-expanded="true"]', '[aria-current]:not([aria-current="false"])', '[aria-invalid="true"]', '[aria-readonly="true"]', "[data-readonly]", "[readonly]", "[data-disabled]", ":disabled"];
  const results = [];
  for (const selector of selectors) {
    // Of the elements in this state, take the first one that draws a visible edge (the control itself),
    // skipping wrappers and visually hidden inputs. Elements already reported for another selector are skipped.
    const found = await scope.evaluate((el, selector) => {
      for (const marked of document.querySelectorAll("[data-look-state]")) marked.removeAttribute("data-look-state");
      const seen = (window.lookSeen ??= new Set());
      const visible = (candidate) => {
        const box = candidate.getBoundingClientRect();
        return box.width > 2 && box.height > 2;
      };
      const edged = (candidate) => {
        const style = getComputedStyle(candidate);
        return style.borderTopStyle !== "none" && parseFloat(style.borderTopWidth) > 0;
      };
      const all = [...el.querySelectorAll(selector)].filter(visible);
      const target = all.find((c) => edged(c) && !seen.has(c)) ?? all.find((c) => !seen.has(c));
      if (!target) return false;
      seen.add(target);
      target.setAttribute("data-look-state", "");
      return true;
    }, selector);
    if (!found) continue;
    const target = scope.locator("[data-look-state]");
    const look = () => target.evaluate((el) => `${getComputedStyle(el).backgroundColor} | ${getComputedStyle(el).borderTopColor}`);
    await page.mouse.move(0, 0);
    await page.waitForTimeout(350);
    const rest = await look();
    await target.hover({ force: true });
    await page.waitForTimeout(350);
    const hovered = await look();
    results.push({ selector, element: await target.evaluate((el) => describe(el)), rest, hovered });
  }
  await page.mouse.move(0, 0);
  await page.evaluate(() => delete window.lookSeen);
  return results;
}

function describeElement(el) {
  if (!el || el === document.body) return "the page (nothing focused)";
  const role = el.getAttribute("role");
  // Visible text without aria-hidden parts (such as the "Read only" note), roughly what a screen reader reads.
  const text = (node) => {
    if (!node) return "";
    const copy = node.cloneNode(true);
    for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) hidden.remove();
    return copy.textContent.replace(/\s+/g, " ").trim();
  };
  const byIds = (el.getAttribute("aria-labelledby") ?? "").split(" ").filter(Boolean).map((id) => text(document.getElementById(id))).join(" ").trim();
  const label = el.getAttribute("aria-label") || byIds || text(el.labels?.[0]) || text(el);
  const classes = [...el.classList].slice(0, 2).map((c) => `.${c}`).join("");
  return `${el.tagName.toLowerCase()}${classes}${role ? ` [role=${role}]` : ""}${label ? ` "${label.slice(0, 40)}"` : ""}`;
}

function send(response, status) {
  response.writeHead(status);
  response.end();
}

function warnIfStale() {
  const built = statSync(join(staticDir, "index.html")).mtimeMs;
  const newest = (path) => {
    const info = statSync(path);
    if (!info.isDirectory()) return info.mtimeMs;
    return Math.max(0, ...readdirSync(path).map((entry) => newest(join(path, entry))));
  };
  const sources = [join(root, folder), join(root, "src/internal"), join(root, "src/styles"), join(root, "tokens/tokens.json")];
  if (sources.some((path) => existsSync(path) && newest(path) > built)) {
    console.log("WARN  storybook-static is older than the component, src/internal, src/styles, or the tokens. Run pnpm build-storybook first.\n");
  }
}

function stop(message) {
  console.error(message);
  process.exit(2);
}
