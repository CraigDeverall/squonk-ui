// Live examples for the Purpose tokens page. Docs-only: each shows the same
// components under different purpose decisions, so the only difference you
// see is what the theme decided.
import React from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CheckboxGroup,
  Code,
  Currency,
  Heading,
  HStack,
  Select,
  Split,
  Table,
  Tag,
  TagGroup,
  Text,
  TextField,
  ThemeModifier,
  VStack,
} from "../../components";
import { useSquonkTheme } from "../../theme/theme-context";
import { SquonkThemeProvider } from "../../theme/theme-provider";
import type { RoleBindingsOverride } from "../../theme/purpose";
import type { PrimitivesOverride } from "../../theme/theme";
import { EXAMPLE_THEMES, type ExampleTheme } from "../themes/themes";
import { useExampleThemeFonts } from "../themes/use-theme-fonts";
import styles from "./purpose-token-examples.module.css";

/** A short form, so spacing, type, edges and controls all show. */
function SampleForm() {
  return (
    <Card>
      <VStack gap="md">
        <Heading level={4} as="h3">Contact details</Heading>
        <TextField label="Full name" defaultValue="Aroha Ngata" helperText="As it appears on your ID." />
        <Select label="Chapter" defaultValue="wellington" options={[{ value: "wellington", label: "Wellington Chapter" }, { value: "auckland", label: "Auckland Chapter" }]} />
        <CheckboxGroup legend="Send me" defaultValue={["newsletters"]} options={[{ value: "newsletters", label: "Newsletters" }, { value: "reminders", label: "Reminders", helperText: "Before each due date" }]} />
        <HStack gap="sm" wrap>
          <Button variant="primary">Save</Button>
          <Button variant="secondary">Cancel</Button>
        </HStack>
      </VStack>
    </Card>
  );
}

/** A fuller screen, so a theme's palette, type, shape, density and depth all show. */
function SampleScreen() {
  return (
    <Card>
      <VStack gap="md">
        <Heading level={4} as="h3">Contact details</Heading>
        <Alert tone="info" title="Check your details">We use these to send newsletters and reminders.</Alert>
        <TextField label="Full name" defaultValue="Aroha Ngata" helperText="As it appears on your ID." />
        <Select label="Chapter" defaultValue="wellington" options={[{ value: "wellington", label: "Wellington Chapter" }, { value: "auckland", label: "Auckland Chapter" }]} />
        <Table
          caption="Recent payments"
          columns={[{ key: "date", header: "Date" }, { key: "amount", header: "Amount", align: "right" }]}
          rows={[{ date: "3 Nov 2026", amount: "$1,240.00" }, { date: "6 Oct 2026", amount: "$980.00" }]}
          rowKey="date"
        />
        <HStack gap="sm" wrap>
          <Button variant="primary">Save</Button>
          <Button variant="secondary">Cancel</Button>
        </HStack>
      </VStack>
    </Card>
  );
}

/** A labelled column: a title, why it differs, and the same content under its decisions. */
function Column({
  title,
  why,
  bindings,
  primitives,
  children,
}: {
  title: string;
  why: React.ReactNode;
  bindings?: RoleBindingsOverride;
  primitives?: PrimitivesOverride;
  children: React.ReactNode;
}) {
  const { mode } = useSquonkTheme();
  return (
    <div className={styles.column}>
      <Text weight="bold">{title}</Text>
      <Text tone="secondary">{why}</Text>
      {bindings || primitives ? (
        <SquonkThemeProvider mode={mode} primitives={primitives} roleBindings={bindings}>
          {children}
        </SquonkThemeProvider>
      ) : (
        children
      )}
    </div>
  );
}

/** One tier token and one edge token re-pointed: everything sharing those meanings moves. */
export function CascadeExample() {
  return (
    <div className={`${styles.columns} sb-unstyled`}>
      <Column title="The default" why="The theme as it ships.">
        <SampleForm />
      </Column>
      <Column
        title="Two shared decisions"
        why={<><Code>roles.space.related</Code> → <Code>spacing.sm</Code>, <Code>roles.color.edge</Code> → <Code>colors.border.strong</Code>.</>}
        bindings={{ "roles.space.related": "spacing.sm", "roles.color.edge": "colors.border.strong" }}
      >
        <SampleForm />
      </Column>
    </div>
  );
}

