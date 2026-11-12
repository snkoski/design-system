import { useLayoutEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/Button";
import { Segment, SegmentedControl } from "@/components/SegmentedControl";
import { TextArea } from "@/components/TextArea";
import type { TextAreaResize } from "@/components/TextArea";
import { fixed, Slider } from "@/how-it-works/demo";
import "@/how-it-works/components/text-area.css";

/* Live demos for TextArea's "How it works" page. They render the real TextArea, so what they show is what ships. */

/**
 * A message field in a real form that checks itself when the form is submitted, then, after a failed submit, each
 * time it changes, and shows what the form sent, line breaks included. Put it inside <Inspect>.
 */
export function MessageForm() {
  const field = useRef<HTMLTextAreaElement>(null);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState<string>();
  const problemWith = (message: string) => (message.trim() === "" ? "Write a message before sending." : undefined);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const problem = problemWith(String(data.get("message") ?? ""));
    setChecked(true);
    setError(problem);
    if (problem) {
      setSent(undefined);
      field.current?.focus(); // one error: focus goes to its field
      return;
    }
    // JSON.stringify shows each line break as \n
    setSent(`The form sent message=${JSON.stringify(String(data.get("message")))}.`);
  };

  return (
    <form className="grid justify-items-start gap-3" noValidate onSubmit={submit}>
      <TextArea
        ref={field}
        className="w-full"
        label="Message"
        name="message"
        rows={3}
        required
        description="Tell us about your project. We reply within two days."
        invalid={error !== undefined}
        error={error}
        onChange={(event) => {
          if (checked) setError(problemWith(event.currentTarget.value));
        }}
      />
      <Button type="submit" variant="secondary">
        Send message
      </Button>
      <output className="how-text-area__sent">{sent}</output>
    </form>
  );
}

/** The text area's box, measured from the page */
interface Measures {
  height: number;
  lineHeight: number;
  padding: number;
  edge: number;
  minHeight: number;
  /** Set when it's been dragged: the browser writes the new height into its style attribute */
  dragged: string;
  scrolls: boolean;
}

/**
 * A text area with its `rows` and `resize` props on controls, and its measured height, worked out from its line
 * height, padding, and edge. Drag its corner, or type past the bottom, and the numbers follow.
 */
export function Growing() {
  const [rows, setRows] = useState(2);
  const [resize, setResize] = useState<TextAreaResize>("vertical");
  const [version, setVersion] = useState(0);
  const field = useRef<HTMLTextAreaElement>(null);
  const [measures, setMeasures] = useState<Measures>();

  useLayoutEffect(() => {
    const element = field.current!;
    const update = () => {
      const style = getComputedStyle(element);
      setMeasures({
        height: element.offsetHeight,
        lineHeight: parseFloat(style.lineHeight),
        padding: parseFloat(style.paddingTop),
        edge: parseFloat(style.borderTopWidth),
        minHeight: parseFloat(style.minHeight),
        dragged: element.style.height,
        scrolls: element.scrollHeight > element.clientHeight + 1,
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener("input", update);
    return () => {
      observer.disconnect();
      element.removeEventListener("input", update);
    };
  }, [rows, resize, version]);

  return (
    <div className="explain">
      <div className="explain__controls">
        <Slider label="Rows" value={rows} min={1} max={8} step={1} onChange={setRows} />
        <SegmentedControl label="Resize" name="text-area-resize" value={resize} onValueChange={(value) => setResize(value as TextAreaResize)}>
          <Segment value="vertical">Vertical</Segment>
          <Segment value="none">None</Segment>
        </SegmentedControl>
      </div>
      <TextArea
        key={version}
        ref={field}
        label="Message"
        rows={rows}
        resize={resize}
        defaultValue={"Hi Ada,\nCould we talk about the new site next week?"}
      />
      {measures && (
        <ul className="explain__facts">
          <li>
            {measures.dragged ? (
              <>
                It's {fixed(measures.height, 0)} px tall, because it was dragged: the browser wrote{" "}
                <code>height: {measures.dragged}</code> into its <code>style</code> attribute.
              </>
            ) : (
              <>
                It's {fixed(measures.height, 0)} px tall: {rows} {rows === 1 ? "row" : "rows"} × {fixed(measures.lineHeight, 0)} px
                line height, plus {fixed(measures.padding, 0)} px padding and {fixed(measures.edge, 0)} px edge above and below.
              </>
            )}
          </li>
          <li>
            It never gets shorter than <code>min-height</code>, which is <code>--control-md</code>: {fixed(measures.minHeight, 0)} px.
          </li>
          <li>{measures.scrolls ? "The text is taller than the box, so it scrolls." : "The text fits, so nothing scrolls."}</li>
        </ul>
      )}
      <Button variant="secondary" className="justify-self-start" onClick={() => setVersion((count) => count + 1)}>
        Start the demo again
      </Button>
    </div>
  );
}
