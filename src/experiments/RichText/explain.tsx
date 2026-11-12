import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import type { JSONContent, MarkdownToken } from "@tiptap/react";
import { useEffect, useId, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { TextArea } from "@/components/TextArea";
import "@/how-it-works/demo.css";
import { ALLOWED_SCHEMES, EMAIL, isAllowedHref, normalizeHref, richTextExtensions, SCHEME, toMarkdown } from "@/experiments/RichText/markdown";
import { RichText, TOOLS } from "@/experiments/RichText/RichText";
import "@/experiments/RichText/explain.css";

/* Live demos for the "How it works" page. They use the real extensions, toMarkdown(), normalizeHref(),
   isAllowedHref(), and the toolbar's TOOLS, so what they show is what runs. */

/** One step of the document, as ProseMirror counts it: entering a node, a character, or leaving a node */
interface Cell {
  /** The position just before this step */
  pos: number;
  kind: "open" | "close" | "char" | "leaf";
  text: string;
  marks: string[];
}

/** Every step of a node's content, starting at `start`, the position just inside it */
function cells(node: ProseMirrorNode, start: number, out: Cell[] = []) {
  node.forEach((child, offset) => {
    const at = start + offset;
    if (child.isText) {
      // Positions count UTF-16 units, like JavaScript strings, so split the same way
      child.text!.split("").forEach((character, index) => {
        out.push({ pos: at + index, kind: "char", text: character, marks: child.marks.map((mark) => mark.type.name) });
      });
    } else if (child.isLeaf) {
      out.push({ pos: at, kind: "leaf", text: child.type.name, marks: [] });
    } else {
      out.push({ pos: at, kind: "open", text: child.type.name, marks: [] });
      cells(child, at + 1, out);
      out.push({ pos: at + child.nodeSize - 1, kind: "close", text: child.type.name, marks: [] });
    }
  });
  return out;
}

const glyph = (cell: Cell) =>
  cell.kind === "open" ? `<${cell.text}>` : cell.kind === "close" ? `</${cell.text}>` : cell.kind === "leaf" ? `<${cell.text} />` : cell.text === " " ? "␣" : cell.text;

/**
 * An editor with the field's real extensions, and the document it holds drawn as ProseMirror counts it: each
 * character is one position, and so is each step into or out of a node. Select text or move the caret to see the
 * positions, and which toolbar formats are on there.
 */
export function Positions() {
  const labelId = useId();
  const [, setVersion] = useState(0);
  const extensions = useMemo(() => richTextExtensions(), []);
  const editorProps = useMemo(
    () => ({ attributes: { role: "textbox", "aria-multiline": "true", "aria-labelledby": labelId, class: "rich-text__editor" } }),
    [labelId],
  );
  const editor = useEditor({
    extensions,
    content: "Hi **Ada**\n\n- one",
    contentType: "markdown",
    immediatelyRender: false,
    editorProps,
  });

  // Tiptap doesn't re-render React on every change, so count transactions to draw the newest state
  useEffect(() => {
    if (!editor) return;
    const update = () => setVersion((version) => version + 1);
    editor.on("transaction", update);
    return () => {
      editor.off("transaction", update);
    };
  }, [editor]);

  const state = editor?.state;
  const { from = 0, to = 0, empty = true } = state?.selection ?? {};
  const all = state ? cells(state.doc, 0) : [];
  const size = state?.doc.content.size ?? 0;
  const $from = state?.selection.$from;
  const path = $from ? Array.from({ length: $from.depth + 1 }, (_, depth) => $from.node(depth).type.name).join(" › ") : "";
  const on = editor ? [...TOOLS.filter((tool) => tool.isActive(editor)).map((tool) => tool.label), ...(editor.isActive("link") ? ["Link"] : [])] : [];

  return (
    <div className="explain">
      <div className="rich-text rich-explain__field">
        <span id={labelId} className="rich-text__label">
          Try it here
        </span>
        <div className="rich-text__box">
          <EditorContent editor={editor} className="rich-text__content" />
        </div>
      </div>
      <div className="rich-explain__actions">
        {TOOLS.map((tool) => (
          <Button
            key={tool.label}
            size="sm"
            variant="secondary"
            // Like the real toolbar: the field keeps focus and its selection
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor && tool.run(editor.chain().focus()).run()}
          >
            Toggle {tool.label.toLowerCase()}
          </Button>
        ))}
      </div>
      <p className="explain__note">
        Each box below is one position. The number under it is the position just before it, which is where a caret there would sit. The last
        number, {size}, is the end of the document.
      </p>
      <div className="rich-explain__ruler" aria-hidden="true">
        {all.map((cell) => (
          <span
            key={`${cell.kind}-${cell.pos}`}
            className="rich-explain__cell"
            data-kind={cell.kind}
            data-selected={!empty && cell.pos >= from && cell.pos < to ? "" : undefined}
            data-caret={empty && cell.pos === from ? "" : undefined}
          >
            <span className="rich-explain__glyph" data-bold={cell.marks.includes("bold") || undefined} data-italic={cell.marks.includes("italic") || undefined}>
              {glyph(cell)}
            </span>
            <span className="rich-explain__pos">{cell.pos}</span>
          </span>
        ))}
        <span className="rich-explain__cell" data-kind="end" data-caret={empty && from === size ? "" : undefined}>
          <span className="rich-explain__glyph">end</span>
          <span className="rich-explain__pos">{size}</span>
        </span>
      </div>
      <ul className="explain__facts" aria-live="polite">
        <li>
          {empty ? (
            <>
              The caret is at position <code>{from}</code>, so <code>from</code> and <code>to</code> are both {from}.
            </>
          ) : (
            <>
              The selection runs from <code>{from}</code> to <code>{to}</code>: “{state?.doc.textBetween(from, to, " ")}”.
            </>
          )}
        </li>
        <li>
          Inside: <code>{path}</code>
        </li>
        <li>On here: {on.length ? on.join(", ") : "no formats"}.</li>
      </ul>
    </div>
  );
}

