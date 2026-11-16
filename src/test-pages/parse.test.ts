import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { blockEnd } from "@/how-it-works/sources";
import {
  countTests,
  dedent,
  filesIn,
  storyCount,
  storyName,
  storyTests,
  testSources,
  unitTests,
} from "@/test-pages/parse";

const testFile = [
  'import { describe, it } from "vitest";',
  "",
  "const label = (text: string) => ({ text });",
  "",
  'describe("Button", () => {',
  '  describe("rendering", () => {',
  '    it("renders a native button", () => {',
  '      expect(label("{ not a brace }")).toBeTruthy();',
  "    });",
  "",
  "    // A comment about the next test",
  '    it("keeps (brackets) in its name", () => {',
  "      expect(1).toBe(1);",
  "    });",
  "  });",
  "",
  '  describe("types", () => {',
  '    it("requires aria-label", () => {',
  "      expectTypeOf<Props>().toHaveProperty(\"aria-label\");",
  "    });",
  "",
  '    describe("nested", () => {',
  '      it.each(["md", "lg"] as const)("maps size=%s to data-size", (size) => {',
  "        expect(size).toBeTruthy();",
  "      });",
  "    });",
  "  });",
  "",
  "  it('sits after the blocks, with single quotes', () => {});",
  "});",
].join("\n");

describe("blockEnd", () => {
  it("finds the line where the call that opens on a line closes", () => {
    const lines = testFile.split("\n");
    expect(lines[blockEnd(lines, 6)]).toBe("    });");
    expect(blockEnd(lines, 6)).toBe(8);
  });

  it("ignores brackets inside strings", () => {
    const lines = ['it("a ( b", () => {', '  run("}}");', "});", "after();"];
    expect(blockEnd(lines, 0)).toBe(2);
  });
});

describe("unitTests", () => {
  const root = unitTests(testFile);
  const button = root.groups[0]!;

  it("groups tests by their describe blocks, nested", () => {
    expect(root.name).toBe("");
    expect(button.name).toBe("Button");
    expect(button.groups.map((group) => group.name)).toEqual(["rendering", "types"]);
    expect(button.groups[1]!.groups.map((group) => group.name)).toEqual(["nested"]);
  });

  it("puts each test in the block it's written in", () => {
    expect(button.groups[0]!.tests.map((test) => test.name)).toEqual([
      "renders a native button",
      "keeps (brackets) in its name",
    ]);
    expect(button.groups[1]!.tests.map((test) => test.name)).toEqual(["requires aria-label"]);
    expect(button.tests.map((test) => test.name)).toEqual(["sits after the blocks, with single quotes"]);
  });

  it("returns a test's code whole, with the comment above it and without the outer indent", () => {
    expect(button.groups[0]!.tests[0]!.code).toBe(
      ['it("renders a native button", () => {', '  expect(label("{ not a brace }")).toBeTruthy();', "});"].join("\n"),
    );
    expect(button.groups[0]!.tests[1]!.code).toMatch(/^\/\/ A comment about the next test\nit\("keeps/);
  });

  it("reads it.each's table, without as const", () => {
    const each = button.groups[1]!.groups[0]!.tests[0]!;
    expect(each.name).toBe("maps size=%s to data-size");
    expect(each.each).toBe('["md", "lg"]');
    expect(button.groups[0]!.tests[0]).not.toHaveProperty("each");
  });

  it("marks tests that use expectTypeOf as type tests", () => {
    expect(button.groups[1]!.tests[0]!.types).toBe(true);
    expect(button.groups[0]!.tests[0]!.types).toBe(false);
  });

  it("counts every test, including those in nested blocks", () => {
    expect(countTests(root)).toBe(5);
  });
});

const storiesFile = [
  "const meta = {",
  '  title: "Components/Button",',
  "  play: async () => {},",
  "} satisfies Meta<typeof Button>;",
  "",
  "/** Change any prop. */",
  "export const Playground: Story = {};",
  "",
  "/**",
  " * Small buttons are **32px** tall.",
  " * The story checks both.",
  " */",
  "export const IconOnly: Story = {",
  "  render: () => <Button>{\"}\"}</Button>,",
  "  // Checks the hit area",
  "  play: async ({ canvas }) => {",
  "    await expect(canvas.getByRole(\"button\")).toBeVisible();",
  "  },",
  "};",
  "",
  "export const AllThemes: Story = {",
  "  render: () => <div />,",
  "};",
].join("\n");

describe("storyTests", () => {
  it("lists only the stories with a play function, not meta's", () => {
    expect(storyTests(storiesFile).map((story) => story.name)).toEqual(["Icon Only"]);
  });

  it("returns the play function with the comment above it, and the story's description", () => {
    const [story] = storyTests(storiesFile);
    expect(story!.description).toBe("Small buttons are **32px** tall. The story checks both.");
    expect(story!.code).toBe(
      [
        "// Checks the hit area",
        "play: async ({ canvas }) => {",
        '  await expect(canvas.getByRole("button")).toBeVisible();',
        "},",
      ].join("\n"),
    );
  });

  it("counts every story, with or without a play function", () => {
    expect(storyCount(storiesFile)).toBe(3);
  });
});

describe("storyName", () => {
  it("turns an export name into Storybook's sidebar name", () => {
    expect(storyName("Playground")).toBe("Playground");
    expect(storyName("IconOnly")).toBe("Icon Only");
    expect(storyName("WithoutCSSReset")).toBe("Without CSS Reset");
  });
});

describe("dedent", () => {
  it("takes off only the indent every line shares, ignoring blank lines", () => {
    expect(dedent("    a\n\n      b\n    c")).toBe("a\n\n  b\nc");
  });
});

describe("every component's Tests page", () => {
  const components = readdirSync(join(import.meta.dirname, "../components"));

  it("exists, beside the component's stories", () => {
    expect(components.length).toBeGreaterThan(10);
    for (const name of components) {
      expect(readdirSync(join(import.meta.dirname, "../components", name)), name).toContain("Tests.mdx");
    }
  });

  it("finds every test in the component's test files", () => {
    const testFiles = Object.keys(testSources).filter((path) => /\.test\.tsx?$/.test(path));
    expect(testFiles.length).toBeGreaterThan(10);
    for (const path of testFiles) {
      const calls = testSources[path]!.split("\n").filter((line) => /^\s*(it|test)(\.each\(.*\))?\(/.test(line));
      expect(calls.length, path).toBeGreaterThan(0);
      expect(countTests(unitTests(testSources[path]!)), path).toBe(calls.length);
    }
  });

  it("finds a stories file for each component", () => {
    for (const name of components) expect(filesIn(`components/${name}`).stories, name).not.toHaveLength(0);
  });

  it("throws for a folder with no test or story files", () => {
    expect(() => filesIn("components/Nothing")).toThrow("there are no test or story files in src/components/Nothing");
  });
});
