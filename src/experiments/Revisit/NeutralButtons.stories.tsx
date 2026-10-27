import type { Meta, StoryObj } from "@storybook/react-vite";
import { UserPlus } from "lucide-react";
import { expect } from "storybook/test";
import { Button } from "../../components/Button";
import { Checkbox } from "../../components/Checkbox";
import { Radio, RadioGroup } from "../../components/RadioGroup";
import { Segment, SegmentedControl } from "../../components/SegmentedControl";
import { Switch } from "../../components/Switch";
import { Option, Options, Themes } from "./Compare";
import "./neutral-buttons.css";

const meta = {
  title: "Revisit/Neutral buttons",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** A small page in the brand colors, with every kind of button and the choice controls. `id` keeps names unique. */
function Page({ id }: { id: string }) {
  return (
    <div className="neutral-page">
      <div className="neutral-page__part" data-ground="action">
        <h4 className="neutral-page__heading">Plan your week</h4>
        <p className="neutral-page__text">Add tasks, set reminders, and see the whole week at a glance.</p>
        <div className="flex flex-wrap gap-3">
          <Button>Get started</Button>
          <Button variant="secondary">See pricing</Button>
        </div>
      </div>
      <div className="neutral-page__part" data-ground="surface-tint">
        <span className="neutral-page__badge">New</span>
        <p className="neutral-page__text">Shared lists are here. Invite someone to plan with you.</p>
        <Button variant="ghost" iconStart={<UserPlus />}>
          Invite someone
        </Button>
      </div>
      <form className="neutral-page__part" data-ground="surface" onSubmit={(event) => event.preventDefault()}>
        <h4 className="neutral-page__heading">Settings</h4>
        <div className="grid gap-1">
          <Checkbox defaultChecked>Email me a weekly summary</Checkbox>
          <Switch defaultChecked>Send reminders</Switch>
        </div>
        <RadioGroup label="Week starts on" name={`${id}-start`} defaultValue="monday">
          <Radio value="sunday">Sunday</Radio>
          <Radio value="monday">Monday</Radio>
        </RadioGroup>
        <SegmentedControl label="View" name={`${id}-view`} defaultValue="week">
          <Segment value="day">Day</Segment>
          <Segment value="week">Week</Segment>
          <Segment value="month">Month</Segment>
        </SegmentedControl>
        <div className="flex flex-wrap gap-3">
          <Button type="submit">Save changes</Button>
          <Button variant="ghost">Cancel</Button>
        </div>
      </form>
    </div>
  );
}

/**
 * Today's tangerine buttons and controls next to neutral ones, on a small page that uses the brand colors for its
 * layout: a hero band in the action color, a tinted card, and a settings card. The middle option makes only buttons
 * neutral; the last makes the choice controls neutral too. All three themes. Hover the buttons to see their hover
 * fills. Settles "Neutral buttons, with the brand colors in the layout" in `docs/revisit.md`.
 */
export const InAPage: Story = {
  render: () => (
    <Themes>
      {(theme) => (
        <Options>
          <Option title="Brand-colored (today)" note="Buttons and checked controls use the action color. A primary button on the hero band is the band's own color.">
            <Page id={`${theme}-today`} />
          </Option>
          <Option title="Neutral buttons" note="Buttons are ink and surface; checked controls keep the action color." className="neutral-buttons">
            <Page id={`${theme}-buttons`} />
          </Option>
          <Option title="Neutral buttons and controls" note="Checked controls are ink too, so the brand colors are only in the layout." className="neutral-buttons neutral-controls">
            <Page id={`${theme}-all`} />
          </Option>
        </Options>
      )}
    </Themes>
  ),
  play: async ({ canvasElement }) => {
    // The options really differ: the primary button and the ticked checkbox are ink only where they should be
    const light = canvasElement.querySelector<HTMLElement>("section[data-theme=light]")!;
    const ink = getComputedStyle(light).color;
    const [today, buttons, all] = [...light.querySelectorAll<HTMLElement>(".compare-option")];
    const fill = (option: HTMLElement, selector: string) => getComputedStyle(option.querySelector(selector)!).backgroundColor;
    const primary = '.button[data-variant="primary"][type="submit"]';
    const ticked = '.checkbox__box[aria-checked="true"]';
    await expect(fill(today!, primary)).not.toBe(ink);
    await expect(fill(buttons!, primary)).toBe(ink);
    await expect(fill(all!, primary)).toBe(ink);
    await expect(fill(today!, ticked)).not.toBe(ink);
    await expect(fill(buttons!, ticked)).toBe(fill(today!, ticked));
    await expect(fill(all!, ticked)).toBe(ink);
  },
};
