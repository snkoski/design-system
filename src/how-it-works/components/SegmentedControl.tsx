import { LayoutGrid, List, Moon, Sun } from "lucide-react";
import { useState } from "react";
import type { CSSProperties } from "react";
import { Segment, SegmentedControl } from "../../components/SegmentedControl";
import { Slider } from "../demo";
import { Inspect } from "../Inspect";
import { FormReadout, FormSwitches, PointerStage, px, StateSwitch } from "./RadioGroup";
import type { DemoState } from "./RadioGroup";
import "./segmented-control.css";

/* Live demos for SegmentedControl's "How it works" page, built from the real components. The state switch, form
   readout, and pointer stage are RadioGroup's (./RadioGroup.tsx). */

/** Two short options, for the demos with a framed stage, so they fit side by side on a phone without wrapping */
const twoViews = (
  <>
    <Segment value="list">List</Segment>
    <Segment value="grid">Grid</Segment>
  </>
);

/** Three short options, for the demos with more room */
const views = (
  <>
    <Segment value="list">List</Segment>
    <Segment value="grid">Grid</Segment>
    <Segment value="map">Map</Segment>
  </>
);

/** A control in each state, with its live HTML. Invalid shows the error until an option is chosen. */
export function SegmentedControlStates() {
  const [state, setState] = useState<DemoState>("usable");
  const [value, setValue] = useState<string | null>("grid");
  return (
    <div className="explain how-states">
      <StateSwitch
        name="segmented-control-state"
        value={state}
        onChange={(next) => {
          setState(next);
          if (next === "invalid") setValue(null);
        }}
      />
      <Inspect hint="Pick a state above, then try the control: click, Tab to it, and use the arrow keys.">
        <SegmentedControl
          label="Show results as"
          value={value}
          onValueChange={setValue}
          invalid={state === "invalid" && value === null}
          error="Choose how to show the results."
          disabled={state === "disabled"}
          readOnly={state === "read-only"}
        >
          {twoViews}
        </SegmentedControl>
      </Inspect>
    </div>
  );
}

/** Options with an icon before the label, and icon-only options, with their live HTML */
export function SegmentIcons() {
  return (
    <Inspect hint="Choose an option in either control. The icons never change: only aria-checked and the attributes that follow it do.">
      <div className="how-segment-icons">
        <SegmentedControl label="Theme" defaultValue="light">
          <Segment value="light" iconStart={<Sun />}>
            Light
          </Segment>
          <Segment value="dark" iconStart={<Moon />}>
            Dark
          </Segment>
        </SegmentedControl>
        <SegmentedControl aria-label="View" defaultValue="list">
          <Segment value="list" iconOnly aria-label="List">
            <List />
          </Segment>
          <Segment value="grid" iconOnly aria-label="Grid">
            <LayoutGrid />
          </Segment>
        </SegmentedControl>
      </div>
    </Inspect>
  );
}

/** A controlled segmented control in a form, with what the form would send */
export function SegmentedControlForm() {
  const [value, setValue] = useState<string | null>("grid");
  const [flags, setFlags] = useState({ required: false, disabled: false, readOnly: false });
  return (
    <div className="explain">
      <FormSwitches {...flags} onChange={(change) => setFlags({ ...flags, ...change })} />
      <FormReadout>
        <SegmentedControl label="Show results as" name="layout" value={value} onValueChange={setValue} {...flags}>
          {views}
        </SegmentedControl>
      </FormReadout>
    </div>
  );
}

const measureSegments = (stage: HTMLElement) => {
  const track = stage.querySelector(".segmented-control__track")!;
  const option = stage.querySelector(".segment__button")!;
  const after = getComputedStyle(option, "::after");
  const icon = stage.querySelector(".segment__button[data-icon-only]")!.getBoundingClientRect();
  return [
    `The track (control-md): ${px(track.getBoundingClientRect().height)} tall, its edge included.`,
    `Each option's hit area (::after): ${after.height} tall, reaching over the track's edge.`,
    `An icon-only option: ${px(icon.width)} wide, never narrower than target-min.`,
  ];
};

/** A segmented control with a mouse and on touch, with each option's hit area drawn */
export function SegmentHitAreas() {
  return (
    <PointerStage name="segment-pointer" measure={measureSegments}>
      <div className="how-hit-areas__pair">
        <SegmentedControl label="Show results as" defaultValue="grid">
          {twoViews}
        </SegmentedControl>
        <SegmentedControl label="View" defaultValue="list">
          <Segment value="list" iconOnly aria-label="List">
            <List />
          </Segment>
          <Segment value="grid" iconOnly aria-label="Grid">
            <LayoutGrid />
          </Segment>
        </SegmentedControl>
      </div>
    </PointerStage>
  );
}

/** Top to bottom. `depth` is how far down the stack each one is drawn. */
const LAYERS = [
  { layer: "label", depth: 2, title: "3. Label and icons", detail: "ink, above the highlight" },
  { layer: "highlight", depth: 1, title: "2. Highlight (::before)", detail: "surface, with an inset ink border" },
  { layer: "track", depth: 0, title: "1. Track", detail: "track, inside a transparent edge" },
] as const;

/**
 * The control's three layers, pulled apart. Each layer is a copy of the real control, restyled from outside to show
 * only its own part, and follows the real control above it. At 0 they sit exactly on top of each other, which is
 * what the control looks like.
 */
export function Layers() {
  const [value, setValue] = useState<string | null>("grid");
  const [apart, setApart] = useState(100);
  const [inset, setInset] = useState(3);
  const style = { "--apart": apart / 100, "--segment-inset": `${inset / 16}rem` } as CSSProperties;
  return (
    <div className="explain">
      <div className="explain__controls">
        <Slider label="Pull apart" value={apart} min={0} max={100} step={1} unit="%" onChange={setApart} />
        <Slider label="segment-inset (3px in the system)" value={inset} min={0} max={8} step={1} unit="px" onChange={setInset} />
      </div>
      <div style={style} className="how-layers__real">
        <SegmentedControl label="Show results as" value={value} onValueChange={setValue}>
          {views}
        </SegmentedControl>
      </div>
      <div className="how-layers" style={style} aria-hidden="true" inert>
        {LAYERS.map(({ layer, depth, title, detail }) => (
          <div key={layer} className="how-layers__layer" data-layer={layer} style={{ "--depth": depth } as CSSProperties}>
            <SegmentedControl aria-label={title} value={value}>
              {views}
            </SegmentedControl>
            <p className="how-layers__caption">
              <strong>{title}</strong>
              <span>{detail}</span>
            </p>
          </div>
        ))}
      </div>
      <p className="explain__note">
        Choose an option in the control at the top and the layers follow it. The slider for <code>segment-inset</code> changes the
        token on this demo only.
      </p>
    </div>
  );
}
