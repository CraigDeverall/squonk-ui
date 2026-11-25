import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { Card } from "../../layout/card/card";
import { Grid } from "./grid";

const spacingOptions = ["none", "xxs", "xs", "sm", "md", "lg", "xl", "xxl"];

const meta: Meta<typeof Grid> = {
  title: "Components/Layout/Stacks and grids/Grid",
  // Keeps the URL from before components were grouped by job.
  id: "layout-primitives-grid",
  component: Grid,
  argTypes: {
    ...commonArgTypes,
    columns: {
      control: "number",
      description: "Number of equal-width columns, or a raw grid-template-columns string.",
    },
    minColumnWidth: {
      control: "text",
      description:
        "Minimum column width (e.g. `200px`). When set, columns auto-fit and `columns` is ignored.",
    },
    gap: {
      control: "select",
      options: spacingOptions,
      description: "Gap between cells (spacing scale token).",
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

type Story = StoryObj<typeof Grid>;

const cells = (count = 6) =>
  Array.from({ length: count }).map((_, i) => (
    <Card key={i} variant="filled">
      Cell {i + 1}
    </Card>
  ));

export const TwoColumn: Story = {
  args: { columns: 2, gap: "md", children: cells(4) },
};

export const ThreeColumn: Story = {
  args: { columns: 3, gap: "md", children: cells(6) },
};

export const AutoFit: Story = {
  args: { minColumnWidth: "180px", gap: "md", children: cells(8) },
};

export const TightGap: Story = {
  args: { columns: 4, gap: "xs", children: cells(8) },
};
