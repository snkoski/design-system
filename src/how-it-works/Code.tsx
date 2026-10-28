import { Source } from "@storybook/addon-docs/blocks";
import { snippet } from "./sources";
import "./how-it-works.css";

interface CodeProps {
  /** The file, from src, such as "components/Switch/Switch.tsx" or "experiments/Bounce/physics.ts" */
  file: string;
  /**
   * A top-level function, constant, interface, or type in it, or in a CSS file, a rule by how it starts (".switch__thumb",
   * "@media (forced-colors: active)"). Leave it out to show the whole file.
   */
  name?: string;
}

/**
 * A piece of the real source code, read from the file when the page loads, so it can't go out of date.
 * For "How it works" pages.
 */
export function Code({ file, name }: CodeProps) {
  return (
    <figure className="how-code">
      <figcaption className="how-code__caption">
        {name && (
          <>
            <code>{name}</code> in{" "}
          </>
        )}
        <code>src/{file}</code>
      </figcaption>
      <Source code={snippet(file, name)} language={file.endsWith(".css") ? "css" : "tsx"} format={false} />
    </figure>
  );
}
