import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { expect, waitFor } from "storybook/test";
import { Button } from "../Button";
import { Spinner } from "./Spinner";
import type { SpinnerProps } from "./Spinner";

/** The px value of a length token, measured in the browser */
function measure(token: string, parent: HTMLElement) {
  const probe = document.createElement("div");
  probe.style.width = `var(${token})`;
  parent.append(probe);
  const width = probe.getBoundingClientRect().width;
  probe.remove();
  return width;
}

/** A time token in seconds, as the browser reads it, from a probe inside `parent` (so data-motion reaches it) */
function seconds(token: string, parent: Element) {
  const probe = document.createElement("div");
  probe.style.transitionDuration = `var(${token})`;
  parent.append(probe);
  const value = getComputedStyle(probe).transitionDuration;
  probe.remove();
  return value;
}

const meta = {
  title: "Components/Spinner",
  component: Spinner,
  args: {
    label: "Loading applications…",
    size: "md",
    hideLabel: false,
    delay: 0,
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    delay: { control: { type: "number", min: 0, step: 100 } },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel. */
export const Playground: Story = {};

/** Every size, with the label shown and hidden. The label is small text at `sm` and body text at `md` and `lg`. */
export const States: Story = {
  render: () => <Matrix />,
  play: async ({ canvasElement }) => {
    const drawings = [...canvasElement.querySelectorAll<SVGElement>(".spinner__graphic")];
    expect(drawings).toHaveLength(6);
    // The icon tokens, measured rather than written down, so a token change can't break the check
    const widths = drawings.slice(0, 3).map((svg) => svg.getBoundingClientRect().width);
    const tokens = ["--icon-sm", "--icon-md", "--icon-lg"].map((token) => measure(token, canvasElement));
    expect(widths).toEqual(tokens);
    expect(tokens[0]).toBeGreaterThan(0);
    expect(tokens[0]).toBeLessThan(tokens[1]!);
    expect(tokens[1]).toBeLessThan(tokens[2]!);
  },
};

/**
 * Pressing the button loads for two seconds. With a `delay`, the spinner stays invisible and silent until the delay
 * is over, then fades in and is announced, so a load that finishes sooner never flashes it. Try a delay longer than
 * two seconds: the spinner never appears. This is also the story to test with a screen reader: press the button and
 * listen for the label, once.
 */
export const Delay: Story = {
  args: { delay: 400 },
  render: (args) => <LoadDemo {...args} />,
  play: async ({ canvas, userEvent, canvasElement }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Load applications" }));
    const spinner = canvasElement.querySelector<HTMLElement>(".spinner");
    expect(spinner).toBeInTheDocument();
    expect(Number(getComputedStyle(spinner!).opacity)).toBeLessThan(1);
    expect(canvas.getByRole("status")).toHaveTextContent("");
    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("Loading applications…"));
    await waitFor(() => expect(getComputedStyle(spinner!).opacity).toBe("1"));
  },
};

/**
 * Where there's no room for words, `hideLabel` hides them from view. Screen readers still announce the label, so
 * it still says what's loading.
 */
export const HiddenLabel: Story = {
  args: { hideLabel: true, size: "sm", label: "Loading contacts…" },
  render: (args) => (
    <div className="flex items-center gap-2">
      <h2 className="text-label">Contacts</h2>
      <Spinner {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const label = canvasElement.querySelector(".spinner__label");
    expect(label).toHaveTextContent("Loading contacts…");
    const box = label!.getBoundingClientRect();
    expect(box.width).toBeLessThanOrEqual(1);
    expect(box.height).toBeLessThanOrEqual(1);
  },
};

/**
 * With reduced motion, the spinner turns more slowly (one turn every 1.6 seconds instead of 0.7) but never stops,
 * so it still shows that something is happening. The right one is set to reduced motion with `data-motion`.
 */
export const ReducedMotion: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-8">
      <div data-motion="full">
        <Spinner {...args} label="Loading applications…" />
      </div>
      <div data-motion="reduced">
        <Spinner {...args} label="Loading contacts…" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const drawings = [...canvasElement.querySelectorAll(".spinner__graphic")];
    expect(drawings).toHaveLength(2);
    const [full, reduced] = drawings.map((svg) => getComputedStyle(svg)) as [CSSStyleDeclaration, CSSStyleDeclaration];
    expect(full.animationName).toBe("spinner-spin");
    expect(reduced.animationName).toBe("spinner-spin");
    // Each turns once per --duration-loop, as its own data-motion sets it, and reduced is slower
    expect(full.animationDuration).toBe(seconds("--duration-loop", drawings[0]!.parentElement!));
    expect(reduced.animationDuration).toBe(seconds("--duration-loop", drawings[1]!.parentElement!));
    expect(parseFloat(reduced.animationDuration)).toBeGreaterThan(parseFloat(full.animationDuration));
  },
};

/** Every size and state in all three themes at once. Chromatic snapshots this one. */
export const AllThemes: Story = {
  parameters: { layout: "fullscreen" },
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

function Matrix() {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-8">
        <Spinner size="sm" label="Loading applications…" />
        <Spinner size="md" label="Loading applications…" />
        <Spinner size="lg" label="Loading applications…" />
      </div>
      <div className="flex flex-wrap items-center gap-8">
        <Spinner size="sm" hideLabel label="Loading contacts…" />
        <Spinner size="md" hideLabel label="Loading contacts…" />
        <Spinner size="lg" hideLabel label="Loading contacts…" />
      </div>
    </div>
  );
}

/** A list that takes two seconds to load, the way a page waits for its data */
function LoadDemo(props: SpinnerProps) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  useEffect(() => {
    if (state !== "loading") return;
    const timer = setTimeout(() => setState("done"), 2000);
    return () => clearTimeout(timer);
  }, [state]);
  return (
    // A fixed width, so the centered story doesn't shift sideways when "Loading applications…" turns into the shorter result
    <div className="grid w-64 justify-items-start gap-4">
      <Button variant="secondary" onClick={() => setState("loading")}>Load applications</Button>
      {/* The spinner stays outside any aria-busy element, which could hold back its announcement */}
      <div className="min-h-12">
        {state === "loading" && <Spinner {...props} />}
        {state === "done" && <p>3 applications</p>}
      </div>
    </div>
  );
}
