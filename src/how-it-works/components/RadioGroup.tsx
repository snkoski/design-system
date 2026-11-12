import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { Radio, RadioGroup } from "@/components/RadioGroup";
import { Segment, SegmentedControl } from "@/components/SegmentedControl";
import "@/how-it-works/demo.css";
import { Inspect } from "@/how-it-works/Inspect";
import "@/how-it-works/components/radio-group.css";

/* Live demos for RadioGroup's "How it works" page, built from the real components. SegmentedControl's page uses the
   shared pieces too (FormReadout, PointerStage, and StateSwitch). */

export type DemoState = "usable" | "invalid" | "disabled" | "read-only";

/** Picks the state a demo's component is shown in. Its radios sit in a row that wraps (radio-group.css), so it fits a phone. */
export function StateSwitch({ name, value, onChange }: { name: string; value: DemoState; onChange: (value: DemoState) => void }) {
  return (
    <RadioGroup className="how-state-switch" label="Show the state" name={name} value={value} onValueChange={(next) => onChange(next as DemoState)}>
      <Radio value="usable">Usable</Radio>
      <Radio value="invalid">Invalid</Radio>
      <Radio value="disabled">Disabled</Radio>
      <Radio value="read-only">Read only</Radio>
    </RadioGroup>
  );
}

/**
 * A group in each state, with its live HTML. Switching state underlines every attribute it changes. Invalid shows the
 * error until a plan is chosen, the way a real form would after a submit with nothing chosen.
 */
export function RadioGroupStates() {
  const [state, setState] = useState<DemoState>("usable");
  const [value, setValue] = useState<string | null>("team");
  return (
    <div className="explain how-states">
      <StateSwitch
        name="radio-group-state"
        value={state}
        onChange={(next) => {
          setState(next);
          if (next === "invalid") setValue(null);
        }}
      />
      <Inspect hint="Pick a state above, then try the group: click, Tab to it, and use the arrow keys.">
        <RadioGroup
          label="Plan"
          value={value}
          onValueChange={setValue}
          invalid={state === "invalid" && value === null}
          error="Choose a plan."
          disabled={state === "disabled"}
          readOnly={state === "read-only"}
        >
          <Radio value="free">Free</Radio>
          <Radio value="team">Team</Radio>
          <Radio value="business">Business</Radio>
        </RadioGroup>
      </Inspect>
    </div>
  );
}

/**
 * Wraps a control in a real `<form>` and shows what `new FormData(form)` holds right now, and whether the browser's
 * own validation would let the form submit. It reads again whenever anything inside the form changes.
 */