const EXAMPLES = [
  { label: "every format", markdown: "**Bold**, *italic*, <u>underlined</u>, ~~struck~~, `code`, and [a link](https://example.com).\n\n> A quote\n\n1. A numbered item" },
  { label: "rewrites", markdown: "__Bold__ and _italic_\n\n* one\n* two" },
  { label: "what's left out", markdown: "# A heading\n\n---\n\n| Day | Time |\n|---|---|\n| Tuesday | **10:00** |" },
  { label: "unsafe parts", markdown: '[Click me](javascript:alert(1)) and <span style="color:red">red</span><script>alert(2)</script>' },
];

/** The tokens inside a token: inline tokens, or a list's items */
const childTokens = (token: MarkdownToken): MarkdownToken[] | undefined => (token.type === "list" ? token.items : token.tokens);

function TokenTree({ tokens }: { tokens: MarkdownToken[] }) {
  return (
    <ul className="rich-explain__tree">
      {tokens.map((token, index) => {
        const children = childTokens(token);
        return (
          <li key={index}>
            <code className="rich-explain__type">{token.type}</code> <code className="rich-explain__raw">{JSON.stringify(token.raw)}</code>
            {children && children.length > 0 && <TokenTree tokens={children} />}
          </li>
        );
      })}
    </ul>
  );
}

/** The attributes worth showing: the ones that change what's written back */
const SHOWN_ATTRIBUTES = ["href", "language", "start"];

function attributes(attrs: Record<string, unknown> | undefined) {
  const shown = Object.entries(attrs ?? {}).filter(([key, value]) => SHOWN_ATTRIBUTES.includes(key) && value !== null && value !== undefined);
  return shown.map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(", ");
}

