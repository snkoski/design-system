import { useState } from "react";
import { Button } from "@/components/Button";
import { Segment, SegmentedControl } from "@/components/SegmentedControl";
import { Skeleton, SkeletonItem } from "@/components/Skeleton";
import { Inspect } from "@/how-it-works/Inspect";

/* Live demos for Skeleton's "How it works" page. Every one renders the real Skeleton, styled by the real skeleton.css. */

/**
 * Shows a skeleton appearing, again on demand, so the HTML below it shows each step: the hidden copy of the label
 * hidden from screen readers as soon as JavaScript runs, and the status region getting its words a moment later.
 */
export function Appearing() {
  const [round, setRound] = useState(0);
  const [delay, setDelay] = useState("0");
  return (
    <Inspect
      hint="Press the button and watch the HTML: aria-hidden lands on the hidden label straight away, and its words arrive in the status region a moment later."
      controls={
        <div className="flex flex-wrap items-end gap-4">
          <SegmentedControl label={<code>delay</code>} value={delay} onValueChange={(value) => setDelay(String(value))}>
            <Segment value="0">0</Segment>
            <Segment value="400">400</Segment>
            <Segment value="1000">1000</Segment>
          </SegmentedControl>
          <Button variant="secondary" onClick={() => setRound((n) => n + 1)}>Show it again</Button>
        </div>
      }
    >
      <Skeleton key={`${round}-${delay}`} label="Loading applications…" delay={Number(delay)} className="flex w-64 items-center gap-3">
        <SkeletonItem shape="circle" className="size-10" />
        <SkeletonItem lines={2} className="text-small flex-1" />
      </Skeleton>
    </Inspect>
  );
}
