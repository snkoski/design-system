// Builds docs/reading-list.md and docs/reading-list.html from docs/reading-list.json.
// `node scripts/build-reading-list.mjs --check` fails if either file is out of date, so `pnpm check` catches a
// hand edit to the generated files or a data change that wasn't rebuilt.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = join(root, "docs/reading-list.json");
const mdPath = join(root, "docs/reading-list.md");
const htmlPath = join(root, "docs/reading-list.html");
const data = JSON.parse(readFileSync(dataPath, "utf8"));

// ---------- Check the data ----------

const problems = [];
const ids = (list, what) => {
  const seen = new Set();
  for (const item of list) {
    if (!item.id || !item.name) problems.push(`A ${what} needs an id and a name: ${JSON.stringify(item)}`);
    if (seen.has(item.id)) problems.push(`Two ${what}s have the id "${item.id}".`);
    seen.add(item.id);
  }
  return seen;
};
const groupIds = ids(data.groups, "group");
const topicIds = ids(data.topics, "topic");
const systemIds = ids(data.systems, "system");
for (const topic of data.topics) {
  if (!groupIds.has(topic.group)) problems.push(`Topic "${topic.id}" is in an unknown group "${topic.group}".`);
}
const seenLinks = new Set();
for (const link of data.links) {
  const where = `Link "${link.title ?? link.url}"`;
  if (!link.title || !link.url) problems.push(`${where} needs a title and a url.`);
  if (link.url && !/^https:\/\//.test(link.url)) problems.push(`${where} should be an https:// url.`);
  if (!Array.isArray(link.topics) || link.topics.length === 0) problems.push(`${where} needs at least one topic.`);
  for (const topic of link.topics ?? []) if (!topicIds.has(topic)) problems.push(`${where} has an unknown topic "${topic}".`);
  if (link.system && !systemIds.has(link.system)) problems.push(`${where} has an unknown system "${link.system}".`);
  const key = `${link.system ?? ""} ${link.url} ${link.title}`;
  if (seenLinks.has(key)) problems.push(`${where} is listed twice. Add a topic to the first one instead.`);
  seenLinks.add(key);
}
for (const topic of data.topics) {
  if (!data.links.some((link) => link.topics.includes(topic.id))) problems.push(`Topic "${topic.id}" has no links.`);
}
if (problems.length) {
  console.error(`docs/reading-list.json has ${problems.length} problem${problems.length === 1 ? "" : "s"}:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}

// ---------- Shared helpers ----------

const systemById = new Map(data.systems.map((system) => [system.id, system]));
const topicsIn = (group) => data.topics.filter((topic) => topic.group === group.id);
const linksFor = (filter) => data.links.filter(filter);
const listOf = (items) =>
  items.length <= 2 ? items.join(" and ") : `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
const systemGroups = data.groups.filter((group) => group.kind === "systems");
const readingGroups = data.groups.filter((group) => group.kind === "reading");
// Topics in the order they're listed, for showing one system's links grouped by topic
const systemTopics = systemGroups.flatMap(topicsIn);

// ---------- Markdown ----------

const slugCounts = new Map([["reading-list", 1], ["contents", 1]]);
const slug = (text) => {
  const base = text.trim().toLowerCase().replace(/[^\w\- ]/g, "").replace(/ /g, "-");
  const count = slugCounts.get(base) ?? 0;
  slugCounts.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
};
const mdLink = (link) => `[${link.title}](${link.url})`;
// "The full standard." reads as "[WCAG 2.2](…): the full standard." Leave "HSL" or "WCAG" alone.
const lowerFirst = (text) => (/^[A-Z][a-z]/.test(text) ? text[0].toLowerCase() + text.slice(1) : text);
const mdNoteInline = (link) => (link.note ? ` (${lowerFirst(link.note.replace(/\.$/, ""))})` : "");

const body = [];
const headings = [];
const heading = (level, text) => {
  headings.push({ level, text, anchor: slug(text) });
  body.push(`${"#".repeat(level)} ${text}`, "");
};

for (const group of readingGroups) {
  heading(2, group.name);
  if (group.intro) body.push(group.intro, "");
  for (const topic of topicsIn(group)) {
    heading(3, topic.name);
    if (topic.intro) body.push(topic.intro, "");
    for (const link of linksFor((l) => l.topics.includes(topic.id))) {
      body.push(`- ${mdLink(link)}${link.note ? `: ${lowerFirst(link.note)}` : ""}`);
    }
    body.push("");
  }
}

heading(2, "Design systems, by system");
body.push("Everything we read from each system, grouped by topic.", "");
for (const system of data.systems) {
  heading(3, system.name);
  for (const topic of systemTopics) {
    const links = linksFor((l) => l.system === system.id && l.topics.includes(topic.id));
    if (links.length) body.push(`- **${topic.name}:** ${listOf(links.map((l) => mdLink(l) + mdNoteInline(l)))}`);
  }
  body.push("");
}

for (const group of systemGroups) {
  heading(2, group.name);
  if (group.intro) body.push(group.intro, "");
  for (const topic of topicsIn(group)) {
    heading(3, topic.name);
    for (const system of data.systems) {
      const links = linksFor((l) => l.system === system.id && l.topics.includes(topic.id));
      if (links.length) body.push(`- **${system.name}:** ${listOf(links.map((l) => mdLink(l) + mdNoteInline(l)))}`);
    }
    body.push("");
  }
}

const markdown = [
  "<!-- Generated from docs/reading-list.json by scripts/build-reading-list.mjs. Edit the JSON, then run `pnpm reading-list`. -->",
  "",
  "# Reading list",
  "",
  "Articles, guides, and references to read later. When something here changes a decision, record the decision in `docs/brand/`.",
  "",
  "Design system links appear twice on purpose: once by system, to see everything one system says, and again by topic, to compare how every system handles, say, design tokens or checkboxes. Both come from the same entry in `docs/reading-list.json`, so a link is only ever added once. `docs/reading-list.html` is the same list as a page you can search and filter.",
  "",
  "## Contents",
  "",
  ...headings.map((h) => `${h.level === 3 ? "  " : ""}- [${h.text}](#${h.anchor})`),
  "",
  ...body,
]
  .join("\n")
  .replace(/\n+$/, "\n");

// ---------- Standalone HTML ----------

const escape = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// The real token CSS, so the page uses the system's colors, type, and three themes
const tokensCss = readFileSync(join(root, "src/styles/tokens.css"), "utf8").replace(/^\/\*.*\*\/\n/, "");
// The page's own styles, then the filters and results it shares with the Storybook page
const pageCss = [
  readFileSync(join(root, "scripts/reading-list-page.css"), "utf8"),
  readFileSync(join(root, "src/foundations/reading-list.css"), "utf8"),
  // The shared class for text that only screen readers read, from the published stylesheet
  readFileSync(join(root, "src/internal/visually-hidden.css"), "utf8"),
].join("\n");
const pageJs = readFileSync(join(root, "scripts/reading-list-page.js"), "utf8");
const json = JSON.stringify({ groups: data.groups, topics: data.topics, systems: data.systems, links: data.links }).replace(
  /</g,
  "\\u003c",
);

const html = `<!doctype html>
<!-- Generated from docs/reading-list.json by scripts/build-reading-list.mjs. Edit the JSON, then run \`pnpm reading-list\`. -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Reading list</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap">
<style>
@layer theme, base, page;
${tokensCss.trim()}
${pageCss.trim()}
</style>
</head>
<body>
<a class="rl-skip" href="#rl-results">Skip to the links</a>
<header class="rl-header">
  <div class="rl-header__text">
    <h1>Reading list</h1>
    <p>Articles, guides, and design system pages to read later. ${data.links.length} links from ${data.systems.length} design systems and other sources.</p>
  </div>
  <div class="rl-themes" role="group" aria-label="Theme">
    <button type="button" data-theme-choice="auto" aria-pressed="true">Auto</button>
    <button type="button" data-theme-choice="light" aria-pressed="false">Light</button>
    <button type="button" data-theme-choice="dark" aria-pressed="false">Dark</button>
    <button type="button" data-theme-choice="hotdog" aria-pressed="false">Hot dog</button>
  </div>
</header>
<main class="rl-main">
  <form class="rl-filters" role="search" aria-label="Filter the reading list">
    <div class="rl-field rl-field--search">
      <label for="rl-query">Search</label>
      <input id="rl-query" type="search" autocomplete="off" placeholder="Checkbox, tokens, or Atlassian">
    </div>
    <fieldset class="rl-field rl-view">
      <legend>Group by</legend>
      <div class="rl-segments">
        <label><input type="radio" name="view" value="topic" checked><span>Topic</span></label>
        <label><input type="radio" name="view" value="system"><span>System</span></label>
      </div>
    </fieldset>
    <div class="rl-field">
      <label for="rl-topic">Topic</label>
      <select id="rl-topic"><option value="">All topics</option>${data.groups
        .map(
          (g) =>
            `<optgroup label="${escape(g.name)}">${topicsIn(g)
              .map((t) => `<option value="${escape(t.id)}">${escape(t.name)}</option>`)
              .join("")}</optgroup>`,
        )
        .join("")}</select>
    </div>
    <details class="rl-systems">
      <summary><span class="rl-systems__label">Systems</span> <span class="rl-systems__value" id="rl-systems-value">All</span></summary>
      <fieldset class="rl-systems__options">
        <legend class="visually-hidden">Systems to show</legend>
        <label class="rl-check rl-check--all"><input type="checkbox" id="rl-systems-all" checked> All systems</label>
        ${data.systems
          .map((s) => `<label class="rl-check"><input type="checkbox" name="system" value="${escape(s.id)}" checked> ${escape(s.name)}</label>`)
          .join("\n        ")}
      </fieldset>
    </details>
  </form>
  <p class="rl-count" id="rl-count" role="status"></p>
  <div id="rl-results" class="rl-results" tabindex="-1"></div>
  <noscript>
    <p>This page needs JavaScript to search and filter. The same list is in <code>docs/reading-list.md</code>.</p>
  </noscript>
</main>
<script type="application/json" id="rl-data">${json}</script>
<script>
${pageJs.trim()}
</script>
</body>
</html>
`;

// ---------- Write or check ----------

const outputs = [
  [mdPath, markdown],
  [htmlPath, html],
];
if (process.argv.includes("--check")) {
  const stale = outputs.filter(([path, text]) => !existsSync(path) || readFileSync(path, "utf8") !== text);
  if (stale.length) {
    console.error(
      `Reading list: ${stale.map(([path]) => path.replace(root + "/", "")).join(" and ")} ${stale.length === 1 ? "is" : "are"} out of date. Edit docs/reading-list.json, not the generated files, then run pnpm reading-list.`,
    );
    process.exit(1);
  }
  console.log(`Reading list: ${data.links.length} links, generated files up to date.`);
} else {
  for (const [path, text] of outputs) writeFileSync(path, text);
  console.log(`Reading list built: ${data.links.length} links → docs/reading-list.md, docs/reading-list.html`);
}
