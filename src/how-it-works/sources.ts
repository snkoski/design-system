/**
 * The text of the source files that "How it works" pages show, so what they show is always the code that runs: the
 * components, the pieces they share, the hand-written styles, and the experiments. Tests and stories are left out, and
 * so is generated CSS. Paths are from src, such as "components/Switch/Switch.tsx" or "experiments/Bounce/physics.ts".
 */
const files = import.meta.glob<string>(
  [
    "../{components,internal,experiments}/**/*.{ts,tsx,css}",
    "../styles/*.css",
    "!../**/*.test.{ts,tsx}",
    "!../**/*.stories.tsx",
    "!../styles/{tokens,tailwind-theme}.css",
  ],
  { query: "?raw", import: "default", eager: true },
);

export const sources: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, text]) => [path.replace(/^\.\.\//, ""), text]),
);

/** The whole text of one source file */
export function file(path: string) {
  const text = sources[path];
  if (text === undefined) throw new Error(`How it works: there's no source file at ${path}`);
  return text;
}

const startOf = (name: string) =>
  new RegExp(`^(export\\s+)?(default\\s+)?(async\\s+)?(function|const|let|interface|type|class)\\s+${name}\\b`);

/** A line that is only comment: inside or around a block comment, or a line comment */
const isComment = (line: string) => /^\s*(\/\*|\*|\/\/)/.test(line);

/** Where the scan is at the end of a line: in code, or partway through something that spans lines */
type Inside = "code" | "block-comment" | "template";

/** After one of these (or at the start of a line), a `/` starts a regular expression rather than dividing */
const BEFORE_REGEX = /(?:[(,=:[!&|?{};+\-*%<>~^]|\breturn)$|^$/;

/**
 * How one line changes the bracket depth, counting (), [], and {} but not anything inside strings, comments, or
 * regular expressions (`/[^)]/` would otherwise close a bracket that was never opened)
 */
function scan(line: string, inside: Inside) {
  let depth = 0;
  let index = 0;
  const before = () => line.slice(0, index).trimEnd();
  while (index < line.length) {
    const character = line[index]!;
    if (inside === "block-comment") {
      if (line.startsWith("*/", index)) {
        inside = "code";
        index++;
      }
    } else if (inside === "template") {
      if (character === "\\") index++;
      else if (character === "`") inside = "code";
    } else if (line.startsWith("//", index)) {
      break;
    } else if (line.startsWith("/*", index)) {
      inside = "block-comment";
      index++;
    } else if (character === "`") {
      inside = "template";
    } else if (character === '"' || character === "'") {
      // A quote with no partner on its line is an apostrophe in JSX text ("Don't"), not a string
      let end = index + 1;
      while (end < line.length && line[end] !== character) end += line[end] === "\\" ? 2 : 1;
      if (end < line.length) index = end;
    } else if (character === "/" && line[index - 1] !== "<" && line[index + 1] !== ">" && BEFORE_REGEX.test(before())) {
      // (`</` and `/>` are JSX tags)
      let inClass = false;
      index++;
      while (index < line.length && (inClass || line[index] !== "/")) {
        if (line[index] === "\\") index++;
        else if (line[index] === "[") inClass = true;
        else if (line[index] === "]") inClass = false;
        index++;
      }
    } else if ("([{".includes(character)) {
      depth++;
    } else if (")]}".includes(character)) {
      depth--;
    }
    index++;
  }
  return { depth, inside };
}

/** A line that carries on the statement above it: indented, or starting with `.`, `|`, `&`, `?`, `:`, or a closing bracket */
const continues = (line: string | undefined) => line !== undefined && /^(\s+\S|[.|&?:)\]}])/.test(line);

/**
 * One top-level declaration from a file's text, with the comment above it: a function, constant, interface, type, or
 * class, found by its name. It ends at the first line where every bracket it opened has closed and the next line
 * doesn't carry on the statement (it's blank, or starts a new one at the left edge).
 */
export function declaration(source: string, name: string) {
  const lines = source.split("\n");
  const start = lines.findIndex((line) => startOf(name).test(line));
  if (start === -1) throw new Error(`How it works: there's no top-level declaration named ${name}`);

  let first = start;
  while (first > 0 && isComment(lines[first - 1]!)) first--;

  let depth = 0;
  let inside: Inside = "code";
  let last = start;
  for (let index = start; index < lines.length; index++) {
    last = index;
    const line = scan(lines[index]!, inside);
    depth += line.depth;
    inside = line.inside;
    if (inside === "code" && depth <= 0 && !continues(lines[index + 1])) break;
  }
  return lines.slice(first, last + 1).join("\n");
}

/**
 * One CSS rule from a stylesheet's text, with the comment above it, found by how its selector list starts: a selector
 * (".switch__thumb"), several (".switch__label, .switch__description" picks the rule whose list starts with both), or
 * an at-rule ("@media (forced-colors: active)"). Only the start of a rule counts, not a selector further down a list,
 * and the first match wins. It ends where its braces close, and loses the indent of the `@layer` block around it.
 */
export function rule(source: string, name: string) {
  const lines = source.split("\n");
  const flat = (text: string) => text.replace(/\s+/g, " ").replace(/\s*,\s*/g, ", ").trim();
  const wanted = flat(name);
  // The same lines with comments blanked out, so a comment can't look like a selector
  const code = source.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " ")).split("\n");
  // A rule starts on the first line of code after an opening or closing brace or a semicolon
  let ready = true;
  let start = -1;
  for (let index = 0; index < code.length && start === -1; index++) {
    const line = code[index]!.trim();
    if (line === "") continue;
    if (ready) {
      let selector = "";
      for (let end = index; end < code.length; end++) {
        selector += ` ${code[end]}`;
        if (/[{;]/.test(code[end]!)) break;
      }
      const list = flat(selector.split(/[{;]/)[0]!);
      if (list.startsWith(wanted) && /^($|[\s,])/.test(list.slice(wanted.length))) start = index;
    }
    ready = /[{};]$/.test(line);
  }
  if (start === -1) throw new Error(`How it works: there's no CSS rule starting ${name}`);

  // The comment above it, which can end on a line of its own words ("   on hover. */")
  let first = start;
  if (lines[first - 1]?.trimEnd().endsWith("*/")) {
    first--;
    while (first > 0 && !lines[first]!.includes("/*")) first--;
  }

  let depth = 0;
  let opened = false;
  let last = start;
  for (let index = start; index < lines.length; index++) {
    last = index;
    for (const character of lines[index]!.replace(/\/\*.*?\*\//g, "").replace(/(["'])(?:\\.|(?!\1).)*\1/g, "")) {
      if (character === "{") {
        depth++;
        opened = true;
      } else if (character === "}") {
        depth--;
      }
    }
    if (opened && depth <= 0) break;
  }

  const indent = lines[start]!.length - lines[start]!.trimStart().length;
  return lines
    .slice(first, last + 1)
    .map((line) => (line.slice(0, indent).trim() === "" ? line.slice(indent) : line))
    .join("\n");
}

/** A piece of a file's text: a declaration by name, or for CSS a rule by its selector, or the whole text without one */
export function excerpt(path: string, text: string, name?: string) {
  if (!name) return text.trimEnd();
  return path.endsWith(".css") ? rule(text, name) : declaration(text, name);
}

/** A piece of a source file, by name (see excerpt), or the whole file without one */
export function snippet(path: string, name?: string) {
  return excerpt(path, file(path), name);
}
