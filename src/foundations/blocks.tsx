// Visual blocks for the Foundations docs pages. Everything is drawn from tokens/tokens.json,
// so a token change updates these pages automatically. Not part of the published package.
import { useEffect, useRef, useState, type ReactNode } from "react";
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

export function Sizing() {
  return (
    <ThemeFrame label="Sizing">
      <div className="fd-stack">
        <section className="fd-panel">
          <h3 className="fd-group">Border widths</h3>
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
          <h3 className="fd-group">Touch targets and controls</h3>
          <div className="fd-grid">
            <div className="fd-item">
              <b>Minimum touch target</b>
              <div className="fd-row"><span className="fd-target"><Button size="sm">Small</Button></span></div>
              <p className="fd-note">The dashed outline is <code>target-min</code> (2.75rem, 44px). A small button is 2rem tall, so its clickable area is padded out to 44px.</p>
            </div>
            <div className="fd-item">
              <b>Control heights</b>
              <div className="fd-row end">
                <span className="fd-col"><Button size="sm">Small</Button><code>control-sm · 2rem</code></span>
                <span className="fd-col"><Button>Default</Button><code>control-md · 2.75rem</code></span>
                <span className="fd-col"><Button size="lg">Large</Button><code>control-lg · 3.25rem</code></span>
              </div>
            </div>
            <div className="fd-item">
              <b>Icon sizes</b>
              <div className="fd-row">
                <span className="fd-icon-text sm"><svg className="fd-ico sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>Saved</span>
                <span className="fd-icon-text"><svg className="fd-ico md" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>See my work</span>
              </div>
              <code>icon-sm · 1rem · icon-md · 1.25rem</code>
            </div>
          </div>
        </section>
        <section className="fd-panel">
          <h3 className="fd-group">Layout widths, drawn to scale</h3>
          <div className="fd-bar content">content-max · 72rem · page content</div>
          <div className="fd-bar measure">measure · 40rem · running text</div>
          <p className="fd-prose">This paragraph is capped at <code>measure</code>. Lines of about 65 characters are the easiest to read, so running text stops here even when the page is wider.</p>
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
  { name: "Fast", token: "--duration-fast" },
  { name: "Base", token: "--duration-base" },
  { name: "Slow", token: "--duration-slow" },
] as const;

function Curve({ c }: { c: readonly number[] }) {
  const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = c;
  return (
    <svg className="fd-curve" viewBox="0 0 100 100" aria-hidden="true">
      <path className="axis" d="M0 0 V100 H100" />
      <path className="line" d={`M0 100 C${x1 * 100} ${100 - y1 * 100} ${x2 * 100} ${100 - y2 * 100} 100 0`} />
    </svg>
  );
}

export function MotionDemo() {
  const root = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(false);
  const chip = useRef<HTMLButtonElement>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  const css = (name: string) => (root.current ? getComputedStyle(root.current).getPropertyValue(name).trim() : "");
  const isReduced = () => reduced || matchMedia("(prefers-reduced-motion: reduce)").matches;

  function play(puck: HTMLElement) {
    const track = puck.parentElement;
    if (!track) return;
    const dist = track.clientWidth - puck.offsetWidth - 8;
    const durAttr = puck.dataset.dur ?? "";
    const dur = durAttr.startsWith("--") ? css(durAttr) : durAttr;
    const ease = css(puck.dataset.ease ?? "--ease-out");
    puck.style.transition = "none";
    if (isReduced()) {
      puck.style.transform = `translateX(${dist}px)`;
      puck.style.opacity = "0";
      void puck.offsetWidth;
      puck.style.transition = `opacity ${durAttr.startsWith("--") ? css("--duration-fast") : dur} ${css("--ease-out")}`;
      puck.style.opacity = "1";
    } else {
      puck.style.opacity = "1";
      puck.style.transform = "translateX(0)";
      void puck.offsetWidth;
      puck.style.transition = `transform ${dur} ${ease}`;
      puck.style.transform = `translateX(${dist}px)`;
    }
  }
  const playAll = () => root.current?.querySelectorAll<HTMLElement>(".fd-puck").forEach(play);

  useEffect(() => {
    // Minified CSS may store "120ms" as ".12s", so show milliseconds either way
    const ms = (v: string) => (v.endsWith("ms") ? v : v.endsWith("s") ? `${Math.round(parseFloat(v) * 1000)}ms` : v);
    setValues(Object.fromEntries(DURATIONS.map((d) => [d.token, ms(css(d.token))])));
    const id = setTimeout(playAll, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  return (
    <ThemeFrame label="Motion">
      <div ref={root} className={`fd-motion${reduced ? " sim-reduced" : ""}`}>
        <div className="fd-row">
          <Button onClick={playAll}>Replay all</Button>
          <Button variant="secondary" aria-pressed={reduced} onClick={() => setReduced((r) => !r)}>Simulate reduced motion</Button>
          <span className="fd-note" role="status">{reduced ? "Reduced motion: slides become fades, nothing bounces" : "Full motion"}</span>
        </div>

        <section className="fd-panel">
          <h3 className="fd-group">Durations · real speed</h3>
          {DURATIONS.map((d) => (
            <div key={d.token} className="fd-motion-row">
              <span className="fd-meta"><b>{d.name}</b><code>{d.token} · {values[d.token]}</code></span>
              <div className="fd-track" onClick={(e) => play(e.currentTarget.querySelector(".fd-puck") as HTMLElement)}>
                <span className="fd-puck" data-dur={d.token} data-ease="--ease-out" />
              </div>
            </div>
          ))}
        </section>

        <section className="fd-panel">
          <h3 className="fd-group">Easing · slowed to 900ms so the curve is visible</h3>
          {EASINGS.map((e) => (
            <div key={e.token} className="fd-motion-row ease">
              <span className="fd-meta"><b>{e.name}</b><code>{e.note}</code></span>
              <Curve c={e.token === "--ease-bounce" && reduced ? [0.2, 0.8, 0.2, 1] : e.curve} />
              <div className="fd-track" onClick={(ev) => play(ev.currentTarget.querySelector(".fd-puck") as HTMLElement)}>
                <span className="fd-puck" data-dur="900ms" data-ease={e.token} />
              </div>
            </div>
          ))}
        </section>

        <section className="fd-demos">
          <div className="fd-panel">
            <b>Button lift</b>
            <Button>Hover or press me</Button>
            <p className="fd-note">Lifts on hover with the fast duration. In hot dog mode it pushes into its hard shadow instead.</p>
          </div>
          <div className="fd-panel">
            <b>Popover</b>
            <div className="fd-pop-wrap">
              <Button variant="secondary" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? "Close popover" : "Open popover"}</Button>
              <div className="fd-pop" data-closed={open ? undefined : ""}>Enters with ease out at the base duration and leaves faster with ease in.</div>
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
            <p className="fd-note">Selecting it pops with the bounce curve, the system's one playful flourish.</p>
          </div>
        </section>
      </div>
    </ThemeFrame>
  );
}
