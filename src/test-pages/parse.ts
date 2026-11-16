import { blockEnd } from "@/how-it-works/sources";

/**
 * The text of every component's test and story files, for the "Tests" pages, so what they list is always the tests
 * that run. Paths are from src, such as "components/Button/Button.test.tsx".
 */
const files = import.meta.glob<string>(["@/components/**/*.test.{ts,tsx}", "@/components/**/*.stories.tsx"], {
  query: "?raw",
  import: "default",
  eager: true,
});

export const testSources: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, text]) => [path.replace(/^\/src\//, ""), text]),
);

/** One `it(…)`: what its name says it checks, and its code */
export interface UnitTest {
  name: string;
  /** For `it.each(table)`, the table it runs once for each row of, as written */
  each?: string;
  /** The test's code, with any comment above it, and without the indent of the blocks around it */
  code: string;
  /** Whether it checks types with `expectTypeOf`, which `pnpm typecheck` runs rather than Vitest */
  types: boolean;
}

/** One `describe(…)` block, or the top level of a file (named ""), with its tests and the blocks inside it */
export interface TestGroup {
  name: string;
  tests: UnitTest[];
  groups: TestGroup[];
}

/** One story with a `play` function: its name in Storybook's sidebar, its description, and the play function's code */
export interface StoryTest {
  name: string;
  description: string;
  code: string;
}

/** Takes the indent every non-blank line shares off them all */
export function dedent(text: string) {
  const lines = text.split("\n");
  const indent = Math.min(...lines.filter((line) => line.trim()).map((line) => line.length - line.trimStart().length));
  return lines.map((line) => line.slice(indent)).join("\n");
}

/** A line that is only comment: inside or around a block comment, or a line comment */
const isComment = (line: string) => /^\s*(\/\*|\*|\/\/)/.test(line);

/** The first line of the comment directly above line `start`, or `start` if there's none */
function commentStart(lines: string[], start: number) {
  let first = start;
  while (first > 0 && isComment(lines[first - 1]!)) first--;
  return first;
}

/** `describe("name", …)`, `it("name", …)`, `test("name", …)`, and `it.each(table)("name", …)`, at the start of a line */
const CALL = /^\s*(describe|it|test)(?:\.each\((.*?)\))?\(\s*(["'`])((?:\\.|(?!\3).)*)\3/;

/**
 * Every test in a test file, grouped by its `describe` blocks. A test's name is the line on the page, so it should say
 * what's checked ("calls onClick once per click").
 */
export function unitTests(source: string): TestGroup {
  const lines = source.split("\n");
  const root: TestGroup = { name: "", tests: [], groups: [] };
  const open: { group: TestGroup; end: number }[] = [{ group: root, end: lines.length }];

  for (let index = 0; index < lines.length; index++) {
    while (index > open.at(-1)!.end) open.pop();
    const match = CALL.exec(lines[index]!);
    if (!match) continue;
    const [, kind, each, , name] = match;
    const end = blockEnd(lines, index);
    const parent = open.at(-1)!.group;
    if (kind === "describe") {
      const group: TestGroup = { name: name!, tests: [], groups: [] };
      parent.groups.push(group);
      open.push({ group, end });
    } else {
      const code = lines.slice(commentStart(lines, index), end + 1).join("\n");
      parent.tests.push({
        name: name!,
        ...(each !== undefined && { each: each.replace(/\s+as const$/, "") }),
        code: dedent(code),
        types: code.includes("expectTypeOf"),
      });
      index = end;
    }
  }
  return root;
}

/** How many tests a group holds, counting the groups inside it */
export function countTests(group: TestGroup): number {
  return group.tests.length + group.groups.reduce((sum, inner) => sum + countTests(inner), 0);
}

/** A story export, `export const Name: Story = {`, at the start of a line */
const STORY = /^export const (\w+)\s*:\s*Story\b/;

/** A story's name in Storybook's sidebar, from its export name: "IconOnly" becomes "Icon Only" */
export const storyName = (exportName: string) =>
  exportName
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/^./, (first) => first.toUpperCase());

/** The words of a JSDoc comment, without its `/**`, `*`, and `*\/` */
function commentText(lines: string[]) {
  return lines
    .map((line) => line.trim().replace(/^\/\*\*?|\*\/$/g, "").replace(/^\*\s?/, "").trim())
    .filter(Boolean)
    .join(" ");
}

/** The stories in a stories file, every one of which Storybook renders and checks with axe */
export function storyCount(source: string) {
  return source.split("\n").filter((line) => STORY.test(line)).length;
}

/** The stories in a stories file that have a `play` function, with the function's code */
export function storyTests(source: string): StoryTest[] {
  const lines = source.split("\n");
  const stories: StoryTest[] = [];
  for (let index = 0; index < lines.length; index++) {
    const match = STORY.exec(lines[index]!);
    if (!match) continue;
    const end = blockEnd(lines, index);
    const play = lines.findIndex((line, at) => at > index && at <= end && /^\s{2}play\s*:/.test(line));
    if (play !== -1) {
      const first = commentStart(lines, index);
      stories.push({
        name: storyName(match[1]!),
        description: commentText(lines.slice(first, index)),
        code: dedent(lines.slice(commentStart(lines, play), blockEnd(lines, play) + 1).join("\n")),
      });
    }
    index = end;
  }
  return stories;
}

/** The test and story files in a folder from src, such as "components/Button", in alphabetical order */
export function filesIn(folder: string) {
  const inFolder = Object.keys(testSources)
    .filter((path) => path.startsWith(`${folder}/`) && !path.slice(folder.length + 1).includes("/"))
    .sort();
  if (inFolder.length === 0) throw new Error(`Tests page: there are no test or story files in src/${folder}`);
  return {
    unit: inFolder.filter((path) => /\.test\.tsx?$/.test(path)),
    stories: inFolder.filter((path) => path.endsWith(".stories.tsx")),
  };
}
