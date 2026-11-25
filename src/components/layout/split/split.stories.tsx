import type { Meta, StoryObj } from "@storybook/react";
import { Split } from "./split";
import { Heading } from "../../functional-primitive/heading/heading";
import { Text } from "../../functional-primitive/text/text";
import { Button } from "../../functional/button/button";
import { Badge } from "../../functional/badge/badge";

const meta: Meta<typeof Split> = {
  title: "Components/Layout/Page structure/Split",
  // Keeps the URL from before components were grouped by job.
  id: "layout-split",
  component: Split,
  argTypes: {
    align: {
      control: "inline-radio",
      options: ["start", "center", "end", "baseline"],
    },
    gap: {
      control: "select",
      options: ["xxs", "xs", "sm", "md", "lg", "xl"],
    },
    wrap: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof Split>;

export const TitleAndAction: Story = {
  render: () => (
    <Split>
      <Heading level={3}>Active sessions</Heading>
      <Button variant="primary">New session</Button>
    </Split>
  ),
};

export const TitleAndStatus: Story = {
  render: () => (
    <Split>
      <Heading level={4}>checkout-flow</Heading>
      <Badge tone="success" variant="subtle" caps>
        Live
      </Badge>
    </Split>
  ),
};

export const RowOfText: Story = {
  render: () => (
    <Split>
      <Text>You signed in 4 minutes ago.</Text>
      <Text tone="muted">12:34 PM</Text>
    </Split>
  ),
};
