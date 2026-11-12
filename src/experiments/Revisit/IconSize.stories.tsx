import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight, Download, Heart, LayoutGrid, List, Rows3 } from "lucide-react";
import { expect } from "storybook/test";
import { Button } from "@/components/Button";
import { Segment, SegmentedControl } from "@/components/SegmentedControl";
import { Option, Options, Themes } from "@/experiments/Revisit/Compare";
import "@/experiments/Revisit/icon-size.css";

const meta = {
  title: "Revisit/Icon size in large controls",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Large buttons and segments with icons, plus a medium row for scale */
function Controls({ id }: { id: string }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" iconStart={<Download />}>Download résumé</Button>
        <Button size="lg" variant="secondary" iconEnd={<ArrowRight />}>Next project</Button>
        <Button size="lg" variant="ghost" iconOnly aria-label="Add to favorites"><Heart /></Button>
        <Button size="lg" variant="secondary" iconOnly aria-label="Add to favorites"><Heart /></Button>
      </div>
      <SegmentedControl size="lg" label="View" name={`${id}-view`} defaultValue="list">
        <Segment value="list" iconStart={<List />}>List</Segment>
        <Segment value="grid" iconStart={<LayoutGrid />}>Grid</Segment>
        <Segment value="rows" iconEnd={<Rows3 />}>Rows</Segment>
      </SegmentedControl>
      <SegmentedControl size="lg" aria-label="Icon-only view" name={`${id}-icons`} defaultValue="grid">
        <Segment value="list" iconOnly aria-label="List"><List /></Segment>
        <Segment value="grid" iconOnly aria-label="Grid"><LayoutGrid /></Segment>
        <Segment value="rows" iconOnly aria-label="Rows"><Rows3 /></Segment>
      </SegmentedControl>
      <div className="grid gap-2">
        <p className="compare-option__note">Medium, for scale (the same in both)</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button iconStart={<Download />}>Download résumé</Button>
          <Button variant="ghost" iconOnly aria-label="Add to favorites"><Heart /></Button>
        </div>
      </div>
    </>
  );
}

/**
 * Large buttons and segmented controls with `icon-md` (20px, today) and `icon-lg` (24px, as
 * `docs/brand/iconography.md` asks), with icons before and after the label and icon-only, in all three themes.
 * Settles "Icon size in large buttons and segments" in `docs/revisit.md`.
 */
export const SideBySide: Story = {
  render: () => (
    <Themes>
      {(theme) => (
        <Options>
          <Option title="icon-md, 20px (today)" note="The same size as in medium buttons.">
            <Controls id={`${theme}-md`} />
          </Option>
          <Option title="icon-lg, 24px" note="What iconography.md says large buttons use." className="icon-lg">
            <Controls id={`${theme}-lg`} />
          </Option>
        </Options>
      )}
    </Themes>
  ),
  play: async ({ canvasElement }) => {
    // The two options really differ: 20px icons in the first, 24px in the second
    const [md, lg] = [...canvasElement.querySelectorAll<HTMLElement>("section[data-theme=light] .compare-option")];
    const width = (root: HTMLElement, selector: string) => root.querySelector(selector)!.getBoundingClientRect().width;
    await expect(width(md!, ".button__icon")).toBe(20);
    await expect(width(lg!, ".button__icon")).toBe(24);
    await expect(width(lg!, ".segment__icon")).toBe(24);
  },
};
