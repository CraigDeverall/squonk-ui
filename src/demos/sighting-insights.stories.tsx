import type { Meta, StoryObj } from "@storybook/react";
import { SightingInsights } from "./sighting-insights";

const meta: Meta<typeof SightingInsights> = {
  title: "Examples/Sighting Insights",
  component: SightingInsights,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    options: { showPanel: false },
  },
};

export default meta;
type Story = StoryObj<typeof SightingInsights>;

/** Switch the Period to redraw the figures, hover a chart for its tooltip,
 *  and use "Table view" to read any chart as a table. The Chapters tab sorts,
 *  with a sparkline per row, and Operations shows capacity meters and a
 *  scatter of caseload against time to resolve. */
export const Overview: Story = {};
