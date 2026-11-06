import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { expect, waitFor } from "storybook/test";
import { Button } from "../../components/Button";
import { AutoSkeleton } from "./AutoSkeleton";
import type { AutoSkeletonProps } from "./AutoSkeleton";
import { ApplicationList, ProfileForm, applications, placeholderApplications, placeholderProfile, profile } from "./sample";

/**
 * Wrap content in `<AutoSkeleton loading={…}>`, and while it loads it's drawn as a skeleton automatically: a gray bar
 * for every line of text and a gray box for every image, control, and badge, with each card keeping its own fill
 * and edge. Give the content placeholder data of a typical length while it loads; it's measured, never shown.
 */
const meta = {
  title: "Experiments/Auto skeleton",
  component: AutoSkeleton,
  args: { loading: true, label: "Loading applications…", delay: 0, children: null },
  argTypes: {
    delay: { control: { type: "number", min: 0, step: 100 } },
    children: { control: false },
  },
  render: (args) => (
    <div className="w-[34rem]">
      <AutoSkeleton {...args}>
        <ApplicationList applications={args.loading ? placeholderApplications : applications} />
      </AutoSkeleton>
    </div>
  ),
} satisfies Meta<typeof AutoSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Switch `loading` in the Controls panel: the same list, as a skeleton and loaded. */
export const Playground: Story = {};

/** A rect's position and size, rounded, for comparing an element with its shape */
function box(element: Element, origin: Element) {
  const rect = element.getBoundingClientRect();
  const base = origin.getBoundingClientRect();
  return [rect.left - base.left, rect.top - base.top, rect.width, rect.height].map((n) => Math.round(n));
}

/**
 * The loaded content beside its automatic skeleton, in all three themes: a list of cards, and a form. The skeleton
 * is drawn from the placeholder data, so its text lines are as long as the placeholder's.
 */
export const SideBySide: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="grid">
      {(["light", "dark", "hotdog"] as const).map((theme) => (
        <section key={theme} data-theme={theme} className="grid gap-6 p-8" style={{ background: "var(--bg)", color: "var(--ink)" }}>
          <h2 className="text-label">{theme === "hotdog" ? "Hot dog" : theme}</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <ApplicationList applications={applications} />
            <AutoSkeleton loading label={`Loading applications (${theme})…`}>
              <ApplicationList applications={placeholderApplications} />
            </AutoSkeleton>
            <ProfileForm profile={profile} />
            <AutoSkeleton loading label={`Loading your profile (${theme})…`}>
              <ProfileForm profile={placeholderProfile} />
            </AutoSkeleton>
          </div>
        </section>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const skeleton = canvasElement.querySelector<HTMLElement>("section[data-theme=light] .auto-skeleton")!;
    const content = skeleton.querySelector<HTMLElement>(".auto-skeleton__content")!;
    const overlay = skeleton.querySelector<HTMLElement>(".auto-skeleton__overlay")!;
    // The real content is there and laid out, but invisible and unreachable
    expect(content.querySelectorAll("li")).toHaveLength(3);
    expect(getComputedStyle(content).opacity).toBe("0");
    expect(content.inert).toBe(true);
    const button = content.querySelector("button")!;
    button.focus();
    expect(document.activeElement).not.toBe(button);

    await waitFor(() => expect(overlay.children.length).toBeGreaterThan(0));
    const drawn = [...overlay.children].map((shape) => ({ shape, at: box(shape, overlay).join() }));
    const at = (element: Element) => drawn.filter(({ at }) => at === box(element, overlay).join()).map(({ shape }) => shape);
    // Each card keeps its look as a frame; each badge, button, and avatar becomes one gray shape in its place
    for (const card of content.querySelectorAll("li")) {
      expect(at(card).map((shape) => shape.className)).toEqual(["auto-skeleton__frame"]);
    }
    for (const element of content.querySelectorAll(".badge, button, li > span")) {
      expect(at(element)[0]).toHaveClass("skeleton-item");
    }
    // Each line of text is one bar, however it wraps: the line of detail's <strong> joins the bar around it
    const bars = drawn
      .map(({ shape }) => shape as HTMLElement)
      .filter((shape) => shape.classList.contains("skeleton-item") && shape.style.borderRadius === "var(--radius-sm)");
    for (const text of content.querySelectorAll("li h3, li p")) {
      const rect = text.getBoundingClientRect();
      const lines = Math.round(rect.height / parseFloat(getComputedStyle(text).lineHeight));
      expect(lines).toBeGreaterThan(0);
      const inside = bars.filter((bar) => {
        const drawnBar = bar.getBoundingClientRect();
        return drawnBar.top >= rect.top && drawnBar.bottom <= rect.bottom && drawnBar.left >= rect.left - 1;
      });
      expect(inside).toHaveLength(lines);
    }
  },
};

/** A list that takes two seconds to load. The page passes `loading`, and the same list renders either way. */
export const Loading: Story = {
  render: (args) => <LoadDemo {...args} />,
};

function LoadDemo(props: AutoSkeletonProps) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, [loading]);
  return (
    <div className="grid w-[34rem] justify-items-start gap-4">
      <Button variant="secondary" onClick={() => setLoading(true)} disabled={loading}>
        Load again
      </Button>
      <div className="self-stretch">
        <AutoSkeleton {...props} loading={loading}>
          <ApplicationList applications={loading ? placeholderApplications : applications} />
        </AutoSkeleton>
      </div>
    </div>
  );
}
