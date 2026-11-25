import type { Meta, StoryObj } from "@storybook/react";
import { Cluster } from "./cluster";
import { Badge } from "../../functional/badge/badge";
import { Button } from "../../functional/button/button";
import { Block } from "../../layout-primitive/block/block";

const meta: Meta<typeof Cluster> = {
  title: "Components/Layout/Stacks and grids/Cluster",
  // Keeps the URL from before components were grouped by job.
  id: "layout-cluster",
  component: Cluster,
  argTypes: {
    align: {
      control: "inline-radio",
      options: ["start", "center", "end", "baseline"],
    },
    justify: {
      control: "inline-radio",
      options: ["start", "center", "end"],
    },
    gap: {
      control: "select",
      options: ["xxs", "xs", "sm", "md", "lg", "xl"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof Cluster>;

export const Tags: Story = {
  render: () => (
    <Cluster>
      <Badge tone="primary" variant="subtle">React</Badge>
      <Badge tone="primary" variant="subtle">TypeScript</Badge>
      <Badge tone="primary" variant="subtle">styled-components</Badge>
      <Badge tone="primary" variant="subtle">Storybook</Badge>
      <Badge tone="primary" variant="subtle">Playwright</Badge>
    </Cluster>
  ),
};

export const ButtonGroup: Story = {
  render: () => (
    <Cluster>
      <Button variant="primary">Save</Button>
      <Button variant="secondary">Cancel</Button>
      <Button variant="ghost">Discard</Button>
    </Cluster>
  ),
};

export const Centered: Story = {
  render: () => (
    <Cluster justify="center">
      <Button variant="primary">Get started</Button>
      <Button variant="secondary">Read the docs</Button>
    </Cluster>
  ),
};

export const Wrapping: Story = {
  render: () => (
    <Block bordered padding="md" radius="base" maxWidth="320px">
      <Cluster>
        {Array.from({ length: 12 }).map((_, i) => (
          <Badge key={i} tone="neutral" variant="outline">
            tag-{i + 1}
          </Badge>
        ))}
      </Cluster>
    </Block>
  ),
};
