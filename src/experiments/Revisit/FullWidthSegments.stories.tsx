import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Segment, SegmentedControl } from "@/components/SegmentedControl";
import { Option, Options, Themes } from "@/experiments/Revisit/Compare";
import "@/experiments/Revisit/full-width-segments.css";

const meta = {
  title: "Revisit/Full-width segmented control",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const frames = [
  ["phone", "Phone, 320px wide"],
  ["panel", "Side panel, 24rem wide"],
] as const;

/** Two, three, and four options, the last with one longer label, in a phone screen and in a side panel */
function Frames({ id }: { id: string }) {
  return (
    <>
      {frames.map(([frame, name]) => (
        <div key={frame} className="segments-frame" data-frame={frame}>
          <p className="segments-frame__name">{name}</p>
          <SegmentedControl label="Billing" name={`${id}-${frame}-billing`} defaultValue="monthly">
            <Segment value="monthly">Monthly</Segment>
            <Segment value="yearly">Yearly</Segment>
          </SegmentedControl>
          <SegmentedControl label="View" name={`${id}-${frame}-view`} defaultValue="list">
            <Segment value="list">List</Segment>
            <Segment value="board">Board</Segment>
            <Segment value="calendar">Calendar</Segment>
          </SegmentedControl>
          <SegmentedControl label="Date range" name={`${id}-${frame}-range`} defaultValue="week">
            <Segment value="day">Day</Segment>
            <Segment value="week">Week</Segment>
            <Segment value="month">Month</Segment>
            <Segment value="custom">Custom range</Segment>
          </SegmentedControl>
        </div>
      ))}
    </>
  );
}

/**
 * A SegmentedControl that hugs its options (today) and one that fills its container, at phone width (320px, with
 * a 16px gutter) and in a 24rem side panel, with two, three, and four options, in all three themes. Where the
 * options already reach the edge today (three and four at phone width, four in the panel), the two look the same,
 * and words break inside the narrow options. Settles "A full-width segmented control" in `docs/revisit.md`.
 */
export const SideBySide: Story = {
  render: () => (
    <Themes>
      {(theme) => (
        <Options>
          <Option
            title="Hugs its options (today)"
            note="As wide as its options need, every option as wide as the widest."
          >
            <Frames id={`${theme}-hug`} />
          </Option>
          <Option
            title="Fills its container"
            note="The track stretches to the container's width, and the options share it equally."
            className="segments-fill"
          >
            <Frames id={`${theme}-fill`} />
          </Option>
        </Options>
      )}
    </Themes>
  ),
  play: async ({ canvasElement }) => {
    // The options really differ: in the second, a two-option track is as wide as its control; in the first, narrower
    const [hug, fill] = [...canvasElement.querySelectorAll<HTMLElement>("section[data-theme=light] .compare-option")];
    const widths = (root: HTMLElement) => {
      const control = root.querySelector<HTMLElement>(".segmented-control")!;
      return [control.querySelector(".segmented-control__track")!.getBoundingClientRect().width, control.getBoundingClientRect().width];
    };
    const [hugTrack, hugControl] = widths(hug!);
    const [fillTrack, fillControl] = widths(fill!);
    await expect(hugTrack).toBeLessThan(hugControl!);
    await expect(fillTrack).toBe(fillControl);
  },
};
