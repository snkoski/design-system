import { createContext } from "react";

/** What a CheckboxGroup tells the checkboxes inside it. Its presence is how a Checkbox knows it's in a group. */
export interface CheckboxGroupContextValue {
  readOnly: boolean;
}

export const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(null);
