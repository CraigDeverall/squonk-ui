import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import {
  AccountIcon,
  BankIcon,
  CloudIcon,
  DatabaseIcon,
  DeliveryIcon,
  GlobeIcon,
  KeyIcon,
  OrganisationIcon,
  PackageIcon,
  PinIcon,
  ProtectedIcon,
  ServerIcon,
  StoreIcon,
  UnpinIcon,
  UserIcon,
  WalletIcon,
} from "../../functional-primitive/icon/icon";
import { Text } from "../../functional-primitive/text/text";
import { Card } from "../../layout/card/card";
import { Block } from "../../layout-primitive/block/block";
import { HStack } from "../../layout-primitive/hstack/hstack";
import { VStack } from "../../layout-primitive/vstack/vstack";
import { ThemeStyleBlock } from "../../style/theme-style-block/theme-style-block";
import { Button } from "../button/button";
import { TextField } from "../text-field/text-field";
import {
  NetworkGraph,
  NetworkGraphLegend,
  type NetworkGraphHiddenKinds,
  type NetworkGraphLink,
  type NetworkGraphLinkKinds,
  type NetworkGraphNode,
  type NetworkGraphNodeKinds,
  type NetworkGraphStructure,
} from "./network-graph";

// A small group of chapters: who funds and leads which chapter, and who shares maps with whom.
const nodeKinds: NetworkGraphNodeKinds = {
  company: { label: "Chapter", icon: <OrganisationIcon /> },
  person: { label: "Member", shape: "square", icon: <UserIcon /> },
  trust: { label: "Household", shape: "diamond", icon: <ProtectedIcon /> },
};

const linkKinds: NetworkGraphLinkKinds = {
  owns: { label: "Funds" },
  directs: { label: "Leads", variant: "dashed" },
  supplies: { label: "Shares maps", tone: "info", animation: "particles", animationDuration: 2400 },
};

const nodes: NetworkGraphNode[] = [
  { id: "waikato", label: "Waikato Chapter", kind: "company", size: 1.6 },
  { id: "hollow", label: "Hemlock Hollow Chapter", kind: "company", size: 1.3 },
  { id: "tasman", label: "Tasman Chapter", kind: "company", size: 1.2 },
  { id: "ridge", label: "Ridgeline Chapter", kind: "company", size: 1.3 },
  { id: "southern", label: "Southern Cross Chapter and Night-Watch Network", kind: "company", size: 1.2 },
  { id: "avery", label: "Avery Chen", kind: "person", size: 1.2 },
  { id: "marcus", label: "Marcus Olu", kind: "person", size: 1.2 },
  { id: "priya", label: "Priya Singh", kind: "person", size: 1.2 },
  { id: "chen-trust", label: "Chen Household", kind: "trust", size: 1.2 },
];

const links: NetworkGraphLink[] = [
  { source: "chen-trust", target: "waikato", kind: "owns", label: "Funds 60%", thickness: 4 },
  { source: "marcus", target: "waikato", kind: "owns", label: "Funds 40%", thickness: 3 },
  { source: "avery", target: "chen-trust", kind: "directs", label: "Treasurer" },
  { source: "avery", target: "waikato", kind: "directs" },
  { source: "waikato", target: "hollow", kind: "owns", label: "Funds 100%", thickness: 5 },
  { source: "priya", target: "hollow", kind: "directs" },
  { source: "priya", target: "ridge", kind: "owns", label: "Funds 100%", thickness: 5 },
  { source: "tasman", target: "ridge", kind: "supplies" },
  { source: "ridge", target: "hollow", kind: "supplies" },
  { source: "southern", target: "waikato", kind: "supplies" },
  { source: "hollow", target: "southern", kind: "supplies" },
];

// The same group drawn plainly, for the stories about the basics.
const plainNodeKinds: NetworkGraphNodeKinds = {
  company: { label: "Chapter" },
  person: { label: "Member", shape: "square" },
  trust: { label: "Household", shape: "diamond" },
};
const plainLinkKinds: NetworkGraphLinkKinds = {
  owns: { label: "Funds" },
  directs: { label: "Leads", variant: "dashed" },
  supplies: { label: "Shares maps", tone: "info" },
};
const plainNodes = nodes.map((node) => ({ ...node, size: undefined }));
const plainLinks = links.map((link) => ({ ...link, thickness: undefined }));

const meta: Meta<typeof NetworkGraph> = {
  title: "Components/Data Visualization/Network Graph",
  id: "functional-network-graph",
  component: NetworkGraph,
  decorators: [(Story) => <Block width="720px" maxWidth="100%"><Story /></Block>],
  args: {
    label: "Funding and map sharing between chapters in the Waikato region",
    nodes,
    links,
    nodeKinds,
    linkKinds,
    hoverHighlight: "neighbours",
    style: { height: 440 },
  },
  argTypes: {
    nodes: { control: false },
    links: { control: false },
    nodeKinds: { control: false },
    linkKinds: { control: false },
    hiddenKinds: { control: false },
    selectedId: { control: false },
    defaultSelectedId: { control: false },
    pinnedIds: { control: false },
    defaultPinnedIds: { control: false },
    renderNode: { control: false },
    hoverHighlight: {
      control: "select",
      options: ["none", "neighbours", "outgoing", "incoming", "downstream", "upstream"],
    },
    layout: { control: "inline-radio", options: ["static", "force"] },
    empty: { control: "text" },
  },
};

