import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/Button";
import { DatePicker, isDateValue } from "@/components/DatePicker";
import { enGB } from "@/date-locales";

/* Live demos for DatePicker's "How it works" page. They render the real DatePicker, so what they show is what ships. */

const today = "2026-11-13";

function problemWith(start: string) {
  if (start === "") return "Enter a start date.";
  if (!isDateValue(start)) return "Enter a real date, like Nov 27, 2026."; // "2026-11-31" has the shape, but not the day
  if (start < "2026-11-03" || start > "2026-12-31") return "Enter a date between Nov 3 and Dec 31, 2026.";
  return undefined;
}

/**
 * A required start date in a real form that checks itself when the form is submitted, then, after a failed submit,
 * each time it changes, and shows what the form sent. Put it inside <Inspect>.
 */
export function StartDateForm() {
  const field = useRef<HTMLInputElement>(null);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState<string>();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const start = String(new FormData(event.currentTarget).get("start") ?? "");
    const problem = problemWith(start);
    setChecked(true);
    setError(problem);
    if (problem) {
      setSent(undefined);
      field.current?.focus(); // one error: focus goes to its field
      return;
    }
    setSent(`The form sent start=${start}.`);
  };

  return (
    <form className="grid justify-items-start gap-3" noValidate onSubmit={submit}>
      <DatePicker
        ref={field}
        className="w-full"
        label="Start date"
        name="start"
        required
        min="2026-11-03"
        max="2026-12-31"
        today={today}
        description="Between Nov 3 and Dec 31, 2026. For example, Nov 27, 2026."
        invalid={error !== undefined}
        error={error}
        onValueChange={(start) => {
          if (checked) setError(problemWith(start));
        }}
      />
      <Button type="submit" variant="secondary">
        Save start date
      </Button>
      <output>{sent}</output>
    </form>
  );
}

/** The same date in en-US and en-GB, side by side: the shown format and the first day of the week follow `locale`. */
export function LocalePair() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <DatePicker label="United States (default)" defaultValue="2026-11-12" today={today} />
      <DatePicker label="United Kingdom" locale={enGB} defaultValue="2026-11-12" today={today} />
    </div>
  );
}
