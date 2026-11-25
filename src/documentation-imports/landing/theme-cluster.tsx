import React from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  HStack,
  Heading,
  Link,
  Motion,
  Presentation,
  ProgressBar,
  RadioGroup,
  Stat,
  Switch,
  Table,
  type TableColumn,
  Tag,
  TagGroup,
  Text,
  TextField,
  VStack,
} from "../../components";
import {
  ArrowRightIcon,
  type Icon,
  SearchIcon,
  StarIcon,
} from "../../components/functional-primitive/icon/icon";
import type { Register } from "../../theme/purpose";
import { SquonkThemeProvider } from "../../theme/theme-provider";
import { useSquonkTheme } from "../../theme/theme-context";
import { useThemeCssVars } from "../../theme/use-theme-css-vars";
import { exampleTheme } from "../../design-system/themes/themes";
import { useExampleThemeFonts } from "../../design-system/themes/use-theme-fonts";
import styles from "./theme-cluster.module.css";

/**
 * One light for the whole cluster: every card's relief, edges and drop
 * shadows fall away from the upper left, where the glow sits behind them.
 */
const LIGHT_ANGLE = 315;

type Reading = { id: string; site: string; tears: string; at: string };
const READINGS: Reading[] = [
  { id: "r1", site: "Pureora 04", tears: "12.4 ml", at: "02:14" },
  { id: "r2", site: "Whirinaki 11", tears: "8.9 ml", at: "02:31" },
  { id: "r3", site: "Kaimai 02", tears: "15.0 ml", at: "02:47" },
];
const READING_COLUMNS: TableColumn<Reading>[] = [
  { key: "site", header: "Site" },
  { key: "tears", header: "Tears" },
  { key: "at", header: "Time" },
];

/** Dues collected each month this year, in thousands, ending with this month. */
const DUES = [18.2, 19.1, 18.7, 20.4, 21.0, 22.6, 22.1, 24.8];
const thousands = (n: number) => `$${n.toFixed(1)}k`;

/** A card's heading, with a decorative icon before it. */
function Titled({ icon: Glyph, children }: { icon: Icon; children: React.ReactNode }) {
  return (
    <HStack gap="xs" align="center">
      <Glyph size="md" />
      <Heading level={5} as="p">{children}</Heading>
    </HStack>
  );
}

interface Group {
  /** What the card shows, for its group label. */
  name: string;
  theme: string;
  register: Register;
  /** Its place in the cluster's grid (see theme-cluster.module.css). */
  slot: string;
  /** How far it stands off the tilted plane, in px; nearer cards sit on top. */
  z: number;
  /** Hidden on narrow screens, where the cluster becomes a short stack. */
  optional?: boolean;
  content: React.ReactNode;
}

