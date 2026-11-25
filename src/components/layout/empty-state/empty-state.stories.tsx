import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./empty-state";
import { Button } from "../../functional/button/button";

const meta: Meta<typeof EmptyState> = {
  title: "Components/Feedback/Empty State",
  // Keeps the URL from before components were grouped by job.
  id: "layout-empty-state",
  component: EmptyState,
};

export default meta;

type Story = StoryObj<typeof EmptyState>;

const InboxIcon = (
  <svg
    width="56"
    height="56"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
  </svg>
);

export const NoProjects: Story = {
  render: () => (
    <EmptyState
      icon={InboxIcon}
      title="No projects yet"
      body="Create your first project to get started."
      action={<Button variant="primary">New project</Button>}
    />
  ),
};

export const NoResults: Story = {
  render: () => (
    <EmptyState
      title="No results"
      body="Try a different search term, or clear your filters."
      action={<Button variant="secondary">Clear filters</Button>}
    />
  ),
};

export const Minimal: Story = {
  render: () => (
    <EmptyState
      title="All caught up"
      body="No new notifications since yesterday."
    />
  ),
};
