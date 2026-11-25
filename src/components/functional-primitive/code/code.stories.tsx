import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { Code } from "./code";

const meta: Meta<typeof Code> = {
  title: "Components/Text and icons/Code",
  // Keeps the URL from before components were grouped by job.
  id: "functional-primitives-code",
  component: Code,
  argTypes: {
    ...commonArgTypes,
    block: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof Code>;

export const Inline: Story = {
  args: { children: "npm install @squonk/ui" },
};

export const Block: Story = {
  args: {
    block: true,
    children: `import { Button } from "@squonk/ui";

export default function App() {
  return <Button variant="primary">Click me</Button>;
}`,
  },
};
