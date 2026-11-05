import { useState } from "react";
import { Segment, SegmentedControl } from "../../components/SegmentedControl";
import { Separator } from "../../components/Separator";
import { Inspect } from "../Inspect";

/* Live demos for Separator's "How it works" page. Every one renders the real Separator, styled by the real separator.css. */

type Kind = "horizontal" | "vertical" | "label";

/** One separator at a time, so the HTML below it shows the element and attributes change: <hr> without a label, <div> with one. */
export function Kinds() {
  const [kind, setKind] = useState<Kind>("horizontal");
  return (
    <Inspect
      hint="Switch between them and watch the HTML: the element is an <hr> until there's a label, and aria-orientation follows the orientation prop."
      controls={
        <SegmentedControl label="Show" value={kind} onValueChange={(value) => setKind(value as Kind)}>
          <Segment value="horizontal">Horizontal</Segment>
          <Segment value="vertical">Vertical</Segment>
          <Segment value="label">With a label</Segment>
        </SegmentedControl>
      }
    >
      {kind === "vertical" ? (
        <div className="flex items-center gap-4">
          <span>Applications</span>
          <Separator orientation="vertical" />
          <span>Contacts</span>
        </div>
      ) : (
        <div className="w-64">
          <Separator label={kind === "label" ? "or" : undefined} />
        </div>
      )}
    </Inspect>
  );
}
