import type { Meta, StoryObj } from "@storybook/react";
import { SquonkThemeProvider } from "@src/theme/theme-provider";
import { VStack } from "../../layout-primitive/vstack/vstack";
import { Presentation } from "../../style/presentation/presentation";
import { CurrencyField } from "./currency-field";

const meta: Meta<typeof CurrencyField> = {
  title: "Components/Inputs/Currency Field",
  component: CurrencyField,
  args: {
    label: "Amount",
    helperText: "",
    error: "",
    currency: "NZD",
    locale: "en-NZ",
    currencyDisplay: "symbol",
    allowNegative: false,
    showCurrencyCode: false,
    fullWidth: true,
    disabled: false,
    readOnly: false,
    required: false,
  },
  argTypes: {
    label: { control: "text" },
    helperText: { control: "text" },
    error: { control: "text" },
    currency: { control: "select", options: ["NZD", "AUD", "USD", "GBP", "EUR", "JPY", "KWD"] },
    locale: { control: "select", options: ["en-NZ", "en-AU", "en-US", "en-GB", "de-DE", "fr-FR", "ja-JP"] },
    currencyDisplay: { control: "radio", options: ["symbol", "narrowSymbol", "code", "name"] },
    fractionDigits: { control: { type: "number", min: 0, max: 4 } },
    minValue: { control: "number" },
    maxValue: { control: "number" },
    step: { control: "number" },
    allowNegative: { control: "boolean" },
    showCurrencyCode: { control: "boolean" },
    fullWidth: { control: "boolean" },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
    required: { control: "boolean" },
    onChange: { action: "change" },
    ref: {
      description: "Ref to the input",
      control: false,
      table: { type: { summary: "React.Ref<HTMLInputElement>" } },
    },
  },
};

export default meta;

type Story = StoryObj<typeof CurrencyField>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { label: "Amount to pay", defaultValue: 1240.5, helperText: "You can pay part now and the rest later." },
};

export const WithError: Story = {
  args: { label: "Amount to pay", defaultValue: 0, error: "Enter an amount more than $0" },
};

/** The currency sets the symbol and the decimal places; the locale sets the separators. */
export const Currencies: Story = {
  render: (args) => (
    <VStack gap="md">
      <CurrencyField {...args} label="New Zealand dollars (en-NZ)" currency="NZD" locale="en-NZ" defaultValue={1234.5} />
      <CurrencyField {...args} label="Pounds sterling (en-GB)" currency="GBP" locale="en-GB" defaultValue={1234.5} />
      <CurrencyField {...args} label="Euros (de-DE)" currency="EUR" locale="de-DE" defaultValue={1234.5} />
      <CurrencyField {...args} label="Japanese yen (ja-JP)" currency="JPY" locale="ja-JP" defaultValue={1234} />
      <CurrencyField {...args} label="Kuwaiti dinar (en-NZ)" currency="KWD" locale="en-NZ" defaultValue={1234.5} />
    </VStack>
  ),
};

/** US dollars in a New Zealand locale show as US$; add the code when several dollars are in play. */
export const WithCurrencyCode: Story = {
  args: { label: "Invoice amount", currency: "USD", showCurrencyCode: true, defaultValue: 980 },
};

export const AllowNegative: Story = {
  args: { label: "Credit adjustment", allowNegative: true, defaultValue: -42.1, helperText: "Enter a negative amount to reduce what you owe." },
};

export const WholeDollars: Story = {
  args: { label: "Chapter fundraising target", fractionDigits: 0, step: 1000, defaultValue: 60000, helperText: "Before costs. A rough figure is fine." },
};

export const MinAndMax: Story = {
  args: { label: "Instalment", minValue: 20, maxValue: 5000, defaultValue: 250, helperText: "Between $20 and $5,000." },
};

export const Compact: Story = {
  render: (args) => (
    <Presentation register="compact">
      <CurrencyField {...args} defaultValue={99.95} />
    </Presentation>
  ),
};

export const Large: Story = {
  render: (args) => (
    <Presentation register="large">
      <CurrencyField {...args} defaultValue={99.95} />
    </Presentation>
  ),
};

export const Disabled: Story = {
  args: { label: "Amount", defaultValue: 31.24, disabled: true },
};

export const ReadOnly: Story = {
  args: { label: "Credit", defaultValue: 31.24, readOnly: true },
};

export const Dark: Story = {
  args: { label: "Amount to pay", defaultValue: 1240.5, helperText: "You can pay part now and the rest later." },
  decorators: [(Story) => <SquonkThemeProvider mode="dark"><Story /></SquonkThemeProvider>],
};
