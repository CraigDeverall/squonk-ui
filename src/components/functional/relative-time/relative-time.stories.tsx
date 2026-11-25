import type { Meta, StoryObj } from "@storybook/react";
import { Text } from "../../functional-primitive/text/text";
import { RelativeTime } from "./relative-time";

const now = new Date("2026-11-13T12:00:00+13:00");
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000);

const meta: Meta<typeof RelativeTime> = {
  title: "Components/Data Display/Relative Time",
  id: "functional-relative-time",
  component: RelativeTime,
  args: { value: ago(125), now, locale: "en-NZ" },
  argTypes: { value: { control: "date" }, now: { control: false } },
};

export default meta;
type Story = StoryObj<typeof RelativeTime>;

export const Default: Story = {};

/** In a byline. Press the time to see the full date and time. */
export const InBylines: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 8 }}>
      {[0.2, 5, 125, 26 * 60, 3 * 24 * 60, 70 * 24 * 60].map((minutes) => (
        <Text key={minutes}>
          <strong>Aroha</strong>, <RelativeTime value={ago(minutes)} now={now} locale="en-NZ" />
        </Text>
      ))}
    </div>
  ),
};
