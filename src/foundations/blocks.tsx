// Visual blocks for the Foundations docs pages. Everything is drawn from tokens/tokens.json,
// so a token change updates these pages automatically. Not part of the published package.
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import tokens from "../../tokens/tokens.json";
import { Button } from "../components/Button";
import "./foundations.css";

type Theme = "light" | "dark" | "hotdog";
const THEMES: Array<{ id: Theme; name: string }> = [
  { id: "light", name: "Light" },
  { id: "dark", name: "Dark" },
  { id: "hotdog", name: "Hot dog" },
];

type ColorValue = string | Record<string, string>;
interface ColorToken { name: string; value: ColorValue; usage?: string }
interface PlainToken { name: string; value: string; usage?: string }

const colorTokens = tokens.color.tokens as ColorToken[];
const primitives = colorTokens.filter((t) => typeof t.value === "string");
const semantic = colorTokens.filter((t) => typeof t.value !== "string");
const primitiveValue = new Map(primitives.map((t) => [t.name, t.value as string]));

/** "{tangerine-500}" → "hsl(22 92% 55%)" */
function resolve(value: string): { alias?: string; hsl: string } {
  const m = /^\{(.+)\}$/.exec(value);
  if (!m?.[1]) return { hsl: value };
  return { alias: m[1], hsl: primitiveValue.get(m[1]) ?? value };
}

