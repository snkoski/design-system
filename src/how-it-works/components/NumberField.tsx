import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/Button";
import { NumberField } from "@/components/NumberField";

/* Live demos for NumberField's "How it works" page. They render the real NumberField, so what they show is what ships. */

function problemWith(score: number | null) {
  if (score === null) return "Enter a score.";
  if (score < 0 || score > 100) return "Enter a number from 0 to 100.";
  return undefined;
}

/**
 * A required score from 0 to 100 in a real form that checks itself when the form is submitted, then, after a failed
 * submit, each time it changes, and shows what the form sent. Put it inside <Inspect>.
 */
export function ScoreForm() {
  const field = useRef<HTMLInputElement>(null);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState<string>();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const raw = String(new FormData(event.currentTarget).get("score") ?? "");
    const problem = problemWith(raw === "" ? null : Number(raw));
    setChecked(true);
    setError(problem);
    if (problem) {
      setSent(undefined);
      field.current?.focus(); // one error: focus goes to its field
      return;
    }
    setSent(`The form sent score=${raw}.`);
  };

  return (
    <form className="grid justify-items-start gap-3" noValidate onSubmit={submit}>
      <NumberField
        ref={field}
        className="w-full"
        label="Score"
        name="score"
        min={0}
        max={100}
        step={5}
        required
        description="From 0 to 100."
        invalid={error !== undefined}
        error={error}
        onValueChange={(score) => {
          if (checked) setError(problemWith(score));
        }}
      />
      <Button type="submit" variant="secondary">
        Save score
      </Button>
      <output>{sent}</output>
    </form>
  );
}
