import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { Block } from "../block/block";
import { Centered } from "../centered/centered";
import { Text } from "../../functional-primitive/text/text";
import { AspectRatio } from "./aspect-ratio";

const meta: Meta<typeof AspectRatio> = {
  title: "Components/Layout/Stacks and grids/AspectRatio",
  // Keeps the URL from before components were grouped by job.
  id: "layout-primitives-aspectratio",
  component: AspectRatio,
  argTypes: {
    ...commonArgTypes,
    ratio: {
      control: "text",
      description:
        "Width / height ratio. Number (e.g. `1.7778`) or CSS string (`'16 / 9'`).",
    },
    ref: {
      description: "Ref to the DOM element",
      control: false,
      table: {
        type: { summary: "React.RefObject<HTMLDivElement>" },
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof AspectRatio>;

const placeholder = (
  <Block background="subtle" bordered radius="base">
    <Centered minHeight="100%">
      <Text tone="muted">Content</Text>
    </Centered>
  </Block>
);

export const Square: Story = {
  args: { ratio: 1, children: placeholder },
};

export const Widescreen: Story = {
  args: { ratio: "16 / 9", children: placeholder },
};

export const Portrait: Story = {
  args: { ratio: "3 / 4", children: placeholder },
};

export const Cinemascope: Story = {
  args: { ratio: "21 / 9", children: placeholder },
};
