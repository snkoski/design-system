import type { Meta, StoryObj } from "@storybook/react-vite";
import { Crosshair, Ghost, Heart, MousePointer2, Star, Wand2 } from "lucide-react";
import { useState } from "react";
import type { ReactElement } from "react";
import { expect } from "storybook/test";
import { Button, ButtonLink } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { Input } from "@/components/Input";
import { Radio, RadioGroup } from "@/components/RadioGroup";
import { CustomCursor } from "@/experiments/CustomCursor/CustomCursor";
import type { Hotspot } from "@/experiments/CustomCursor/CustomCursor";

const meta = {
  title: "Experiments/Custom cursor",
  parameters: { layout: "fullscreen" },
  // No Docs page: it shows every story at once, and their page-wide cursors would cover each other
  tags: ["!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const page = { background: "var(--bg)", color: "var(--ink)", minHeight: "100vh" };
const emoji = ["🌭", "🦄", "👀", "✨", "🔥", "🍕", "🐱", "👉"];
const icons: Record<string, ReactElement> = {
  Star: <Star fill="currentColor" />,
  Heart: <Heart fill="currentColor" />,
  Ghost: <Ghost />,
  Crosshair: <Crosshair />,
  Pointer: <MousePointer2 fill="currentColor" />,
  Wand: <Wand2 />,
};

/** Something to move the cursor over: text, a button, a link, a checkbox, a field, and a disabled button */
function TryArea() {
  return (
    <div className="grid justify-items-start gap-4 rounded-lg p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <p>Move the cursor over everything here, including the button and the link.</p>
      <div className="flex flex-wrap gap-3">
        <Button>A button</Button>
        <ButtonLink href="#somewhere" variant="secondary">
          A link
        </ButtonLink>
        <Button disabled variant="secondary">
          Disabled
        </Button>
      </div>
      <Checkbox>A checkbox</Checkbox>
      <Input label="A field" className="w-72" />
    </div>
  );
}

/** Pick an emoji, an icon, or type your own, then move the mouse over the page. */
export const Picker: Story = {
  render: function Render() {
    const [cursor, setCursor] = useState<string | ReactElement>("🌭");
    const [typed, setTyped] = useState("");
    const [url, setUrl] = useState("");
    const [size, setSize] = useState(32);
    const [hotspot, setHotspot] = useState<"center" | "top-left">("center");
    const [overControls, setOverControls] = useState<"keep" | "replace">("keep");
    const [scope, setScope] = useState<"children" | "page">("page");
    const [made, setMade] = useState<string | null>(null);
    // The first image in the cursor value is the one shown at normal density
    const preview = made?.match(/url\("([^"]+)"\)/)?.[1];
    const spot = made?.match(/\) (\d+) (\d+), auto$/);

    return (
      <div className="grid gap-8 p-8" style={page}>
        <CustomCursor
          cursor={cursor}
          size={size}
          hotspot={hotspot as Hotspot}
          overControls={overControls}
          scope={scope}
          onCursorChange={setMade}
          className="grid gap-8"
        >
          <div className="grid gap-3">
            <h2 className="text-label">Emoji</h2>
            <div className="flex flex-wrap gap-2">
              {emoji.map((choice) => (
                <Button key={choice} variant={cursor === choice ? "primary" : "secondary"} aria-label={`Use ${choice}`} onClick={() => setCursor(choice)}>
                  <span style={{ fontSize: "1.5rem" }}>{choice}</span>
                </Button>
              ))}
            </div>
            <h2 className="text-label">Icons</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(icons).map(([name, icon]) => (
                <Button key={name} variant={cursor === icon ? "primary" : "secondary"} onClick={() => setCursor(icon)}>
                  {name}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <Input label="Type an emoji or text" value={typed} onValueChange={setTyped} className="w-56" />
              <Button variant="secondary" disabled={!typed} onClick={() => setCursor(typed)}>
                Use it
              </Button>
              <Input label="Or an image address" value={url} onValueChange={setUrl} placeholder="https://…" className="w-72" />
              <Button variant="secondary" disabled={!url} onClick={() => setCursor(url)}>
                Use the image
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-10">
            <label className="grid gap-1">
              <span className="text-label">Size: {size}px</span>
              <input type="range" min={16} max={128} step={4} value={size} onChange={(event) => setSize(Number(event.target.value))} />
            </label>
            <RadioGroup label="Hotspot" value={hotspot} onValueChange={(value) => setHotspot(value as "center" | "top-left")}>
              <Radio value="center">Center</Radio>
              <Radio value="top-left">Top-left corner</Radio>
            </RadioGroup>
            <RadioGroup label="Over buttons and links" value={overControls} onValueChange={(value) => setOverControls(value as "keep" | "replace")}>
              <Radio value="keep">Keep their hand cursor</Radio>
              <Radio value="replace">Use this cursor too</Radio>
            </RadioGroup>
            <RadioGroup label="Where" value={scope} onValueChange={(value) => setScope(value as "children" | "page")}>
              <Radio value="page">The whole page</Radio>
              <Radio value="children">Only inside this box</Radio>
            </RadioGroup>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-label">The cursor, at its real size (the dot is the hotspot)</span>
            {preview && (
              <span className="relative inline-block" style={{ outline: "1px dashed var(--border)" }}>
                <img src={preview} alt="" width={size} height={size} style={{ display: "block" }} />
                {spot && (
                  <span
                    style={{ position: "absolute", left: `${Number(spot[1]) - 2}px`, top: `${Number(spot[2]) - 2}px`, width: "4px", height: "4px", borderRadius: "50%", background: "var(--danger)" }}
                  />
                )}
              </span>
            )}
          </div>

          <TryArea />
        </CustomCursor>
      </div>
    );
  },
};

/** An emoji cursor over the box. The button keeps its hand cursor. */
export const Emoji: Story = {
  render: () => (
    <div className="p-8" style={page}>
      <CustomCursor cursor="🦄" data-testid="area">
        <TryArea />
      </CustomCursor>
    </div>
  ),
  play: async ({ canvas }) => {
    const area = canvas.getByTestId("area");
    await expect(getComputedStyle(area).cursor).toMatch(/^image-set\(url\("data:image\/png/);
    await expect(getComputedStyle(canvas.getByText("Move the cursor over everything here, including the button and the link.")).cursor).toMatch(/url\(/);
    await expect(getComputedStyle(canvas.getByRole("button", { name: "A button" })).cursor).toBe("pointer");
  },
};

/** An icon cursor that replaces even the hand over buttons and links. */
export const IconEverywhere: Story = {
  render: () => (
    <div className="p-8" style={page}>
      <CustomCursor cursor={<Star fill="currentColor" />} overControls="replace" size={40}>
        <TryArea />
      </CustomCursor>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(getComputedStyle(canvas.getByRole("button", { name: "A button" })).cursor).toMatch(/^url\("data:image\/svg\+xml/);
    await expect(getComputedStyle(canvas.getByRole("link", { name: "A link" })).cursor).toMatch(/url\(/);
  },
};

/** The whole page gets the cursor while this story is open. */
export const WholePage: Story = {
  render: () => (
    <div className="p-8" style={page}>
      <CustomCursor cursor="👀" scope="page" />
      <TryArea />
    </div>
  ),
  play: async () => {
    await expect(getComputedStyle(document.documentElement).cursor).toMatch(/url\(/);
  },
};
