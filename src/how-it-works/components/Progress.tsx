import { useState } from "react";
import { Checkbox } from "../../components/Checkbox";
import { Progress } from "../../components/Progress";
import type { ProgressSize } from "../../components/Progress";
import { Segment, SegmentedControl } from "../../components/SegmentedControl";
import { Slider } from "../demo";
import { Inspect } from "../Inspect";

/* Live demos for Progress's "How it works" page. Every one renders the real Progress, styled by the real CSS. */

/**
 * One progress bar, with its value, size, and hidden label switched from controls, and a switch to "doesn't know
 * how long", so the HTML below it shows each prop become an attribute.
 */
export function Props() {
  const [value, setValue] = useState(40);
  const [known, setKnown] = useState(true);
  const [size, setSize] = useState<ProgressSize>("md");
  const [hideLabel, setHideLabel] = useState(false);
  const done = known && value >= 100;
  return (
    <Inspect
      hint="Move the value and watch aria-valuenow, aria-valuetext, and --bar-value change; at 100, data-complete appears and the label changes. Turn off the known length and the value attributes go, data-indeterminate appears, and the fill slides."
      controls={
        <div className="grid gap-4">
          <Slider label="value" value={value} min={0} max={100} step={1} onChange={setValue} />
          <div className="flex flex-wrap items-end gap-4">
            <SegmentedControl label="size" value={size} onValueChange={(next) => setSize(next as ProgressSize)}>
              <Segment value="sm">sm</Segment>
              <Segment value="md">md</Segment>
            </SegmentedControl>
          </div>
          <div className="flex flex-wrap gap-4">
            <Checkbox checked={known} onCheckedChange={setKnown}>
              Knows how long
            </Checkbox>
            <Checkbox checked={hideLabel} onCheckedChange={setHideLabel}>
              Hide the label
            </Checkbox>
          </div>
        </div>
      }
    >
      <Progress
        className="w-80"
        label={done ? "Uploaded resume.pdf" : "Uploading resume.pdf…"}
        value={known ? value : null}
        size={size}
        hideLabel={hideLabel}
      />
    </Inspect>
  );
}
