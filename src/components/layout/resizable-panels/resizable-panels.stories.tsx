import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { Code } from "../../functional-primitive/code/code";
import { Heading } from "../../functional-primitive/heading/heading";
import { DocumentIcon, FileIcon, FolderIcon, HomeIcon, SearchIcon, SettingsIcon } from "../../functional-primitive/icon/icon";
import { Text } from "../../functional-primitive/text/text";
import { Block } from "../../layout-primitive/block/block";
import { VStack } from "../../layout-primitive/vstack/vstack";
import { Button } from "../../functional/button/button";
import { ResizableHandle, ResizablePanel, ResizablePanels } from "./resizable-panels";

const meta: Meta<typeof ResizablePanels> = {
  title: "Components/Layout/Page structure/Resizable Panels",
  component: ResizablePanels,
  subcomponents: { ResizablePanel, ResizableHandle } as Meta["subcomponents"],
  args: {
    orientation: "horizontal",
  },
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
      description: "Side by side (horizontal) or stacked (vertical).",
    },
    defaultLayout: { control: false },
    onLayout: { control: false },
    children: { control: false },
    ref: {
      description: "Ref to the group's DOM element",
      control: false,
      table: { type: { summary: "React.Ref<HTMLDivElement>" } },
    },
  },
  decorators: [
    (Story) => (
      <Block bordered radius="base" style={{ width: 760, maxWidth: "100%", height: 320, overflow: "hidden", boxSizing: "border-box" }}>
        <Story />
      </Block>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof ResizablePanels>;

/** Filler for a panel: a padded, scrollable area with a title. */
function Pane({ title, children, background }: { title: string; children?: React.ReactNode; background?: "subtle" | "surface" }) {
  return (
    <Block padding="md" background={background} style={{ height: "100%", overflow: "auto", boxSizing: "border-box" }}>
      <VStack gap="xs">
        <Heading level={4}>{title}</Heading>
        {children}
      </VStack>
    </Block>
  );
}

const navItems = [
  { icon: HomeIcon, label: "Overview" },
  { icon: DocumentIcon, label: "Sightings" },
  { icon: SearchIcon, label: "Search" },
  { icon: SettingsIcon, label: "Settings" },
];

/** A sidebar between 200px and 40% of the width, beside the main content. */
export const SidebarAndContent: Story = {
  render: (args) => (
    <ResizablePanels {...args}>
      <ResizablePanel id="sidebar" defaultSize={25} minSize="200px" maxSize={40}>
        <Pane title="Accounts" background="subtle">
          <Text tone="muted">Between 200px and 40% wide. Drag the line, or focus it and use the arrow keys.</Text>
        </Pane>
      </ResizablePanel>
      <ResizableHandle label="Resize sidebar" />
      <ResizablePanel id="content">
        <Pane title="Sighting report, March 2026">
          <Text>Dues of $24.00 and a kit hire of $9.60 give a Swamp Fund levy of $1.88.</Text>
        </Pane>
      </ResizablePanel>
    </ResizablePanels>
  ),
};

/** Stacked panels with a horizontal handle between them. */
export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <ResizablePanels {...args}>
      <ResizablePanel defaultSize={60} minSize={20}>
        <Pane title="Case summary">
          <Text>Avery Chen asked for a payment arrangement on 2026-04-12.</Text>
        </Pane>
      </ResizablePanel>
      <ResizableHandle label="Resize notes" />
      <ResizablePanel minSize="80px">
        <Pane title="Notes" background="subtle">
          <Text tone="muted">At least 80px tall.</Text>
        </Pane>
      </ResizablePanel>
    </ResizablePanels>
  ),
};

/** A vertical group inside a horizontal panel: files | editor over terminal. */
export const Nested: Story = {
  render: () => (
    <ResizablePanels>
      <ResizablePanel defaultSize={22} minSize="160px" maxSize={35}>
        <Pane title="Files" background="subtle">
          <VStack gap="xxs">
            <Text><FolderIcon /> src</Text>
            <Text><FileIcon /> index.ts</Text>
            <Text><FileIcon /> theme.ts</Text>
          </VStack>
        </Pane>
      </ResizablePanel>
      <ResizableHandle label="Resize files" />
      <ResizablePanel>
        <ResizablePanels orientation="vertical">
          <ResizablePanel defaultSize={70} minSize={30}>
            <Pane title="Editor">
              <Code block>{`export const total = sales - purchases;`}</Code>
            </Pane>
          </ResizablePanel>
          <ResizableHandle label="Resize terminal" />
          <ResizablePanel minSize="64px">
            <Pane title="Terminal" background="subtle">
              <Code>npm run build</Code>
            </Pane>
          </ResizablePanel>
        </ResizablePanels>
      </ResizablePanel>
    </ResizablePanels>
  ),
};

function CollapsibleSidebarDemo() {
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <ResizablePanels>
      <ResizablePanel
        id="nav"
        defaultSize={24}
        minSize="180px"
        maxSize={40}
        collapsible
        collapsedSize="56px"
        onCollapsedChange={setCollapsed}
      >
        <Block padding="sm" background="subtle" style={{ height: "100%", boxSizing: "border-box" }}>
          <VStack gap="xs">
            {navItems.map(({ icon: ItemIcon, label }) => (
              <Text key={label} title={collapsed ? label : undefined}>
                <ItemIcon /> {collapsed ? null : label}
              </Text>
            ))}
          </VStack>
        </Block>
      </ResizablePanel>
      <ResizableHandle label="Resize navigation" appearance="grip" />
      <ResizablePanel>
        <Pane title="Overview">
          <Text tone="muted">
            Drag the handle past halfway below 180px to collapse the navigation to a 56px rail, or focus the handle and
            press Enter. {collapsed ? "Collapsed." : "Expanded."}
          </Text>
        </Pane>
      </ResizablePanel>
    </ResizablePanels>
  );
}

