import type { Meta, StoryObj } from "@storybook/react";
import { Table, type TableColumn } from "./table";
import { Badge } from "../badge/badge";
import { Presentation } from "../../style/presentation/presentation";

interface DemoUser {
  name: string;
  email: string;
  role: string;
  active: boolean;
}

const users: DemoUser[] = [
  { name: "Ada Lovelace", email: "ada@example.com", role: "Admin", active: true },
  { name: "Grace Hopper", email: "grace@example.com", role: "Member", active: true },
  { name: "Alan Turing", email: "alan@example.com", role: "Member", active: false },
];

const columns: TableColumn<DemoUser>[] = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  {
    key: "role",
    header: "Role",
    render: (row) => (
      <Badge tone={row.role === "Admin" ? "primary" : "neutral"}>
        {row.role}
      </Badge>
    ),
  },
  {
    key: "active",
    header: "Status",
    align: "right",
    render: (row) => (row.active ? "Active" : "Deactivated"),
  },
];

const meta: Meta<typeof Table<DemoUser>> = {
  title: "Components/Data display/Table",
  // Keeps the URL from before components were grouped by job.
  id: "functional-table",
  component: Table,
  argTypes: {
    striped: { control: "boolean" },
    caption: { control: "text" },
    columns: { control: false },
    rows: { control: false },
    rowKey: { control: false },
    empty: { control: false },
  },
};

export default meta;

type Story = StoryObj<typeof Table<DemoUser>>;

export const Default: Story = {
  args: {
    columns,
    rows: users,
    rowKey: (row) => row.email,
    caption: "Project users",
  },
};

export const Striped: Story = {
  args: {
    columns,
    rows: users,
    rowKey: (row) => row.email,
    striped: true,
  },
};

export const Empty: Story = {
  args: {
    columns,
    rows: [],
    empty: "No users yet — invite one to get started.",
  },
};

export const Compact: Story = {
  args: {
    columns,
    rows: users,
    rowKey: (row) => row.email,
  },
  render: (args) => (
    <Presentation register="compact">
      <Table {...args} />
    </Presentation>
  ),
};

export const FixedColumnWidths: Story = {
  args: {
    columns: [
      { key: "name", header: "Name", width: "200px" },
      { key: "email", header: "Email" },
      { key: "role", header: "Role", width: "120px", align: "center" },
    ],
    rows: users,
    rowKey: (row) => row.email,
  },
};

const sortableColumns: TableColumn<DemoUser>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "email", header: "Email", sortable: true },
  { key: "role", header: "Role", sortable: true },
];

export const SortableAndPaged: Story = {
  args: {
    columns: sortableColumns,
    rows: [...users, ...users.map((user) => ({ ...user, name: `${user.name} II`, email: `ii.${user.email}` }))],
    rowKey: (row) => row.email,
    caption: "Project users",
    defaultSort: { key: "name", direction: "asc" },
    pageSize: 4,
  },
};

export const Selectable: Story = {
  args: {
    columns,
    rows: users,
    rowKey: (row) => row.email,
    caption: "Project users",
    selectable: true,
    defaultSelectedKeys: ["grace@example.com"],
  },
};
