import type { Meta, StoryObj } from "@storybook/react";
import { HStack } from "../../layout-primitive/hstack/hstack";
import { Text } from "../text/text";
import {
  ILLUSTRATION_NAMES,
  ILLUSTRATIONS,
  InboxIllustration,
  type IllustrationName,
  type IllustrationSize,
} from "./illustration";
import styles from "./illustration-stories.module.css";

/** One illustration chosen by name, for the controls. */
function IllustrationPicker({ name = "inbox", size = "lg", label }: { name?: IllustrationName; size?: IllustrationSize; label?: string }) {
  const Drawing = ILLUSTRATIONS[name];
  return <Drawing size={size} label={label} />;
}

const meta = {
  title: "Components/Text and icons/Illustration",
  component: IllustrationPicker,
  args: { name: "inbox", size: "lg" },
  argTypes: {
    name: { control: "select", options: ILLUSTRATION_NAMES, description: "Which illustration: each is its own component, such as `InboxIllustration`." },
    size: { control: "inline-radio", options: ["sm", "md", "lg", "xl"] },
    label: { control: "text", description: "An accessible name, when the illustration carries meaning the text beside it doesn't." },
  },
} satisfies Meta<typeof IllustrationPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The four sizes, from the `components.illustration.size.*` tokens. */
export const Sizes: Story = {
  render: () => (
    <HStack gap="lg" align="end">
      {(["sm", "md", "lg", "xl"] as const).map((size) => (
        <InboxIllustration key={size} size={size} />
      ))}
    </HStack>
  ),
};

/** Every illustration, by name. */
export const Gallery: Story = {
  render: () => (
    <div className={styles.gallery}>
      {ILLUSTRATION_NAMES.map((name) => {
        const Drawing = ILLUSTRATIONS[name];
        return (
          <figure key={name} className={styles.item}>
            <Drawing size="lg" />
            <Text as="figcaption" tone="secondary">{Drawing.displayName}</Text>
          </figure>
        );
      })}
    </div>
  ),
};