function DocTree({ nodes }: { nodes: JSONContent[] }) {
  return (
    <ul className="rich-explain__tree">
      {nodes.map((node, index) => {
        const attrs = attributes(node.attrs);
        return (
          <li key={index}>
            <code className="rich-explain__type">{node.type}</code>
            {attrs && <code className="rich-explain__raw"> {`{ ${attrs} }`}</code>}
            {node.text !== undefined && <code className="rich-explain__raw"> {JSON.stringify(node.text)}</code>}
            {node.marks && node.marks.length > 0 && (
              <span className="rich-explain__marks">
                {" "}
                marks:{" "}
                {node.marks.map((mark, markIndex) => {
                  const markAttrs = attributes(mark.attrs);
                  return (
                    <code key={markIndex} className="rich-explain__mark">
                      {mark.type}
                      {markAttrs && ` { ${markAttrs} }`}
                    </code>
                  );
                })}
              </span>
            )}
            {node.content && node.content.length > 0 && <DocTree nodes={node.content} />}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Markdown in, through each stage, and back out: marked's tokens, the document the editor builds from them, the
 * markdown toMarkdown() writes, and the real field drawing it. All from a headless editor with the field's extensions.
 */
export function RoundTrip() {
  const [markdown, setMarkdown] = useState(EXAMPLES[0]!.markdown);
  const [editor, setEditor] = useState<Editor | null>(null);

  // A headless editor: no view on the page, just the schema, the extensions, and the markdown manager
  useEffect(() => {
    const headless = new Editor({ extensions: richTextExtensions() });
    setEditor(headless);
    return () => headless.destroy();
  }, []);

  const result = useMemo(() => {
    if (!editor?.markdown) return null;
    const { instance } = editor.markdown;
    const tokens = new instance.Lexer(instance.defaults).lex(markdown) as MarkdownToken[];
    editor.commands.setContent(markdown, { contentType: "markdown", emitUpdate: false });
    return { tokens, doc: editor.getJSON(), written: toMarkdown(editor) };
  }, [editor, markdown]);

  return (
    <div className="explain">
      <div className="rich-explain__actions">
        {EXAMPLES.map((example) => (
          <Button key={example.label} size="sm" variant="secondary" onClick={() => setMarkdown(example.markdown)}>
            Load {example.label}
          </Button>
        ))}
      </div>
      <TextArea label="Markdown" rows={5} value={markdown} onValueChange={(value) => setMarkdown(value)} spellCheck={false} />
      {result && (
        <div className="rich-explain__stages">
          <figure className="rich-explain__stage">
            <figcaption className="rich-explain__caption">
              1. Tokens <span className="rich-explain__aside">from marked’s lexer, with what each one matched</span>
            </figcaption>
            <TokenTree tokens={result.tokens} />
          </figure>
          <figure className="rich-explain__stage">
            <figcaption className="rich-explain__caption">
              2. The document <span className="rich-explain__aside">the editor builds from them</span>
            </figcaption>
            <DocTree nodes={[result.doc]} />
          </figure>
          <figure className="rich-explain__stage">
            <figcaption className="rich-explain__caption">
              3. Written back <span className="rich-explain__aside">by toMarkdown(), as the form and onValueChange get it</span>
            </figcaption>
            <pre className="rich-explain__output">{result.written === "" ? "(an empty string)" : result.written}</pre>
            <p className="explain__readout">
              {result.written === markdown ? "The same as what went in." : "Not the same as what went in: the field writes markdown its own way."}
            </p>
          </figure>
          <figure className="rich-explain__stage">
            <figcaption className="rich-explain__caption">
              4. Drawn <span className="rich-explain__aside">by the real field, read-only</span>
            </figcaption>
            <RichText label="In the field" readOnly maxRows={10} value={markdown} />
          </figure>
        </div>
      )}
    </div>
  );
}

const ADDRESSES = ["example.com", "me@example.com", "example.com:8080/path", "javascript:alert(1)", "/settings"];

interface Check {
  text: ReactNode;
  /** Set on the step that refuses the address */
  refused?: boolean;
}

/** normalizeHref() and isAllowedHref(), worked through for one address, step by step */
function check(input: string): Check[] {
  const steps: Check[] = [];
  const trimmed = input.trim();
  steps.push({
    text: (
      <>
        <strong>Trim.</strong> <code>{JSON.stringify(trimmed)}</code>
      </>
    ),
  });
  if (!trimmed) return [...steps, { text: "Nothing is left, so there's no address: refused.", refused: true }];
  if (/\s/.test(trimmed)) return [...steps, { text: "There's a space inside it, so it can't be one address: refused.", refused: true }];

  const scheme = SCHEME.exec(trimmed)?.[1];
  const hasScheme = scheme !== undefined && !scheme.includes(".");
  steps.push({
    text: (
      <>
        <strong>Scheme.</strong>{" "}
        {scheme === undefined ? (
          <>None: nothing before a colon matches <code>SCHEME</code>.</>
        ) : hasScheme ? (
          <>
            <code>{JSON.stringify(scheme)}</code>, the part before the first colon.
          </>
        ) : (
          <>
            <code>SCHEME</code> matched <code>{JSON.stringify(scheme)}</code>, but a scheme never has a dot, so that's a host and port, not a scheme.
          </>
        )}
      </>
    ),
  });

  let href = trimmed;
  if (!hasScheme) {
    if (EMAIL.test(trimmed)) {
      href = `mailto:${trimmed}`;
      steps.push({
        text: (
          <>
            <strong>Fill in.</strong> It matches <code>EMAIL</code>, so it gets <code>mailto:</code> in front: <code>{href}</code>
          </>
        ),
      });
    } else if (/^[^/?#.][^/?#]*\.[^/?#]/.test(trimmed)) {
      href = `https://${trimmed}`;
      steps.push({
        text: (
          <>
            <strong>Fill in.</strong> It has a dot after its first character, before any <code>/</code>, <code>?</code>, or <code>#</code>, so it looks
            like a web address and gets <code>https://</code> in front: <code>{href}</code>
          </>
        ),
      });
    } else {
      return [
        ...steps,
        {
          text: (
            <>
              <strong>Fill in.</strong> It isn't an email address and doesn't look like a web address, so nothing can be filled in: refused.
            </>
          ),
          refused: true,
        },
      ];
    }
  } else {
    steps.push({ text: <><strong>Fill in.</strong> It already has a scheme, so it stays as it is.</> });
  }

  const finalScheme = SCHEME.exec(href)?.[1]?.toLowerCase();
  if (!finalScheme || !ALLOWED_SCHEMES.has(finalScheme)) {
    return [
      ...steps,
      {
        text: (
          <>
            <strong>Allowed?</strong> <code>{finalScheme}</code> isn't one of <code>http</code>, <code>https</code>, or <code>mailto</code>: refused.
          </>
        ),
        refused: true,
      },
    ];
  }
  let url: URL | null = null;
  try {
    url = new URL(href);
  } catch {
    return [...steps, { text: <><strong>Allowed?</strong> The browser can't read it as a URL: refused.</>, refused: true }];
  }
  const part = finalScheme === "mailto" ? url.pathname : url.hostname;
  steps.push({
    text: part ? (
      <>
        <strong>Allowed?</strong> <code>{finalScheme}</code> is allowed, and the browser reads its {finalScheme === "mailto" ? "address" : "host"} as{" "}
        <code>{part}</code>: kept.
      </>
    ) : (
      <>
        <strong>Allowed?</strong> <code>{finalScheme}</code> is allowed, but there's no {finalScheme === "mailto" ? "address" : "host"} after it: refused.
      </>
    ),
    refused: !part,
  });
  return steps;
}

/**
 * The link editor's address check, step by step: what normalizeHref() does to what you type, then what
 * isAllowedHref() decides. The last lines are what the real functions returned.
 */
export function LinkCheck() {
  const [address, setAddress] = useState(ADDRESSES[0]!);
  const steps = check(address);
  const result = normalizeHref(address);

  return (
    <div className="explain">
      <div className="rich-explain__actions">
        {ADDRESSES.map((example) => (
          <Button key={example} size="sm" variant="secondary" onClick={() => setAddress(example)}>
            Try {example}
          </Button>
        ))}
      </div>
      <Input label="Link address" value={address} onValueChange={(value) => setAddress(value)} autoComplete="off" spellCheck={false} />
      <ol className="explain__steps">
        {steps.map((step, index) => (
          <li key={index} data-refused={step.refused || undefined}>
            {step.text}
          </li>
        ))}
      </ol>
      <p className="explain__result" aria-live="polite">
        The real <code>normalizeHref()</code> returned <code>{JSON.stringify(result)}</code>, so the link editor{" "}
        {result === null ? "shows an error and keeps the popover open" : "saves the link"}. Loaded as markdown exactly as typed, with no filling in,{" "}
        <code>isAllowedHref()</code> says <code>{String(isAllowedHref(address))}</code>, so the link {isAllowedHref(address) ? "is kept" : "is dropped and only its text stays"}.
      </p>
    </div>
  );
}
