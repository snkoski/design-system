import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/Button";
import { NativeSelect } from "@/components/NativeSelect";
import type { NativeSelectGroup, NativeSelectOption } from "@/components/NativeSelect";

/* Live demos for NativeSelect's "How it works" page. They render the real NativeSelect, so what they show is what ships. */

const statuses: (NativeSelectOption | NativeSelectGroup)[] = [
  { value: "saved", label: "Saved" },
  {
    label: "In progress",
    options: [
      { value: "applied", label: "Applied" },
      { value: "interview", label: "Interview" },
    ],
  },
  {
    label: "Closed",
    options: [
      { value: "offer", label: "Offer" },
      { value: "rejected", label: "Rejected" },
      { value: "ghosted", label: "No reply", disabled: true },
    ],
  },
];

/**
 * A required status field in a real form that checks itself when the form is submitted, then, after a failed submit,
 * each time it changes, and shows what the form sent. Put it inside <Inspect>.
 */
export function StatusForm() {
  const field = useRef<HTMLSelectElement>(null);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState<string>();
  const problemWith = (status: string) => (status === "" ? "Choose a status." : undefined);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const status = String(new FormData(event.currentTarget).get("status") ?? "");
    const problem = problemWith(status);
    setChecked(true);
    setError(problem);
    if (problem) {
      setSent(undefined);
      field.current?.focus(); // one error: focus goes to its field
      return;
    }
    setSent(`The form sent status=${status}.`);
  };

  return (
    <form className="grid justify-items-start gap-3" noValidate onSubmit={submit}>
      <NativeSelect
        ref={field}
        className="w-full"
        label="Status"
        name="status"
        options={statuses}
        placeholder="Choose a status"
        required
        description="Where the application stands."
        invalid={error !== undefined}
        error={error}
        onValueChange={(status) => {
          if (checked) setError(problemWith(status));
        }}
      />
      <Button type="submit" variant="secondary">
        Save status
      </Button>
      <output>{sent}</output>
    </form>
  );
}
