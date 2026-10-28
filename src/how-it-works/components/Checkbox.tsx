import { useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { Button } from "../../components/Button";
import { Checkbox } from "../../components/Checkbox";
import { Segment, SegmentedControl } from "../../components/SegmentedControl";
import "../demo.css";
import "./checkbox.css";

/* Live demos for Checkbox's "How it works" page, also used by Checkbox group's. They render the real components, so
   what they show is what runs. */

/** One name and value a form would send */
type Entry = [name: string, value: string];

/**
 * What a form would send right now, read with FormData the way the browser builds a submission, and whether the
 * browser's own validation passes. Kept up to date as the controls inside it change.
 */
export function useSubmitted(form: RefObject<HTMLFormElement | null>) {
  // Kept as text, so reading the same entries again doesn't re-render: a re-render sets attributes on the inputs,
  // which the observer below would see, and it would read again forever
  const [text, setText] = useState("[]");
  const [valid, setValid] = useState(true);
  useLayoutEffect(() => {
    const element = form.current!;
    const update = () => {
      setText(JSON.stringify([...new FormData(element).entries()].map(([name, value]) => [name, String(value)])));
      setValid(element.checkValidity());
    };
    update();
    // A tick changes the box's aria-checked, and uncheckedValue adds or removes an input, so watch both
    const observer = new MutationObserver(update);
    observer.observe(element, { subtree: true, childList: true, attributes: true });
    return () => observer.disconnect();
  }, [form]);
  return { entries: JSON.parse(text) as Entry[], valid };
}

/** A form's entries as name=value lines, or a note that nothing would be sent */
export function Entries({ entries }: { entries: Entry[] }) {
  return (
    <div className="explain__result">
      <p className="checkbox-demo__title">What the form would send</p>
      {entries.length === 0 ? (
        <p className="checkbox-demo__empty">Nothing.</p>
      ) : (
        <ul className="checkbox-demo__entries">
          {entries.map(([name, value], index) => (
            <li key={index}>
              <code>
                {name}={value}
              </code>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Four checkboxes in a form, each with different form props, and what the form would send. Shows the rules: a ticked
 * box sends its value or "on", an unticked one sends nothing or its uncheckedValue, and a disabled one never sends.
 */
export function SubmitDemo() {
  const form = useRef<HTMLFormElement>(null);
  const { entries, valid } = useSubmitted(form);
  return (
    <div className="explain">
      <p className="explain__note">
        Tick and untick the boxes. Each one's form props are beside it. Under them is what the form would send right
        now, read with <code>new FormData(form)</code>, the same way the browser builds a submission.
      </p>
      <form ref={form} className="checkbox-demo__rows" onSubmit={(event) => event.preventDefault()}>
        <div className="checkbox-demo__row">
          <Checkbox name="newsletter" value="yes">
            Email me about new projects
          </Checkbox>
          <code>name="newsletter" value="yes"</code>
        </div>
        <div className="checkbox-demo__row">
          <Checkbox name="reminders" value="yes" uncheckedValue="no" defaultChecked>
            Send me reminders
          </Checkbox>
          <code>name="reminders" value="yes" uncheckedValue="no" defaultChecked</code>
        </div>
        <div className="checkbox-demo__row">
          <Checkbox name="terms" required>
            I accept the terms (required)
          </Checkbox>
          <code>name="terms" required</code>
        </div>
        <div className="checkbox-demo__row">
          <Checkbox name="beta" disabled defaultChecked>
            Join the beta
          </Checkbox>
          <code>name="beta" disabled defaultChecked</code>
        </div>
      </form>
      <Entries entries={entries} />
      <p className="explain__readout">
        The browser's own check, <code>form.checkValidity()</code>:{" "}
        {valid ? "passes." : "fails, because a required box is unticked."}
      </p>
    </div>
  );
}

/**
 * A required checkbox in a form that's checked when it's sent: the error appears if the box is unticked, and goes
 * once it's ticked. For Inspect, to watch aria-invalid and aria-describedby change.
 */
export function TermsDemo() {
  const [checked, setChecked] = useState(false);
  const [sent, setSent] = useState(false);
  const invalid = sent && !checked;
  return (
    <form
      className="checkbox-demo__form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
    >
      <Checkbox
        name="terms"
        required
        checked={checked}
        onCheckedChange={setChecked}
        invalid={invalid}
        error="You need to accept the terms to continue."
      >
        I accept the terms (required)
      </Checkbox>
      <Button type="submit">Create account</Button>
    </form>
  );
}

interface Sizes {
  row: number;
  box: number;
  wrapper: number;
  hit: number;
}

/**
 * A checkbox with a label and one without, with a mouse or on touch. Outlines show the label row (the click target)
 * and the invisible hit area of the box without a label, and the readout gives their measured sizes.
 */
export function HitArea() {
  const [pointer, setPointer] = useState("fine");
  const stage = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState<Sizes | null>(null);

  useLayoutEffect(() => {
    const root = stage.current!;
    const [labelled, lone] = root.querySelectorAll<HTMLElement>(".checkbox");
    const loneBox = lone!.querySelector(".checkbox__box")!;
    setSizes({
      row: labelled!.querySelector(".checkbox__row")!.getBoundingClientRect().height,
      box: loneBox.getBoundingClientRect().height,
      wrapper: lone!.getBoundingClientRect().height,
      hit: parseFloat(getComputedStyle(loneBox, "::after").height),
    });
  }, [pointer]);

  const px = (value: number) => `${Math.round(value)}px`;
  return (
    <div className="explain">
      <SegmentedControl label="Pointer" value={pointer} onValueChange={setPointer}>
        <Segment value="fine">Mouse</Segment>
        <Segment value="coarse">Touch</Segment>
      </SegmentedControl>
      <div className="checkbox-demo__hit" data-pointer={pointer} ref={stage}>
        <Checkbox>Email me about new projects</Checkbox>
        <Checkbox aria-label="Select row 3" />
      </div>
      {sizes && (
        <ul className="explain__facts">
          <li>
            The dashed outline is the label row, the click target of the first checkbox: <strong>{px(sizes.row)}</strong>{" "}
            tall (<code>--choice-row</code>).
          </li>
          <li>
            The box itself is <strong>{px(sizes.box)}</strong> square (<code>--choice</code>), with a mouse and on touch.
          </li>
          <li>
            The dotted outline is the hit area of the second checkbox, which has no label: <strong>{px(sizes.hit)}</strong>{" "}
            square (<code>--target-min</code>). Its wrapper is <strong>{px(sizes.wrapper)}</strong> tall, so the hit
            area never reaches into a control above or below it.
          </li>
        </ul>
      )}
    </div>
  );
}