export default meta;

type Story = StoryObj<typeof NetworkGraph>;

/**
 * Icons say what each node is, size and line weight carry the stake, and
 * supplies flow along their links. Point at a node to light up what it
 * touches.
 */
export const Default: Story = {};

/** The least a graph needs: nodes, links, a label, and a description of each kind. */
export const NodesAndLinks: Story = {
  args: {
    label: "Who funds and leads the Waikato Chapter",
    style: { height: 280 },
    nodeKinds: plainNodeKinds,
    hoverHighlight: "none",
    nodes: [
      { id: "waikato", label: "Waikato Chapter", kind: "company" },
      { id: "trust", label: "Chen Household", kind: "trust" },
      { id: "avery", label: "Avery Chen", kind: "person" },
      { id: "marcus", label: "Marcus Olu", kind: "person" },
    ],
    links: [
      { source: "trust", target: "waikato", label: "Funds 60%" },
      { source: "marcus", target: "waikato", label: "Funds 40%" },
      { source: "avery", target: "trust", label: "Treasurer" },
    ],
    linkKinds: undefined,
  },
};

/** In a card, with a line of context and the legend above the graph. */
export const InACard: Story = {
  render: (args) => (
    <Card>
      <VStack gap="sm">
        <Text>Two people lead the Hemlock Hollow Chapter through different routes.</Text>
        <NetworkGraphLegend nodeKinds={nodeKinds} linkKinds={linkKinds} nodes={args.nodes} links={args.links} />
        <NetworkGraph {...args} />
      </VStack>
    </Card>
  ),
  args: {
    label: "Leaders of the Hemlock Hollow Chapter",
    style: { height: 280 },
    defaultSelectedId: "hollow",
    nodes: [
      { id: "hollow", label: "Hemlock Hollow Chapter", kind: "company", size: 1.5 },
      { id: "waikato", label: "Waikato Chapter", kind: "company", size: 1.3 },
      { id: "priya", label: "Priya Singh", kind: "person", size: 1.2 },
      { id: "avery", label: "Avery Chen", kind: "person", size: 1.2 },
    ],
    links: [
      { source: "priya", target: "hollow", kind: "directs" },
      { source: "avery", target: "waikato", kind: "directs" },
      { source: "waikato", target: "hollow", kind: "owns", label: "Funds 100%", thickness: 4 },
    ],
  },
};

/** Kinds differ by shape and icon as well as colour. A kind takes a status tone only when the kind is a status. */
export const KindsAndTones: Story = {
  args: {
    label: "Open cases and the membership accounts and members they involve",
    style: { height: 380 },
    nodeKinds: {
      account: { label: "Membership account", shape: "circle", icon: <WalletIcon /> },
      person: { label: "Member", shape: "square", icon: <UserIcon /> },
      overdue: { label: "Overdue case", tone: "error", shape: "triangle" },
      review: { label: "Case in review", tone: "warning", shape: "diamond" },
      settled: { label: "Settled case", tone: "success", shape: "hexagon" },
    },
    linkKinds: {
      holds: { label: "Holds" },
      concerns: { label: "Concerns", tone: "neutral" },
    },
    nodes: [
      { id: "acc-1", label: "Annual dues SQ-104-772", kind: "account", size: 1.5 },
      { id: "acc-2", label: "Swamp Fund levy SQ-104-773", kind: "account", size: 1.5 },
      { id: "p-1", label: "Avery Chen", kind: "person", size: 1.3 },
      { id: "p-2", label: "Marcus Olu", kind: "person", size: 1.3 },
      { id: "c-1", label: "Dues overdue", kind: "overdue" },
      { id: "c-2", label: "Credit check", kind: "review" },
      { id: "c-3", label: "Instalment plan", kind: "settled" },
    ],
    links: [
      { source: "p-1", target: "acc-1", kind: "holds" },
      { source: "p-1", target: "acc-2", kind: "holds" },
      { source: "p-2", target: "acc-2", kind: "holds" },
      { source: "c-1", target: "acc-1", kind: "concerns", animation: "pulse", animationDuration: 1200, label: "Overdue now" },
      { source: "c-2", target: "acc-1", kind: "concerns" },
      { source: "c-3", target: "acc-2", kind: "concerns" },
    ],
  },
};

// A theme's own colours (`addedColorPrimitives`), each with a light and a dark value.
const ADDED_COLORS = {
  violet: { light: "#7c3aed", dark: "#a78bfa" },
  teal: { light: "#0f766e", dark: "#2dd4bf" },
};

