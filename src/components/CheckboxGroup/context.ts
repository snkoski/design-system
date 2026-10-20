import { createContext } from "react";

/** What a CheckboxGroup tells the checkboxes inside it. Its presence is how a Checkbox knows it's in a group. */
export interface CheckboxGroupContextValue {
  readOnly: boolean;
  /** Whether the group was given `allValues`, without which a parent box can't work. */
  hasAllValues: boolean;
}

export const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(null);
