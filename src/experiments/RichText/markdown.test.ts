import { Editor } from "@tiptap/react";
import { afterEach, describe, expect, it } from "vitest";
import { isAllowedHref, normalizeHref, richTextExtensions, toMarkdown } from "@/experiments/RichText/markdown";

let editor: Editor | undefined;

/** A headless editor (no React, no view) with the field's extensions, loaded with some markdown. */
function load(markdown: string) {
  editor = new Editor({ extensions: richTextExtensions(), content: markdown, contentType: "markdown" });
  return editor;
}

/** Loads markdown and writes it back out, as the field does. */
const roundTrip = (markdown: string) => toMarkdown(load(markdown));

afterEach(() => {
  editor?.destroy();
  editor = undefined;
});

describe("markdown", () => {
  describe("round trips", () => {
    it.each([
      ["bold", "a **b** c"],
      ["italic", "a *b* c"],
      ["underline, as an HTML tag", "a <u>b</u> c"],
      ["strikethrough", "a ~~b~~ c"],
      ["inline code", "a `b` c"],
      ["a link", "a [b](https://example.com) c"],
      ["an email link", "a [b](mailto:me@example.com) c"],
      ["a quote", "> a quote"],
      ["a bulleted list", "- one\n- two"],
      ["a numbered list", "1. one\n2. two"],
      ["a code block", "```\nconst a = 1;\n```"],
      ["a code block with a language", "```js\nconst a = 1;\n```"],
      ["paragraphs", "one\n\ntwo"],
      ["nested formats", "***both*** and **<u>bold underline</u>**"],
    ])("keeps %s as it was", (_name, markdown) => {
      expect(roundTrip(markdown)).toBe(markdown);
    });

    it("loads each format as its element", () => {
      const html = load("**b** *i* <u>u</u> ~~s~~ `c` [l](https://example.com)").getHTML();
      expect(html).toContain("<strong>b</strong>");
      expect(html).toContain("<em>i</em>");
      expect(html).toContain("<u>u</u>");
      expect(html).toContain("<s>s</s>");
      expect(html).toContain("<code>c</code>");
      expect(html).toMatch(/<a [^>]*href="https:\/\/example\.com"[^>]*>l<\/a>/);
    });

    it("loads each block as its element", () => {
      const html = load("> q\n\n- b\n\n1. n\n\n```\nc\n```").getHTML();
      expect(html).toContain("<blockquote><p>q</p></blockquote>");
      expect(html).toContain("<ul><li><p>b</p></li></ul>");
      expect(html).toContain("<ol><li><p>n</p></li></ol>");
      expect(html).toContain("<pre><code>c</code></pre>");
    });
  });

  describe("rewriting", () => {
    it.each([
      ["__bold__ as **bold**", "__b__", "**b**"],
      ["_italic_ as *italic*", "_i_", "*i*"],
      ["* bullets as - bullets", "* one\n* two", "- one\n- two"],
      ["underline inside bold, with bold outside", "<u>**b**</u>", "**<u>b</u>**"],
    ])("writes %s", (_name, markdown, expected) => {
      expect(roundTrip(markdown)).toBe(expected);
    });

    it("doesn't read ++text++ as underline, since underline is stored as <u>", () => {
      expect(load("++b++").getHTML()).not.toContain("<u>");
      expect(roundTrip("++b++")).toBe("++b++");
    });
  });

  describe("what it leaves out", () => {
    it("turns headings into plain paragraphs, keeping the rest of the message", () => {
      expect(roundTrip("# Title\n\nBody with **bold**")).toBe("Title\n\nBody with **bold**");
      expect(roundTrip("## Sub *heading*")).toBe("Sub *heading*");
    });

    it("drops a horizontal rule, keeping the text around it", () => {
      const markdown = roundTrip("above\n\n---\n\nbelow");
      expect(markdown).toMatch(/^above\n\n/);
      expect(markdown).toMatch(/\n\nbelow$/);
      expect(markdown).not.toContain("---");
    });

    it("turns a table into a paragraph per row, keeping its text and formats", () => {
      expect(roundTrip("| a | b |\n|---|---|\n| 1 | **2** |")).toBe("a  b\n\n1  **2**");
    });

    it("keeps HTML for formats it has, as those formats", () => {
      expect(roundTrip("<b>hi</b> there")).toBe("**hi** there");
    });

    it("removes other HTML tags and keeps their text", () => {
      expect(roundTrip("a <span style='color:red'>red</span> b")).toBe("a red b");
    });

    it("drops scripts, text and all", () => {
      const markdown = roundTrip("<script>alert(1)</script>safe");
      expect(markdown).toBe("safe");
    });

    it("keeps an image's description as text", () => {
      expect(roundTrip("![a cat](https://example.com/cat.png)")).toBe("a cat");
    });
  });

  describe("links", () => {
    it.each([
      ["javascript:", "[click](javascript:alert(1))"],
      ["data:", "[click](data:text/html,hi)"],
      ["a relative path", "[click](/settings)"],
      ["an anchor", "[click](#top)"],
      ["ftp:", "[click](ftp://example.com)"],
    ])("drops a %s link and keeps its text", (_name, markdown) => {
      const loaded = load(markdown);
      expect(loaded.getHTML()).toContain("click");
      expect(loaded.getHTML()).not.toContain("<a");
      expect(toMarkdown(loaded)).toBe("click");
    });

    it("keeps web and email links", () => {
      expect(roundTrip("[a](http://example.com) [b](https://example.com) [c](mailto:me@example.com)")).toBe(
        "[a](http://example.com) [b](https://example.com) [c](mailto:me@example.com)",
      );
    });
  });

  describe("empty and trailing whitespace", () => {
    it.each([
      ["nothing", ""],
      ["only spaces", "   "],
      ["only blank lines", "\n\n\n"],
      ["an empty list item", "-"],
      ["an empty numbered item", "1. "],
      ["an empty quote", ">"],
    ])("is an empty string for %s", (_name, markdown) => {
      expect(roundTrip(markdown)).toBe("");
    });

    it("never ends with a newline, even after a list or code block", () => {
      expect(roundTrip("- one\n- two\n\n")).toBe("- one\n- two");
      expect(roundTrip("```\ncode\n```\n\n")).toBe("```\ncode\n```");
      expect(roundTrip("text\n\n\n")).toBe("text");
    });

    it("keeps a line break inside a paragraph", () => {
      expect(roundTrip("one  \ntwo")).toBe("one  \ntwo");
    });
  });

  describe("isAllowedHref", () => {
    it.each(["http://example.com", "https://example.com/a?b=c#d", "mailto:me@example.com", "HTTPS://EXAMPLE.COM"])(
      "allows %s",
      (href) => {
        expect(isAllowedHref(href)).toBe(true);
      },
    );

    it.each(["javascript:alert(1)", " javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,x", "vbscript:x", "ftp://example.com", "tel:123", "/path", "#top", "?q=1", "example.com", "", "https://"])(
      "doesn't allow %j",
      (href) => {
        expect(isAllowedHref("https://example.com")).toBe(true); // so a function that refuses everything fails
        expect(isAllowedHref(href)).toBe(false);
      },
    );
  });

  describe("normalizeHref", () => {
    it.each([
      ["https://example.com", "https://example.com"],
      ["  https://example.com  ", "https://example.com"],
      ["http://example.com", "http://example.com"],
      ["example.com", "https://example.com"],
      ["www.example.com/a?b=c", "https://www.example.com/a?b=c"],
      ["example.com:8080/path", "https://example.com:8080/path"],
      ["mailto:me@example.com", "mailto:me@example.com"],
      ["me@example.com", "mailto:me@example.com"],
    ])("turns %j into %j", (input, expected) => {
      expect(normalizeHref(input)).toBe(expected);
    });

    it.each(["", "   ", "javascript:alert(1)", "data:text/html,x", "/path", "#top", "ftp://example.com", "not a link", "https://"])(
      "refuses %j",
      (input) => {
        expect(normalizeHref("example.com")).toBe("https://example.com"); // so a function that refuses everything fails
        expect(normalizeHref(input)).toBeNull();
      },
    );
  });
});