export function FormReadout({ children }: { children: ReactNode }) {
  const form = useRef<HTMLFormElement>(null);
  const [entries, setEntries] = useState<Array<[string, string]>>([]);
  const [valid, setValid] = useState(true);

  useLayoutEffect(() => {
    const element = form.current!;
    const read = () => {
      setEntries([...new FormData(element)].map(([key, value]) => [key, String(value)]));
      // Reading validity, rather than calling checkValidity(), fires no "invalid" events at the controls
      setValid([...element.elements].every((control) => (control as HTMLInputElement).validity?.valid ?? true));
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(element, { subtree: true, attributes: true, childList: true });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <form ref={form} noValidate onSubmit={(event) => event.preventDefault()}>
        {children}
      </form>
      <div className="explain__result how-form-readout" role="status">
        <p>
          <code>new FormData(form)</code>{" "}
          {entries.length === 0 ? (
            "is empty: nothing would be sent for this field."
          ) : (
            <>
              holds{" "}
              {entries.map(([key, value]) => (
                <code key={key + value}>
                  {key} = "{value}"
                </code>
              ))}
              .
            </>
          )}
        </p>
        <p>
          The browser's own validation would {valid ? "let the form submit." : "block the form: a required choice is missing."}
        </p>
      </div>
    </>
  );
}

/** Checkboxes that turn a demo's required, disabled, and read-only props on and off */
export function FormSwitches({
  required,
  disabled,
  readOnly,
  onChange,
}: {
  required: boolean;
  disabled: boolean;
  readOnly: boolean;
  onChange: (change: Partial<{ required: boolean; disabled: boolean; readOnly: boolean }>) => void;
}) {
  return (
    <div className="how-form-switches">
      <Checkbox checked={required} onCheckedChange={(checked) => onChange({ required: checked })}>
        Required
      </Checkbox>
      <Checkbox checked={disabled} onCheckedChange={(checked) => onChange({ disabled: checked })}>
        Disabled
      </Checkbox>
      <Checkbox checked={readOnly} onCheckedChange={(checked) => onChange({ readOnly: checked })}>
        Read only
      </Checkbox>
    </div>
  );
}

/** A controlled group in a form, with what the form would send and a button that sets the value back to null */
export function RadioGroupForm() {
  const [value, setValue] = useState<string | null>(null);
  const [flags, setFlags] = useState({ required: false, disabled: false, readOnly: false });
  return (
    <div className="explain">
      <FormSwitches {...flags} onChange={(change) => setFlags({ ...flags, ...change })} />
      <FormReadout>
        <RadioGroup label="Plan" name="plan" value={value} onValueChange={setValue} {...flags}>
          <Radio value="free">Free</Radio>
          <Radio value="team">Team</Radio>
          <Radio value="business">Business</Radio>
        </RadioGroup>
      </FormReadout>
      <div>
        <Button variant="secondary" onClick={() => setValue(null)}>
          Clear the choice
        </Button>
      </div>
      <p className="explain__readout">
        The <code>value</code> prop is <code>{value === null ? "null" : `"${value}"`}</code>.
      </p>
    </div>
  );
}

/**
 * Shows a control with a mouse's sizes or a touch screen's, by setting `data-pointer` on a wrapper, with its hit areas
 * drawn as dashed lines and measured
 */
export function PointerStage({
  name,
  children,
  measure,
}: {
  name: string;
  children: ReactNode;
  /** Reads the sizes to show from the stage, after each change */
  measure: (stage: HTMLElement) => string[];
}) {
  const [pointer, setPointer] = useState("fine");
  const stage = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<string[]>([]);

  useLayoutEffect(() => {
    // Measure in the loaded font, as the page will look
    let current = true;
    const read = () => current && setLines(measure(stage.current!));
    read();
    void document.fonts.ready.then(read);
    return () => {
      current = false;
    };
  }, [pointer, measure]);

  return (
    <div className="explain">
      <SegmentedControl label="Pointer" name={name} value={pointer} onValueChange={setPointer}>
        <Segment value="fine">Mouse</Segment>
        <Segment value="coarse">Touch</Segment>
      </SegmentedControl>
      <div className="explain-inspect__stage how-hit-areas" data-pointer={pointer} ref={stage}>
        {children}
      </div>
      <ul className="explain__facts">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

/** A length in whole px, the way the page has rendered it */
export const px = (value: number) => `${Math.round(value * 10) / 10}px`;

const measureRadios = (stage: HTMLElement) => {
  const row = stage.querySelector(".radio__row")!.getBoundingClientRect();
  const circle = stage.querySelector(".radio__circle")!;
  const after = getComputedStyle(circle, "::after");
  const bare = stage.querySelector(".radio:not(:has(> .radio__row))")!.getBoundingClientRect();
  return [
    `Each labelled row (choice-row): ${px(row.height)} tall, as wide as the circle and its words.`,
    `The circle (choice): ${px(circle.getBoundingClientRect().width)} wide.`,
    `The circle's own hit area (::after, target-min): ${after.width} by ${after.height}.`,
    `A radio with no visible label: its wrapper is ${px(bare.height)} tall, so its hit area doesn't spill into the next one.`,
  ];
};

/** Radios with a mouse and on touch, with every place a click or tap counts drawn */
export function RadioHitAreas() {
  return (
    <PointerStage name="radio-pointer" measure={measureRadios}>
      <div className="how-hit-areas__pair">
        <RadioGroup label="Plan" defaultValue="team">
          <Radio value="free">Free</Radio>
          <Radio value="team">Team</Radio>
        </RadioGroup>
        <RadioGroup label="Plan, in a table" defaultValue="team">
          <Radio value="free" aria-label="Free" />
          <Radio value="team" aria-label="Team" />
        </RadioGroup>
      </div>
    </PointerStage>
  );
}
