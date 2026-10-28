import "./demo.css";

/* Pieces the live demos on "How it works" pages share. Lay a demo out in a <div className="explain"> (see demo.css). */

/** A number to `digits` decimal places, never "-0.0" */
export const fixed = (value: number, digits = 1) => {
  const text = value.toFixed(digits);
  return /^-0(\.0*)?$/.test(text) ? text.slice(1) : text;
};

/** A share from 0 to 1 as a whole percentage */
export const percent = (value: number) => `${Math.round(value * 100)}%`;

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  /** Decimal places to show */
  digits?: number;
  onChange: (value: number) => void;
}

/** A native range input with its label and current value */
export function Slider({ label, value, min, max, step, unit = "", digits = 0, onChange }: SliderProps) {
  return (
    <label className="explain-slider">
      <span className="explain-slider__label">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <output className="explain-slider__value">
        {fixed(value, digits)}
        {unit && ` ${unit}`}
      </output>
    </label>
  );
}
