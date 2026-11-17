import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import type { ChangeEvent, InputHTMLAttributes, ReactElement, ReactNode, Ref } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, expectTypeOf, it, onTestFinished, vi } from "vitest";
import { takeWarnings } from "@tests/warnings";
import { FileInput } from "@/components/FileInput/FileInput";
import type { FileInputProps, FileInputSize } from "@/components/FileInput/FileInput";

const getInput = (container: HTMLElement) => container.querySelector<HTMLInputElement>('input[type="file"]')!;
const getBox = (container: HTMLElement) => container.querySelector<HTMLElement>(".file-input__box")!;
const queryRemove = () => screen.queryByRole("button", { name: /^Remove/ });
const pdf = (name = "cv.pdf") => new File(["%PDF"], name, { type: "application/pdf" });

/** Server-rendered HTML, before any JavaScript runs, attached to the page until the test ends. */
function serverHtml(element: ReactElement) {
  const host = document.createElement("div");
  host.innerHTML = renderToString(element);
  document.body.append(host);
  onTestFinished(() => host.remove());
  return host;
}

describe("FileInput", () => {
  describe("rendering", () => {
    it("draws its own icon and words before the input, hidden from screen readers", () => {
      const { container } = render(<FileInput label="Résumé" description="PDF, up to 5 MB." />);
      const face = getBox(container).querySelector(".file-input__face");
      expect(face).toBeInTheDocument();
      expect(face).toHaveAttribute("aria-hidden", "true");
      expect(face?.querySelector("svg.file-input__upload")).toBeInTheDocument();
      expect(face?.nextElementSibling).toBe(getInput(container));
      expect(getInput(container)).toHaveAccessibleName("Résumé");
      expect(getInput(container)).toHaveAccessibleDescription("PDF, up to 5 MB.");
    });

    it.each([
      [[], "Choose file"],
      [["cv.pdf"], "cv.pdf"],
      [["essay.pdf", "letter.pdf"], "2 files"],
    ])("with %j chosen, says %s", async (names, words) => {
      const user = userEvent.setup();
      const { container } = render(<FileInput label="Résumé" multiple />);
      if (names.length > 0) await user.upload(getInput(container), names.map((name) => pdf(name)));
      expect(getBox(container).querySelector(".file-input__words")).toHaveTextContent(new RegExp(`^${words.replace(".", "\\.")}$`));
    });

    // After a form reset too, which needs a real browser: see the FormReset story
    it("says Choose file again after Remove", async () => {
      const user = userEvent.setup();
      const { container } = render(<FileInput label="Résumé" />);
      const words = () => getBox(container).querySelector(".file-input__words");
      await user.upload(getInput(container), pdf());
      expect(words()).toHaveTextContent("cv.pdf");
      await user.click(queryRemove()!);
      expect(words()).toHaveTextContent("Choose file");
    });

    it("renders a native file input named by its label", () => {
      const { container } = render(<FileInput label="Résumé" />);
      expect(screen.getByLabelText("Résumé")).toBe(getInput(container));
      expect(getInput(container).tagName).toBe("INPUT");
      expect(getInput(container)).toHaveAttribute("type", "file");
    });

    it("renders the input with the shared and its own class, inside the box", () => {
      const { container } = render(<FileInput label="Résumé" />);
      expect(getInput(container)).toHaveClass("text-field__control", "file-input__control");
      expect(getBox(container)).toContainElement(getInput(container));
    });

    it("renders the label as a <label> pointing at the input", () => {
      const { container } = render(<FileInput label="Résumé" />);
      const label = screen.getByText("Résumé").closest("label");
      expect(label).toHaveClass("field-label", "file-input__label");
      expect(label).toHaveAttribute("for", getInput(container).id);
    });

    it("defaults to the md size, on the outer element with the shared text field class", () => {
      const { container } = render(<FileInput label="Résumé" />);
      expect(container.firstElementChild).toHaveClass("text-field", "file-input");
      expect(container.firstElementChild).toHaveAttribute("data-size", "md");
    });

    it.each(["md", "lg"] as const)("maps size=%s to data-size on the outer element", (size) => {
      const { container } = render(<FileInput label="Résumé" size={size} />);
      expect(container.firstElementChild).toHaveAttribute("data-size", size);
    });

    it("never sets the native size attribute", () => {
      const { container } = render(<FileInput label="Résumé" size="lg" />);
      expect(getInput(container)).toBeInTheDocument();
      expect(getInput(container)).not.toHaveAttribute("size");
    });

    it("can be named by aria-label alone, with no <label> element", () => {
      const { container } = render(<FileInput aria-label="Profile photo" />);
      expect(getInput(container)).toHaveAccessibleName("Profile photo");
      expect(container.querySelector("label")).toBeNull();
    });

    it("puts the description and then the error between the label and the box", () => {
      const { container } = render(
        <FileInput label="Résumé" description="PDF or Word document, up to 5 MB." invalid error="Choose a file smaller than 5 MB." />,
      );
      const parts = ["file-input__label", "file-input__description", "file-input__error", "file-input__box"];
      const order = [...container.querySelectorAll(parts.map((part) => `.${part}`).join(", "))].map((el) =>
        parts.find((part) => el.classList.contains(part)),
      );
      expect(order).toEqual(parts);
    });

    it("puts the shared field class on the description", () => {
      render(<FileInput label="Résumé" description="PDF or Word document, up to 5 MB." />);
      expect(screen.getByText("PDF or Word document, up to 5 MB.")).toHaveClass("field-description", "file-input__description");
    });

    it("applies className to the outer wrapper, next to its own class", () => {
      const { container } = render(<FileInput label="Résumé" className="mt-4" />);
      expect(container.firstElementChild).toHaveClass("file-input", "mt-4");
    });

    it("passes accept, multiple, and capture to the input", () => {
      const { container } = render(<FileInput label="Photos" accept="image/*" multiple capture="environment" />);
      expect(getInput(container)).toHaveAttribute("accept", "image/*");
      expect(getInput(container)).toHaveAttribute("multiple");
      expect(getInput(container)).toHaveAttribute("capture", "environment");
    });

    it("chooses one file by default", () => {
      const { container } = render(<FileInput label="Résumé" />);
      expect(getInput(container)).toBeInTheDocument();
      expect(getInput(container)).not.toHaveAttribute("multiple");
    });

    it("passes other props through to the input", () => {
      const { container } = render(<FileInput label="Résumé" title="Your latest résumé" data-testid="resume" />);
      expect(screen.getByTestId("resume")).toBe(getInput(container));
      expect(getInput(container)).toHaveAttribute("title", "Your latest résumé");
    });

    it("never uses modifier classes", () => {
      const { container } = render(<FileInput label="Résumé" size="lg" invalid disabled error="Choose a résumé to upload." />);
      expect(getBox(container)).toBeInTheDocument();
      expect(container.innerHTML).not.toMatch(/file-input--/);
    });
  });

  describe("choosing files", () => {
    it("calls onFilesChange with the chosen file", async () => {
      const onFilesChange = vi.fn();
      const user = userEvent.setup();
      const { container } = render(<FileInput label="Résumé" onFilesChange={onFilesChange} />);
      const file = pdf();
      await user.upload(getInput(container), file);
      expect(onFilesChange).toHaveBeenCalledOnce();
      expect(onFilesChange.mock.calls[0]![0]).toEqual([file]);
      expect(onFilesChange.mock.calls[0]![1].target).toBe(getInput(container));
    });

    it("calls onFilesChange with every file when several are chosen", async () => {
      const onFilesChange = vi.fn();
      const user = userEvent.setup();
      const { container } = render(<FileInput label="Writing samples" multiple onFilesChange={onFilesChange} />);
      const files = [pdf("essay.pdf"), pdf("letter.pdf")];
      await user.upload(getInput(container), files);
      expect(onFilesChange).toHaveBeenCalledWith(files, expect.anything());
    });

    it("calls onChange first, then onFilesChange", async () => {
      const calls: string[] = [];
      const user = userEvent.setup();
      const { container } = render(
        <FileInput label="Résumé" onChange={() => calls.push("onChange")} onFilesChange={() => calls.push("onFilesChange")} />,
      );
      await user.upload(getInput(container), pdf());
      expect(calls).toEqual(["onChange", "onFilesChange"]);
    });

    it("works with only onChange, reading the files from the event", async () => {
      let names: string[] = [];
      const user = userEvent.setup();
      const { container } = render(
        <FileInput label="Résumé" onChange={(event) => (names = [...(event.target.files ?? [])].map((file) => file.name))} />,
      );
      await user.upload(getInput(container), pdf());
      expect(names).toEqual(["cv.pdf"]);
    });

    it("focuses the input when the label is clicked, without opening the picker", async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      const { container } = render(<FileInput label="Résumé" onClick={onClick} />);
      await user.click(screen.getByText("Résumé"));
      expect(getInput(container)).toHaveFocus();
      expect(onClick).not.toHaveBeenCalled();
      await user.click(getInput(container));
      expect(onClick).toHaveBeenCalledOnce();
    });

    it("lets a link in the label work when it's clicked", async () => {
      const user = userEvent.setup();
      let prevented: boolean | undefined;
      const listen = (event: MouseEvent) => {
        prevented = event.defaultPrevented;
        event.preventDefault(); // jsdom can't navigate
      };
      document.addEventListener("click", listen);
      onTestFinished(() => document.removeEventListener("click", listen));
      render(
        <FileInput
          label={
            <>
              Résumé (<a href="#formats">which formats</a>)
            </>
          }
        />,
      );
      await user.click(screen.getByRole("link", { name: "which formats" }));
      expect(prevented).toBe(false);
    });

    it("doesn't focus or open a disabled input when the label is clicked", async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      const { container } = render(<FileInput label="Résumé" disabled onClick={onClick} />);
      expect(getInput(container)).toBeDisabled();
      await user.click(screen.getByText("Résumé"));
      expect(getInput(container)).not.toHaveFocus();
      expect(onClick).not.toHaveBeenCalled();
    });

    it("marks the box while files are chosen", async () => {
      const user = userEvent.setup();
      const { container } = render(<FileInput label="Résumé" />);
      expect(getBox(container)).toBeInTheDocument();
      expect(getBox(container)).not.toHaveAttribute("data-has-files");
      await user.upload(getInput(container), pdf());
      expect(getBox(container)).toHaveAttribute("data-has-files");
    });
  });

  describe("Remove", () => {
    it("has no Remove button until a file is chosen", async () => {
      const user = userEvent.setup();
      const { container } = render(<FileInput label="Résumé" />);
      expect(getInput(container)).toBeInTheDocument();
      expect(queryRemove()).toBeNull();
      await user.upload(getInput(container), pdf());
      expect(queryRemove()).toBeInTheDocument();
    });

    it("names it Remove file, then the field's label, for one file", async () => {
      const user = userEvent.setup();
      const { container } = render(<FileInput label="Résumé" />);
      await user.upload(getInput(container), pdf());
      expect(queryRemove()).toHaveAccessibleName("Remove file, Résumé");
    });

    it("names it Remove files for several", async () => {
      const user = userEvent.setup();
      const { container } = render(<FileInput label="Writing samples" multiple />);
      await user.upload(getInput(container), [pdf("essay.pdf"), pdf("letter.pdf")]);
      expect(queryRemove()).toHaveAccessibleName("Remove files, Writing samples");
    });

    it("builds its name from the field's aria-label when there's no visible label", async () => {
      const user = userEvent.setup();
      const { container } = render(<FileInput aria-label="Profile photo" />);
      await user.upload(getInput(container), pdf("me.png"));
      expect(queryRemove()).toHaveAccessibleName("Remove file, Profile photo");
    });

    it("is an inset button after the input, with its icon hidden from screen readers", async () => {
      const user = userEvent.setup();
      const { container } = render(<FileInput label="Résumé" />);
      await user.upload(getInput(container), pdf());
      const remove = queryRemove()!;
      expect(remove).toHaveClass("inset-button", "file-input__remove");
      expect(remove).toHaveAttribute("type", "button");
      expect(getInput(container).nextElementSibling).toBe(remove);
      const icon = remove.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("empties the field, reports no files, and moves focus to the input", async () => {
      const onFilesChange = vi.fn();
      const onChange = vi.fn();
      const user = userEvent.setup();
      const { container } = render(<FileInput label="Résumé" onChange={onChange} onFilesChange={onFilesChange} />);
      await user.upload(getInput(container), pdf());
      onFilesChange.mockClear();
      onChange.mockClear();
      await user.click(queryRemove()!);
      expect(getInput(container).files).toHaveLength(0);
      expect(onChange).toHaveBeenCalledOnce();
      expect(onFilesChange).toHaveBeenCalledOnce();
      expect(onFilesChange.mock.calls[0]![0]).toEqual([]);
      expect(getInput(container)).toHaveFocus();
      expect(queryRemove()).toBeNull();
      expect(getBox(container)).not.toHaveAttribute("data-has-files");
    });

    it("fires input and then change on the input, as choosing does", async () => {
      const user = userEvent.setup();
      const { container } = render(<FileInput label="Résumé" />);
      await user.upload(getInput(container), pdf());
      const events: string[] = [];
      getInput(container).addEventListener("input", () => events.push("input"));
      getInput(container).addEventListener("change", () => events.push("change"));
      await user.click(queryRemove()!);
      expect(events).toEqual(["input", "change"]);
    });

    it("is the next Tab stop after the input, and works with Enter", async () => {
      const onFilesChange = vi.fn();
      const user = userEvent.setup();
      const { container } = render(<FileInput label="Résumé" onFilesChange={onFilesChange} />);
      await user.upload(getInput(container), pdf());
      getInput(container).focus();
      await user.tab();
      expect(queryRemove()).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(onFilesChange).toHaveBeenLastCalledWith([], expect.anything());
      expect(getInput(container)).toHaveFocus();
    });

    it("works with Space too", async () => {
      const onFilesChange = vi.fn();
      const user = userEvent.setup();
      const { container } = render(<FileInput label="Résumé" onFilesChange={onFilesChange} />);
      await user.upload(getInput(container), pdf());
      queryRemove()!.focus();
      await user.keyboard(" ");
      expect(onFilesChange).toHaveBeenLastCalledWith([], expect.anything());
      expect(getInput(container)).toHaveFocus();
    });

    it("is disabled with the field", async () => {
      const onFilesChange = vi.fn();
      const user = userEvent.setup();
      const { container, rerender } = render(<FileInput label="Résumé" onFilesChange={onFilesChange} />);
      await user.upload(getInput(container), pdf());
      rerender(<FileInput label="Résumé" onFilesChange={onFilesChange} disabled />);
      const remove = queryRemove()!;
      expect(remove).toBeInTheDocument();
      expect(remove).toHaveAttribute("data-disabled");
      onFilesChange.mockClear();
      await user.click(remove);
      expect(onFilesChange).not.toHaveBeenCalled();
      expect(getInput(container).files).toHaveLength(1);
    });

    it("goes away when the field is remounted with a new key", async () => {
      const user = userEvent.setup();
      const { container, rerender } = render(<FileInput key="a" label="Résumé" />);
      await user.upload(getInput(container), pdf());
      expect(queryRemove()).toBeInTheDocument();
      rerender(<FileInput key="b" label="Résumé" />);
      expect(getInput(container).files ?? []).toHaveLength(0);
      expect(queryRemove()).toBeNull();
    });

    // Emptying input.files for real, form reset, and a file dropped on Remove need a real browser's file list:
    // the Remove, FormReset, and DropOnRemove stories check them in Chromium.
  });

  describe("before JavaScript runs", () => {
    const field = () => <FileInput label="Résumé" name="resume" description="PDF or Word document, up to 5 MB." />;

    it("renders the browser's file input, labelled, with its description, and no Remove button", () => {
      const host = serverHtml(field());
      const input = getInput(host);
      expect(input).toHaveAttribute("name", "resume");
      expect(input).toHaveAccessibleName("Résumé");
      // Base UI links the description to the input once JavaScript runs, as it does for every field
      expect(host.querySelector(".file-input__description")).toHaveTextContent("PDF or Word document, up to 5 MB.");
      expect(getBox(host)).not.toHaveAttribute("data-has-files");
      expect(host.querySelector(".file-input__remove")).toBeNull();
    });

    it("hydrates the server HTML without a mismatch, and then reads the input's files", () => {
      const host = serverHtml(field());
      const errors = vi.spyOn(console, "error").mockImplementation(() => {});
      let root: ReturnType<typeof hydrateRoot> | undefined;
      act(() => {
        root = hydrateRoot(host, field());
      });
      onTestFinished(() => act(() => root?.unmount()));
      expect(errors).not.toHaveBeenCalled();
      expect(getInput(host)).toBeInTheDocument();
      expect(host.querySelector(".file-input__remove")).toBeNull();
    });
  });

  describe("keyboard", () => {
    it("is reachable with Tab", async () => {
      const user = userEvent.setup();
      const { container } = render(<FileInput label="Résumé" />);
      await user.tab();
      expect(getInput(container)).toHaveFocus();
    });

    it("is skipped by Tab when disabled", async () => {
      const user = userEvent.setup();
      render(
        <>
          <FileInput label="Off" disabled />
          <FileInput label="On" />
        </>,
      );
      await user.tab();
      expect(screen.getByLabelText("On")).toHaveFocus();
    });
  });

  describe("disabled", () => {
    it("is marked disabled, with the label marked for dimming", () => {
      const { container } = render(<FileInput label="Résumé" disabled />);
      expect(getInput(container)).toBeDisabled();
      expect(container.firstElementChild).toHaveAttribute("data-disabled");
      expect(screen.getByText("Résumé").closest("label")).toHaveAttribute("data-disabled");
    });

    it("doesn't take a file", async () => {
      const onFilesChange = vi.fn();
      const user = userEvent.setup();
      const { container } = render(<FileInput label="Résumé" disabled onFilesChange={onFilesChange} />);
      expect(getInput(container)).toBeDisabled();
      await user.upload(getInput(container), pdf());
      expect(onFilesChange).not.toHaveBeenCalled();
    });
  });

  describe("required and invalid", () => {
    it("is required for assistive technology and the form", () => {
      const { container } = render(<FileInput label="Résumé" required />);
      expect(getInput(container)).toBeRequired();
    });

    it("is not required by default", () => {
      const { container } = render(<FileInput label="Résumé" />);
      expect(getInput(container)).toBeInTheDocument();
      expect(getInput(container)).not.toBeRequired();
    });

    it("is announced as invalid", () => {
      const { container } = render(<FileInput label="Résumé" invalid />);
      expect(getInput(container)).toHaveAttribute("aria-invalid", "true");
    });

    it("is valid by default", () => {
      const { container } = render(<FileInput label="Résumé" />);
      expect(getInput(container)).toBeInTheDocument();
      expect(getInput(container)).not.toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("description and error", () => {
    it("links the description to the input, and keeps it out of the name", () => {
      const { container } = render(<FileInput label="Résumé" description="PDF or Word document, up to 5 MB." />);
      expect(getInput(container)).toHaveAccessibleDescription("PDF or Word document, up to 5 MB.");
      expect(getInput(container)).toHaveAccessibleName("Résumé");
    });

    it("shows the error, linked to the input, when invalid", () => {
      const { container } = render(<FileInput label="Résumé" invalid error="Choose a résumé to upload." />);
      expect(screen.getByText("Choose a résumé to upload.")).toBeInTheDocument();
      expect(getInput(container)).toHaveAccessibleDescription("Error: Choose a résumé to upload.");
    });

    it("gives the error an icon that is hidden from screen readers", () => {
      render(<FileInput label="Résumé" invalid error="Choose a résumé to upload." />);
      const error = screen.getByText("Choose a résumé to upload.").closest(".file-input__error");
      expect(error).toBeInTheDocument();
      expect(error?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });

    it("hides the error when the field is valid", () => {
      const { container } = render(<FileInput label="Résumé" error="Choose a résumé to upload." />);
      expect(getInput(container)).toBeInTheDocument();
      expect(screen.queryByText("Choose a résumé to upload.")).not.toBeInTheDocument();
      expect(getInput(container)).toHaveAccessibleDescription("");
    });

    it("reads the description and the error together", () => {
      const { container } = render(
        <FileInput label="Résumé" invalid description="PDF or Word document, up to 5 MB." error="Choose a file smaller than 5 MB." />,
      );
      expect(getInput(container)).toHaveAccessibleDescription("PDF or Word document, up to 5 MB. Error: Choose a file smaller than 5 MB.");
    });

    it("adds a consumer's aria-describedby to the description and error, not in their place", () => {
      const { container } = render(
        <>
          <p id="resume-note">We keep it for 6 months.</p>
          <FileInput
            label="Résumé"
            invalid
            description="PDF or Word document, up to 5 MB."
            error="Choose a file smaller than 5 MB."
            aria-describedby="resume-note"
          />
        </>,
      );
      const description = (getInput(container).getAttribute("aria-describedby") ?? "").split(" ");
      expect(description).toContain("resume-note");
      expect(getInput(container)).toHaveAccessibleDescription(expect.stringContaining("PDF or Word document, up to 5 MB."));
      expect(getInput(container)).toHaveAccessibleDescription(expect.stringContaining("Error: Choose a file smaller than 5 MB."));
      expect(getInput(container)).toHaveAccessibleDescription(expect.stringContaining("We keep it for 6 months."));
    });
  });

  describe("in a form", () => {
    const getForm = () => screen.getByTestId("form") as HTMLFormElement;

    it("submits under its name, as an empty file when nothing is chosen", () => {
      render(
        <form data-testid="form">
          <FileInput label="Résumé" name="resume" />
        </form>,
      );
      const sent = new FormData(getForm()).get("resume");
      expect(sent).toBeInstanceOf(File);
      expect((sent as File).size).toBe(0);
    });

    it("does not submit when disabled", () => {
      const { container } = render(
        <form data-testid="form">
          <FileInput label="Résumé" name="resume" disabled />
        </form>,
      );
      expect(getInput(container)).toBeDisabled();
      expect([...new FormData(getForm()).keys()]).toEqual([]);
    });

    it("fails the form's own validation when required and empty", () => {
      render(
        <form data-testid="form">
          <FileInput label="Résumé" name="resume" required />
        </form>,
      );
      expect(getForm().checkValidity()).toBe(false);
    });

    // What FormData holds after a choice, a Remove, and a reset needs a real browser's file list: see the stories.
  });

  describe("id and form", () => {
    it("puts id on the input, and the label points to it", () => {
      const { container } = render(<FileInput label="Résumé" id="resume" />);
      expect(getInput(container)).toHaveAttribute("id", "resume");
      expect(screen.getByText("Résumé").closest("label")).toHaveAttribute("for", "resume");
    });

    it("can be labelled by an outside <label htmlFor>, because id is on the input", () => {
      const { container } = render(
        <>
          <label htmlFor="photo-field">Outside label</label>
          <FileInput id="photo-field" aria-label="Profile photo" />
        </>,
      );
      expect(screen.getByLabelText("Outside label")).toBe(getInput(container));
    });

    it("submits with a form it sits outside of, through form", () => {
      render(
        <>
          <form id="application" data-testid="outside-form" />
          <FileInput label="Résumé" name="resume" form="application" />
        </>,
      );
      const form = screen.getByTestId("outside-form") as HTMLFormElement;
      expect([...new FormData(form).keys()]).toEqual(["resume"]);
    });
  });

  describe("props that don't apply", () => {
    // Left out of the type; passed anyway from JavaScript, they'd throw or silently do the wrong thing
    const asProps = (props: Record<string, unknown>) => props as unknown as FileInputProps;

    it("drops value and defaultValue, which a file input can't take", () => {
      const { container } = render(<FileInput {...asProps({ label: "Résumé", value: "cv.pdf", defaultValue: "cv.pdf" })} />);
      expect(getInput(container)).toBeInTheDocument();
      expect(getInput(container)).toHaveValue("");
    });

    it("drops readOnly, which browsers ignore on a file input", () => {
      const { container } = render(<FileInput {...asProps({ label: "Résumé", readOnly: true })} />);
      expect(getInput(container)).toBeInTheDocument();
      expect(getInput(container)).not.toHaveAttribute("readonly");
      expect(screen.queryByText("Read only")).toBeNull();
    });

    it("drops onValueChange, which would get the browser's fake path", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      const { container } = render(<FileInput {...asProps({ label: "Résumé", onValueChange })} />);
      await user.upload(getInput(container), pdf());
      expect(getInput(container).files).toHaveLength(1);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("keeps type=file, render, and children out", () => {
      const { container } = render(
        <FileInput {...asProps({ label: "Résumé", type: "text", render: <textarea />, children: "Extra" })} />,
      );
      expect(getInput(container)).toHaveAttribute("type", "file");
      expect(container.querySelector("textarea")).toBeNull();
      expect(container).not.toHaveTextContent("Extra");
    });
  });

  describe("refs", () => {
    it("forwards ref to the input, which holds the chosen files", async () => {
      const ref = createRef<HTMLInputElement>();
      const user = userEvent.setup();
      const { container } = render(<FileInput label="Résumé" ref={ref} />);
      expect(ref.current).toBe(getInput(container));
      await user.upload(getInput(container), pdf());
      expect(ref.current?.files?.[0]?.name).toBe("cv.pdf");
    });

    it("runs a callback ref's cleanup when the input goes, and never calls it with null", () => {
      const calls: (HTMLInputElement | null)[] = [];
      const cleanup = vi.fn();
      const ref = (element: HTMLInputElement | null) => {
        calls.push(element);
        return cleanup;
      };
      const { container, unmount } = render(<FileInput label="Résumé" ref={ref} />);
      expect(calls).toEqual([getInput(container)]);
      expect(cleanup).not.toHaveBeenCalled();
      unmount();
      expect(cleanup).toHaveBeenCalledOnce();
      expect(calls).toHaveLength(1);
    });

    it("calls a callback ref with no cleanup with the input, then null when it goes", () => {
      const calls: (HTMLInputElement | null)[] = [];
      const { container, unmount } = render(<FileInput label="Résumé" ref={(element) => void calls.push(element)} />);
      expect(calls).toEqual([getInput(container)]);
      unmount();
      expect(calls).toEqual([expect.any(HTMLInputElement), null]);
    });

    it("cleans up the old callback ref and calls the new one when the ref changes", () => {
      const first = vi.fn();
      const second = vi.fn();
      const { container, rerender } = render(<FileInput label="Résumé" ref={() => first} />);
      rerender(<FileInput label="Résumé" ref={() => second} />);
      expect(first).toHaveBeenCalledOnce();
      expect(second).not.toHaveBeenCalled();
      expect(getInput(container)).toBeInTheDocument();
    });

    it("empties an object ref when the input goes", () => {
      const ref = createRef<HTMLInputElement>();
      const { container, unmount } = render(<FileInput label="Résumé" ref={ref} />);
      expect(ref.current).toBe(getInput(container));
      unmount();
      expect(ref.current).toBeNull();
    });
  });

  describe("types", () => {
    it("requires a visible label or an aria-label", () => {
      expectTypeOf<{ label: string }>().toExtend<FileInputProps>();
      expectTypeOf<{ "aria-label": string }>().toExtend<FileInputProps>();
      expectTypeOf<object>().not.toExtend<FileInputProps>();
      expectTypeOf<{ description: string }>().not.toExtend<FileInputProps>();
      expectTypeOf<{ label: undefined }>().not.toExtend<FileInputProps>();
      expectTypeOf<{ label: null }>().not.toExtend<FileInputProps>();
      expectTypeOf<{ label: string | undefined }>().not.toExtend<FileInputProps>();
    });

    it("leaves out what a file input can't take: a value, read-only, and text field attributes", () => {
      expectTypeOf<FileInputProps>().not.toHaveProperty("value");
      expectTypeOf<FileInputProps>().not.toHaveProperty("defaultValue");
      expectTypeOf<FileInputProps>().not.toHaveProperty("onValueChange");
      expectTypeOf<FileInputProps>().not.toHaveProperty("readOnly");
      expectTypeOf<FileInputProps>().not.toHaveProperty("type");
      expectTypeOf<FileInputProps>().not.toHaveProperty("placeholder");
      expectTypeOf<FileInputProps>().not.toHaveProperty("autoComplete");
      expectTypeOf<FileInputProps>().not.toHaveProperty("inputMode");
      expectTypeOf<FileInputProps>().not.toHaveProperty("pattern");
      expectTypeOf<FileInputProps>().not.toHaveProperty("min");
      expectTypeOf<FileInputProps>().not.toHaveProperty("max");
      expectTypeOf<FileInputProps>().not.toHaveProperty("step");
      expectTypeOf<FileInputProps>().not.toHaveProperty("maxLength");
      expectTypeOf<FileInputProps>().not.toHaveProperty("minLength");
      expectTypeOf<FileInputProps>().not.toHaveProperty("list");
      expectTypeOf<FileInputProps>().not.toHaveProperty("checked");
      expectTypeOf<FileInputProps>().not.toHaveProperty("defaultChecked");
      expectTypeOf<FileInputProps>().not.toHaveProperty("render");
      expectTypeOf<FileInputProps>().not.toHaveProperty("children");
    });

    it("takes the two sizes, the browser's capture values, and reports files as an array", () => {
      expectTypeOf<FileInputProps["size"]>().toEqualTypeOf<FileInputSize | undefined>();
      expectTypeOf<FileInputSize>().toEqualTypeOf<"md" | "lg">();
      expectTypeOf<FileInputProps["capture"]>().toEqualTypeOf<InputHTMLAttributes<HTMLInputElement>["capture"]>();
      expectTypeOf<NonNullable<FileInputProps["onFilesChange"]>>().parameter(0).toEqualTypeOf<File[]>();
      expectTypeOf<NonNullable<FileInputProps["onFilesChange"]>>().parameter(1).toEqualTypeOf<ChangeEvent<HTMLInputElement>>();
    });

    it("types the ref as an input and className as a string", () => {
      expectTypeOf<FileInputProps["ref"]>().toEqualTypeOf<Ref<HTMLInputElement> | undefined>();
      expectTypeOf<FileInputProps["className"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<FileInputProps["description"]>().toEqualTypeOf<ReactNode>();
    });
  });

  describe("dev warnings", () => {
    it("warns when the label is empty and there's no aria-label", () => {
      const { container } = render(<FileInput label="" />);
      expect(getInput(container)).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        "[design-system] FileInput: has no accessible name, so screen readers announce it without one. Give it a label or an aria-label.",
      ]);
    });
  });
});
