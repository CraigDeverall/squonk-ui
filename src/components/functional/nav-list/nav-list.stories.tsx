import type React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { INDICATOR_STYLE_NAMES, INDICATOR_STYLES } from "../../../theme/switches";
import {
  CalendarIcon,
  DocumentIcon,
  FolderIcon,
  HomeIcon,
  MailIcon,
  PaymentIcon,
  SettingsIcon,
} from "../../functional-primitive/icon/icon";
import { Badge } from "../badge/badge";
import { Text } from "../../functional-primitive/text/text";
import { NavList, type NavListItem } from "./nav-list";
import styles from "./nav-list-stories.module.css";

const ITEMS: NavListItem[] = [
  { id: "overview", label: "Overview", href: "#overview", icon: <HomeIcon /> },
  { id: "membership", label: "Membership", href: "#membership", icon: <FolderIcon /> },
  { id: "sightings", label: "Sightings", href: "#sightings", icon: <DocumentIcon />, end: <Badge tone="warning">1 due</Badge> },
  { id: "payments", label: "Payments", href: "#payments", icon: <PaymentIcon /> },
  { id: "plans", label: "Instalment plans", href: "#plans", icon: <CalendarIcon /> },
  { id: "newsletters", label: "Newsletters", href: "#newsletters", icon: <MailIcon />, end: "3" },
  { id: "settings", label: "Settings", href: "#settings", icon: <SettingsIcon /> },
];

const PLAIN = ITEMS.map(({ id, label, href }) => ({ id, label, href }));

const meta = {
  title: "Components/Navigation/NavList",
  component: NavList,
  args: { label: "Main", items: PLAIN, current: "overview", orientation: "vertical" },
  argTypes: {
    current: { control: "select", options: PLAIN.map((item) => item.id) },
    orientation: { control: "inline-radio", options: ["vertical", "horizontal"] },
  },
} satisfies Meta<typeof NavList>;

/** A side navigation's width. */
const sideFrame = [(Story: React.ComponentType) => <div className={styles.frame}><Story /></div>];

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { decorators: sideFrame };

/** Icons before the labels and counts or badges after them. */
export const WithIconsAndCounts: Story = { args: { items: ITEMS, current: "sightings" }, decorators: sideFrame };

/** A row across the top of a section. */
export const Horizontal: Story = {
  args: { orientation: "horizontal", items: PLAIN.slice(0, 4), current: "membership" },
  decorators: [(Story) => <div className={styles.wide}><Story /></div>],
};

/** Pages that exist but can't be opened yet show dimmed, with a tooltip that says why. */
export const DisabledItems: Story = {
  args: {
    orientation: "horizontal",
    current: "overview",
    items: [
      PLAIN[0],
      { ...PLAIN[1], disabled: true, title: "Coming later" },
      { ...PLAIN[2], disabled: true, title: "Coming later" },
    ],
  },
  decorators: [(Story) => <div className={styles.wide}><Story /></div>],
};

/**
 * The theme's `indicatorStyle` in each of its settings: how the current page
 * is marked, and (point at the items) how hovering is.
 */
export const IndicatorStyles: Story = {
  decorators: [(Story) => <div className={styles.wide}><Story /></div>],
  render: (args) => (
    <div className={styles.styles}>
      {INDICATOR_STYLE_NAMES.map((style) => (
        <div key={style} className={styles.style}>
          <Text weight="bold">{style}</Text>
          <Text tone="secondary">{INDICATOR_STYLES[style].what}</Text>
          <SquonkThemeProvider primitives={{ indicatorStyle: style }}>
            <NavList {...args} label={`Main, ${style}`} items={PLAIN.slice(0, 4)} current="overview" />
          </SquonkThemeProvider>
        </div>
      ))}
    </div>
  ),
};

/**
 * Any effect is a few token values. Here, a pill-cornered border with a
 * gap around the current page, and the same, thinner and quieter, under the
 * pointer.
 */
export const BorderWithAGap: Story = {
  decorators: sideFrame,
  render: (args) => (
    <SquonkThemeProvider
      primitives={{ indicatorStyle: "ring" }}
      roleBindings={{
        "roles.indicator.radius": "borders.radius.full",
        "roles.indicator.current.gap": "3px",
        "roles.indicator.hover.color": "roles.color.edge",
      }}
    >
      <NavList {...args} items={ITEMS} />
    </SquonkThemeProvider>
  ),
};
