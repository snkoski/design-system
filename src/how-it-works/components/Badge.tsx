import { Check, Clock, TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/Badge";
import type { BadgeSize, BadgeTone } from "@/components/Badge";
import { Checkbox } from "@/components/Checkbox";
import { Segment, SegmentedControl } from "@/components/SegmentedControl";
import { Inspect } from "@/how-it-works/Inspect";

/* Live demos for Badge's "How it works" page. Every one renders the real Badge, styled by the real badge.css. */

const examples = {
  neutral: { words: "Applied", icon: <Clock /> },
  success: { words: "Offer", icon: <Check /> },
  warning: { words: "Needs review", icon: <TriangleAlert /> },
  danger: { words: "Rejected", icon: <X /> },
} as const;

/** One badge, with its tone, size, and icon switched from controls, so the HTML below it shows each prop become an attribute. */
export function Props() {
  const [tone, setTone] = useState<BadgeTone>("success");
  const [size, setSize] = useState<BadgeSize>("md");
  const [icon, setIcon] = useState(true);
  const example = examples[tone];
  return (
    <Inspect
      hint="Change the tone and size and watch data-tone and data-size change. Turn the icon off and its span disappears."
      controls={
        <div className="flex flex-wrap items-end gap-4">
          <SegmentedControl label="tone" value={tone} onValueChange={(value) => setTone(value as BadgeTone)}>
            <Segment value="neutral">neutral</Segment>
            <Segment value="success">success</Segment>
            <Segment value="warning">warning</Segment>
            <Segment value="danger">danger</Segment>
          </SegmentedControl>
          <SegmentedControl label="size" value={size} onValueChange={(value) => setSize(value as BadgeSize)}>
            <Segment value="sm">sm</Segment>
            <Segment value="md">md</Segment>
          </SegmentedControl>
          <Checkbox checked={icon} onCheckedChange={setIcon}>
            Show an icon
          </Checkbox>
        </div>
      }
    >
      <Badge tone={tone} size={size} icon={icon ? example.icon : undefined}>
        {example.words}
      </Badge>
    </Inspect>
  );
}
