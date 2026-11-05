import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { expect, waitFor } from "storybook/test";
import { Button } from "../Button";
import { Input } from "../Input";
import { Separator } from "./Separator";
import separatorCss from "./separator.css?inline";

/** The px value of a length token, measured in the browser */
function measure(token: string, parent: HTMLElement) {
  const probe = document.createElement("div");
  probe.style.width = `var(${token})`;
  parent.append(probe);
  const width = probe.getBoundingClientRect().width;
  probe.remove();
  return width;
}

/** A color token as the browser computes it, from a probe inside `parent` so its theme applies */
function tokenColor(token: string, parent: HTMLElement) {
  const probe = document.createElement("span");
  probe.style.color = `var(${token})`;
  parent.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/** The four border widths and four margins, in px, as the browser computes them */
function edges(element: Element, pseudo?: "::before" | "::after") {
  const style = getComputedStyle(element, pseudo);
  return {
    borders: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].map(parseFloat),
    margins: [style.marginTop, style.marginRight, style.marginBottom, style.marginLeft].map(parseFloat),
  };
}

/** A fixed width, so a horizontal line has something to fill in Storybook's centered layout */
const withWidth: Decorator = (Story) => (
  <div className="w-80">
    <Story />
  </div>
);

const meta = {
  title: "Components/Separator",
  component: Separator,
  args: { orientation: "horizontal", label: "" },
  argTypes: {
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel. A label only shows on a horizontal separator. */
export const Playground: Story = {
  decorators: [withWidth],
  render: ({ orientation, label, ...args }) =>
    orientation === "vertical" ? (
      <div className="flex items-center gap-4">
        <span>Applications</span>
        <Separator {...args} orientation="vertical" />
        <span>Contacts</span>
      </div>
    ) : (
      <div className="flex flex-col gap-4">
        <p>Above the line</p>
        <Separator {...args} label={label} />
        <p>Below the line</p>
      </div>
    ),
};

/**
 * A horizontal line fills its container's width, a vertical one fills its row's height, and a label sits in the
 * middle of a horizontal line. None of them adds space of its own: the `gap` around them comes from the layout.
 */
export const States: Story = {
  decorators: [withWidth],
  render: () => <Matrix />,
  play: async ({ canvasElement }) => {
    const thin = measure("--border-thin", canvasElement);
    expect(thin).toBeGreaterThan(0);
    const [horizontal, vertical, labelled] = [...canvasElement.querySelectorAll<HTMLElement>(".separator")];

    // Horizontal: one line along the top, no margin, as wide as its container
    expect(edges(horizontal!)).toEqual({ borders: [thin, 0, 0, 0], margins: [0, 0, 0, 0] });
    expect(horizontal!.getBoundingClientRect().width).toBe(horizontal!.parentElement!.getBoundingClientRect().width);

    // Vertical: one line down the start side, no margin, as tall as its row
    expect(edges(vertical!)).toEqual({ borders: [0, 0, 0, thin], margins: [0, 0, 0, 0] });
    expect(vertical!.getBoundingClientRect().height).toBe(vertical!.parentElement!.getBoundingClientRect().height);

    // Labelled: no line of its own; a line on either side of the words, which sit in the middle
    expect(edges(labelled!).borders).toEqual([0, 0, 0, 0]);
    for (const side of ["::before", "::after"] as const) {
      expect(edges(labelled!, side).borders).toEqual([thin, 0, 0, 0]);
    }
    const words = labelled!.querySelector(".separator__label")!.getBoundingClientRect();
    const line = labelled!.getBoundingClientRect();
    expect(Math.abs(words.left + words.width / 2 - (line.left + line.width / 2))).toBeLessThanOrEqual(1);
  },
};

/**
 * Between two groups of links in a row. The row is a flex container, so the line is as tall as the row. Put a
 * separator between lists, not inside one.
 */
export const Vertical: Story = {
  render: () => (
    <nav aria-label="Account" className="flex items-center gap-4">
      <a href="#applications">Applications</a>
      <a href="#contacts">Contacts</a>
      <Separator orientation="vertical" />
      <a href="#settings">Settings</a>
      <a href="#sign-out">Sign out</a>
    </nav>
  ),
};

/**
 * "or" between two ways to sign in. Screen readers hear "separator" but not the word, which only repeats what the
 * two choices already make clear.
 */
export const WithLabel: Story = {
  decorators: [withWidth],
  render: () => (
    <div className="flex flex-col gap-4">
      <Button variant="secondary">Sign in with GitHub</Button>
      <Separator label="or" />
      <Input label="Email" type="email" autoComplete="email" />
      <Button>Send sign-in link</Button>
    </div>
  ),
};

/**
 * On a site with no CSS reset, an `<hr>` comes with the browser's own look: a gray, inset border on all four sides
 * and margins. Storybook loads Tailwind's reset, which would hide that, so this separator sits in a shadow root
 * with only `separator.css`. It still draws one flat line with no margin.
 */
export const WithoutCssReset: Story = {
  decorators: [withWidth],
  render: () => <ShadowSeparator />,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("[data-shadow-host]");
    await waitFor(() => expect(host?.shadowRoot?.querySelector("hr")).toBeInstanceOf(HTMLHRElement));
    const hr = host!.shadowRoot!.querySelector("hr");
    const thin = measure("--border-thin", canvasElement);
    expect(edges(hr!)).toEqual({ borders: [thin, 0, 0, 0], margins: [0, 0, 0, 0] });
    expect(getComputedStyle(hr!).borderTopStyle).toBe("solid");
    expect(getComputedStyle(hr!).borderTopColor).toBe(tokenColor("--border", canvasElement));
  },
};

/** Every state in all three themes at once. Chromatic snapshots this one. */
export const AllThemes: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="grid">
      {(["light", "dark", "hotdog"] as const).map((theme) => (
        <section key={theme} data-theme={theme} className="grid gap-4 p-8" style={{ background: "var(--bg)", color: "var(--ink)" }}>
          <h2 className="text-label">{theme === "hotdog" ? "Hot dog" : theme}</h2>
          <div className="w-80">
            <Matrix />
          </div>
        </section>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Light and dark draw the line in the border color
    for (const theme of ["light", "dark"]) {
      const section = canvasElement.querySelector<HTMLElement>(`section[data-theme=${theme}]`)!;
      const line = section.querySelector<HTMLElement>(".separator[data-orientation=horizontal]")!;
      expect(getComputedStyle(line).borderTopColor).toBe(tokenColor("--border", section));
    }
    // Hot dog mode draws every line in thick ink, the label's lines too
    const hotdog = canvasElement.querySelector<HTMLElement>("section[data-theme=hotdog]")!;
    const thick = measure("--border-thick", hotdog);
    expect(thick).toBeGreaterThan(measure("--border-thin", hotdog));
    const ink = tokenColor("--ink", hotdog);
    for (const separator of hotdog.querySelectorAll<HTMLElement>(".separator:not(:has(.separator__label))")) {
      const style = getComputedStyle(separator);
      const vertical = separator.dataset.orientation === "vertical";
      expect(parseFloat(vertical ? style.borderLeftWidth : style.borderTopWidth)).toBe(thick);
      expect(vertical ? style.borderLeftColor : style.borderTopColor).toBe(ink);
    }
    const labelled = hotdog.querySelector(".separator:has(.separator__label)")!;
    for (const side of ["::before", "::after"] as const) {
      expect(edges(labelled, side).borders).toEqual([thick, 0, 0, 0]);
      expect(getComputedStyle(labelled, side).borderTopColor).toBe(ink);
    }
  },
};


function Matrix() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p>Profile</p>
        <Separator />
        <p>Notifications</p>
      </div>
      <div className="flex items-center gap-4">
        <span>Applications</span>
        <Separator orientation="vertical" />
        <span>Contacts</span>
      </div>
      <Separator label="or" />
    </div>
  );
}

/** The real Separator in a shadow root that has only separator.css, so no reset reaches it (tokens still do) */
function ShadowSeparator() {
  const host = useRef<HTMLDivElement>(null);
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  // A layout effect, so the shadow root and its separator are there before the play function starts
  useLayoutEffect(() => {
    const element = host.current;
    if (element) setRoot(element.shadowRoot ?? element.attachShadow({ mode: "open" }));
  }, []);
  return (
    <div ref={host} data-shadow-host="">
      {root &&
        createPortal(
          <>
            <style>{separatorCss}</style>
            <p>Above the line</p>
            <Separator />
            <p>Below the line</p>
          </>,
          root,
        )}
    </div>
  );
}
