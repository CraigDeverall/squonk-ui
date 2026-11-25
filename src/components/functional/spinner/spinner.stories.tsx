import type { Meta, StoryObj } from "@storybook/react";
import { Spinner } from "./spinner";
import { Presentation } from "../../style/presentation/presentation";
import { ThemeModifier } from "../../style/theme-modifier/theme-modifier";
import { Block } from "../../layout-primitive/block/block";
import { HStack } from "../../layout-primitive/hstack/hstack";
import { darkTheme } from "../../../theme/theme";

const meta: Meta<typeof Spinner> = {
  title: "Components/Feedback/Spinner",
  // Keeps the URL from before components were grouped by job.
  id: "functional-spinner",
  component: Spinner,
  argTypes: {
    tone: { control: "radio", options: ["primary", "neutral", "inverse"] },
    label: { control: "text" },
  },
};

export default meta;

type Story = StoryObj<typeof Spinner>;

export const Default: Story = { args: {} };

export const Scale: Story = {
  render: () => (
    <HStack gap="md" align="center">
      <Presentation register="compact">
        <Spinner />
      </Presentation>
      <Presentation register="default">
        <Spinner />
      </Presentation>
      <Presentation register="large">
        <Spinner />
      </Presentation>
      <Presentation register="hero">
        <Spinner />
      </Presentation>
    </HStack>
  ),
};

export const OnDarkBackground: Story = {
  render: () => (
    <ThemeModifier override={darkTheme}>
      <Block background="default" padding="lg" radius="base">
        <Presentation register="large">
          <Spinner tone="inverse" />
        </Presentation>
      </Block>
    </ThemeModifier>
  ),
};
