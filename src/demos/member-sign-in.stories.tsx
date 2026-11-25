import type { Meta, StoryObj } from "@storybook/react";
import { MemberSignIn } from "./member-sign-in";

const meta: Meta<typeof MemberSignIn> = {
  title: "Examples/Member Sign In",
  component: MemberSignIn,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    options: { showPanel: false },
  },
};

export default meta;
type Story = StoryObj<typeof MemberSignIn>;

/** Sign in with any membership number such as SQ-104-772. Use the password "wrong" to see a server
 *  error land on the password field. */
export const SignIn: Story = {};
