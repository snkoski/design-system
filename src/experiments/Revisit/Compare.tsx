import type { ReactNode } from "react";
import "@/experiments/Revisit/compare.css";

const themes = [
  ["light", "Light"],
  ["dark", "Dark"],
  ["hotdog", "Hot dog"],
] as const;

/** Renders its children once per theme, one section each, so a comparison can be judged in all three. */
export function Themes({ children }: { children: (theme: string) => ReactNode }) {
  return (
    <div className="grid">
      {themes.map(([theme, name]) => (
        <section key={theme} data-theme={theme} className="compare-theme">
          <h2 className="compare-theme__name">{name}</h2>
          {children(theme)}
        </section>
      ))}
    </div>
  );
}

/** Options side by side, each under a heading. Stacks on narrow screens. */
export function Options({ children }: { children: ReactNode }) {
  return <div className="compare-options">{children}</div>;
}

/** One option: a heading saying what it is, a line on where it comes from, and the components drawn that way. */
export function Option({
  title,
  note,
  className,
  children,
}: {
  title: string;
  note?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="compare-option">
      <h3 className="compare-option__title">{title}</h3>
      {note && <p className="compare-option__note">{note}</p>}
      <div className={className ? `compare-option__body ${className}` : "compare-option__body"}>{children}</div>
    </div>
  );
}
