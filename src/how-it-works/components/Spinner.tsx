import { useState } from "react";
import { Button } from "@/components/Button";
import { Segment, SegmentedControl } from "@/components/SegmentedControl";
import { Spinner } from "@/components/Spinner";
import { Inspect } from "@/how-it-works/Inspect";

/* Live demos for Spinner's "How it works" page. Every one renders the real Spinner, styled by the real spinner.css. */

/**
 * Shows the spinner appearing, again on demand, so the HTML below it shows each step: the visible label hidden from
 * screen readers as soon as JavaScript runs, and the status region getting its text a moment later.
 */
export function Appearing() {
  const [round, setRound] = useState(0);
  const [delay, setDelay] = useState("0");
  return (
    <Inspect
      hint="Press the button and watch the HTML: aria-hidden lands on the visible label straight away, and the label's words arrive in the status region a moment later."
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
      <Spinner key={`${round}-${delay}`} label="Loading applications…" delay={Number(delay)} />
    </Inspect>
  );
}
