import type { Meta, StoryObj } from "@storybook/react";
import { NotPrintable, Printable, PrintOnly } from "./printable";
import { PrintableStatement } from "./printable.showcase";
import { Text } from "../../functional-primitive/text/text";

const meta: Meta<typeof Printable> = {
  title: "Components/Theme and motion/Printable",
  id: "style-printable",
  component: Printable,
  subcomponents: { NotPrintable, PrintOnly } as Meta["subcomponents"],
  args: { breakBefore: false, keepTogether: false, inline: false },
  argTypes: {
    breakBefore: { control: "boolean", description: "Start this area on a new printed page." },
    keepTogether: { control: "boolean", description: "Keep this area on one printed page where it fits." },
    inline: { control: "boolean", description: "Render a span, for a mark inside a line of text." },
  },
};

export default meta;
type Story = StoryObj<typeof Printable>;

/** Print this story (Ctrl+P or ⌘P): only the statement prints, with a letterhead and reference added. */
export const Statement: Story = {
  render: () => <PrintableStatement />,
};

/** Without a Printable the whole page prints, except NotPrintable areas and buttons. */
export const WholePage: Story = {
  render: () => <PrintableStatement withPrintable={false} />,
};

/** A PrintOnly or NotPrintable mark inside a sentence, with `inline`. */
export const Inline: Story = {
  render: () => (
    <Text>
      Your reference is S-2026-11-0042
      <NotPrintable inline> (copy it from here)</NotPrintable>
      <PrintOnly inline>, printed 8 November 2026</PrintOnly>.
    </Text>
  ),
};
