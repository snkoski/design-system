import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Skeleton } from "@/components/Skeleton/Skeleton";
import { SkeletonItem } from "@/components/Skeleton/SkeletonItem";

const meta = {
  title: "Components/Skeleton item",
  component: SkeletonItem,
  args: { shape: "text", lines: 3 },
  argTypes: {
    shape: { control: "inline-radio", options: ["text", "box", "circle"] },
    lines: { control: { type: "number", min: 1, max: 8 }, if: { arg: "shape", eq: "text" } },
  },
  render: (args) => (
    <Skeleton label="Loading applications…" className="w-72">
      <SkeletonItem {...(args.shape === "text" ? args : { shape: args.shape })} className={args.shape === "box" ? "h-24" : args.shape === "circle" ? "size-12" : "text-body"} />
    </Skeleton>
  ),
} satisfies Meta<typeof SkeletonItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change the shape and number of lines in the Controls panel. Shapes always go inside a `Skeleton`. */
export const Playground: Story = {};

/** Each shape on its own, in all three themes. Chromatic snapshots this one. */
export const AllThemes: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="grid">
      {(["light", "dark", "hotdog"] as const).map((theme) => (
        <section key={theme} data-theme={theme} className="grid gap-4 p-8" style={{ background: "var(--bg)", color: "var(--ink)" }}>
          <h2 className="text-label">{theme === "hotdog" ? "Hot dog" : theme}</h2>
          <Skeleton label="Loading applications…" className="flex flex-wrap items-start gap-8">
            <SkeletonItem lines={2} className="text-body w-48" />
            <SkeletonItem shape="box" className="h-16 w-32" />
            <SkeletonItem shape="circle" className="size-10" />
          </Skeleton>
        </section>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const items = canvasElement.querySelectorAll(".skeleton-item");
    expect(items).toHaveLength(9);
    items.forEach((item) => expect(item).toHaveAttribute("aria-hidden", "true"));
  },
};