/** One small scene per example theme, each suited to the product it imagines. */
const GROUPS: Group[] = [
  {
    name: "Field journal article",
    theme: "kauri",
    register: "default",
    slot: "kauri",
    z: -80,
    optional: true,
    content: (
      <VStack gap="sm">
        <Text variant="eyebrow" tone="secondary">Field Journal · Issue 41</Text>
        <Heading level={4} as="p">The quiet hours of the Pureora squonk</Heading>
        <Text>Three winters of night-watch notes, and what the tear trails <Link href="#field-journal">tell us about its range</Link>.</Text>
        <HStack gap="sm" align="center">
          <Avatar name="Mere Tūhoe" />
          <Text tone="secondary">Mere Tūhoe · 9 min read</Text>
        </HStack>
      </VStack>
    ),
  },
  {
    name: "Ask the archive",
    theme: "aurora",
    register: "default",
    slot: "aurora",
    z: -40,
    content: (
      <VStack gap="sm">
        <Titled icon={StarIcon}>Ask the archive</Titled>
        <TextField label="Question" defaultValue="Where was weeping heard in May?" />
        <TagGroup label="Suggestions">
          <Tag>Map the sightings</Tag>
          <Tag>Compare with 2025</Tag>
        </TagGroup>
        <Button variant="primary">Ask <ArrowRightIcon /></Button>
      </VStack>
    ),
  },
  {
    name: "Dues collected",
    theme: "meridian",
    register: "compact",
    slot: "meridian",
    z: 10,
    optional: true,
    content: (
      <Stat
        label="Dues collected, November"
        value={<Motion.Count value={DUES[DUES.length - 1]} format={thousands} playOnMount />}
        change={0.122}
        changeLabel="vs October"
        trend={DUES}
        trendLabel="Dues collected each month this year"
      />
    ),
  },
  {
    name: "Swamp walks this week",
    theme: "tidepool",
    register: "default",
    slot: "tidepool",
    z: 120,
    content: (
      <VStack gap="md">
        <Heading level={4} as="p">Kia ora, Aroha</Heading>
        <ProgressBar label="Swamp walks this week" value={60} showValue />
        <Switch label="Remind me at dusk" defaultChecked />
        <Button variant="primary" fullWidth>Plan a walk <ArrowRightIcon /></Button>
      </VStack>
    ),
  },
  {
    name: "Live sighting log",
    theme: "fieldbook",
    register: "compact",
    slot: "fieldbook",
    z: 40,
    optional: true,
    content: (
      <VStack gap="sm">
        <HStack gap="sm" align="center">
          <Titled icon={SearchIcon}>Sighting log</Titled>
          <Badge tone="success">Live</Badge>
        </HStack>
        <Table caption="Sighting log" columns={READING_COLUMNS} rows={READINGS} rowKey="id" selectable defaultSelectedKeys={["r2"]} />
      </VStack>
    ),
  },
  {
    name: "Night watch poster",
    theme: "monolith",
    register: "default",
    slot: "monolith",
    z: 70,
    content: (
      <VStack gap="sm">
        <Text variant="eyebrow">Night watch · 28.11</Text>
        <Heading level={3} as="p">Listen for <em>the weeping</em></Heading>
        <Button variant="primary">Reserve a place</Button>
      </VStack>
    ),
  },
  {
    name: "Report a sighting",
    theme: "wayfinder",
    register: "default",
    slot: "wayfinder",
    z: 0,
    optional: true,
    content: (
      <VStack gap="md">
        <Text variant="eyebrow" tone="secondary">Step 2 of 3</Text>
        <RadioGroup
          name="noticed"
          legend="What did you notice?"
          value="weeping"
          options={[
            { value: "weeping", label: "Weeping" },
            { value: "tracks", label: "Tear tracks" },
          ]}
        />
        <Button variant="primary">Continue</Button>
      </VStack>
    ),
  },
];

/** Carries a nested theme's variables onto the card's own wrapper. */
function ThemedCard({ group }: { group: Group }) {
  const scope = useThemeCssVars();
  return (
    <div className={styles.scope} style={scope.style}>
      {scope.provide(
        <Presentation register={group.register}>
          <Motion.Presence show playOnMount from="below">
            <div className={styles.arrive}>
              <Card variant="elevated" className={styles.card}>{group.content}</Card>
            </div>
          </Motion.Presence>
        </Presentation>,
      )}
    </div>
  );
}

/**
 * Real components in seven example themes and three sizes, in the page's
 * colour mode, scattered on a tilted plane with a glow behind them. The cards
 * overlap on a grid, so the cluster keeps its shape as the column narrows and
 * stacks on small screens. On arrival they fly out from the middle, growing
 * as they go, each with its own theme's motion, and every one is lit from the
 * same direction.
 */
export function ThemeCluster() {
  useExampleThemeFonts();
  const { mode: pageMode } = useSquonkTheme();
  return (
    <figure
      className={styles.cluster}
      data-mode={pageMode}
      aria-label="The same components in seven themes and three sizes, lit from one direction"
    >
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.rays} aria-hidden="true" />
      <div className={styles.stage}>
        <div className={styles.plane}>
          <Motion.Stagger>
            {GROUPS.map((group, index) => {
              const theme = exampleTheme(group.theme);
              return (
                <div
                  key={group.name}
                  role="group"
                  aria-label={`${group.name}, in the ${theme.name} theme`}
                  className={styles.group}
                  data-slot={group.slot}
                  data-optional={group.optional || undefined}
                  style={{ "--at-z": `${group.z}px`, zIndex: group.z + 100 } as React.CSSProperties}
                >
                  <div className={styles.flight} style={{ "--flight-index": index } as React.CSSProperties}>
                    <SquonkThemeProvider
                      mode={pageMode}
                      primitives={{ ...theme.primitives, lightAngle: LIGHT_ANGLE }}
                      roleBindings={theme.roleBindings}
                    >
                      <ThemedCard group={group} />
                    </SquonkThemeProvider>
                  </div>
                </div>
              );
            })}
          </Motion.Stagger>
        </div>
      </div>
    </figure>
  );
}
