import type { Meta, StoryObj } from "@storybook/react-vite";
import { Download } from "lucide-react";
import { expect } from "storybook/test";
import { Button } from "../../components/Button";
import { Option, Options, Themes } from "./Compare";
import "./secondary-background.css";

const meta = {
  title: "Revisit/Secondary button background",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const grounds = [
  ["bg", "On the page (bg)"],
  ["surface", "On a card (surface)"],
  ["surface-tint", "On a tinted panel (surface-tint)"],
] as const;

/** Secondary buttons in every size, with and without an icon, next to a primary button, on each ground */
function Grounds() {
  return (
    <>
      {grounds.map(([ground, name]) => (
        <div key={ground} className="secondary-ground w-full" data-ground={ground}>
          <p className="secondary-ground__name">{name}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Save changes</Button>
            <Button variant="secondary">Cancel</Button>
            <Button variant="secondary" iconStart={<Download />}>
              Export
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm">
              Small
            </Button>
            <Button variant="secondary">Medium</Button>
            <Button variant="secondary" size="lg">
              Large
            </Button>
          </div>
        </div>
      ))}
    </>
  );
}

/**
 * Secondary buttons with a `surface` background (today, `button.css`) and a `transparent` one (the CSS example on
 * the Building page), on the page, on a card, and on a tinted panel, next to a primary button, in all three themes.
 * Hover a button to see its hover fill on each ground. Settles "The secondary button's background in the Building
 * page" in `docs/revisit.md`.
 */
export const OnEveryGround: Story = {
  render: () => (
    <Themes>
      {() => (
        <Options>
          <Option title="surface (today)" note="What button.css does. The button is a card-colored chip, whatever it sits on.">
            <Grounds />
          </Option>
          <Option
            title="transparent"
            note="What the Building page shows. The ground shows through, so only the edge draws the button."
            className="secondary-transparent"
          >
            <Grounds />
          </Option>
        </Options>
      )}
    </Themes>
  ),
  play: async ({ canvasElement }) => {
    // The two options really differ: the secondary button on a tinted panel is surface-colored in the first, clear in the second
    const [today, clear] = [...canvasElement.querySelectorAll<HTMLElement>("section[data-theme=light] .compare-option")];
    const fill = (root: HTMLElement) =>
      getComputedStyle(root.querySelector('[data-ground="surface-tint"] .button[data-variant="secondary"]')!).backgroundColor;
    await expect(fill(today!)).not.toBe("rgba(0, 0, 0, 0)");
    await expect(fill(clear!)).toBe("rgba(0, 0, 0, 0)");
  },
};