/** A switch for the big decision, and one purpose it sets adjusted. */
export function OverrideExample() {
  const tags = (
    <Card>
      <VStack gap="md">
        <TextField label="Search sightings" defaultValue="tear trail" />
        <TagGroup aria-label="Filters">
          <Tag tone="primary" onRemove={() => {}}>Wellington Chapter</Tag>
          <Tag tone="primary" onRemove={() => {}}>2026</Tag>
        </TagGroup>
        <HStack gap="sm" wrap>
          <Button variant="primary">Search</Button>
          <Button variant="secondary">Clear</Button>
        </HStack>
      </VStack>
    </Card>
  );
  return (
    <div className={`${styles.columns} sb-unstyled`}>
      <Column title="pillControls" why="Buttons, fields and tags all fully rounded." primitives={{ pillControls: true }}>
        {tags}
      </Column>
      <Column
        title="pillControls, then one override"
        why={<>Tags re-pointed: <Code>roles.radius.chip</Code> → <Code>borders.radius.sm</Code>.</>}
        primitives={{ pillControls: true }}
        bindings={{ "roles.radius.chip": "borders.radius.sm" }}
      >
        {tags}
      </Column>
    </div>
  );
}

/** The same form, with one region re-pointed by a ThemeModifier. */
export function ScopedExample() {
  return (
    <div className={`${styles.columns} sb-unstyled`}>
      <div className={styles.column}>
        <Text weight="bold">The page</Text>
        <Text tone="secondary">The theme as it ships.</Text>
        <SampleForm />
      </div>
      <div className={styles.column}>
        <Text weight="bold">A ThemeModifier region</Text>
        <Text tone="secondary">Roomier related spacing and body-size labels, for this region only.</Text>
        <ThemeModifier override={{ roleBindings: { "roles.space.related": "spacing.sm", "roles.type.label": "roles.type.body" } }}>
          <SampleForm />
        </ThemeModifier>
      </div>
    </div>
  );
}

/** A public service: generous space, soft fully rounded controls, quieter hints. */
const SPACIOUS: RoleBindingsOverride = {
  "roles.space.questionGap": "spacing.xxl",
  "roles.space.related": "spacing.sm",
  "roles.space.surfaceInset": "spacing.lg",
  "roles.radius.control": "borders.radius.full",
  "roles.radius.surface": "borders.radius.xl",
  "roles.control.paddingInline.default": "spacing.lg",
  "components.button.paddingInline.default": "spacing.xl",
  "roles.color.hint": "colors.text.muted",
};

/** A back office: tight forms, square controls, compact tables, small labels. */
const DENSE: RoleBindingsOverride = {
  "roles.space.questionGap": "spacing.md",
  "roles.space.related": "spacing.xxs",
  "roles.space.surfaceInset": "spacing.sm",
  "roles.radius.control": "borders.radius.none",
  "roles.radius.surface": "borders.radius.sm",
  "roles.control.paddingInline.default": "spacing.sm",
  "components.button.paddingInline.default": "spacing.md",
  "components.table.cellPaddingBlock.default": "spacing.xxs",
  "components.table.cellPaddingInline.default": "spacing.sm",
  "roles.type.label": "roles.type.fine",
};

/** Purpose decisions alone: the same scales, primitives and colours. */
export function OneDecisionThreeWays() {
  return (
    <div className={`${styles.columns} sb-unstyled`}>
      <Column title="Default" why="The library's decisions.">
        <SampleScreen />
      </Column>
      <Column title="Spacious" why="A public service: room to breathe, soft controls." bindings={SPACIOUS}>
        <SampleScreen />
      </Column>
      <Column title="Dense" why="A back office: more on screen, square and tight." bindings={DENSE}>
        <SampleScreen />
      </Column>
    </div>
  );
}

/** One example theme's column, in the page's colour mode. */
function ThemeColumn({ theme }: { theme: ExampleTheme }) {
  const { mode } = useSquonkTheme();
  return (
    <div className={styles.column}>
      <Text weight="bold">{theme.name}</Text>
      <Text tone="secondary">{theme.description}</Text>
      <SquonkThemeProvider mode={mode} primitives={theme.primitives} roleBindings={theme.roleBindings}>
        <Card>
          <VStack gap="md">
            <Split wrap>
              <Heading level={4} as="h3">Aroha Ngata</Heading>
              <Badge tone="warning">Payment due</Badge>
            </Split>
            <VStack gap="xxs">
              <Text tone="secondary">To pay</Text>
              <Heading level={3} as="p"><Currency value={148.2} locale="en-NZ" /></Heading>
            </VStack>
            <TextField label="Reference" defaultValue="DUES-0042" />
            <HStack gap="sm" wrap>
              <Button variant="primary">Pay now</Button>
              <Button variant="secondary">Set up a plan</Button>
            </HStack>
          </VStack>
        </Card>
      </SquonkThemeProvider>
    </div>
  );
}

/** The same screen in every example theme. */
export function EveryTheme() {
  useExampleThemeFonts();
  return (
    <div className={`${styles.columns} sb-unstyled`}>
      {EXAMPLE_THEMES.map((theme) => <ThemeColumn key={theme.id} theme={theme} />)}
    </div>
  );
}
