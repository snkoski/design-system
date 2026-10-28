import { Link } from "@tiptap/extension-link";
import { ListItem } from "@tiptap/extension-list";
import { Underline } from "@tiptap/extension-underline";
import { Placeholder } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import { Fragment, Slice } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Extension } from "@tiptap/react";
import type { AnyExtension, Editor, JSONContent, MarkdownParseHelpers, MarkdownToken } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

/* The editor's setup and its markdown rules. Markdown is Tiptap's own (@tiptap/markdown), with these changes:
   underline is stored as <u>text</u> (standard markdown has none, and an HTML tag renders anywhere), only web and
   email links are kept, and the formats the field doesn't offer (headings, rules, tables) load as plain text
   instead of failing. */

export const SCHEME = /^([a-z][a-z\d+.-]*):/i;
export const ALLOWED_SCHEMES = new Set(["http", "https", "mailto"]);
export const EMAIL = /^[^\s@/:]+@[^\s@/:]+\.[^\s@/:]+$/;

/** Whether a link address may be kept: absolute web (`http:`, `https:`) and email (`mailto:`) addresses only. */
export function isAllowedHref(href: string): boolean {
  const scheme = SCHEME.exec(href)?.[1]?.toLowerCase();
  if (!scheme || !ALLOWED_SCHEMES.has(scheme)) return false;
  try {
    const url = new URL(href);
    return scheme === "mailto" ? url.pathname.length > 0 : url.hostname.length > 0;
  } catch {
    return false;
  }
}

/**
 * Turns what someone typed into a link address, or null when it can't be one. Trims it, adds `https://` to an
 * address with no scheme (`example.com`) and `mailto:` to an email address, and refuses anything that isn't a web
 * or email address once that's done.
 */
export function normalizeHref(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  // "example.com:8080" looks like a scheme to the pattern, but a scheme never has a dot
  const scheme = SCHEME.exec(trimmed)?.[1];
  const hasScheme = scheme !== undefined && !scheme.includes(".");
  let href = trimmed;
  if (!hasScheme) {
    if (EMAIL.test(trimmed)) href = `mailto:${trimmed}`;
    else if (/^[^/?#.][^/?#]*\.[^/?#]/.test(trimmed)) href = `https://${trimmed}`;
    else return null;
  }
  return isAllowedHref(href) ? href : null;
}

/** Underline, stored as `<u>text</u>`: standard markdown has no underline, and the tag renders anywhere HTML does. */
const UnderlineTag = Underline.extend({
  renderMarkdown: (node, helpers) => `<u>${helpers.renderChildren(node)}</u>`,
  markdownTokenizer: {
    name: "underline",
    level: "inline",
    start: (src: string) => src.indexOf("<u>"),
    tokenize(src, _tokens, lexer) {
      const match = /^<u>([\s\S]+?)<\/u>/.exec(src);
      if (!match) return undefined;
      return { type: "underline", raw: match[0], text: match[1], tokens: lexer.inlineTokens(match[1]!) };
    },
  },
});

/** Links, kept only for web and email addresses, wherever they come from: typed, pasted, or loaded as markdown. */
const SafeLink = Link.extend({
  parseMarkdown(token: MarkdownToken, helpers: MarkdownParseHelpers) {
    const content = helpers.parseInline(token.tokens || []);
    // Tiptap's own markdown parsing skips the isAllowedUri check that its HTML parsing does
    if (!isAllowedHref(String(token.href ?? ""))) return content;
    return helpers.applyMark("link", content, { href: token.href, title: token.title || null });
  },
}).configure({
  // Never opened by Tiptap: links aren't followed while editing. A read-only field isn't editable, so the browser
  // follows its links itself. (Tiptap 3.32's "whenNotEditable" does the opposite: it opens them only while editing.)
  openOnClick: false,
  autolink: true,
  linkOnPaste: true,
  defaultProtocol: "https",
  isAllowedUri: (url) => isAllowedHref(url),
  HTMLAttributes: { target: "_blank", rel: "noopener noreferrer nofollow" },
});

/** List items without Tiptap's Tab and Shift-Tab, so Tab always moves on to the next control, as in any field. */
const ListItemNoTab = ListItem.extend({
  addKeyboardShortcuts() {
    return { Enter: () => this.editor.commands.splitListItem(this.name) };
  },
});

/** Loads a markdown block the field doesn't offer as something it does, instead of failing to load at all. */
function loadAs(name: string, token: string, parse: (token: MarkdownToken, helpers: MarkdownParseHelpers) => JSONContent | JSONContent[]) {
  return Extension.create({ name, markdownTokenName: token, parseMarkdown: parse });
}

const HeadingAsParagraph = loadAs("headingAsParagraph", "heading", (token, helpers) =>
  helpers.createNode("paragraph", {}, helpers.parseInline(token.tokens || [])),
);

const RuleAsEmptyLine = loadAs("ruleAsEmptyLine", "hr", (_token, helpers) => helpers.createNode("paragraph", {}, []));

/** A table becomes a paragraph per row, its cells separated by two spaces. */
const TableAsText = loadAs("tableAsText", "table", (token, helpers) => {
  const rows = [token.header as MarkdownToken[], ...(token.rows as MarkdownToken[][])];
  return rows.map((cells) =>
    helpers.createNode(
      "paragraph",
      {},
      cells.flatMap((cell, index) => [...(index > 0 ? [{ type: "text", text: "  " }] : []), ...helpers.parseInline(cell.tokens || [])]),
    ),
  );
});

/** Reads pasted plain text as markdown, except in a code block or when pasted as plain text (Shift), where it's literal. */
const PasteMarkdown = Extension.create({
  name: "pasteMarkdown",
  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        key: new PluginKey("pasteMarkdown"),
        props: {
          clipboardTextParser(text, _context, plain) {
            if (plain || !editor.markdown) return undefined as unknown as Slice; // ProseMirror's own plain-text paste
            const doc = editor.schema.nodeFromJSON(editor.markdown.parse(text));
            return Slice.maxOpen(Fragment.from(doc.content));
          },
        },
      }),
    ];
  },
});

