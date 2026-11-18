import { useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { flushSync } from "react-dom";

interface Options<T> {
  /** The controlled value, `null` for none, or `undefined` when uncontrolled */
  value: T | null | undefined;
  /** Where an uncontrolled control starts, and goes back to on a form reset */
  defaultValue: T | undefined;
  /** The element holding the control (and any hidden radio inputs); the form is found from it */
  groupRef: RefObject<HTMLElement | null>;
  /** The id of a `<form>` the control submits with, when it sits outside that form */
  form: string | undefined;
}

/**
 * The value a group of radios shows (RadioGroup, SegmentedControl, Rating), or RatingSlider's slider, kept in step with
 * a form reset. The component passes `shown` to Base UI as `value` every time, so Base UI never keeps a value of its
 * own, and calls `setOwnValue` when an uncontrolled value changes.
 *
 * A form reset puts each hidden radio back as it was when the page loaded, but Base UI's state doesn't follow: the
 * radios kept showing the last choice while the form sent the first one, and a slider keeps its value through a reset.
 * So once the browser has reset the fields, an uncontrolled control goes back to `defaultValue` (or none), a
 * controlled one keeps `value`, and any hidden radios are set to match. No change is reported: the person didn't
 * choose anything, and a page that wants to know listens for the form's reset itself. Internal: not exported from the
 * package.
 */
export function useResettableValue<T extends string | number>({ value, defaultValue, groupRef, form }: Options<T>) {
  const controlled = value !== undefined;
  const [ownValue, setOwnValue] = useState<T | null>(defaultValue ?? null);
  const shown = controlled ? value : ownValue;

  const latest = useRef({ controlled, value, defaultValue });
  latest.current = { controlled, value, defaultValue };

  // A layout effect, so a reset straight after the first render is heard. The reset event fires before the browser
  // resets the fields, so the work waits for it.
  useLayoutEffect(() => {
    const group = groupRef.current;
    const formElement = form ? group?.ownerDocument.getElementById(form) : group?.closest("form");
    if (!(formElement instanceof HTMLFormElement)) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onReset = () => {
      timer = setTimeout(() => {
        const now = latest.current;
        const target = now.controlled ? (now.value ?? null) : (now.defaultValue ?? null);
        if (!now.controlled) flushSync(() => setOwnValue(target));
        for (const input of groupRef.current?.querySelectorAll<HTMLInputElement>('input[type="radio"]') ?? []) {
          input.checked = target !== null && input.value === String(target);
        }
      }, 0);
    };
    formElement.addEventListener("reset", onReset);
    return () => {
      formElement.removeEventListener("reset", onReset);
      clearTimeout(timer);
    };
  }, [controlled, form, groupRef]);

  return { controlled, shown, setOwnValue };
}
