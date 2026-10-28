import { useLayoutEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { fixed } from "../demo";
import "./input.css";

/* Live demos for Input's "How it works" page. They render the real Input, so what they show is what ships. */

/** What's wrong with an email address, in words, or nothing when it looks right */
function problemWith(email: string) {
  if (email.trim() === "") return "Enter your email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter an email address like ada@example.com.";
  return undefined;
}

/**
 * An email field in a real form that checks itself the way docs/brand/forms.md says: when the form is submitted,
 * then again each time you leave the field. Put it inside <Inspect> to watch `aria-invalid` and `aria-describedby`
 * change.
 */
export function EmailForm() {
  const field = useRef<HTMLInputElement>(null);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState<string>();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const problem = problemWith(String(data.get("email") ?? ""));
    setChecked(true);
    setError(problem);
    if (problem) {
      setSent(undefined);
      field.current?.focus(); // one error: focus goes to its field
      return;
    }
    setSent(`The form sent ${[...data].map(([key, value]) => `${key}=${String(value)}`).join(", ")}.`);
  };

  return (
    <form className="grid justify-items-start gap-3" noValidate onSubmit={submit}>
      <Input
        ref={field}
        className="w-full"
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        description="We only use it to reply to you."
        invalid={error !== undefined}
        error={error}
        onBlur={(event) => {
          if (checked) setError(problemWith(event.currentTarget.value));
        }}
      />
      <Button type="submit" variant="secondary">
        Save email
      </Button>
      <output>{sent}</output>
    </form>
  );
}

const MODES = [
  { name: "With a mouse", pointer: "fine" },
  { name: "On touch", pointer: "coarse" },
  { name: "Compact, with a mouse", pointer: "fine", density: "compact" },
  { name: "Compact, on touch", pointer: "coarse", density: "compact" },
] as const;

/** Heights in px, measured from the page: each column's two inputs and its --target-min */
type Heights = Record<string, { md: number; lg: number; target: number }>;

/** The px value of a length token where `parent` is, so its data-pointer and data-density count */
function measure(token: string, parent: HTMLElement) {
  const probe = document.createElement("div");
  probe.style.height = `var(${token})`;
  parent.append(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height;
}

/**
 * The same two inputs in four places: with a mouse, on touch (`data-pointer="coarse"`), and in compact density
 * (`data-density="compact"`) with each. Under each input is its height, measured from the page.
 */
export function PointerAndDensity() {
  const root = useRef<HTMLDivElement>(null);
  const [heights, setHeights] = useState<Heights>({});

  useLayoutEffect(() => {
    const element = root.current!;
    const update = () => {
      const next: Heights = {};
      for (const column of element.querySelectorAll<HTMLElement>("[data-mode]")) {
        const [md, lg] = [...column.querySelectorAll("input")].map((input) => input.getBoundingClientRect().height);
        next[column.dataset.mode!] = { md: md ?? 0, lg: lg ?? 0, target: measure("--target-min", column) };
      }
      setHeights(next);
    };
    update();
    const observer = new ResizeObserver(update);
    for (const input of element.querySelectorAll("input")) observer.observe(input);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="explain">
      <p className="explain__note">
        Each column sets the attributes above it on a wrapper. The inputs inside are the same component with the same props;
        only the tokens they read have changed.
      </p>
      <div className="how-input__columns" ref={root}>
        {MODES.map((mode) => {
          const measured = heights[mode.name];
          return (
            <div
              key={mode.name}
              className="how-input__column"
              data-mode={mode.name}
              data-pointer={mode.pointer}
              data-density={"density" in mode ? mode.density : undefined}
            >
              <p className="how-input__heading">
                {mode.name}
                <br />
                <code className="how-input__attributes">
                  data-pointer="{mode.pointer}"{"density" in mode && ` data-density="${mode.density}"`}
                </code>
              </p>
              <Input label="Medium" defaultValue="Ada Lovelace" />
              <p className="explain__readout">{measured ? `${fixed(measured.md, 0)} px tall` : "…"}</p>
              <Input label="Large" size="lg" defaultValue="Ada Lovelace" />
              <p className="explain__readout">{measured ? `${fixed(measured.lg, 0)} px tall` : "…"}</p>
              <p className="explain__readout">
                <code>--target-min</code>: {measured ? `${fixed(measured.target, 0)} px` : "…"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