/** A panel that renders its children in one of the three themes, with a switcher. */
export function ThemeFrame({ children, label }: { children: ReactNode; label: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  return (
    <div className="fd-frame" data-theme={theme}>
      <div className="fd-switch" role="group" aria-label={`${label}: theme`}>
        {THEMES.map((t) => (
          <button key={t.id} type="button" aria-pressed={theme === t.id} onClick={() => setTheme(t.id)}>
            {t.name}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}

export function PrimitiveColors() {
  return (
    <div className="fd-frame" data-theme="light">
      <div className="fd-swatches">
        {primitives.map((t) => (
          <figure key={t.name} className="fd-swatch">
            <span className="fd-chip" style={{ background: t.value as string }} />
            <figcaption>
              <b>{t.name}</b>
              <code>{t.value as string}</code>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

export function SemanticColors() {
  return (
    <div className="fd-frame fd-scroll" data-theme="light">
      <table className="fd-table">
        <thead>
          <tr>
            <th scope="col">Token</th>
            {THEMES.map((t) => <th key={t.id} scope="col">{t.name}</th>)}
            <th scope="col">Usage</th>
          </tr>
        </thead>
        <tbody>
          {semantic.map((t) => (
            <tr key={t.name}>
              <th scope="row"><code>{t.name}</code></th>
              {THEMES.map((th) => {
                const raw = (t.value as Record<string, string>)[th.id] ?? (t.value as Record<string, string>).light ?? "";
                const { alias, hsl } = resolve(raw);
                return (
                  <td key={th.id}>
                    <div className="fd-cell">
                      <span className="fd-chip sm" data-theme={th.id} style={{ background: `var(--${t.name})` }} />
                      <span>
                        {alias && <span className="fd-alias">{alias}</span>}
                        <code>{hsl}</code>
                      </span>
                    </div>
                  </td>
                );
              })}
              <td className="fd-usage">{t.usage}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface TypeStyle { name: string; fontSize: string; lineHeight: number | string; fontWeight: number | string; letterSpacing?: string; sample?: string; usage?: string }

export function TypeScale() {
  return (
    <ThemeFrame label="Type scale">
      <div className="fd-stack">
        {tokens.type.groups.map((g) => (
          <section key={g.name} className="fd-stack">
            <h3 className="fd-group">{g.name}</h3>
            {(g.styles as TypeStyle[]).map((s) => (
              <div key={s.name} className="fd-type-row">
                <div className="fd-meta">
                  <b>{s.name}</b>
                  <code>{s.fontSize} · {s.fontWeight} · {String(s.lineHeight)}</code>
                </div>
                <div>
                  <p className={`text-${s.name}`}>{s.sample ?? "Strange ideas, carefully made."}</p>
                  {s.usage && <p className="fd-note">{s.usage}</p>}
                </div>
              </div>
            ))}
          </section>
        ))}
        <section className="fd-stack">
          <h3 className="fd-group">Line heights</h3>
          {tokens.type.leading.tokens.map((t) => (
            <div key={t.name} className="fd-type-row">
              <div className="fd-meta">
                <b>{t.name}</b>
                <code>{t.value}</code>
              </div>
              <p className="fd-note">{t.usage}</p>
            </div>
          ))}
        </section>
      </div>
    </ThemeFrame>
  );
}

export function SpacingScale() {
  return (
    <ThemeFrame label="Spacing">
      <div className="fd-stack sm">
        {(tokens.spacing.tokens as PlainToken[]).map((t) => (
          <div key={t.name} className="fd-space-row">
            <code>{t.name}</code>
            <span className="fd-space-bar" style={{ width: `var(--${t.name})` }} />
            <span className="fd-note">{t.value} · {t.usage}</span>
          </div>
        ))}
      </div>
    </ThemeFrame>
  );
}

export function RadiusScale() {
  return (
    <ThemeFrame label="Radius">
      <div className="fd-tiles">
        {(tokens.radius.tokens as PlainToken[]).map((t) => (
          <figure key={t.name} className="fd-tile">
            <span className="fd-radius" style={{ borderRadius: `var(--${t.name})` }} />
            <figcaption><b>{t.name}</b><code>{t.value}</code><span className="fd-note">{t.usage}</span></figcaption>
          </figure>
        ))}
      </div>
    </ThemeFrame>
  );
}

export function Shadows() {
  return (
    <ThemeFrame label="Shadows">
      <div className="fd-tiles">
        {tokens.shadow.tokens.map((t) => (
          <figure key={t.name} className="fd-tile">
            <span className="fd-shadow" style={{ boxShadow: `var(--${t.name})` }} />
            <figcaption><b>{t.name}</b><span className="fd-note">{t.usage}</span></figcaption>
          </figure>
        ))}
      </div>
    </ThemeFrame>
  );
}

type PointerMode = "auto" | "fine" | "coarse";
type Density = "comfortable" | "compact";
const SIZE_TOKENS = ["target-min", "target-gap", "control-sm", "control-md", "control-lg"] as const;

type SizeToken = { name: string; value: string; touch?: string; compact?: string };
const sizeTokens = tokens.size.tokens as SizeToken[];
const sizeToken = (name: string) => sizeTokens.find((t) => t.name === name)!;
/** A rem value from tokens.json in px, at the browser's default 16px */
const px = (rem: string) => `${parseFloat(rem) * 16}px`;

/** Reads live size tokens from an element, as "2.75rem · 44px". Measured, because compact sizes are a max(). */
function useSizeReadout(ref: RefObject<HTMLElement | null>, deps: unknown[]) {
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const probe = document.createElement("div");
    el.append(probe);
    setValues(Object.fromEntries(SIZE_TOKENS.map((t) => {
      probe.style.height = `var(--${t})`;
      const height = probe.getBoundingClientRect().height;
      return [t, `${height / rootPx}rem · ${Math.round(height)}px`];
    })));
    probe.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return values;
}

export function Sizing() {
  const [pointer, setPointer] = useState<PointerMode>("auto");
  const [density, setDensity] = useState<Density>("comfortable");
  const [hasTouch] = useState(() => matchMedia("(any-pointer: coarse)").matches);
  const box = useRef<HTMLDivElement>(null);
  const v = useSizeReadout(box, [pointer, density]);
  const touch = pointer === "coarse" || (pointer === "auto" && hasTouch);

  return (
    <ThemeFrame label="Sizing">
      <div
        ref={box}
        className="fd-stack"
        data-pointer={pointer === "auto" ? undefined : pointer}
        data-density={density === "compact" ? "compact" : undefined}
      >
        <div className="fd-stack sm">
          <div className="fd-row">
            <span className="fd-group">Pointer</span>
            <div className="fd-switch" role="group" aria-label="Pointer preview">
              {(["auto", "fine", "coarse"] as const).map((m) => (
                <button key={m} type="button" aria-pressed={pointer === m} onClick={() => setPointer(m)}>
                  {m === "auto" ? `Auto (${hasTouch ? "touch" : "mouse"})` : m === "fine" ? "Mouse" : "Touch"}
                </button>
              ))}
            </div>
            <span className="fd-group">Density</span>
            <div className="fd-switch" role="group" aria-label="Density preview">
              {(["comfortable", "compact"] as const).map((d) => (
                <button key={d} type="button" aria-pressed={density === d} onClick={() => setDensity(d)}>
                  {d === "comfortable" ? "Comfortable" : "Compact"}
                </button>
              ))}
            </div>
          </div>
          <p className="fd-note" role="status">
            {touch
              ? `Touch sizes: ${px(sizeToken("target-min").touch!)} minimum hit area, ${px(sizeToken("control-md").touch!)} default controls, and ${px(sizeToken("control-lg").touch!)} large controls.`
              : `Mouse and trackpad sizes: ${px(sizeToken("target-min").value)} minimum hit area, ${px(sizeToken("control-md").value)} default controls, and ${px(sizeToken("control-lg").value)} large controls.`}
            {density === "compact" ? " Compact density shrinks default and large controls one step, but never below the minimum hit area." : ""}
          </p>
        </div>

        <section className="fd-panel">
          <h3 className="fd-group">Targets and controls</h3>
          <div className="fd-grid">
            <div className="fd-item">
              <b>Minimum hit area</b>
              <div className="fd-row"><span className="fd-target"><Button size="sm">Small</Button></span></div>
              <code>target-min · {v["target-min"]}</code>
              <p className="fd-note">The dashed outline is the clickable area. With a mouse, the {px(sizeToken("control-sm").value)} button already exceeds the {px(sizeToken("target-min").value)} minimum. On touch, an invisible area pads it out to {px(sizeToken("target-min").touch!)}.</p>
            </div>
            <div className="fd-item">
              <b>Space between small targets</b>
              <div className="fd-row" style={{ gap: "var(--target-gap)" }}>
                <Button size="sm" variant="secondary" iconOnly aria-label="Bold"><svg viewBox="0 0 24 24" className="fd-ico" aria-hidden="true"><path d="M7 5h6a3.5 3.5 0 0 1 0 7H7z" /><path d="M7 12h7a3.5 3.5 0 0 1 0 7H7z" /></svg></Button>
                <Button size="sm" variant="secondary" iconOnly aria-label="Italic"><svg viewBox="0 0 24 24" className="fd-ico" aria-hidden="true"><path d="M14 5h-4" /><path d="M14 19h-4" /><path d="M14 5 10 19" /></svg></Button>
                <Button size="sm" variant="secondary" iconOnly aria-label="Underline"><svg viewBox="0 0 24 24" className="fd-ico" aria-hidden="true"><path d="M7 4v7a5 5 0 0 0 10 0V4" /><path d="M5 20h14" /></svg></Button>
              </div>
              <code>target-gap · {v["target-gap"]}</code>
            </div>
            <div className="fd-item">
              <b>Control heights</b>
              <div className="fd-row end">
                <span className="fd-col"><Button size="sm">Small</Button><code>{v["control-sm"]}</code></span>
                <span className="fd-col"><Button>Default</Button><code>{v["control-md"]}</code></span>
                <span className="fd-col"><Button size="lg">Large</Button><code>{v["control-lg"]}</code></span>
              </div>
            </div>
          </div>
        </section>

        <section className="fd-panel">
          <h3 className="fd-group">Border widths and focus</h3>
          <div className="fd-grid">
            <div className="fd-item">
              <b>Thin and thick</b>
              <span className="fd-line thin" /><code>border-thin · 1px · hairlines, card edges, and inputs</code>
              <span className="fd-line thick" /><code>border-thick · 2px · selected, outline buttons, and hot dog</code>
            </div>
            <div className="fd-item">
              <b>At rest versus selected</b>
              <div className="fd-row"><span className="fd-mini rest">Card at rest</span><span className="fd-mini selected">Selected card</span></div>
              <p className="fd-note">Selection adds weight and a stronger color, so it still shows in forced-colors mode.</p>
            </div>
            <div className="fd-item">
              <b>Focus outline</b>
              <div className="fd-row"><span className="fd-focus-demo">Focused button</span><Button variant="secondary">Tab to me</Button></div>
              <code>focus-width 2px · focus-offset 2px · color focus</code>
            </div>
          </div>
        </section>

        <section className="fd-panel">
          <h3 className="fd-group">Icon sizes</h3>
          <div className="fd-row">
            <span className="fd-icon-text sm"><svg className="fd-ico sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>Saved</span>
            <span className="fd-icon-text"><svg className="fd-ico md" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>See my work</span>
            <span className="fd-icon-text lg"><svg className="fd-ico lg" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>Home</span>
          </div>
          <code>{["icon-sm", "icon-md", "icon-lg"].map((n) => `${n} · ${sizeToken(n).value} (${px(sizeToken(n).value)})`).join(" · ")}</code>
        </section>

        <section className="fd-panel">
          <h3 className="fd-group">Layout widths, drawn to scale</h3>
          <div className="fd-bar content">content-max · {sizeToken("content-max").value} · page content</div>
          <div className="fd-bar measure" style={{ width: `${(parseFloat(sizeToken("measure").value) / parseFloat(sizeToken("content-max").value)) * 100}%` }}>measure · {sizeToken("measure").value} · running text</div>
          <p className="fd-prose">This paragraph is capped at <code>measure</code>. Lines of about 65–75 characters are the easiest to read, so running text stops here even when the page is wider.</p>
        </section>
      </div>
    </ThemeFrame>
  );
}

const EASINGS = [
  { name: "Ease out", token: "--ease-out", note: "Things entering", curve: [0.2, 0.8, 0.2, 1] },
  { name: "Ease in", token: "--ease-in", note: "Things leaving", curve: [0.4, 0, 1, 1] },
  { name: "Ease in-out", token: "--ease-in-out", note: "Moving or morphing", curve: [0.4, 0, 0.2, 1] },
  { name: "Bounce", token: "--ease-bounce", note: "Chips, toggles, and success", curve: [0.34, 1.56, 0.64, 1] },
] as const;
const DURATIONS = [
  { name: "Fast", token: "--duration-fast", note: "Hover, press, and color" },
  { name: "Base", token: "--duration-base", note: "Popovers, menus, and tooltips" },
  { name: "Slow", token: "--duration-slow", note: "Dialogs and drawers" },
] as const;
const EASE_DEMO_MS = 900;

type MotionMode = "system" | "full" | "reduced";

/** Converts ".12s" or "120ms" to milliseconds. */
const toMs = (v: string) => (v.endsWith("ms") ? parseFloat(v) : v.endsWith("s") ? parseFloat(v) * 1000 : 0);

function useSystemReducedMotion() {
  const [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function Curve({ c }: { c: readonly number[] }) {
  const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = c;
  return (
    <svg className="fd-curve" viewBox="0 0 100 100" aria-hidden="true">
      <path className="axis" d="M0 0 V100 H100" />
      <path className="line" d={`M0 100 C${x1 * 100} ${100 - y1 * 100} ${x2 * 100} ${100 - y2 * 100} 100 0`} />
    </svg>
  );
}

/**
 * One animation lane: a pill at the start of a track that slides to the end when played,
 * holds, then snaps back. With reduced motion it fades in at the end instead of sliding.
 */
function Lane({ label, duration, easing, reduced, playKey }: {
  label: string;
  duration: string;
  easing: string;
  reduced: boolean;
  playKey: number;
}) {
  const puck = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | undefined>(undefined);

  function play() {
    const el = puck.current;
    const track = el?.parentElement;
    if (!el || !track) return;
    window.clearTimeout(timer.current);
    const dist = track.clientWidth - el.offsetWidth - 8;
    const ms = toMs(duration);
    el.style.transition = "none";
    el.style.transform = reduced ? `translateX(${dist}px)` : "translateX(0)";
    el.style.opacity = reduced ? "0" : "1";
    void el.offsetWidth; // restart from the start position
    if (reduced) {
      el.style.transition = `opacity ${ms}ms ${easing}`;
      el.style.opacity = "1";
    } else {
      el.style.transition = `transform ${ms}ms ${easing}`;
      el.style.transform = `translateX(${dist}px)`;
    }
    // Hold at the end so the result is visible, then return to the start
    timer.current = window.setTimeout(() => {
      el.style.transition = "none";
      el.style.transform = "translateX(0)";
      el.style.opacity = "1";
    }, ms + 900);
  }

  useEffect(() => {
    if (playKey > 0) play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playKey]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div className="fd-lane">
      <Button size="sm" variant="secondary" onClick={play} aria-label={`Play ${label}`}>Play</Button>
      <div className="fd-track" aria-hidden="true">
        <span className="fd-track-end" />
        <span ref={puck} className="fd-puck" />
      </div>
    </div>
  );
}

export function MotionDemo() {
  const root = useRef<HTMLDivElement>(null);
  const systemReduced = useSystemReducedMotion();
  const [mode, setMode] = useState<MotionMode>("system");
  const reduced = mode === "reduced" || (mode === "system" && systemReduced);
  const [values, setValues] = useState<Record<string, string>>({});
  const [playKey, setPlayKey] = useState(0);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(false);
  const chip = useRef<HTMLButtonElement>(null);

  // Read the live token values (they change with the motion mode)
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    const read = (t: string) => cs.getPropertyValue(t).trim();
    setValues({
      ...Object.fromEntries(DURATIONS.map((d) => [d.token, `${Math.round(toMs(read(d.token)))}ms`])),
      ...Object.fromEntries(EASINGS.map((e) => [e.token, read(e.token)])),
    });
  }, [mode, systemReduced]);

  const statusText = reduced
    ? mode === "system"
      ? "Your device has Reduce motion turned on, so this shows the reduced versions: slides become fades, durations shorten, and nothing bounces. Choose Full to preview the full animations."
      : "Showing reduced motion: slides become fades, durations shorten, and nothing bounces."
    : "Showing full motion.";

  return (
    <ThemeFrame label="Motion">
      <div ref={root} className="fd-motion" data-motion={mode === "system" ? undefined : mode}>
        <div className="fd-stack sm">
          <div className="fd-row">
            <span className="fd-group">Motion</span>
            <div className="fd-switch" role="group" aria-label="Motion preview">
              {(["system", "full", "reduced"] as const).map((m) => (
                <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>
                  {m === "system" ? `System (${systemReduced ? "reduced" : "full"})` : m === "full" ? "Full" : "Reduced"}
                </button>
              ))}
            </div>
            <Button onClick={() => setPlayKey((k) => k + 1)}>Play all</Button>
          </div>
          <p className="fd-note" role="status">{statusText}</p>
        </div>

        <section className="fd-panel">
          <h3 className="fd-group">Durations, at real speed with ease out</h3>
          <p className="fd-note">Press Play to send the pill from start to finish. These are short on purpose: interface motion should feel quick.</p>
          {DURATIONS.map((d) => (
            <div key={d.token} className="fd-motion-row">
              <span className="fd-meta"><b>{d.name} · {values[d.token]}</b><code>{d.token}</code><span className="fd-note">{d.note}</span></span>
              <Lane label={`${d.name} duration`} duration={values[d.token] ?? "0ms"} easing={values["--ease-out"] ?? "ease-out"} reduced={reduced} playKey={playKey} />
            </div>
          ))}
        </section>

        <section className="fd-panel">
          <h3 className="fd-group">Easing curves, slowed to {EASE_DEMO_MS}ms</h3>
          <p className="fd-note">Slowed down so you can see the shape of each curve. Watch where the pill speeds up and slows down; Bounce overshoots the end and settles back.</p>
          {EASINGS.map((e) => (
            <div key={e.token} className="fd-motion-row ease">
              <span className="fd-meta"><b>{e.name}</b><code>{e.token}</code><span className="fd-note">{e.note}</span></span>
              <Curve c={e.token === "--ease-bounce" && reduced ? EASINGS[0].curve : e.curve} />
              <Lane label={e.name} duration={`${reduced ? 120 : EASE_DEMO_MS}ms`} easing={values[e.token] ?? "ease"} reduced={reduced} playKey={playKey} />
            </div>
          ))}
        </section>

        <section className="fd-demos">
          <div className="fd-panel">
            <b>Button lift</b>
            <Button>Hover over me</Button>
            <p className="fd-note">Rises 1px on hover and settles when pressed. It's meant to be subtle; you'll feel it more than see it. Reduced motion keeps the color change only. In hot dog mode the button presses into its hard shadow instead.</p>
          </div>
          <div className="fd-panel">
            <b>Popover</b>
            <div className="fd-pop-wrap">
              <Button variant="secondary" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? "Close popover" : "Open popover"}</Button>
              <div className="fd-pop" data-closed={open ? undefined : ""}>Slides up and fades in with ease out, then leaves faster with ease in.</div>
            </div>
          </div>
          <div className="fd-panel">
            <b>Chip</b>
            <button
              ref={chip}
              type="button"
              className="fd-chip-toggle"
              aria-pressed={picked}
              onClick={() => {
                setPicked((p) => !p);
                const el = chip.current;
                if (el) { el.classList.remove("popping"); void el.offsetWidth; el.classList.add("popping"); }
              }}
            >
              Hot dog fan
            </button>
            <p className="fd-note">Press it: it pops from small to full size with the bounce curve, the system's one playful flourish. Reduced motion skips the pop.</p>
          </div>
        </section>
      </div>
    </ThemeFrame>
  );
}
