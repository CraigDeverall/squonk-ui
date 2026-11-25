import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Popover } from "./popover";
import { Button } from "../button/button";
import { IconButton } from "../icon-button/icon-button";
import { CheckboxGroup } from "../checkbox-group/checkbox-group";
import { Link } from "../link/link";
import { Avatar } from "../avatar/avatar";
import { Badge } from "../badge/badge";
import { Text } from "../../functional-primitive/text/text";
import { FilterIcon, InfoIcon } from "../../functional-primitive/icon/icon";

const meta: Meta<typeof Popover> = {
  title: "Components/Overlays/Popover",
  // Keeps the URL from before components were grouped by job.
  id: "functional-popover",
  component: Popover,
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
    placement: { control: "select", options: ["top", "top-start", "top-end", "bottom", "bottom-start", "bottom-end", "left", "right"] },
    arrow: { control: "boolean" },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    showCloseButton: { control: "boolean" },
    trigger: { control: false },
  },
  args: {
    trigger: <Button variant="secondary" shape="rounded">What's included?</Button>,
    title: "Included in your dues",
    description: "As at 3 November 2026",
    children: (
      <Text>
        Annual dues for the 2026-27 season, a late fee of $4.20 and the Swamp Fund levy to today.
      </Text>
    ),
  },
  decorators: [(Story) => <div style={{ minHeight: 260 }}><Story /></div>],
};

export default meta;

type Story = StoryObj<typeof Popover>;

export const Default: Story = {};

export const Open: Story = { args: { defaultOpen: true } };

export const WithArrow: Story = { args: { arrow: true, placement: "bottom", defaultOpen: true } };

/** A small form in a popover: filters that apply on demand. */
export const Filters: Story = {
  render: function Filters() {
    const [open, setOpen] = React.useState(false);
    const [draft, setDraft] = React.useState<string[]>(["trail"]);
    const [applied, setApplied] = React.useState<string[]>(["trail"]);
    return (
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Popover
          open={open}
          onOpenChange={(next) => { setOpen(next); if (next) setDraft(applied); }}
          trigger={<Button variant="secondary" shape="rounded"><FilterIcon size="control" /> Filters {applied.length ? <Badge tone="primary">{applied.length}</Badge> : null}</Button>}
          title="Filter sightings"
          footer={
            <>
              <Button variant="ghost" shape="rounded" onClick={() => setDraft([])}>Clear</Button>
              <Button variant="primary" shape="rounded" lift={false} onClick={() => { setApplied(draft); setOpen(false); }}>Apply</Button>
            </>
          }
        >
          <CheckboxGroup
            legend="Sighting type"
            value={draft}
            onChange={setDraft}
            options={[
              { value: "trail", label: "Tear trail" },
              { value: "pool", label: "Tear pool" },
              { value: "weeping", label: "Heard weeping" },
            ]}
          />
        </Popover>
        <Text as="span" tone="secondary">{applied.length ? `Showing ${applied.join(", ").toUpperCase()}` : "Showing all sightings"}</Text>
      </div>
    );
  },
};

/** An info button that explains a figure, with a link to more. */
export const ExplainAFigure: Story = {
  render: () => (
    <Text>
      Late fee: $4.20{" "}
      <Popover
        size="sm"
        trigger={<IconButton icon={<InfoIcon />} label="About the late fee" tooltip={false} />}
        title="Late fee"
      >
        <Text>Added once when annual dues are paid more than 30 days after the due date.</Text>
        <Link href="#late-fee">How the late fee is calculated</Link>
      </Popover>
    </Text>
  ),
};

/** A person's details on demand, from their name. */
export const ContactCard: Story = {
  render: () => (
    <Popover
      size="sm"
      trigger={<Button variant="ghost" shape="rounded">Aroha Ngata</Button>}
      showCloseButton={false}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Avatar name="Aroha Ngata" />
        <div>
          <Text weight="bold">Aroha Ngata</Text>
          <Text tone="secondary">Membership officer, Wellington Chapter</Text>
        </div>
      </div>
      <Link href="mailto:aroha@example.govt.nz">aroha@example.govt.nz</Link>
    </Popover>
  ),
};
