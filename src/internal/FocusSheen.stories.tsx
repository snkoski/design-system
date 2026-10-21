import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { expect } from "storybook/test";
import { Button, ButtonLink } from "../components/Button";
import { Checkbox } from "../components/Checkbox";
import { Input } from "../components/Input";
import { Radio, RadioGroup } from "../components/RadioGroup";
import { Switch } from "../components/Switch";

const eases = {
  "ease-in-out (now)": "var(--ease-in-out)",
  "ease-out": "var(--ease-out)",
  "ease-in": "var(--ease-in)",
  "ease-bounce": "var(--ease-bounce)",
  linear: "linear",
} as const;

interface SheenArgs {
  /** How long one sweep takes, in milliseconds. Now: 320, the longest the motion rules allow. */
  duration: number;
  /** The easing curve of the sweep. */
  ease: keyof typeof eases;
}

/** Overrides the sheen's speed and easing for everything inside, through sheen.css's custom properties */
const sheenStyle = (duration: number, ease: keyof typeof eases) =>
  ({ "--sheen-duration": `${duration}ms`, "--sheen-ease": eases[ease] }) as CSSProperties;

/**
 * When a control gets keyboard focus, a band of light sweeps across it once. Press Tab to move through the
 * controls and watch it. It's decoration: the focus outline still shows where focus is. With reduced motion
 * it doesn't appear at all.
 */
const meta: Meta<SheenArgs> = {
  title: "Effects/Focus sheen",
  parameters: { layout: "fullscreen" },
  args: { duration: 320, ease: "ease-in-out (now)" },
  argTypes: {
    duration: { control: { type: "range", min: 100, max: 2000, step: 20 } },
    ease: { control: "select", options: Object.keys(eases) },
  },
};

export default meta;
type Story = StoryObj<SheenArgs>;

const noControls = { controls: { disable: true } };

function Controls({ name }: { name: string }) {
  return (
    <div className="grid justify-items-start gap-4">
      <div className="flex flex-wrap gap-3">
        <Button>Save changes</Button>
        <Button variant="secondary">Cancel</Button>
        <Button variant="ghost">Skip</Button>
        <ButtonLink href="#plans" variant="secondary">
          See plans
        </ButtonLink>
      </div>
      <Checkbox defaultChecked>Email me about new projects</Checkbox>
      <Checkbox>Send me a copy</Checkbox>
      <Switch defaultChecked>Share my portfolio</Switch>
      <RadioGroup label="Plan" name={`${name}-plan`} defaultValue="team">
        <Radio value="free">Free</Radio>
        <Radio value="team">Team</Radio>
      </RadioGroup>
      <Input label="Email" className="w-72" />
    </div>
  );
}

/** Pauses the sheen on a control halfway through its sweep and returns how visible the band is there */
function opacityHalfway(host: Element) {
  const animation = document.getAnimations().find((candidate) => {
    const effect = candidate.effect as KeyframeEffect | null;
    return effect?.target === host && effect.pseudoElement === "::before";
  });
  if (!animation) return null;
  animation.pause();
  animation.currentTime = Number(animation.effect!.getComputedTiming().duration) / 2;
  return Number(getComputedStyle(host, "::before").opacity);
}

/** Change the speed and easing in the Controls panel, then click the page and press Tab to watch each control. */
export const Playground: Story = {
  render: ({ duration, ease }) => (
    <div className="grid gap-4 p-8" style={{ background: "var(--bg)", color: "var(--ink)", ...sheenStyle(duration, ease) }}>
      <p className="text-small">
        Sweep: {duration}ms, {ease}
      </p>
      <Controls name="playground" />
    </div>
  ),
};

/** The same controls at fixed speeds, slowest last. Tab down through the rows to compare. */
export const Speeds: Story = {
  parameters: noControls,
  render: () => (
    <div className="grid gap-6 p-8" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      {[200, 320, 500, 800, 1200].map((duration) => (
        <section key={duration} className="grid gap-2" style={sheenStyle(duration, "ease-in-out (now)")}>
          <h2 className="text-label">
            {duration}ms{duration === 320 ? " (now)" : ""}
          </h2>
          <div className="flex flex-wrap items-center gap-6">
            <Button>Save changes</Button>
            <Checkbox defaultChecked>Ticked</Checkbox>
            <Switch defaultChecked>On</Switch>
            <Input aria-label={`Email, ${duration}ms`} placeholder="Email" className="w-56" />
          </div>
        </section>
      ))}
    </div>
  ),
};

/** Tab through the controls. Each one's band of light sweeps across as it gets focus. */
export const Default: Story = {
  parameters: noControls,
  render: () => (
    <div className="p-8" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <Controls name="default" />
    </div>
  ),
  play: async ({ canvasElement, userEvent }) => {
    const swept = new Set<string>();
    for (let stop = 0; stop < 12; stop++) {
      await userEvent.tab();
      const focused = document.activeElement as HTMLElement;
      if (!canvasElement.contains(focused)) break;
      const host = focused.closest<HTMLElement>(".sheen");
      await expect(host, `${focused.outerHTML.slice(0, 60)} has no sheen`).not.toBeNull();
      await expect(getComputedStyle(host!, "::before").animationName).toBe("sheen");
      // Halfway through, the band is visible
      await expect(opacityHalfway(host!)).toBeGreaterThan(0);
      swept.add(host!.classList[0]!);
    }
    // Every kind of focusable part was reached, and swept
    await expect([...swept].sort()).toEqual(["button", "checkbox__box", "input__box", "radio__circle", "switch__track"]);
  },
};

/** The sheen in every theme. */
export const AllThemes: Story = {
  parameters: noControls,
  render: () => (
    <div className="grid">
      {(["light", "dark", "hotdog"] as const).map((theme) => (
        <section key={theme} data-theme={theme} className="grid gap-4 p-8" style={{ background: "var(--bg)", color: "var(--ink)" }}>
          <h2 className="text-label">{theme === "hotdog" ? "Hot dog" : theme}</h2>
          <Controls name={theme} />
        </section>
      ))}
    </div>
  ),
};

/** With reduced motion (here forced with data-motion="reduced"), there is no sheen: only the focus outline. */
export const ReducedMotion: Story = {
  parameters: noControls,
  render: () => (
    <div data-motion="reduced" className="p-8" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <Controls name="reduced" />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    const button = canvas.getByRole("button", { name: "Save changes" });
    await expect(button).toHaveFocus();
    await expect(getComputedStyle(button).getPropertyValue("--motion-decoration").trim()).toBe("0");
    // Even halfway through, where the band is brightest, nothing shows
    await expect(opacityHalfway(button)).toBe(0);
    await expect(getComputedStyle(button).outlineStyle).toBe("solid");
  },
};
