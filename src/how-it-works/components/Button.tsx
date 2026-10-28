import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Heart, Plus, Send } from "lucide-react";
import { Button } from "../../components/Button";
import type { ButtonShape, ButtonSize, ButtonVariant } from "../../components/Button";
import { Segment, SegmentedControl } from "../../components/SegmentedControl";
import { Switch } from "../../components/Switch";
import { Inspect } from "../Inspect";
import "./button.css";

/* Live demos for Button's "How it works" page. Every one renders the real Button, styled by the real button.css. */

/** How long the pretend message takes to send, in ms */
const SENDING = 3000;

/**
 * Change each prop and watch the HTML follow: every prop becomes one attribute on the `<button>`, set by Button.tsx or
 * by Base UI.
 */
export function PropsToHtml() {
  const [variant, setVariant] = useState<ButtonVariant>("primary");
  const [size, setSize] = useState<ButtonSize>("md");
  const [shape, setShape] = useState<ButtonShape>("rectangle");
  const [iconOnly, setIconOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const shared = { variant, size, shape, loading, disabled };

  return (
    <div className="explain button-explain">
      <div className="button-explain__controls">
        <SegmentedControl label={<code>variant</code>} value={variant} onValueChange={(value) => setVariant(value as ButtonVariant)}>
          <Segment value="primary">primary</Segment>
          <Segment value="secondary">secondary</Segment>
          <Segment value="ghost">ghost</Segment>
        </SegmentedControl>
        <SegmentedControl label={<code>size</code>} value={size} onValueChange={(value) => setSize(value as ButtonSize)}>
          <Segment value="sm">sm</Segment>
          <Segment value="md">md</Segment>
          <Segment value="lg">lg</Segment>
        </SegmentedControl>
        <SegmentedControl label={<code>shape</code>} value={shape} onValueChange={(value) => setShape(value as ButtonShape)}>
          <Segment value="rectangle">rectangle</Segment>
          <Segment value="pill">pill</Segment>
        </SegmentedControl>
        <div className="button-explain__switches">
          <Switch checked={iconOnly} onCheckedChange={setIconOnly}>
            <code>iconOnly</code>
          </Switch>
          <Switch checked={loading} onCheckedChange={setLoading}>
            <code>loading</code>
          </Switch>
          <Switch checked={disabled} onCheckedChange={setDisabled}>
            <code>disabled</code>
          </Switch>
        </div>
      </div>
      <Inspect>
        {iconOnly ? (
          <Button {...shared} iconOnly aria-label="Add to favorites">
            <Heart />
          </Button>
        ) : (
          <Button {...shared} iconStart={<Heart />}>
            Add to favorites
          </Button>
        )}
      </Inspect>
    </div>
  );
}

/**
 * A button that loads for a few seconds when pressed, like one that sends a message. It counts real clicks, so
 * pressing it again while it loads shows that loading blocks them.
 */
export function LoadingButton() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const send = () => {
    setSent((count) => count + 1);
    setLoading(true);
    timer.current = window.setTimeout(() => setLoading(false), SENDING);
  };

  return (
    <Inspect
      hint={
        <>
          Press the button with the mouse, or Tab to it and press Enter or Space. For 3 seconds it's loading: press it
          again and nothing happens, and focus stays on it. Messages sent: <strong>{sent}</strong>.
        </>
      }
    >
      <Button loading={loading} iconStart={<Send />} onClick={send}>
        {loading ? "Sending message" : "Send message"}
      </Button>
    </Inspect>
  );
}

interface HitAreaSize {
  visible: string;
  hit: string;
}

const px = (value: number) => Math.round(value);

/** The button's own box and the box its ::after hit area covers, measured from the CSS the browser applied */
function measure(button: HTMLElement): HitAreaSize {
  const box = button.getBoundingClientRect();
  const after = getComputedStyle(button, "::after");
  // The ::after is placed from the button's padding box (inside its border), and its insets are 0 or negative
  const hitWidth = Math.max(box.width, button.clientWidth - parseFloat(after.left) - parseFloat(after.right));
  const hitHeight = Math.max(box.height, button.clientHeight - parseFloat(after.top) - parseFloat(after.bottom));
  return { visible: `${px(box.width)} × ${px(box.height)}`, hit: `${px(hitWidth)} × ${px(hitHeight)}` };
}

/** One button with its sizes underneath, measured live */
function Measured({ children }: { children: (ref: (element: HTMLButtonElement | null) => void) => ReactNode }) {
  const [button, setButton] = useState<HTMLButtonElement | null>(null);
  const [size, setSize] = useState<HitAreaSize | null>(null);

  useLayoutEffect(() => {
    if (!button) return;
    const update = () => setSize(measure(button));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(button);
    return () => observer.disconnect();
  }, [button]);

  return (
    <div className="button-hit__item">
      {children(setButton)}
      {size && (
        <p className="button-hit__size">
          Button {size.visible} px
          <br />
          Hit area {size.hit} px
        </p>
      )}
    </div>
  );
}

/**
 * The same small buttons with a mouse and on touch, with each one's invisible hit area drawn as a dashed line. Clicks
 * anywhere inside the line count.
 */
export function HitArea() {
  const [clicks, setClicks] = useState(0);
  const click = () => setClicks((count) => count + 1);

  return (
    <div className="explain">
      <p className="explain__note">
        The dashed line is each button's <code>::after</code>, which is normally invisible. Click inside a line but
        outside its button: the click still counts. Clicks: <strong>{clicks}</strong>.
      </p>
      <div className="button-hit">
        {(["fine", "coarse"] as const).map((pointer) => (
          <div key={pointer} className="button-hit__column" data-pointer={pointer}>
            <p className="button-hit__name">{pointer === "fine" ? "With a mouse (target-min 24px)" : "On touch (target-min 44px)"}</p>
            <div className="button-hit__row">
              <Measured>
                {(ref) => (
                  <Button ref={ref} size="sm" iconOnly aria-label="Add to favorites" onClick={click}>
                    <Heart />
                  </Button>
                )}
              </Measured>
              <Measured>
                {(ref) => (
                  <Button ref={ref} size="sm" iconStart={<Plus />} onClick={click}>
                    Add tag
                  </Button>
                )}
              </Measured>
              <Measured>
                {(ref) => (
                  <Button ref={ref} onClick={click}>
                    Send message
                  </Button>
                )}
              </Measured>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const THEMES = [
  { theme: "light", name: "Light" },
  { theme: "dark", name: "Dark" },
  { theme: "hotdog", name: "Hot dog" },
] as const;

/**
 * The three variants and a loading button in each theme, side by side, to hover, press, and Tab through. A switch
 * turns on reduced motion for the demo, with the same `data-motion` attribute any page can use.
 */
export function Themes() {
  const [reduced, setReduced] = useState(false);

  return (
    <div className="explain">
      <p className="explain__note">
        Hover each button, press and hold it, and Tab through them. Then turn on reduced motion and hover again.
      </p>
      <Switch checked={reduced} onCheckedChange={setReduced}>
        Reduce motion in this demo
      </Switch>
      <div className="button-themes" data-motion={reduced ? "reduced" : undefined}>
        {THEMES.map(({ theme, name }) => (
          <div key={theme} className="button-themes__theme" data-theme={theme}>
            <p className="button-themes__name">{name}</p>
            <div className="button-themes__buttons">
              <Button>Save changes</Button>
              <Button variant="secondary">Cancel</Button>
              <Button variant="ghost" iconStart={<Plus />}>
                Add tag
              </Button>
              <Button variant="secondary" loading>
                Saving changes
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