/** A sidebar that snaps to an icon rail. */
export const CollapsibleSidebar: Story = {
  render: () => <CollapsibleSidebarDemo />,
};

/** The three handle appearances: line, bar and grip. */
export const Appearances: Story = {
  render: () => (
    <ResizablePanels>
      <ResizablePanel minSize={10}>
        <Pane title="Line" />
      </ResizablePanel>
      <ResizableHandle label="Resize line panel" appearance="line" />
      <ResizablePanel minSize={10}>
        <Pane title="Bar" />
      </ResizablePanel>
      <ResizableHandle label="Resize bar panel" appearance="bar" />
      <ResizablePanel minSize={10}>
        <Pane title="Grip" />
      </ResizablePanel>
      <ResizableHandle label="Resize grip panel" appearance="grip" />
      <ResizablePanel minSize={10}>
        <Pane title="End" />
      </ResizablePanel>
    </ResizablePanels>
  ),
};

/** A handle that can't move: the panels keep their sizes. */
export const DisabledHandle: Story = {
  render: () => (
    <ResizablePanels>
      <ResizablePanel defaultSize={30}>
        <Pane title="Fixed" background="subtle" />
      </ResizablePanel>
      <ResizableHandle label="Resize" appearance="bar" disabled />
      <ResizablePanel>
        <Pane title="Content" />
      </ResizablePanel>
    </ResizablePanels>
  ),
};

const storageKey = "squonk-resizable-panels-story-layout";

function readLayout(): number[] | undefined {
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
    return Array.isArray(saved) && saved.every((n) => typeof n === "number") ? saved : undefined;
  } catch {
    return undefined;
  }
}

function PersistedLayoutDemo() {
  const [defaultLayout] = React.useState(readLayout);
  const [key, setKey] = React.useState(0);
  const save = (sizes: number[]) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(sizes));
    } catch {
      // Storage can be unavailable (a private window): the layout just isn't kept.
    }
  };
  const reset = () => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Nothing saved to remove.
    }
    setKey((n) => n + 1);
  };
  return (
    <ResizablePanels key={key} defaultLayout={key ? undefined : defaultLayout} onLayout={save}>
      <ResizablePanel defaultSize={30} minSize={15}>
        <Pane title="Saved layout" background="subtle">
          <Text tone="muted">Resize, then reload the page: the sizes come back from localStorage.</Text>
          <Button onClick={reset}>Reset layout</Button>
        </Pane>
      </ResizablePanel>
      <ResizableHandle label="Resize saved panel" />
      <ResizablePanel minSize={30}>
        <Pane title="Content" />
      </ResizablePanel>
    </ResizablePanels>
  );
}

/** Keep the layout across visits: save `onLayout`, pass it back as `defaultLayout`. */
export const PersistedLayout: Story = {
  render: () => <PersistedLayoutDemo />,
};

/** Re-point the handle's tokens: a thick accent bar that glows while pointed at or dragged. */
export const ThemedHandle: Story = {
  render: () => (
    <SquonkThemeProvider
      roleBindings={{
        "components.resizable.gutter": "8px",
        "components.resizable.lineWidth": "8px",
        "components.resizable.lineWidthHover": "8px",
        "components.resizable.lineWidthActive": "8px",
        "components.resizable.lineColor": "roles.color.edge",
        "components.resizable.lineColorHover": "roles.color.accent",
        "components.resizable.lineColorActive": "roles.color.accent",
        "components.resizable.glow": "0 0 12px 2px color-mix(in srgb, var(--squonk-roles-color-accent) 60%, transparent)",
        "components.resizable.hoverDelay": "120ms",
        "components.resizable.barColor": "roles.color.surface",
        "components.resizable.barLength": "24px",
        "components.resizable.barThickness": "2px",
      }}
    >
      <ResizablePanels>
        <ResizablePanel defaultSize={35} minSize={20}>
          <Pane title="Themed handle" background="subtle">
            <Text tone="muted">Point at the bar: it widens and glows in the accent colour.</Text>
          </Pane>
        </ResizablePanel>
        <ResizableHandle label="Resize" appearance="bar" />
        <ResizablePanel minSize={20}>
          <Pane title="Content" />
        </ResizablePanel>
      </ResizablePanels>
    </SquonkThemeProvider>
  ),
};

/** The handles in dark mode. */
export const Dark: Story = {
  render: () => (
    <SquonkThemeProvider mode="dark">
      <ResizablePanels>
        <ResizablePanel defaultSize={30} minSize={15}>
          <Pane title="Line" background="subtle" />
        </ResizablePanel>
        <ResizableHandle label="Resize line panel" />
        <ResizablePanel minSize={15}>
          <Pane title="Bar" background="surface" />
        </ResizablePanel>
        <ResizableHandle label="Resize bar panel" appearance="bar" />
        <ResizablePanel minSize={15}>
          <Pane title="Grip" background="surface" />
        </ResizablePanel>
        <ResizableHandle label="Resize grip panel" appearance="grip" />
        <ResizablePanel minSize={15}>
          <Pane title="End" background="surface" />
        </ResizablePanel>
      </ResizablePanels>
    </SquonkThemeProvider>
  ),
};
