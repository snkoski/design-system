import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { LayoutGrid, List, Sparkles } from "lucide-react";
import { expect } from "storybook/test";
import { Segment } from "@/components/SegmentedControl/Segment";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";

/** A Segment only works inside a SegmentedControl, so stories render one around it, unless they bring their own. */
const inControl: Decorator = (Story, { parameters }) =>
  parameters.ownControls ? (
    <Story />
  ) : (
    <SegmentedControl aria-label="Billing" defaultValue={parameters.controlValue as string | undefined}>
      <Story />
    </SegmentedControl>
  );

/** The px value of a length token, measured in the browser. Pass a parent to see its `data-pointer`. */
function measure(token: string, parent: HTMLElement = document.body) {
  const probe = document.createElement("div");
  probe.style.height = `var(${token})`;
  parent.append(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height;
}

const meta = {
  title: "Components/Segment",
  component: Segment,
  decorators: [inControl],
  args: {
    value: "yearly",
    children: "Yearly",
    disabled: false,
  },
  argTypes: {
    ref: { control: false },
    iconStart: { control: false },
    iconEnd: { control: false },
  },
} satisfies Meta<typeof Segment>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel. The option sits in a SegmentedControl, which owns its chosen state. */
export const Playground: Story = {};

/** Not chosen, chosen, and disabled. The chosen option has a border, so the state never relies on color alone. */
export const States: Story = {
  parameters: { controlValue: "yearly" },
  render: () => (
    <>
      <Segment value="monthly">Not chosen</Segment>
      <Segment value="yearly">Chosen</Segment>
      <Segment value="lifetime" disabled>
        Disabled
      </Segment>
    </>
  ),
};

/** Icons before the label, after it, or both. They're decorative: the label names the option. */
export const WithIcons: Story = {
  parameters: { controlValue: "list" },
  render: () => (
    <>
      <Segment value="list" iconStart={<List />}>
        Icon before
      </Segment>
      <Segment value="grid" iconEnd={<LayoutGrid />}>
        Icon after
      </Segment>
      <Segment value="both" iconStart={<Sparkles />} iconEnd={<Sparkles />}>
        Both
      </Segment>
    </>
  ),
};

/**
 * An icon-only option needs an `aria-label`. It's still at least `target-min` wide and tall: 24px with a mouse,
 * 44px on touch. The story checks both.
 */
export const IconOnly: Story = {
  parameters: { controlValue: "grid" },
  render: () => (
    <>
      <Segment value="list" iconOnly aria-label="List">
        <List />
      </Segment>
      <Segment value="grid" iconOnly aria-label="Grid">
        <LayoutGrid />
      </Segment>
    </>
  ),
  play: async ({ canvas, canvasElement }) => {
    const check = async (floor: number) => {
      const target = measure("--target-min", canvasElement);
      await expect(target).toBeGreaterThanOrEqual(floor);
      const track = canvas.getByRole("radiogroup").querySelector(".segmented-control__track")!.getBoundingClientRect();
      await expect(track.height).toBeGreaterThanOrEqual(target);
      for (const name of ["List", "Grid"]) {
        const option = canvas.getByRole("radio", { name });
        const box = option.getBoundingClientRect();
        await expect(box.width).toBeGreaterThanOrEqual(target);
        // The hit area reaches over the track's edge, so the option is a target from the track's top to its bottom
        const x = box.left + box.width / 2;
        await expect(option.contains(document.elementFromPoint(x, track.top + 0.5))).toBe(true);
        await expect(option.contains(document.elementFromPoint(x, track.bottom - 0.5))).toBe(true);
      }
    };
    // With a mouse, target-min is 24px
    await check(24);
    // On touch, target-min is 44px, and the track grows to meet it
    canvasElement.dataset.pointer = "coarse";
    try {
      await check(44);
    } finally {
      delete canvasElement.dataset.pointer;
    }
  },
};

/** A disabled option can't be chosen, and the arrow keys skip it. */
export const Disabled: Story = {
  args: { disabled: true },
};

function Matrix() {
  return (
    <div className="grid gap-4">
      <SegmentedControl aria-label="Billing" defaultValue="yearly">
        <Segment value="monthly">Not chosen</Segment>
        <Segment value="yearly">Chosen</Segment>
        <Segment value="lifetime" disabled>
          Disabled
        </Segment>
      </SegmentedControl>
      <SegmentedControl aria-label="View" defaultValue="list">
        <Segment value="list" iconStart={<List />}>
          Chosen
        </Segment>
        <Segment value="grid" iconEnd={<LayoutGrid />}>
          Not chosen
        </Segment>
      </SegmentedControl>
      <SegmentedControl aria-label="Icon-only view" defaultValue="grid">
        <Segment value="list" iconOnly aria-label="List">
          <List />
        </Segment>
        <Segment value="grid" iconOnly aria-label="Grid">
          <LayoutGrid />
        </Segment>
      </SegmentedControl>
    </div>
  );
}

/** Every state in all three themes at once. Chromatic snapshots this one. */
export const AllThemes: Story = {
  parameters: { layout: "fullscreen", ownControls: true },
  render: () => (
    <div className="grid">
      {(["light", "dark", "hotdog"] as const).map((theme) => (
        <section key={theme} data-theme={theme} className="grid gap-4 p-8" style={{ background: "var(--bg)", color: "var(--ink)" }}>
          <h2 className="text-label">{theme === "hotdog" ? "Hot dog" : theme}</h2>
          <Matrix />
        </section>
      ))}
    </div>
  ),
};
