import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { CheckboxGroup } from "@/components/CheckboxGroup";
import { Entries, useSubmitted } from "@/how-it-works/components/Checkbox";
import "@/how-it-works/demo.css";
import "@/how-it-works/components/checkbox.css";

/* Live demos for Checkbox group's "How it works" page. They render the real components, so what they show is what
   runs. */

/**
 * A group that asks for at least one choice, checked when the form is sent: the error appears on the group and every
 * option if nothing is ticked, and goes once something is. For Inspect, to watch the attributes change.
 */
export function RequiredServices() {
  const [value, setValue] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const invalid = sent && value.length === 0;
  return (
    <form
      className="checkbox-demo__form"
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
    >
      <CheckboxGroup
        label="Services (required)"
        name="services"
        value={value}
        onValueChange={setValue}
        invalid={invalid}
        error="Choose at least one service."
      >
        <Checkbox value="design">Design</Checkbox>
        <Checkbox value="development">Development</Checkbox>
      </CheckboxGroup>
      <Button type="submit">Request a quote</Button>
    </form>
  );
}

/**
 * A group with a "select all" box and a disabled option, and what the form would send: one entry per ticked option,
 * all under the group's name. The parent box and the disabled option never send.
 */
export function ServicesForm() {
  const form = useRef<HTMLFormElement>(null);
  const { entries } = useSubmitted(form);
  const services = entries.filter(([name]) => name === "services").map(([, value]) => value);
  return (
    <div className="explain">
      <p className="explain__note">
        Tick and untick the options, or use "All services". Under them is what the form would send right now, read
        with <code>new FormData(form)</code>.
      </p>
      <form ref={form} onSubmit={(event) => event.preventDefault()}>
        <CheckboxGroup
          label="Services"
          name="services"
          allValues={["design", "development", "writing"]}
          defaultValue={["design", "writing"]}
        >
          <Checkbox parent>All services</Checkbox>
          <Checkbox value="design">Design</Checkbox>
          <Checkbox value="development">Development</Checkbox>
          <Checkbox value="writing" disabled>
            Writing (fully booked)
          </Checkbox>
        </CheckboxGroup>
      </form>
      <Entries entries={entries} />
      <p className="explain__readout">
        On a server, or with <code>formData.getAll("services")</code>, that's the list{" "}
        <code>[{services.map((service) => `"${service}"`).join(", ")}]</code>.
      </p>
    </div>
  );
}
