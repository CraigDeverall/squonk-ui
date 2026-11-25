import type { Meta, StoryObj } from "@storybook/react";
import { DuesInstalmentPlan } from "./dues-instalment-plan";

const meta: Meta<typeof DuesInstalmentPlan> = {
  title: "Examples/Dues Instalment Plan",
  component: DuesInstalmentPlan,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    options: { showPanel: false },
  },
};

export default meta;
type Story = StoryObj<typeof DuesInstalmentPlan>;

/** Choose instalments to build a schedule; it updates as you change the
 *  frequency, number of payments and start date. */
export const NewArrangement: Story = {};