/** A kind or a node can take a colour the theme added, by its key. */
export const AddedColours: Story = {
  render: (args) => (
    <HStack gap="md" wrap>
      {(["light", "dark"] as const).map((mode) => (
        <SquonkThemeProvider key={mode} mode={mode} addedColorPrimitives={ADDED_COLORS}>
          <NetworkGraph
            {...args}
            style={{ height: 360, width: 420 }}
            nodeKinds={{
              company: { label: "Chapter", tone: "violet", icon: <OrganisationIcon /> },
              person: { label: "Member", tone: "teal", shape: "square", icon: <UserIcon /> },
              trust: { label: "Household", tone: "neutral", shape: "diamond", icon: <ProtectedIcon /> },
            }}
          />
        </SquonkThemeProvider>
      ))}
    </HStack>
  ),
};

// Generated portraits, so the story needs no network: initials on a gradient.
const portrait = (initials: string, from: string, to: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><text x="32" y="41" font-family="system-ui,sans-serif" font-size="24" font-weight="600" fill="white" text-anchor="middle">${initials}</text></svg>`,
  )}`;

/**
 * Each node can carry an `icon`, an `image` such as a photo or logo, and a
 * `size` for a measure. Here size is each person's number of reports.
 */
export const IconsImagesAndSizes: Story = {
  args: {
    label: "The Society leadership team and who reports to whom",
    style: { height: 460 },
    hoverHighlight: "downstream",
    nodeKinds: {
      lead: { label: "Leader", slot: 1 },
      team: { label: "Team", slot: 3, shape: "hexagon", icon: <OrganisationIcon /> },
      system: { label: "System", slot: 5, shape: "square", icon: <ServerIcon /> },
    },
    linkKinds: { leads: { label: "Leads" }, runs: { label: "Runs", variant: "dashed" } },
    nodes: [
      { id: "ceo", label: "Aroha Ngata, Society Secretary", kind: "lead", image: portrait("AN", "#6366f1", "#ec4899"), size: 2.4 },
      { id: "cfo", label: "Ben Walker, Treasurer", kind: "lead", image: portrait("BW", "#0ea5e9", "#22c55e"), size: 1.8 },
      { id: "coo", label: "Mele Tupou, Night watches", kind: "lead", image: portrait("MT", "#f59e0b", "#ef4444"), size: 2 },
      { id: "cto", label: "Sam Lee, Folklore archive", kind: "lead", image: portrait("SL", "#14b8a6", "#6366f1"), size: 1.8 },
      { id: "ar", label: "Dues collection", kind: "team", size: 1.3 },
      { id: "payroll", label: "Chapter treasurers", kind: "team", size: 1.2 },
      { id: "depot", label: "Auckland Chapter", kind: "team", size: 1.6 },
      { id: "fleet", label: "Night-watch kit", kind: "team", size: 1.4 },
      { id: "platform", label: "Sighting portal", kind: "team", size: 1.3 },
      { id: "ledger", label: "Dues ledger", kind: "system", icon: <DatabaseIcon />, size: 1.3 },
      { id: "tracking", label: "Sightings API", kind: "system", icon: <CloudIcon />, size: 1.3 },
    ],
    links: [
      { source: "ceo", target: "cfo", kind: "leads", thickness: 3 },
      { source: "ceo", target: "coo", kind: "leads", thickness: 3 },
      { source: "ceo", target: "cto", kind: "leads", thickness: 3 },
      { source: "cfo", target: "ar", kind: "leads" },
      { source: "cfo", target: "payroll", kind: "leads" },
      { source: "coo", target: "depot", kind: "leads" },
      { source: "coo", target: "fleet", kind: "leads" },
      { source: "cto", target: "platform", kind: "leads" },
      { source: "ar", target: "ledger", kind: "runs" },
      { source: "platform", target: "tracking", kind: "runs" },
      { source: "fleet", target: "tracking", kind: "runs" },
    ],
  },
};

/**
 * `renderNode` draws the inside of each node yourself, as SVG around 0,0.
 * Here each node is a ring that fills to its capacity used, coloured by its
 * kind. The graph still draws the label, rings, pin and hit area.
 */
export const CustomNodeRenderer: Story = {
  args: {
    label: "Warehouses and how full each one is",
    style: { height: 420 },
    hoverHighlight: "outgoing",
    nodeKinds: {
      hub: { label: "Hub", slot: 1 },
      store: { label: "Store", slot: 2 },
      full: { label: "Over 90% full", tone: "error" },
    },
    linkKinds: { ships: { label: "Ships to", animation: "flow", animationDuration: 1400 } },
    nodes: [
      { id: "akl", label: "Auckland hub · 72%", kind: "hub", size: 2.2, description: "72% full" },
      { id: "chc", label: "Christchurch hub · 94%", kind: "full", size: 2, description: "94% full" },
      { id: "ham", label: "Hamilton · 38%", kind: "store", size: 1.5, description: "38% full" },
      { id: "tga", label: "Tauranga · 55%", kind: "store", size: 1.5, description: "55% full" },
      { id: "wlg", label: "Wellington · 81%", kind: "store", size: 1.6, description: "81% full" },
      { id: "dud", label: "Dunedin · 27%", kind: "store", size: 1.4, description: "27% full" },
      { id: "nsn", label: "Nelson · 61%", kind: "store", size: 1.4, description: "61% full" },
    ],
    links: [
      { source: "akl", target: "ham", kind: "ships", thickness: 4 },
      { source: "akl", target: "tga", kind: "ships", thickness: 3 },
      { source: "akl", target: "wlg", kind: "ships", thickness: 5 },
      { source: "akl", target: "chc", kind: "ships", thickness: 6 },
      { source: "chc", target: "dud", kind: "ships", thickness: 3 },
      { source: "chc", target: "nsn", kind: "ships", thickness: 2 },
      { source: "wlg", target: "nsn", kind: "ships", thickness: 2 },
    ],
    renderNode: (node, { radius, color, hovered }) => {
      const used = Number(node.description?.match(/\d+/)?.[0] ?? 0) / 100;
      const ring = radius - 2;
      const circumference = 2 * Math.PI * ring;
      return (
        <g>
          <circle r={radius} fill="var(--squonk-components-network-graph-canvas)" />
          <circle r={ring} fill="none" stroke="var(--squonk-roles-color-outline)" strokeWidth={4} />
          <circle
            r={ring}
            fill="none"
            stroke={color}
            strokeWidth={hovered ? 6 : 4}
            strokeLinecap="round"
            strokeDasharray={`${circumference * used} ${circumference}`}
            transform="rotate(-90)"
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={radius * 0.55}
            fontWeight={600}
            fill="var(--squonk-roles-color-text)"
          >
            {Math.round(used * 100)}
          </text>
        </g>
      );
    },
  },
};

// Dues moving between chapters and funds, thicker for more.
const paymentKinds: NetworkGraphNodeKinds = {
  bank: { label: "Fund", slot: 1, icon: <BankIcon /> },
  business: { label: "Chapter", slot: 2, shape: "square", icon: <StoreIcon /> },
  person: { label: "Member", slot: 3, shape: "circle", icon: <AccountIcon /> },
};
const payments: { from: string; to: string; amount: number }[] = [
  { from: "swamp", to: "waikato", amount: 420 },
  { from: "waikato", to: "hollow", amount: 260 },
  { from: "waikato", to: "southern", amount: 110 },
  { from: "hollow", to: "priya", amount: 40 },
  { from: "southern", to: "marcus", amount: 25 },
  { from: "waikato", to: "avery", amount: 60 },
  { from: "national", to: "hollow", amount: 150 },
  { from: "hollow", to: "national", amount: 18 },
];

/**
 * `thickness` sets a line's width in pixels for a measure, here thousands
 * of dollars paid this month. The arrowhead grows with the line. Say what
 * the width means near the graph.
 */
export const LinkThickness: Story = {
  render: (args) => (
    <VStack gap="sm">
      <Text>Dues paid this month. A thicker line is more money.</Text>
      <NetworkGraph {...args} />
    </VStack>
  ),
  args: {
    label: "Dues between funds, chapters and members this month",
    style: { height: 420 },
    nodeKinds: paymentKinds,
    linkKinds: { pays: { label: "Pays", slot: 2 } },
    nodes: [
      { id: "swamp", label: "Swamp Fund", kind: "bank", size: 1.6 },
      { id: "national", label: "National treasury", kind: "bank", size: 1.6 },
      { id: "waikato", label: "Waikato Chapter", kind: "business", size: 1.4 },
      { id: "hollow", label: "Hemlock Hollow Chapter", kind: "business", size: 1.4 },
      { id: "southern", label: "Southern Cross Chapter", kind: "business", size: 1.4 },
      { id: "avery", label: "Avery Chen", kind: "person", size: 1.2 },
      { id: "priya", label: "Priya Singh", kind: "person", size: 1.2 },
      { id: "marcus", label: "Marcus Olu", kind: "person", size: 1.2 },
    ],
    links: payments.map(({ from, to, amount }) => ({
      source: from,
      target: to,
      kind: "pays",
      label: `$${amount}k`,
      thickness: Math.max(1, amount / 40),
    })),
  },
};

/**
 * Links can move to show that something travels along them: `flow`
 * marches the line, `particles` sends dots and `pulse` breathes. Set
 * `animationDuration` for the pace. Motion stops when the device asks for
 * reduced motion, so the label says it too.
 */
export const AnimatedLinks: Story = {
  args: {
    label: "Traffic between services, by how it moves",
    style: { height: 420 },
    hoverHighlight: "neighbours",
    nodeKinds: {
      edge: { label: "Edge", slot: 1, icon: <GlobeIcon /> },
      service: { label: "Service", slot: 2, shape: "square", icon: <ServerIcon /> },
      store: { label: "Data store", slot: 4, shape: "hexagon", icon: <DatabaseIcon /> },
    },
    linkKinds: {
      requests: { label: "Requests", slot: 1, animation: "particles", animationDuration: 1800 },
      streams: { label: "Streams", slot: 2, animation: "flow", animationDuration: 900 },
      heartbeat: { label: "Heartbeat", tone: "success", animation: "pulse", animationDuration: 1400, variant: "dashed" },
    },
    nodes: [
      { id: "cdn", label: "CDN", kind: "edge", size: 1.8 },
      { id: "api", label: "API gateway", kind: "service", size: 1.6 },
      { id: "orders", label: "Orders", kind: "service", size: 1.4 },
      { id: "tracking", label: "Tracking", kind: "service", size: 1.4 },
      { id: "events", label: "Event stream", kind: "store", size: 1.5 },
      { id: "db", label: "Orders database", kind: "store", size: 1.5 },
      { id: "monitor", label: "Monitor", kind: "service", size: 1.2 },
    ],
    links: [
      { source: "cdn", target: "api", kind: "requests", thickness: 5, label: "Requests, 1.2k a second" },
      { source: "api", target: "orders", kind: "requests", thickness: 3 },
      { source: "api", target: "tracking", kind: "requests", thickness: 4, animationDuration: 1200 },
      { source: "orders", target: "events", kind: "streams", thickness: 3 },
      { source: "tracking", target: "events", kind: "streams", thickness: 2 },
      { source: "orders", target: "db", kind: "streams", thickness: 4, animationDuration: 600 },
      { source: "monitor", target: "api", kind: "heartbeat" },
      { source: "monitor", target: "orders", kind: "heartbeat" },
      { source: "monitor", target: "tracking", kind: "heartbeat" },
    ],
  },
};

// A supply chain: raw goods at the top, shoppers at the bottom.
const supplyKinds: NetworkGraphNodeKinds = {
  grower: { label: "Grower", slot: 3, icon: <PackageIcon /> },
  packer: { label: "Packer", slot: 2, shape: "square", icon: <StoreIcon /> },
  carrier: { label: "Carrier", slot: 1, shape: "diamond", icon: <DeliveryIcon /> },
  retailer: { label: "Retailer", slot: 4, shape: "hexagon", icon: <StoreIcon /> },
};
const supplyNodes: NetworkGraphNode[] = [
  { id: "g1", label: "Ridgeline Orchards", kind: "grower", size: 1.4 },
  { id: "g2", label: "Hawke's Bay Apples", kind: "grower", size: 1.4 },
  { id: "g3", label: "Bay Kiwifruit", kind: "grower", size: 1.4 },
  { id: "p1", label: "Tasman Packaging", kind: "packer", size: 1.5 },
  { id: "p2", label: "Coastal Packhouse", kind: "packer", size: 1.5 },
  { id: "c1", label: "Southern Cross Chapter", kind: "carrier", size: 1.4 },
  { id: "c2", label: "Waikato Chapter", kind: "carrier", size: 1.6 },
  { id: "r1", label: "FreshCo Auckland", kind: "retailer", size: 1.3 },
  { id: "r2", label: "FreshCo Wellington", kind: "retailer", size: 1.3 },
  { id: "r3", label: "Corner Grocer", kind: "retailer", size: 1.1 },
];
const supplyLinks: NetworkGraphLink[] = [
  { source: "g1", target: "p1", kind: "supplies" },
  { source: "g2", target: "p1", kind: "supplies" },
  { source: "g2", target: "p2", kind: "supplies" },
  { source: "g3", target: "p2", kind: "supplies" },
  { source: "p1", target: "c1", kind: "supplies" },
  { source: "p1", target: "c2", kind: "supplies" },
  { source: "p2", target: "c2", kind: "supplies" },
  { source: "c1", target: "r2", kind: "supplies" },
  { source: "c2", target: "r1", kind: "supplies" },
  { source: "c2", target: "r3", kind: "supplies" },
];

const structures: { value: NetworkGraphStructure; label: string; hint: string }[] = [
  { value: "neighbours", label: "Neighbours", hint: "everything one link away" },
  { value: "downstream", label: "Downstream", hint: "everything it feeds, all the way down" },
  { value: "upstream", label: "Upstream", hint: "everything that feeds it" },
  { value: "outgoing", label: "Outgoing", hint: "only what it supplies directly" },
  { value: "incoming", label: "Incoming", hint: "only what supplies it directly" },
];

/**
 * `hoverHighlight` lights up a structure around the node the reader points
 * at, or moves keyboard focus to, and sets the rest back. Pick one below and
 * point at a packer: downstream shows every shop its fruit reaches.
 */
export const HoverStructures: Story = {
  render: (args) => {
    const Example = () => {
      const [structure, setStructure] = React.useState<NetworkGraphStructure>("downstream");
      const hint = structures.find((entry) => entry.value === structure)!.hint;
      return (
        <VStack gap="sm">
          <HStack gap="xs" wrap role="group" aria-label="What to light up">
            {structures.map((entry) => (
              <Button
                key={entry.value}
                variant={entry.value === structure ? "primary" : "secondary"}
                aria-pressed={entry.value === structure}
                onClick={() => setStructure(entry.value)}
              >
                {entry.label}
              </Button>
            ))}
          </HStack>
          <Text>Point at a node to see {hint}.</Text>
          <NetworkGraph {...args} hoverHighlight={structure} />
        </VStack>
      );
    };
    return <Example />;
  },
  args: {
    label: "How fruit moves from growers to shops",
    style: { height: 440 },
    nodeKinds: supplyKinds,
    linkKinds: { supplies: { label: "Shares maps", animation: "flow", animationDuration: 1800 } },
    nodes: supplyNodes,
    links: supplyLinks,
  },
};

/**
 * `hoverHighlight` also takes a function, for a structure of your own. Here
 * it lights every node of the same kind as the one pointed at.
 */
export const CustomHighlight: Story = {
  args: {
    label: "How fruit moves from growers to shops, lit by kind",
    style: { height: 420 },
    nodeKinds: supplyKinds,
    linkKinds: { supplies: { label: "Shares maps" } },
    nodes: supplyNodes,
    links: supplyLinks,
    hoverHighlight: (node, graph) => graph.nodes.filter((other) => other.kind === node.kind).map((other) => other.id),
  },
};

/**
 * With `layout="force"` the graph is a live simulation: drag a node and the
 * nodes linked to it follow, then everything settles. Double-click a node,
 * or press P while it has focus, to pin it where it is.
 */
export const ForceLayout: Story = {
  args: {
    layout: "force",
    defaultPinnedIds: ["waikato"],
    hoverHighlight: "neighbours",
    style: { height: 480 },
  },
};

/** The parent holds the pins: select a node, then pin or unpin it with the button. */
export const PinTheSelectedNode: Story = {
  render: (args) => {
    const Example = () => {
      const [selectedId, setSelectedId] = React.useState<string | null>("hollow");
      const [pinnedIds, setPinnedIds] = React.useState<string[]>(["waikato"]);
      const selected = nodes.find((node) => node.id === selectedId);
      const isPinned = selectedId !== null && pinnedIds.includes(selectedId);
      const toggle = () =>
        setPinnedIds((current) =>
          selectedId === null ? current : isPinned ? current.filter((id) => id !== selectedId) : [...current, selectedId],
        );
      return (
        <VStack gap="sm">
          <HStack gap="sm" align="center" wrap>
            <Button variant="secondary" onClick={toggle} disabled={!selected}>
              {isPinned ? <UnpinIcon /> : <PinIcon />}
              {isPinned ? "Unpin" : "Pin"} {selected ? selected.label : "a node"}
            </Button>
            <Button variant="ghost" onClick={() => setPinnedIds([])} disabled={pinnedIds.length === 0}>
              Unpin all
            </Button>
            <Text>
              {pinnedIds.length === 0
                ? "Nothing pinned."
                : `Pinned: ${pinnedIds.map((id) => nodes.find((node) => node.id === id)?.label ?? id).join(", ")}`}
            </Text>
          </HStack>
          <NetworkGraph
            {...args}
            selectedId={selectedId}
            onSelectionChange={setSelectedId}
            pinnedIds={pinnedIds}
            onPinnedChange={setPinnedIds}
          />
        </VStack>
      );
    };
    return <Example />;
  },
  args: { layout: "force", style: { height: 460 } },
};

/** Selecting a node keeps it and its neighbours and sets the rest back. */
export const Selection: Story = {
  args: { defaultSelectedId: "waikato", hoverHighlight: "none" },
};

/** The parent holds the selection and shows what was picked beside the graph. */
export const ControlledSelection: Story = {
  render: (args) => {
    const Example = () => {
      const [selectedId, setSelectedId] = React.useState<string | null>("hollow");
      const selected = nodes.find((node) => node.id === selectedId);
      return (
        <VStack gap="sm">
          <NetworkGraph {...args} selectedId={selectedId} onSelectionChange={setSelectedId} />
          <Text>{selected ? `Selected: ${selected.label}` : "Nothing selected. Pick a node to see what it connects to."}</Text>
        </VStack>
      );
    };
    return <Example />;
  },
};

/** Dashed nodes are de-emphasised: here, chapters that have closed. */
export const DashedNodesAndLinks: Story = {
  args: {
    label: "Chapter links in the Waikato region, including closed chapters",
    nodes: [
      ...nodes,
      { id: "old-waikato", label: "Waikato Watchers (1998) Group", kind: "company", variant: "dashed", description: "Closed chapter" },
      { id: "old-hollow", label: "Hemlock Hollow Annex", kind: "company", variant: "dashed", description: "Closed chapter" },
    ],
    links: [
      ...links,
      { source: "marcus", target: "old-waikato", kind: "owns", label: "Funded until 2019", variant: "dashed" },
      { source: "old-waikato", target: "old-hollow", kind: "owns", label: "Funded until 2019", variant: "dashed" },
    ],
  },
};

/** The legend lists the kinds on show and hides or shows each one. Hiding a kind moves nothing else. */
export const WithLegend: Story = {
  render: (args) => {
    const Example = () => {
      const [hiddenKinds, setHiddenKinds] = React.useState<NetworkGraphHiddenKinds>({ nodes: ["person"], links: [] });
      return (
        <VStack gap="sm">
          <NetworkGraphLegend
            nodeKinds={nodeKinds}
            linkKinds={linkKinds}
            nodes={nodes}
            links={links}
            hiddenKinds={hiddenKinds}
            onHiddenKindsChange={setHiddenKinds}
          />
          <NetworkGraph {...args} hiddenKinds={hiddenKinds} />
        </VStack>
      );
    };
    return <Example />;
  },
};

/** Without `onHiddenKindsChange` the legend is a plain key. */
export const LegendAsKey: Story = {
  render: (args) => (
    <VStack gap="sm">
      <NetworkGraphLegend nodeKinds={plainNodeKinds} linkKinds={plainLinkKinds} />
      <NetworkGraph {...args} />
    </VStack>
  ),
  args: { nodeKinds: plainNodeKinds, linkKinds: plainLinkKinds, nodes: plainNodes, links: plainLinks, hoverHighlight: "none" },
};

export const Empty: Story = {
  args: {
    nodes: [],
    links: [],
    empty: "No related chapters yet. They appear here as they are formed.",
    style: { height: 240 },
  },
};

// About 150 nodes: 12 groups, each a chapter with the members, households and chapters around it.
const manyNodes: NetworkGraphNode[] = [];
const manyLinks: NetworkGraphLink[] = [];
for (let group = 0; group < 12; group += 1) {
  const hub = `group-${group}`;
  manyNodes.push({ id: hub, label: `Regional chapter ${group + 1}`, kind: "company", size: 1.8 });
  if (group > 0) manyLinks.push({ source: `group-${Math.floor((group - 1) / 2)}`, target: hub, kind: "owns", thickness: 3 });
  for (let member = 0; member < 12; member += 1) {
    const id = `${hub}-${member}`;
    const kind = member % 4 === 0 ? "trust" : member % 2 === 0 ? "person" : "company";
    manyNodes.push({ id, label: `${nodeKinds[kind].label} ${group + 1}.${member + 1}`, kind });
    manyLinks.push(
      kind === "company"
        ? { source: hub, target: id, kind: "owns" }
        : { source: id, target: hub, kind: kind === "person" ? "directs" : "owns" },
    );
    if (member % 5 === 4) manyLinks.push({ source: id, target: `${hub}-${member - 3}`, kind: "supplies" });
  }
}

/**
 * 156 nodes in a live layout. Point at a regional chapter to see all it
 * funds downstream, and drag one to pull its group about. Past a few dozen,
 * a graph shows clusters and outliers, not individual facts: pair it with a table.
 */
export const ManyNodes: Story = {
  args: {
    label: "Twelve regional chapters and the chapters, members and households around them",
    nodes: manyNodes,
    links: manyLinks,
    layout: "force",
    hoverHighlight: "downstream",
    style: { height: 560 },
  },
};

const arrivals: { node: NetworkGraphNode; link: NetworkGraphLink }[] = [
  { node: { id: "new-1", label: "Coastline Chapter", kind: "company", size: 1.2 }, link: { source: "new-1", target: "southern", kind: "supplies" } },
  { node: { id: "new-2", label: "Dana Whitu", kind: "person", size: 1.2 }, link: { source: "new-2", target: "new-1", kind: "directs" } },
  { node: { id: "new-3", label: "Whitu Household", kind: "trust", size: 1.2 }, link: { source: "new-3", target: "tasman", kind: "owns", thickness: 3 } },
  { node: { id: "new-4", label: "Ridgeline Annex", kind: "company", size: 1.2 }, link: { source: "ridge", target: "new-4", kind: "owns", thickness: 4 } },
  { node: { id: "new-5", label: "Eli Park", kind: "person", size: 1.2 }, link: { source: "new-5", target: "new-4", kind: "directs" } },
];

/**
 * Data arriving while the graph is open: the nodes already drawn stay
 * exactly where they are, and each newcomer's link pulses until the next one
 * arrives.
 */
export const LiveUpdate: Story = {
  render: (args) => {
    const Example = () => {
      const [added, setAdded] = React.useState(0);
      const extra = arrivals.slice(0, added);
      return (
        <VStack gap="sm">
          <HStack gap="sm" align="center">
            <Button onClick={() => setAdded((count) => Math.min(arrivals.length, count + 1))} disabled={added === arrivals.length}>
              Add a node
            </Button>
            <Button variant="ghost" onClick={() => setAdded((count) => Math.max(0, count - 1))} disabled={added === 0}>
              Remove the last one
            </Button>
            <Text>{nodes.length + added} nodes</Text>
          </HStack>
          <NetworkGraph
            {...args}
            nodes={[...nodes, ...extra.map((arrival) => arrival.node)]}
            links={[
              ...links,
              ...extra.map((arrival, index) =>
                index === extra.length - 1 ? { ...arrival.link, animation: "pulse" as const, label: "Just added" } : arrival.link,
              ),
            ]}
          />
        </VStack>
      );
    };
    return <Example />;
  },
};

/**
 * A search that narrows the graph as the reader types. With `settleOnChange`
 * what is left draws together, with `autoFit` the view moves to fit it, and
 * nodes that leave fade out. Full screen
 * keeps the search and the selected node's details over the graph.
 */
export const SearchAndFullScreen: Story = {
  render: (args) => {
    const Example = () => {
      const [search, setSearch] = React.useState("");
      const [selectedId, setSelectedId] = React.useState<string | null>(null);
      const words = search.toLowerCase().split(/\s+/).filter(Boolean);
      const kept = nodes.filter((node) => words.every((word) => node.label.toLowerCase().includes(word)));
      const ids = new Set(kept.map((node) => node.id));
      const shownLinks = links.filter((link) => ids.has(link.source) && ids.has(link.target));
      const selected = kept.find((node) => node.id === selectedId);
      const field = (
        <TextField label="Search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
      );
      return (
        <VStack gap="sm">
          {field}
          <NetworkGraph
            {...args}
            nodes={kept}
            links={shownLinks}
            autoFit
            settleOnChange
            maxFitZoom={1.75}
            allowFullscreen
            selectedId={selectedId}
            onSelectionChange={setSelectedId}
            empty={`Nothing matches "${search}"`}
            fullscreenToolbar={field}
            fullscreenAside={selected ? <Text>{selected.label}</Text> : null}
          />
        </VStack>
      );
    };
    return <Example />;
  },
};

// A cloud estate for the showcase.
const estateKinds: NetworkGraphNodeKinds = {
  region: { label: "Region", slot: 1, icon: <GlobeIcon />, shape: "hexagon" },
  service: { label: "Service", slot: 2, icon: <ServerIcon />, shape: "square" },
  data: { label: "Data store", slot: 4, icon: <DatabaseIcon /> },
  secret: { label: "Secret", slot: 6, icon: <KeyIcon />, shape: "diamond" },
  down: { label: "Failing", tone: "error", icon: <ServerIcon />, shape: "square" },
};
const estateLinks: NetworkGraphLinkKinds = {
  routes: { label: "Routes to", slot: 1, animation: "particles", animationDuration: 1600 },
  writes: { label: "Writes", slot: 2, animation: "flow", animationDuration: 900 },
  reads: { label: "Reads", variant: "dashed" },
  failing: { label: "Failing calls", tone: "error", animation: "pulse", animationDuration: 900 },
};

/**
 * Everything at once, in the dark: icons, sizes by traffic, line weight by
 * volume, motion by kind, a failing service pulsing, upstream structure on
 * hover and a live layout to drag about. Point at the failing service to
 * see everything that depends on it.
 */
export const OperationsMap: Story = {
  render: (args) => (
    <ThemeStyleBlock invertMode>
      <Card>
        <VStack gap="sm">
          <Text>Production estate, last 5 minutes. Point at a node to see what depends on it; drag to rearrange.</Text>
          <NetworkGraphLegend nodeKinds={estateKinds} linkKinds={estateLinks} nodes={args.nodes} links={args.links} />
          <NetworkGraph {...args} />
        </VStack>
      </Card>
    </ThemeStyleBlock>
  ),
  args: {
    label: "Production services, the data they use and the traffic between them",
    layout: "force",
    hoverHighlight: "upstream",
    style: { height: 520 },
    nodeKinds: estateKinds,
    linkKinds: estateLinks,
    nodes: [
      { id: "syd", label: "ap-southeast-2", kind: "region", size: 2.2 },
      { id: "gw", label: "Gateway", kind: "service", size: 2 },
      { id: "auth", label: "Auth", kind: "service", size: 1.5 },
      { id: "orders", label: "Orders", kind: "service", size: 1.7 },
      { id: "billing", label: "Billing", kind: "down", size: 1.6, description: "Failing: 38% errors" },
      { id: "track", label: "Tracking", kind: "service", size: 1.5 },
      { id: "notify", label: "Notifications", kind: "service", size: 1.2 },
      { id: "pg", label: "Orders DB", kind: "data", size: 1.6 },
      { id: "ledger", label: "Ledger", kind: "data", size: 1.4 },
      { id: "cache", label: "Cache", kind: "data", size: 1.2 },
      { id: "kms", label: "Signing key", kind: "secret", size: 1.1 },
    ],
    links: [
      { source: "syd", target: "gw", kind: "routes", thickness: 6, label: "2.4k requests a second" },
      { source: "gw", target: "auth", kind: "routes", thickness: 3 },
      { source: "gw", target: "orders", kind: "routes", thickness: 4 },
      { source: "gw", target: "track", kind: "routes", thickness: 3 },
      { source: "orders", target: "billing", kind: "failing", thickness: 3, label: "38% failing" },
      { source: "orders", target: "pg", kind: "writes", thickness: 4 },
      { source: "orders", target: "notify", kind: "routes", thickness: 1.5 },
      { source: "billing", target: "ledger", kind: "writes", thickness: 2 },
      { source: "track", target: "cache", kind: "reads" },
      { source: "auth", target: "kms", kind: "reads" },
      { source: "billing", target: "kms", kind: "reads" },
      { source: "track", target: "pg", kind: "reads" },
    ],
  },
};

export const DarkMode: Story = {
  render: (args) => (
    <ThemeStyleBlock invertMode>
      <Card>
        <VStack gap="sm">
          <NetworkGraphLegend nodeKinds={nodeKinds} linkKinds={linkKinds} />
          <NetworkGraph {...args} defaultSelectedId="hollow" />
        </VStack>
      </Card>
    </ThemeStyleBlock>
  ),
};
