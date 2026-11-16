import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/Button";
import { FileInput } from "@/components/FileInput";

/* Live demos for FileInput's "How it works" page. They render the real FileInput, so what they show is what ships. */

const MAX_BYTES = 5 * 1024 * 1024;
const KINDS = [".pdf", ".doc", ".docx"];

/** What's wrong with the chosen files, in the words docs/brand/files.md gives, or nothing */
function problemWith(files: File[]): string | undefined {
  const file = files[0];
  if (!file || file.size === 0) return "Choose a résumé to upload.";
  if (!KINDS.some((kind) => file.name.toLowerCase().endsWith(kind))) return "Choose a PDF or Word document.";
  if (file.size > MAX_BYTES) return "Choose a file smaller than 5 MB.";
  return undefined;
}

const size = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

/**
 * A required résumé field in a real form that checks the file when the form is submitted, then, after a failed submit,
 * each time the choice changes, and shows what the form sent. Put it inside <Inspect>.
 */
export function ResumeForm() {
  const field = useRef<HTMLInputElement>(null);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState<string>();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get("resume");
    const files = file instanceof File ? [file] : [];
    const problem = problemWith(files);
    setChecked(true);
    setError(problem);
    if (problem) {
      setSent(undefined);
      field.current?.focus(); // one error: focus goes to its field
      return;
    }
    setSent(`The form sent resume=${files[0]!.name} (${size(files[0]!.size)}).`);
  };

  return (
    <form className="grid justify-items-start gap-3" noValidate onSubmit={submit}>
      <FileInput
        ref={field}
        className="w-full"
        label="Résumé"
        description="PDF or Word document, up to 5 MB."
        name="resume"
        accept={KINDS.join(",")}
        required
        invalid={error !== undefined}
        error={error}
        onFilesChange={(files) => {
          if (checked) setError(problemWith(files));
          setSent(undefined);
        }}
      />
      <Button type="submit" variant="secondary">Send application</Button>
      <output>{sent}</output>
    </form>
  );
}
