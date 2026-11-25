import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { QrCode } from "./qr-code";

const EXAMPLE_URL = "https://squonkstack.io";
const EXAMPLE_TEXT =
  "https://squonkstack.io/some/very/long/path?foo=bar&baz=qux";

const meta: Meta<typeof QrCode> = {
  title: "Components/Data display/QrCode",
  // Keeps the URL from before components were grouped by job.
  id: "functional-qrcode",
  component: QrCode,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    value: {
      control: "text",
      description: "The string value to encode verbatim in the QR code",
    },
    fgColor: {
      control: "color",
      description: "Foreground (module) colour",
    },
    bgColor: {
      control: "color",
      description: "Background colour",
    },
    padding: {
      control: { type: "range", min: 0, max: 48, step: 4 },
      description: "Padding around the QR code image in pixels",
    },
    label: {
      control: "text",
      description:
        "Optional label text rendered as a clickable link above or below the QR code",
    },
    labelPosition: {
      control: "radio",
      options: ["above", "below"],
      description: "Position of the label relative to the QR code",
    },
  },
};

export default meta;

type Story = StoryObj<typeof QrCode>;

export const Default: Story = {
  args: {
    value: EXAMPLE_URL,
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ width: 200, height: 200 }}>
        <Story />
      </div>
    ),
  ],
};

export const WithLabelBelow: Story = {
  args: {
    value: EXAMPLE_URL,
    label: EXAMPLE_URL,
    labelPosition: "below",
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ width: 200, height: 240 }}>
        <Story />
      </div>
    ),
  ],
};

export const WithLabelAbove: Story = {
  args: {
    value: EXAMPLE_URL,
    label: EXAMPLE_URL,
    labelPosition: "above",
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ width: 200, height: 240 }}>
        <Story />
      </div>
    ),
  ],
};

export const CustomColors: Story = {
  args: {
    value: EXAMPLE_URL,
    fgColor: "#692BCC",
    bgColor: "#F0EAFF",
    label: EXAMPLE_URL,
    labelPosition: "below",
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ width: 220, height: 260 }}>
        <Story />
      </div>
    ),
  ],
};

export const LargePadding: Story = {
  args: {
    value: EXAMPLE_URL,
    padding: 32,
    bgColor: "#ffffff",
    fgColor: "#000000",
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ width: 240, height: 240 }}>
        <Story />
      </div>
    ),
  ],
};

export const NoPadding: Story = {
  args: {
    value: EXAMPLE_URL,
    padding: 0,
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ width: 200, height: 200 }}>
        <Story />
      </div>
    ),
  ],
};

export const LongLabel: Story = {
  args: {
    value: EXAMPLE_TEXT,
    label: EXAMPLE_TEXT,
    labelPosition: "below",
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ width: 200, height: 260 }}>
        <Story />
      </div>
    ),
  ],
};

export const LargeContainer: Story = {
  args: {
    value: EXAMPLE_URL,
    label: EXAMPLE_URL,
    labelPosition: "below",
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ width: 400, height: 440 }}>
        <Story />
      </div>
    ),
  ],
};

export const SmallContainer: Story = {
  args: {
    value: EXAMPLE_URL,
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ width: 100, height: 100 }}>
        <Story />
      </div>
    ),
  ],
};
