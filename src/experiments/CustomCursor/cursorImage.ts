/**
 * Turns a cursor choice into the value of the CSS `cursor` property. The browser keeps drawing the cursor, so it
 * never lags behind the mouse, and if the image can't be used, the normal cursor shows instead.
 */
export type Hotspot = "center" | "top-left" | { x: number; y: number };

/** Browsers ignore cursor images larger than this, in CSS pixels */
export const MAX_SIZE = 128;

export function clampSize(size: number) {
  return Math.min(Math.max(Math.round(size), 8), MAX_SIZE);
}

export function hotspotFor(hotspot: Hotspot, size: number) {
  if (hotspot === "center") return { x: Math.floor(size / 2), y: Math.floor(size / 2) };
  if (hotspot === "top-left") return { x: 0, y: 0 };
  return { x: Math.min(Math.max(Math.round(hotspot.x), 0), size - 1), y: Math.min(Math.max(Math.round(hotspot.y), 0), size - 1) };
}

/** A string that's an image address rather than an emoji or text */
export function isImageUrl(value: string) {
  return /^(https?:|data:image\/|blob:|\/|\.\.?\/)/.test(value.trim());
}

/** Draws an emoji or short text centered on a square canvas, `scale` times the size for sharp high-density screens */
export function drawText(text: string, size: number, scale: number, color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = size * scale;
  canvas.height = size * scale;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.scale(scale, scale);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = color;
  // Emoji look best a little smaller than the square, or their edges clip
  context.font = `${size * 0.85}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", system-ui, sans-serif`;
  context.fillText(text, size / 2, size / 2 + size * 0.05);
  return canvas.toDataURL("image/png");
}

/** An inline <svg> as an image, sized and colored, so currentColor in it resolves */
export function svgToDataUrl(svg: SVGSVGElement, size: number, color: string) {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute("width", String(size));
  copy.setAttribute("height", String(size));
  copy.setAttribute("color", color);
  copy.style.color = color;
  const markup = new XMLSerializer().serializeToString(copy);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

/** The CSS cursor value: the image at 1x, a sharper 2x where the browser supports image-set, and a normal fallback */
export function cursorValue(oneX: string, twoX: string | null, spot: { x: number; y: number }) {
  const supportsSet = twoX && typeof CSS !== "undefined" && CSS.supports?.("cursor", `image-set(url("${oneX}") 1x) 0 0, auto`);
  const image = supportsSet ? `image-set(url("${oneX}") 1x, url("${twoX}") 2x)` : `url("${oneX}")`;
  return `${image} ${spot.x} ${spot.y}, auto`;
}
