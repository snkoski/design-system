import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/Input";
import { Segment, SegmentedControl } from "@/components/SegmentedControl";
import { Slider } from "@/how-it-works/demo";
import { clampSize, cursorValue, drawText, hotspotFor } from "@/experiments/CustomCursor/cursorImage";
import type { Hotspot } from "@/experiments/CustomCursor/cursorImage";
import "@/experiments/CustomCursor/explain.css";

/* A live demo for the "How it works" page. It calls the real functions in cursorImage.ts, the same way
   CustomCursor.tsx does for an emoji, so what it shows is what runs. */

/** How many times bigger the images are drawn here, so their pixels show */
const ZOOM = 3;

/** A cursor value with its data addresses cut short, because each is thousands of characters long */
const shorten = (value: string) => value.replace(/(data:image\/png;base64,)([^"]+)/g, (_, start: string, data: string) => `${start}… (${data.length} characters)`);

/** Makes a cursor from an emoji or text with the real drawText(), hotspotFor(), and cursorValue(), and shows each part */
export function MakeCursor() {
  const [text, setText] = useState("🌭");
  const [size, setSize] = useState(32);
  const [spotChoice, setSpotChoice] = useState<"center" | "top-left" | "exact">("center");
  const [spotX, setSpotX] = useState(4);
  const [spotY, setSpotY] = useState(4);
  const [ink, setInk] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);

  // The text color where the cursor is used, as CustomCursor reads it when no color is given
  useLayoutEffect(() => setInk(getComputedStyle(panel.current!).color), []);

  const px = clampSize(size);
  const hotspot: Hotspot = spotChoice === "exact" ? { x: spotX, y: spotY } : spotChoice;
  const spot = hotspotFor(hotspot, px);
  const images = useMemo(() => {
    if (!ink || !text) return null;
    const oneX = drawText(text, px, 1, ink);
    const twoX = drawText(text, px, 2, ink);
    return oneX ? { oneX, twoX } : null;
  }, [text, px, ink]);
  const value = images ? cursorValue(images.oneX, images.twoX, spot) : null;

  return (
    <div className="explain" ref={panel}>
      <div className="explain__controls">
        <Input label="Emoji or text" value={text} onValueChange={setText} />
        <Slider label="Size" value={size} min={4} max={200} step={4} unit="px" onChange={setSize} />
        <SegmentedControl label="Hotspot" name="make-cursor-hotspot" value={spotChoice} onValueChange={(choice) => setSpotChoice(choice as typeof spotChoice)}>
          <Segment value="center">Center</Segment>
          <Segment value="top-left">Top-left</Segment>
          <Segment value="exact">Exact pixels</Segment>
        </SegmentedControl>
        {spotChoice === "exact" && (
          <>
            <Slider label="Hotspot x" value={spotX} min={-20} max={200} step={1} unit="px" onChange={setSpotX} />
            <Slider label="Hotspot y" value={spotY} min={-20} max={200} step={1} unit="px" onChange={setSpotY} />
          </>
        )}
      </div>
      <ol className="explain__steps">
        <li>
          <strong>Size.</strong> <code>clampSize({size}) = {px}</code>
          {px !== size && <>, held between 8 and 128, the largest cursor browsers show</>}
        </li>
        <li>
          <strong>Hotspot.</strong>{" "}
          <code>
            hotspotFor({typeof hotspot === "string" ? `"${hotspot}"` : `{ x: ${hotspot.x}, y: ${hotspot.y} }`}, {px}) = {"{"} x: {spot.x}, y: {spot.y} {"}"}
          </code>
          {spotChoice === "exact" && (spot.x !== spotX || spot.y !== spotY) && <>, held inside the image, from 0 to {px - 1}</>}
        </li>
        <li>
          <strong>Images.</strong> <code>drawText()</code> draws it twice: {px} × {px} pixels for normal screens, and {px * 2} × {px * 2} for
          high-density ones. Here they're shown {ZOOM} times bigger, so you can see the pixels. The dot is the hotspot.
        </li>
      </ol>
      {images ? (
        <div className="flex flex-wrap items-end gap-6">
          {[
            { src: images.oneX, label: `1x: ${px} × ${px} pixels` },
            ...(images.twoX ? [{ src: images.twoX, label: `2x: ${px * 2} × ${px * 2} pixels` }] : []),
          ].map(({ src, label }) => (
            <figure key={label} className="cursor-explain__figure">
              <span className="cursor-explain__image" style={{ width: `${px * ZOOM}px`, height: `${px * ZOOM}px` }}>
                <img src={src} alt="" width={px * ZOOM} height={px * ZOOM} />
                <span className="cursor-explain__spot" style={{ left: `${(spot.x + 0.5) * ZOOM}px`, top: `${(spot.y + 0.5) * ZOOM}px` }} />
              </span>
              <figcaption>{label}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="explain__note">Type an emoji or some text to make a cursor.</p>
      )}
      {value && (
        <>
          <p className="explain__result">
            The real <code>cursorValue()</code> returned <code>{shorten(value)}</code>
          </p>
          <div className="cursor-explain__try" style={{ cursor: value }}>
            Move the mouse here to use it.
          </div>
        </>
      )}
    </div>
  );
}
