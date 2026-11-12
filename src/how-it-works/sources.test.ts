import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { declaration, excerpt, file, rule, snippet, sources } from "@/how-it-works/sources";

const source = `import { thing } from "@/how-it-works/thing";

/** How far it can go */
export interface Room {
  width: number;
}

// A plain comment
const LIMIT = 0.05;

const SHAPES: Record<string, string> = {
  round: "{ not a brace }",
};

/**
 * Moves it. Doesn't touch { braces } in comments.
 */
export function move({
  speed,
  angle,
}: { speed: number; angle: number }) {
  const label = \`at \${speed}px\`; // it's moving
  if (speed > 0) {
    return { label, angle };
  }
  return null;
}

export function after() {}
`;

describe("declaration", () => {
  it("returns an interface with its comment", () => {
    expect(declaration(source, "Room")).toBe("/** How far it can go */\nexport interface Room {\n  width: number;\n}");
  });

  it("returns a one-line constant with a line comment above it", () => {
    expect(declaration(source, "LIMIT")).toBe("// A plain comment\nconst LIMIT = 0.05;");
  });

  it("returns an object constant, ignoring braces inside strings", () => {
    expect(declaration(source, "SHAPES")).toBe('const SHAPES: Record<string, string> = {\n  round: "{ not a brace }",\n};');
  });

  it("returns a whole function whose parameters span lines, ignoring braces in comments and template strings", () => {
    const move = declaration(source, "move");
    expect(move.startsWith("/**\n * Moves it.")).toBe(true);
    expect(move.endsWith("  return null;\n}")).toBe(true);
    expect(move).not.toContain("after");
  });

  it("returns an array of objects whole, not only its first object", () => {
    const text = "const KINDS = [\n  { name: 'a' },\n  { name: 'b' },\n];\n\nconst NEXT = 1;";
    expect(declaration(text, "KINDS")).toBe("const KINDS = [\n  { name: 'a' },\n  { name: 'b' },\n];");
  });

  it("returns a union type whose branches are on lines of their own", () => {
    const text = "type Labelled =\n  | { label: string }\n  | { 'aria-label': string };\n\nconst NEXT = 1;";
    expect(declaration(text, "Labelled")).toBe("type Labelled =\n  | { label: string }\n  | { 'aria-label': string };");
  });

  it("returns a call whose first line ends inside its parentheses", () => {
    const text = "const Heading = Base.extend({\n  level: 2,\n}).configure({\n  open: true,\n});\nconst NEXT = 1;";
    expect(declaration(text, "Heading")).toBe("const Heading = Base.extend({\n  level: 2,\n}).configure({\n  open: true,\n});");
  });

  it("keeps going past a blank line inside brackets", () => {
    const text = "const STEPS = [\n  'first',\n\n  'second',\n];\n\nconst NEXT = 1;";
    expect(declaration(text, "STEPS")).toBe("const STEPS = [\n  'first',\n\n  'second',\n];");
  });

  it("returns a chain that carries on at the start of the next lines", () => {
    const text = "const tools = all\n  .filter((tool) => tool.on)\n  .map((tool) => tool.name);\nconst NEXT = 1;";
    expect(declaration(text, "tools")).toBe("const tools = all\n  .filter((tool) => tool.on)\n  .map((tool) => tool.name);");
  });

  it("ignores brackets inside regular expressions, block comments, and template strings", () => {
    const text = "const MATCH = /\\((\\d+)/g;\nconst NEXT = 1;\n\nfunction label() {\n  /* ) */ return `${'('}`;\n}\n\nconst AFTER = 1;";
    expect(declaration(text, "MATCH")).toBe("const MATCH = /\\((\\d+)/g;");
    expect(declaration(text, "label")).toBe("function label() {\n  /* ) */ return `${'('}`;\n}");
  });

  it("reads a slash after a value as dividing, not as the start of a regular expression", () => {
    const text = "const share = Math.min((1 - b) / c, 0);\nconst NEXT = 1;";
    expect(declaration(text, "share")).toBe("const share = Math.min((1 - b) / c, 0);");
  });

  it("reads the slashes in JSX tags as tags, not regular expressions", () => {
    const text = "function Label() {\n  return <p>(<b>{a}</b>) <br /></p>;\n}\n\nconst NEXT = 1;";
    expect(declaration(text, "Label")).toBe("function Label() {\n  return <p>(<b>{a}</b>) <br /></p>;\n}");
  });

  it("treats an apostrophe in JSX text as text, not the start of a string", () => {
    const text = "function Note() {\n  return (\n    <p>({count} isn't all)</p>\n  );\n}\n\nconst NEXT = 1;";
    expect(declaration(text, "Note")).toBe("function Note() {\n  return (\n    <p>({count} isn't all)</p>\n  );\n}");
  });

  it("matches the whole name, not a longer one that starts with it", () => {
    expect(declaration("const Bounces = 2;\nconst Bounce = 1;", "Bounce")).toBe("const Bounce = 1;");
  });

  it("says which name it couldn't find", () => {
    expect(() => declaration(source, "missing")).toThrow("no top-level declaration named missing");
  });
});

const css = `@layer components {
  .switch {
    display: grid;
  }

  /* The thumb slides across. It moves under reduced motion too,
     because the movement shows the state. */
  .switch__thumb {
    content: "{ not a brace }";
    translate: 0;
  }

  .switch__track:hover:not([data-disabled]),
  .switch__row:hover .switch__track {
    background: var(--track-hover);
  }

  @media (forced-colors: active) {
    .switch__thumb {
      background: CanvasText;
    }
  }
}
`;

