import { useState } from "react";
import { Checkbox } from "@/components/Checkbox";
import { Meter } from "@/components/Meter";
import type { MeterSize, MeterTone } from "@/components/Meter";
import { Segment, SegmentedControl } from "@/components/SegmentedControl";
import { Slider } from "@/how-it-works/demo";
import { Inspect } from "@/how-it-works/Inspect";

/* Live demos for Meter's "How it works" page. Every one renders the real Meter, styled by the real CSS. */

/**
 * One meter, with its value, words, tone, size, and description switched from controls, so the HTML below it shows
 * each prop become an attribute, and the fill slide.
 */
export function Props() {
  const [value, setValue] = useState(12);
  const [words, setWords] = useState(true);
  const [tone, setTone] = useState<MeterTone>("neutral");
  const [size, setSize] = useState<MeterSize>("md");
  const [description, setDescription] = useState(false);
  return (
    <Inspect
      hint="Move the value and watch aria-valuenow, aria-valuetext, and --bar-value change, and the fill slide. Turn the words off to see the default percent."
      controls={
        <div className="grid gap-4">
          <Slider label="value" value={value} min={0} max={20} step={1} onChange={setValue} />
          <div className="flex flex-wrap items-end gap-4">
            <SegmentedControl label="tone" value={tone} onValueChange={(next) => setTone(next as MeterTone)}>
              <Segment value="neutral">neutral</Segment>
              <Segment value="success">success</Segment>
              <Segment value="warning">warning</Segment>
              <Segment value="danger">danger</Segment>
            </SegmentedControl>
            <SegmentedControl label="size" value={size} onValueChange={(next) => setSize(next as MeterSize)}>
              <Segment value="sm">sm</Segment>
              <Segment value="md">md</Segment>
            </SegmentedControl>
          </div>
          <div className="flex flex-wrap gap-4">
            <Checkbox checked={words} onCheckedChange={setWords}>
              Set valueText
            </Checkbox>
            <Checkbox checked={description} onCheckedChange={setDescription}>
              Add a description
            </Checkbox>
          </div>
        </div>
      }
    >
      <Meter
        className="w-80"
        label="Topics done"
        value={value}
        max={20}
        valueText={words ? `${value} of 20` : undefined}
        tone={tone}
        size={size}
        description={description ? "8 more to finish the course." : undefined}
      />
    </Inspect>
  );
}
