import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { Input } from "@/components/Input";
import { FocusSheen } from "@/experiments/FocusSheen/FocusSheen";
import { LookAt } from "@/experiments/LookAt/LookAt";

const meta = {
  title: "Experiments/Together",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** A form with the focus sheen, in a field of arrows that watch the mouse. Move the mouse, then press Tab. */
export const SheenAndArrows: Story = {
  render: () => (
    <div className="grid place-items-center gap-8 p-8" style={{ background: "var(--bg)", color: "var(--ink)", minHeight: "100vh" }}>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(16, 2.5rem)" }}>
        {Array.from({ length: 32 }, (_, index) => (
          <LookAt key={index} className="size-10">
            <ArrowUp size={22} strokeWidth={2.5} style={{ color: "var(--ink-muted)" }} />
          </LookAt>
        ))}
      </div>
      <FocusSheen className="grid justify-items-start gap-4">
        <Input label="Email" className="w-72" />
        <Checkbox defaultChecked>Email me about new projects</Checkbox>
        <Button>Sign up</Button>
      </FocusSheen>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(16, 2.5rem)" }}>
        {Array.from({ length: 32 }, (_, index) => (
          <LookAt key={index} direction="away" className="size-10">
            <ArrowUp size={22} strokeWidth={2.5} style={{ color: "var(--ink-muted)" }} />
          </LookAt>
        ))}
      </div>
    </div>
  ),
};
