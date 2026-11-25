import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useArgs } from "storybook/preview-api";
import { Pagination } from "./pagination";
import { Presentation } from "../../style/presentation/presentation";
import { Card } from "../../layout/card/card";
import { Text } from "../../functional-primitive/text/text";
import { Badge } from "../badge/badge";

const meta: Meta<typeof Pagination> = {
  title: "Components/Navigation/Pagination",
  // Keeps the URL from before components were grouped by job.
  id: "functional-pagination",
  component: Pagination,
  argTypes: {
    count: { control: "number" },
    pageSize: { control: "number" },
    page: { control: "number" },
    siblingCount: { control: "number" },
    compact: { control: "boolean" },
    showRange: { control: "boolean" },
  },
  args: { count: 112, pageSize: 10, page: 1 },
  render: function Controlled(args) {
    const [, updateArgs] = useArgs();
    return <Pagination {...args} onPageChange={(page) => { updateArgs({ page }); args.onPageChange?.(page); }} />;
  },
};

export default meta;

type Story = StoryObj<typeof Pagination>;

export const Default: Story = {};

export const MiddlePage: Story = { args: { page: 6 } };

export const WithRange: Story = { args: { page: 3, showRange: true } };

export const Compact: Story = { args: { page: 3, compact: true, showRange: true } };

export const FewPages: Story = { args: { count: 34 } };

export const Registers: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16 }}>
      {(["compact", "default", "large"] as const).map((register) => (
        <Presentation key={register} register={register}>
          <Pagination count={240} defaultPage={4} />
        </Presentation>
      ))}
    </div>
  ),
};

/** Links give each page its own address, so pages can be bookmarked and shared. */
export const AsLinks: Story = {
  args: { page: 2, getPageUrl: (page) => `?page=${page}` },
};

const notices = Array.from({ length: 47 }, (_, i) => ({
  id: 2026_0400 + i,
  title: ["Sighting report received", "Dues payment received", "Reminder: dues due", "Dues statement"][i % 4],
  date: new Date(2026, 9, 30 - (i % 30)).toLocaleDateString("en-NZ", { day: "numeric", month: "short" }),
  unread: i % 7 === 0,
}));

/** A paged list of notices: changing page swaps the list and keeps the range in view. */
export const PagedList: Story = {
  render: function PagedList() {
    const [page, setPage] = React.useState(1);
    const pageSize = 8;
    const visible = notices.slice((page - 1) * pageSize, page * pageSize);
    return (
      <Card style={{ maxWidth: 560 }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
          {visible.map((notice) => (
            <li key={notice.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--squonk-colors-border-default)" }}>
              <Text as="span" weight={notice.unread ? "bold" : "regular"}>{notice.title}</Text>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {notice.unread ? <Badge tone="info">New</Badge> : null}
                <Text as="span" tone="secondary">{notice.date}</Text>
              </span>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 16 }}>
          <Pagination count={notices.length} pageSize={pageSize} page={page} onPageChange={setPage} showRange aria-label="Notices pages" />
        </div>
      </Card>
    );
  },
};
