import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import "@/how-it-works/demo.css";

/* A live view of the HTML a real component renders, for "How it works" pages: use the component, and every attribute it
   or Base UI changes is marked as it changes. */

interface Line {
  depth: number;
  /** The tag's name, or null for a line of text */
  tag: string | null;
  /** A closing tag */
  end?: boolean;
  attributes: Attribute[];
  text: string;
  /** No children shown: empty, or an icon's drawing */
  closed: boolean;
}

interface Attribute {
  name: string;
  value: string;
  /** Changed or added in the last moment */
  changed?: boolean;
  /** Taken off in the last moment, and shown struck through */
  removed?: boolean;
}

/** Attributes left out: inline styles are long and say little about how a component works */
const SKIP = new Set(["style"]);

/** How long a change stays marked, in ms. Base UI often sets several attributes one after another, so a change is
    kept marked for a moment rather than only until the next one. */
const MARKED = 1500;

/** Base UI adds some attributes just after a component mounts (its links between label and control). Changes in this
    long, in ms, after the demo appears are how it starts, not changes. */
const SETTLING = 500;

/** Each element's attributes as last seen, with when each one last changed */
type Seen = WeakMap<Element, Map<string, { value: string | null; at: number }>>;

const shorten = (text: string, length = 48) => (text.length > length ? `${text.slice(0, length - 1)}…` : text);

function read(root: Element, seen: Seen, now: number, settled: boolean) {
  const lines: Line[] = [];
  const walk = (element: Element, depth: number) => {
    const first = !settled || !seen.has(element);
    const history = seen.get(element) ?? new Map<string, { value: string | null; at: number }>();
    seen.set(element, history);
    const attributes: Attribute[] = [];
    for (const { name, value } of element.attributes) {
      if (SKIP.has(name)) continue;
      const last = history.get(name);
      if (!last || last.value !== value) history.set(name, { value, at: first ? -Infinity : now });
      attributes.push({ name, value, changed: now - history.get(name)!.at < MARKED });
    }
    // Attributes that were there a moment ago and aren't now
    for (const [name, last] of history) {
      if (element.hasAttribute(name)) continue;
      if (last.value !== null) history.set(name, { value: null, at: settled ? now : -Infinity });
      else if (now - last.at >= MARKED) history.delete(name);
      const gone = history.get(name);
      if (gone && now - gone.at < MARKED) attributes.push({ name, value: "", removed: true });
    }
    // An icon's paths are drawing, not structure
    const tag = element.tagName.toLowerCase();
    const children = tag === "svg" ? [] : [...element.childNodes];
    const shown = children.filter((node) => node.nodeType === Node.ELEMENT_NODE || node.textContent?.trim());
    lines.push({ depth, tag, attributes, text: "", closed: shown.length === 0 });
    for (const node of shown) {
      if (node.nodeType === Node.ELEMENT_NODE) walk(node as Element, depth + 1);
      else lines.push({ depth: depth + 1, tag: null, attributes: [], text: shorten(node.textContent!.trim()), closed: true });
    }
    if (shown.length > 0) lines.push({ depth, tag, end: true, attributes: [], text: "", closed: true });
  };
  for (const child of root.children) walk(child, 0);
  return lines;
}

interface InspectProps {
  /** The real component, set up for the demo */
  children: ReactNode;
  /** What to try, shown above the component */
  hint?: ReactNode;
  /** Controls that change the component's props, shown above it */
  controls?: ReactNode;
}

/**
 * Renders a real component, and under it the HTML it has rendered right now, kept up to date as you use it. Attributes
 * that just changed are marked, so clicking a checkbox shows `aria-checked` and `data-checked` change.
 */
export function Inspect({ children, hint, controls }: InspectProps) {
  const stage = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<Line[]>([]);

  useLayoutEffect(() => {
    const root = stage.current!;
    const seen: Seen = new WeakMap();
    const start = performance.now();
    let unmark: number | undefined;
    const update = () => {
      const now = performance.now();
      setLines(read(root, seen, now, now - start > SETTLING));
      // Read again once the marks have run out, to take them off
      window.clearTimeout(unmark);
      unmark = window.setTimeout(update, MARKED);
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { subtree: true, childList: true, attributes: true, characterData: true });
    return () => {
      observer.disconnect();
      window.clearTimeout(unmark);
    };
  }, []);

  return (
    <div className="explain">
      {hint && <p className="explain__note">{hint}</p>}
      {controls && <div className="explain__controls">{controls}</div>}
      <div className="explain-inspect__stage" ref={stage}>
        {children}
      </div>
      <figure className="explain-inspect">
        <figcaption className="explain-inspect__title">
          The HTML it renders now{" "}
          <span className="explain-inspect__key">(attributes that just changed are underlined, and ones just taken off are struck through)</span>
        </figcaption>
        <pre className="explain-inspect__code" aria-live="off">
          {lines.map((line, index) => (
            <div key={index} style={{ paddingInlineStart: `${line.depth * 2 + 2}ch` }}>
              {line.tag === null ? (
                <span className="explain-inspect__text">{line.text}</span>
              ) : line.end ? (
                <>
                  {"</"}
                  <span className="explain-inspect__tag">{line.tag}</span>
                  {">"}
                </>
              ) : (
                <>
                  {"<"}
                  <span className="explain-inspect__tag">{line.tag}</span>
                  {line.attributes.map((attribute) => (
                    <span key={attribute.name}>
                      {" "}
                      <span
                        className="explain-inspect__attribute"
                        data-changed={attribute.changed || undefined}
                        data-removed={attribute.removed || undefined}
                      >
                        {attribute.name}
                        {attribute.value !== "" && (
                          <>
                            ="<span className="explain-inspect__value">{shorten(attribute.value)}</span>"
                          </>
                        )}
                      </span>
                    </span>
                  ))}
                  {line.closed && line.tag !== "input" ? " />" : ">"}
                </>
              )}
            </div>
          ))}
        </pre>
      </figure>
    </div>
  );
}
