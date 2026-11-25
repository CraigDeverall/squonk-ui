import type { Meta, StoryObj } from "@storybook/react";
import { SquonkThemeProvider } from "@src/theme/theme-provider";
import { VStack } from "../../layout-primitive/vstack/vstack";
import { Text } from "../text/text";
import { Currency } from "./currency";

const tones = ["primary", "secondary", "muted", "inverse", "success", "warning", "error", "info"];

const meta: Meta<typeof Currency> = {
  title: "Components/Data display/Currency",
  component: Currency,
  args: {
    value: 1234.5,
    currency: "NZD",
    locale: "en-NZ",
    currencyDisplay: "symbol",
    signDisplay: "auto",
    accounting: false,
    compact: false,
    minorUnits: false,
  },
  argTypes: {
    value: { control: "number" },
    currency: { control: "select", options: ["NZD", "AUD", "USD", "GBP", "EUR", "JPY", "KWD"] },
    locale: { control: "select", options: ["en-NZ", "en-AU", "en-US", "en-GB", "de-DE", "fr-FR", "ja-JP"] },
    currencyDisplay: { control: "radio", options: ["symbol", "narrowSymbol", "code", "name"] },
    signDisplay: { control: "radio", options: ["auto", "always", "exceptZero", "negative", "never"] },
    accounting: { control: "boolean" },
    compact: { control: "boolean" },
    minorUnits: { control: "boolean" },
    fractionDigits: { control: { type: "number", min: 0, max: 4 } },
    tone: { control: "select", options: tones },
    negativeTone: { control: "select", options: tones },
    fallback: { control: "text" },
    ref: {
      description: "Ref to the `<data>` element",
      control: false,
      table: { type: { summary: "React.Ref<HTMLDataElement>" } },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Currency>;

export const Default: Story = {};

/** The currency sets the symbol and decimal places; the locale sets separators and placement. */
export const Currencies: Story = {
  render: (args) => (
    <VStack gap="xs">
      <Text>NZD, en-NZ: <Currency {...args} currency="NZD" locale="en-NZ" /></Text>
      <Text>NZD, en-US: <Currency {...args} currency="NZD" locale="en-US" /></Text>
      <Text>GBP, en-GB: <Currency {...args} currency="GBP" locale="en-GB" /></Text>
      <Text>EUR, de-DE: <Currency {...args} currency="EUR" locale="de-DE" /></Text>
      <Text>JPY, ja-JP: <Currency {...args} currency="JPY" locale="ja-JP" /></Text>
      <Text>KWD, en-NZ: <Currency {...args} currency="KWD" locale="en-NZ" /></Text>
    </VStack>
  ),
};

export const Accounting: Story = {
  args: { value: -192.82, accounting: true, negativeTone: "error" },
};

export const SignedChange: Story = {
  args: { value: 20, signDisplay: "exceptZero", tone: "success" },
};

export const Compact: Story = {
  args: { value: 1234567, compact: true },
};

/** Integer cents in, dollars out: `1999` shows $19.99. */
export const MinorUnits: Story = {
  args: { value: 1999, minorUnits: true },
};

export const Empty: Story = {
  args: { value: null },
};

export const Dark: Story = {
  render: (args) => (
    <SquonkThemeProvider mode="dark">
      <VStack gap="xs">
        <Text><Currency {...args} /></Text>
        <Text><Currency {...args} value={-192.82} accounting negativeTone="error" /></Text>
        <Text><Currency {...args} value={31.24} tone="success" /></Text>
      </VStack>
    </SquonkThemeProvider>
  ),
};
