import type { Meta, StoryObj } from "@storybook/react-vite";
import { Check, LayoutGrid, List, Monitor, Moon, Rows3, Sun } from "lucide-react";
import { useState } from "react";
import { expect } from "storybook/test";
import { Segment, SegmentedControl } from "../../components/SegmentedControl";
import { Option, Options, Themes } from "./Compare";
import "./chosen-segment.css";

const meta = {
  title: "Revisit/How a chosen segment stands out",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const themeIcons = { light: <Sun />, dark: <Moon />, system: <Monitor /> };

/** Text options, options with icons, and icon-only options, each one click away from a different choice */
function Controls({ id }: { id: string }) {
  return (
    <>
      <SegmentedControl label="Billing" name={`${id}-billing`} defaultValue="monthly">
        <Segment value="monthly">Monthly</Segment>
        <Segment value="yearly">Yearly</Segment>
        <Segment value="lifetime">Lifetime</Segment>
      </SegmentedControl>
      <SegmentedControl label="Theme" name={`${id}-theme`} defaultValue="dark">
        <Segment value="light" iconStart={themeIcons.light}>
          Light
        </Segment>
        <Segment value="dark" iconStart={themeIcons.dark}>
          Dark
        </Segment>
        <Segment value="system" iconStart={themeIcons.system}>
          System
        </Segment>
      </SegmentedControl>
      <SegmentedControl label="View" name={`${id}-view`} defaultValue="grid">
        <Segment value="list" iconOnly aria-label="List">
          <List />
        </Segment>
        <Segment value="grid" iconOnly aria-label="Grid">
          <LayoutGrid />
        </Segment>
        <Segment value="rows" iconOnly aria-label="Rows">
          <Rows3 />
        </Segment>
      </SegmentedControl>
    </>
  );
}

/**
 * Today's fill plus a check mark before the chosen label. The check follows clicks, so the controls are controlled.
 * With an icon, the check takes the icon's place, as in Material's segmented buttons.
 */
function CheckControls({ id }: { id: string }) {
  const [billing, setBilling] = useState("monthly");
  const [theme, setTheme] = useState<keyof typeof themeIcons>("dark");
  const check = <Check />;

  return (
    <>
      <SegmentedControl label="Billing" name={`${id}-billing`} value={billing} onValueChange={setBilling}>
        {(["monthly", "yearly", "lifetime"] as const).map((value) => (
          <Segment key={value} value={value} iconStart={billing === value ? check : undefined}>
            {value[0]!.toUpperCase() + value.slice(1)}
          </Segment>
        ))}
      </SegmentedControl>
      <SegmentedControl
        label="Theme"
        name={`${id}-theme`}
        value={theme}
        onValueChange={(value) => setTheme(value as keyof typeof themeIcons)}
      >
        {(["light", "dark", "system"] as const).map((value) => (
          <Segment key={value} value={value} iconStart={theme === value ? check : themeIcons[value]}>
            {value[0]!.toUpperCase() + value.slice(1)}
          </Segment>
        ))}
      </SegmentedControl>
    </>
  );
}

/**
 * Three ways to show which segment is chosen: an `action` fill with a bold label and thicker icon lines (today), an
 * `ink` fill with `bg`-colored text, still bold, and today's fill with a check mark before the chosen label. Each
 * shows text options, options with icons, and icon-only options (except the check mark: see its note), in all three
 * themes. Click through them. Settles "How a chosen segment stands out" in `docs/revisit.md`.
 */
export const SideBySide: Story = {
  render: () => (
    <Themes>
      {(theme) => (
        <Options>
          <Option
            title="Action fill and bold (today)"
            note="The bold label and thicker icon lines are the cue that doesn't rely on color."
          >
            <Controls id={`${theme}-today`} />
          </Option>
          <Option
            title="Ink fill and bold"
            note="The fill takes the text color and the label the page color: dark in light mode, light in dark mode. It has the strongest contrast with the track in every theme."
            className="chosen-ink"
          >
            <Controls id={`${theme}-ink`} />
          </Option>
          <Option
            title="Action fill and a check mark"
            note="A check before the chosen label, in place of its icon if it has one, as Material does. Not shown for icon-only options: there's no room for a second icon, and swapping the icon for a check would hide what the option means, so they would keep today's bold lines. The check widens the chosen option, so the track grows when the longest one is chosen."
          >
            <CheckControls id={`${theme}-check`} />
          </Option>
        </Options>
      )}
    </Themes>
  ),
  play: async ({ canvasElement, canvas, userEvent }) => {
    const [today, ink, check] = [...canvasElement.querySelectorAll<HTMLElement>("section[data-theme=light] .compare-option")];
    const chosen = (root: HTMLElement) => getComputedStyle(root.querySelector('.segment__button[aria-checked="true"]')!);

    // The ink option really differs from today: a different fill, with the label in the page color
    await expect(chosen(ink!).backgroundColor).not.toBe(chosen(today!).backgroundColor);
    await expect(chosen(ink!).color).toBe(getComputedStyle(canvasElement.querySelector("section[data-theme=light]")!).backgroundColor);

    // The check mark follows the choice
    await expect(check!.querySelectorAll(".segment__button[aria-checked=true] .lucide-check")).toHaveLength(2);
    const [yearly] = canvas.getAllByRole("radio", { name: "Yearly" }).filter((radio) => check!.contains(radio));
    await userEvent.click(yearly!);
    await expect(yearly).toHaveAttribute("aria-checked", "true");
    await expect(yearly!.querySelector(".lucide-check")).not.toBeNull();
    await expect(check!.querySelectorAll(".lucide-check")).toHaveLength(2);
  },
};
