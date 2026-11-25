import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { Link } from "../../functional/link/link";
import { Footer } from "./footer";

const meta: Meta<typeof Footer> = {
  title: "Components/Navigation/Footer",
  // Keeps the URL from before components were grouped by job.
  id: "layout-footer",
  component: Footer,
  argTypes: {
    ...commonArgTypes,
  },
};

export default meta;

type Story = StoryObj<typeof Footer>;

export const Default: Story = {
  args: {
    children: (
      <>
        <span>© 2026 Squonk</span>
        <nav style={{ display: "flex", gap: 16, marginLeft: "auto" }}>
          <Link href="#">Privacy</Link>
          <Link href="#">Terms</Link>
          <Link href="#">Contact</Link>
        </nav>
      </>
    ),
  },
};