const markedKey = new PluginKey<DecorationSet>("richTextMarkedSelection");

/**
 * Keeps a range looking selected after the field loses focus, which hides the browser's own selection. The link
 * editor uses it, so people can see which text the link goes on while they type the address.
 */
const MarkedSelection = Extension.create({
  name: "markedSelection",
  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: markedKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, marked) {
            const range = tr.getMeta(markedKey) as { from: number; to: number } | null | undefined;
            if (range === null) return DecorationSet.empty;
            if (range) return DecorationSet.create(tr.doc, [Decoration.inline(range.from, range.to, { class: "rich-text__selection" })]);
            return marked.map(tr.mapping, tr.doc);
          },
        },
        props: { decorations: (state) => markedKey.getState(state) },
      }),
    ];
  },
});

/** Marks the current selection so it stays visible without focus; does nothing when nothing is selected. */
export function markSelection(editor: Editor) {
  const { from, to, empty } = editor.state.selection;
  if (!empty) editor.view.dispatch(editor.state.tr.setMeta(markedKey, { from, to }).setMeta("addToHistory", false));
}

/** Removes the mark that markSelection added. */
export function unmarkSelection(editor: Editor) {
  if (markedKey.getState(editor.state)?.find().length) {
    editor.view.dispatch(editor.state.tr.setMeta(markedKey, null).setMeta("addToHistory", false));
  }
}

/** Mod-K opens the link editor, only while the field can be edited; RichText decides what that means. */
function linkShortcut(onLinkShortcut: () => void) {
  return Extension.create({
    name: "linkShortcut",
    addKeyboardShortcuts() {
      return {
        "Mod-k": () => {
          if (!this.editor.isEditable) return false;
          onLinkShortcut();
          return true;
        },
      };
    },
  });
}

export interface RichTextExtensionOptions {
  /** Example text shown while the field is empty. A function is read each time the field is drawn. */
  placeholder?: string | (() => string);
  /** Called on Mod-K. */
  onLinkShortcut?: () => void;
}

/** Everything the editor knows how to do. */
export function richTextExtensions({ placeholder, onLinkShortcut }: RichTextExtensionOptions = {}): AnyExtension[] {
  return [
    // No trailing empty line after a final quote, list, or code block: it would make the field a line taller than
    // its text. Enter on an empty line leaves a quote or list, and a code block has its own ways out.
    StarterKit.configure({ heading: false, horizontalRule: false, underline: false, link: false, listItem: false, trailingNode: false }),
    UnderlineTag,
    SafeLink,
    ListItemNoTab,
    HeadingAsParagraph,
    RuleAsEmptyLine,
    TableAsText,
    PasteMarkdown,
    MarkedSelection,
    Markdown,
    ...(placeholder ? [Placeholder.configure({ placeholder })] : []),
    ...(onLinkShortcut ? [linkShortcut(onLinkShortcut)] : []),
  ];
}

/** The editor's content as markdown: an empty string when there's no text, and never any trailing whitespace. */
export function toMarkdown(editor: Editor): string {
  if (editor.state.doc.textContent.trim() === "") return "";
  return editor.getMarkdown().replace(/\s+$/, "");
}
