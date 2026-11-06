/**
 * Reads a rendered piece of the page and describes the skeleton that stands in for it: a gray bar for every line of
 * text, a gray box for every image, control, or small filled element (a badge, an avatar), and a copy of every
 * container's own fill and edge (a card), so the layout's structure stays. Positions are relative to `origin`.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A container's look, copied so the skeleton keeps the page's structure. It doesn't pulse. */
export interface Frame extends Rect {
  kind: "frame";
  background: string;
  borderWidth: string;
  borderStyle: string;
  borderColor: string;
  borderRadius: string;
  boxShadow: string;
}

/** Something that becomes one gray shape: an image, a control, or a small filled element. */
export interface Box extends Rect {
  kind: "box";
  borderRadius: string;
}

/** One line of text, as a bar as tall as the text's letters. */
export interface Line extends Rect {
  kind: "line";
}

export type Shape = Frame | Box | Line;

/** Elements whose content is a picture or a control: each becomes one box, and nothing inside is read. */
const LEAF_TAGS = new Set([
  "IMG",
  "SVG",
  "VIDEO",
  "CANVAS",
  "IFRAME",
  "PICTURE",
  "OBJECT",
  "EMBED",
  "INPUT",
  "TEXTAREA",
  "SELECT",
  "BUTTON",
  "METER",
  "PROGRESS",
]);

/** Roles that mean the same thing on an element that isn't natively one (Base UI's checkboxes are spans). */
const LEAF_ROLES = new Set(["button", "checkbox", "switch", "radio", "slider", "img", "progressbar", "meter"]);

/** True when a computed color is fully transparent */
function transparent(color: string) {
  return color === "transparent" || /rgba\(.*,\s*0\)$/.test(color) || /\/\s*0\)$/.test(color);
}

/** True when an element has a look of its own: a fill, a visible edge, or a shadow */
function decorated(style: CSSStyleDeclaration) {
  const filled = !transparent(style.backgroundColor) || style.backgroundImage !== "none";
  const edged = ["top", "right", "bottom", "left"].some(
    (side) =>
      parseFloat(style.getPropertyValue(`border-${side}-width`)) > 0 &&
      style.getPropertyValue(`border-${side}-style`) !== "none" &&
      !transparent(style.getPropertyValue(`border-${side}-color`)),
  );
  return filled || edged || style.boxShadow !== "none";
}

/** What kind of element this is, for the skeleton */
export function classify(element: Element, style: CSSStyleDeclaration): "skip" | "box" | "decorated" | "content" {
  // Hidden or clipped to nothing (the visually-hidden class, a form control's hidden input): not part of what you see
  if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return "skip";
  if (style.clipPath !== "none" && style.clipPath !== "") return "skip";
  if (style.clip !== "auto" && style.clip !== "") return "skip";

  const tag = element.tagName.toUpperCase();
  const role = element.getAttribute("role");
  if (LEAF_TAGS.has(tag) || (role !== null && LEAF_ROLES.has(role))) return "box";
  return decorated(style) ? "decorated" : "content";
}

/**
 * True when an element with a look of its own is a token, one gray shape (a badge, an avatar, a tag), rather than a
 * container whose content is read (a card, a panel): nothing inside it is a control or has a look of its own,
 * except icons and pictures, and its text is all on one line.
 */
export function isToken(element: Element) {
  for (const inner of element.querySelectorAll("*")) {
    const tag = inner.tagName.toUpperCase();
    if (tag === "SVG" || tag === "IMG" || inner.closest("svg") !== null) continue;
    const role = inner.getAttribute("role");
    if (LEAF_TAGS.has(tag) || (role !== null && LEAF_ROLES.has(role))) return false;
    if (decorated(getComputedStyle(inner))) return false;
  }
  const lines: DOMRect[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!(node as Text).data.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    if (typeof range.getClientRects !== "function") return true;
    lines.push(...[...range.getClientRects()].filter((rect) => rect.width >= 1));
  }
  // One line: every piece of text overlaps the same band
  const top = Math.max(...lines.map((rect) => rect.top));
  const bottom = Math.min(...lines.map((rect) => rect.bottom));
  return lines.length === 0 || top < bottom;
}

/** A rect relative to the origin */
function relative(rect: DOMRect, origin: DOMRect): Rect {
  return { x: rect.left - origin.left, y: rect.top - origin.top, width: rect.width, height: rect.height };
}

/** One bar per line of a text node, as tall as its letters (1em) and centered in the line */
export function textBars(text: Text, fontSize: number, origin: DOMRect): Line[] {
  if (!text.data.trim()) return [];
  const range = document.createRange();
  range.selectNodeContents(text);
  // jsdom has no layout and no Range.getClientRects
  if (typeof range.getClientRects !== "function") return [];
  const bars: Line[] = [];
  for (const rect of range.getClientRects()) {
    if (rect.width < 1 || rect.height < 1) continue;
    const height = Math.min(rect.height, fontSize);
    const line = relative(rect, origin);
    bars.push({ kind: "line", ...line, y: line.y + (line.height - height) / 2, height });
  }
  return bars;
}

/**
 * Joins bars that sit side by side on one line, such as the words before and inside a <strong>, so a sentence is
 * one bar, not several touching ones.
 */
export function mergeBars(bars: Line[]): Line[] {
  const merged: Line[] = [];
  for (const bar of bars) {
    const previous = merged.find(
      (other) =>
        Math.abs(other.y - bar.y) < 1 &&
        Math.abs(other.height - bar.height) < 1 &&
        bar.x <= other.x + other.width + 2 &&
        other.x <= bar.x + bar.width + 2,
    );
    if (previous) {
      const right = Math.max(previous.x + previous.width, bar.x + bar.width);
      previous.x = Math.min(previous.x, bar.x);
      previous.width = right - previous.x;
    } else {
      merged.push({ ...bar });
    }
  }
  return merged;
}

/** Walks everything inside `root` in page order and returns the skeleton's shapes, relative to `origin`. */
export function measureShapes(root: Element, origin: Element): Shape[] {
  const base = origin.getBoundingClientRect();
  const shapes: Shape[] = [];
  const bars: Line[] = [];

  function visit(element: Element) {
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const fontSize = parseFloat(getComputedStyle(element).fontSize);
        bars.push(...textBars(node as Text, fontSize, base));
        continue;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const child = node as Element;
      // The wrapper hides the content with opacity on its outer element, so each element here still reports its
      // own look
      const style = getComputedStyle(child);
      const kind = classify(child, style);
      if (kind === "skip") continue;
      // No box of its own, but its children show
      if (style.display === "contents") {
        visit(child);
        continue;
      }
      const rect = child.getBoundingClientRect();
      // Clipped or squeezed to a pixel, as hidden inputs are: not something you see
      if (rect.width <= 1 && rect.height <= 1) continue;
      if (kind === "box" || (kind === "decorated" && isToken(child))) {
        if (rect.width >= 1 && rect.height >= 1) {
          shapes.push({ kind: "box", ...relative(rect, base), borderRadius: style.borderRadius });
        }
        continue;
      }
      if (kind === "decorated" && rect.width >= 1 && rect.height >= 1) {
        shapes.push({
          kind: "frame",
          ...relative(rect, base),
          background: style.backgroundColor,
          borderWidth: style.borderWidth,
          borderStyle: style.borderStyle,
          borderColor: style.borderColor,
          borderRadius: style.borderRadius,
          boxShadow: style.boxShadow,
        });
      }
      visit(child);
    }
  }

  visit(root);
  return [...shapes, ...mergeBars(bars)];
}