describe("rule", () => {
  it("returns a rule by its selector, with its comment, out of the @layer block's indent", () => {
    expect(rule(css, ".switch__thumb")).toBe(
      '/* The thumb slides across. It moves under reduced motion too,\n   because the movement shows the state. */\n.switch__thumb {\n  content: "{ not a brace }";\n  translate: 0;\n}',
    );
  });

  it("matches the whole selector, not a longer one that starts with it", () => {
    expect(rule(".switch__row {\n  gap: 0;\n}\n.switch {\n  display: grid;\n}", ".switch")).toBe(".switch {\n  display: grid;\n}");
  });

  it("returns a rule whose selector list spans lines", () => {
    expect(rule(css, ".switch__track:hover:not([data-disabled])")).toBe(
      ".switch__track:hover:not([data-disabled]),\n.switch__row:hover .switch__track {\n  background: var(--track-hover);\n}",
    );
  });

  it("returns an at-rule with the rules inside it", () => {
    expect(rule(css, "@media (forced-colors: active)")).toBe(
      "@media (forced-colors: active) {\n  .switch__thumb {\n    background: CanvasText;\n  }\n}",
    );
  });

  it("finds a rule by the start of its selector list, not by a selector further down an earlier list", () => {
    const text = ".a,\n.b {\n  gap: 0;\n}\n\n.b {\n  gap: 1px;\n}";
    expect(rule(text, ".b")).toBe(".b {\n  gap: 1px;\n}");
  });

  it("picks between rules that start the same way by more of their selector list", () => {
    const text = ".a {\n  gap: 0;\n}\n\n.a,\n.c {\n  gap: 1px;\n}";
    expect(rule(text, ".a")).toBe(".a {\n  gap: 0;\n}");
    expect(rule(text, ".a, .c")).toBe(".a,\n.c {\n  gap: 1px;\n}");
  });

  it("isn't fooled by a comment whose last line is words", () => {
    const text = "/* Big\n   gap. */\n.a {\n  gap: 2px;\n}";
    expect(rule(text, ".a")).toBe("/* Big\n   gap. */\n.a {\n  gap: 2px;\n}");
  });

  it("says which rule it couldn't find", () => {
    expect(() => rule(css, ".missing")).toThrow("no CSS rule starting .missing");
  });

  it("is what excerpt uses for CSS files, and declaration for code", () => {
    expect(excerpt("a.css", css, ".switch")).toBe(".switch {\n  display: grid;\n}");
    expect(excerpt("a.ts", "const A = 1;", "A")).toBe("const A = 1;");
  });
});

describe("sources", () => {
  it("has the components', shared pieces', and experiments' code, but not their tests or stories", () => {
    expect(sources["components/Switch/Switch.tsx"]).toContain("export function Switch(");
    expect(sources["internal/FieldError.tsx"]).toContain("export function FieldError(");
    expect(sources["experiments/Bounce/physics.ts"]).toContain("export function step(");
    expect(Object.keys(sources).some((path) => /\.test\.tsx?$|\.stories\.tsx$/.test(path))).toBe(false);
  });

  it("leaves out generated CSS", () => {
    expect(Object.keys(sources)).toContain("styles/base.css");
    expect(Object.keys(sources)).not.toContain("styles/tokens.css");
  });

  it("says which file it couldn't find", () => {
    expect(() => file("experiments/Bounce/missing.ts")).toThrow("no source file at experiments/Bounce/missing.ts");
  });

  it("returns a whole file when no name is given", () => {
    expect(snippet("experiments/Bounce/physics.ts")).toBe(sources["experiments/Bounce/physics.ts"]!.trimEnd());
  });
});

// Every <Code file="…" name="…" /> on a How it works page still finds its code, so renaming a function can't
// quietly break a page. The pages are read from disk when the test runs: an import.meta.glob here is cached by
// Vitest's module cache, which keeps the old list of pages when one is added.
const src = join(import.meta.dirname, "..");
const pages = readdirSync(src, { recursive: true, encoding: "utf8" }).filter((page) => page.endsWith(".mdx"));
const blocks = pages.flatMap((page) =>
  [...readFileSync(join(src, page), "utf8").matchAll(/<Code\s+file="([^"]+)"(?:\s+name=(?:"([^"]+)"|'([^']+)'))?\s*\/>/g)].map(
    ([, path, double, single]) => ({ page, path: path!, name: double ?? single }),
  ),
);

describe("How it works pages", () => {
  it("have code blocks to check", () => {
    expect(blocks.length).toBeGreaterThan(10);
  });

  it.each(blocks.map((block) => [`${block.page}: ${block.path} ${block.name ?? "(whole file)"}`, block] as const))("%s", (_, block) => {
    expect(Object.keys(sources)).toContain(block.path);
    // Vitest's unit tests replace CSS with an empty file, even ?raw, so CSS is read from disk
    if (block.path.endsWith(".css")) {
      const rule = excerpt(block.path, readFileSync(join(src, block.path), "utf8"), block.name);
      expect(rule).toContain("{");
      expect(rule.split("{").length).toBe(rule.split("}").length);
      return;
    }
    const code = snippet(block.path, block.name);
    expect(code.length).toBeGreaterThan(0);
    if (!block.name) return;
    // It isn't cut short: the line after it in the file is blank, the end, or a new statement at the left edge
    const rest = file(block.path).slice(file(block.path).indexOf(code) + code.length);
    expect(rest.split("\n")[1] ?? "").toMatch(/^($|[^\s.|&?:)\]}])/);
    // and it doesn't run on into the next declaration
    expect(code.split("\n").filter((line) => /^(export\s+)?(default\s+)?(async\s+)?(function|const|let|interface|type|class)\s/.test(line))).toHaveLength(1);
  });
});
