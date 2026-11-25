import React from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Code,
  CurrencyField,
  Grid,
  Heading,
  IconButton,
  ProgressBar,
  RadioGroup,
  Select,
  Sparkline,
  Stat,
  Switch,
  Tabs,
  Tag,
  TagGroup,
  Text,
  TextField,
  VStack,
} from "../components";
import { AddIcon, DownloadIcon, EditIcon, MoreIcon, SearchIcon } from "../components/functional-primitive/icon/icon";
import { EXAMPLE_THEMES, type ExampleTheme } from "../design-system/themes/themes";
import { useExampleThemeFonts } from "../design-system/themes/use-theme-fonts";
import { useSquonkTheme } from "../theme/theme-context";
import { SquonkThemeProvider } from "../theme/theme-provider";
import { primitives } from "../theme/theme";
import { BINDING_SWITCH_KEYS } from "../theme/switches";
import { useThemeCssVars } from "../theme/use-theme-css-vars";
import { nz } from "./fixtures";
import styles from "./theme-showcase.module.css";

const SWATCHES: { key: string; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "link", label: "Link" },
  { key: "success", label: "Success" },
  { key: "warning", label: "Warning" },
  { key: "error", label: "Error" },
  { key: "backgroundSurface", label: "Page" },
  { key: "textPrimary", label: "Text" },
];

/** The theme's palette, read from the theme in scope so it follows light and dark. */
function Palette() {
  const theme = useSquonkTheme();
  const colors = theme.colors as unknown as Record<string, string>;
  const value = (key: string) =>
    ({ backgroundSurface: theme.colors.background.surface, textPrimary: theme.colors.text.primary })[key] ?? colors[key];
  return (
    <ul className={styles.palette} aria-label="Palette">
      {SWATCHES.map((swatch) => (
        <li key={swatch.key} className={styles.swatch}>
          <span className={styles.chip} style={{ backgroundColor: value(swatch.key) }} aria-hidden="true" />
          <span className={styles.swatchLabel}>{swatch.label}</span>
        </li>
      ))}
    </ul>
  );
}

function Actions() {
  return (
    <Card className={styles.panel}>
      <VStack gap="md">
        <Heading level={3}>Buttons</Heading>
        <div className={styles.row}>
          <Button variant="primary">Pay now</Button>
          <Button variant="secondary">Save draft</Button>
          <Button variant="solid">Export</Button>
          <Button variant="ghost">Cancel</Button>
        </div>
        <div className={styles.row}>
          <Button variant="primary" lift><AddIcon size="control" /> Log a sighting</Button>
          <Button variant="secondary" lift><DownloadIcon size="control" /> Statement</Button>
          <Button variant="danger">Delete</Button>
        </div>
        <div className={styles.row}>
          <IconButton icon={<EditIcon />} label="Edit" />
          <IconButton variant="secondary" icon={<SearchIcon />} label="Search" />
          <IconButton variant="ghost" icon={<MoreIcon />} label="More actions" />
          <Button variant="primary" disabled>Submitted</Button>
        </div>
        <TagGroup aria-label="Filters">
          <Tag tone="primary">Tear trail</Tag>
          <Tag tone="primary">Tear pool</Tag>
          <Tag>Wellington Chapter</Tag>
        </TagGroup>
        <div className={styles.row}>
          <Badge tone="success">Verified</Badge>
          <Badge tone="warning">Due soon</Badge>
          <Badge tone="error">Overdue</Badge>
          <Badge tone="info">Under review</Badge>
        </div>
      </VStack>
    </Card>
  );
}

function Inputs({ id }: { id: string }) {
  const [frequency, setFrequency] = React.useState("two-monthly");
  return (
    <Card className={styles.panel}>
      <VStack gap="md">
        <Heading level={3}>Fields</Heading>
        <TextField label="Member name" defaultValue="Aroha Ngata" helperText="As it appears on your membership card." />
        <TextField label="Email" defaultValue="aroha@example" error="Enter an email address like name@example.org" />
        <div className={styles.pair}>
          <Select
            label="Fee type"
            defaultValue="dues"
            options={[{ value: "dues", label: "Annual dues" }, { value: "levy", label: "Swamp Fund levy" }, { value: "kit", label: "Night-watch kit hire" }]}
          />
          <CurrencyField {...nz} label="Amount" defaultValue={1240} />
        </div>
        <RadioGroup
          name={`${id}-frequency`}
          legend="Night-watch frequency"
          direction="row"
          value={frequency}
          onChange={setFrequency}
          options={[{ value: "monthly", label: "Monthly" }, { value: "two-monthly", label: "Two-monthly" }, { value: "six-monthly", label: "Six-monthly" }]}
        />
        <div className={styles.row}>
          <Checkbox label="Email me a receipt" defaultChecked />
          <Switch label="Reminders" defaultChecked />
        </div>
      </VStack>
    </Card>
  );
}

function Figures() {
  return (
    <Card className={styles.panel}>
      <VStack gap="md">
        <Stat
          label="Sightings this month"
          value="87"
          change={0.052}
          changeLabel="vs October 2025"
          trend={[71, 74, 73, 78, 80, 79, 83, 87]}
          trendLabel="Sightings logged, last 8 months"
        />
        <ProgressBar label="Watch season" value={68} showValue />
        <div className={styles.inline}>
          <Text as="span" tone="secondary">Credits, last 12 weeks</Text>
          <Sparkline data={[12, 14, 11, 15, 18, 17, 21, 19, 23, 22, 26, 28]} label="Credits applied, last 12 weeks" slot={3} />
        </div>
        <Alert tone="info" title="Instalment plan available">Spread what you owe over up to 12 months.</Alert>
        <Tabs
          listLabel="Account"
          items={[
            { value: "accounts", label: "Accounts", content: <Text tone="secondary">Four membership accounts, one overdue.</Text> },
            { value: "sightings", label: "Sightings", content: <Text tone="secondary">Two sightings logged this year.</Text> },
            { value: "newsletters", label: "Newsletters", content: <Text tone="secondary">No new newsletters.</Text> },
          ]}
        />
      </VStack>
    </Card>
  );
}
/** The theme switches and choices, each of which sets several purposes. */
/** The yes-or-no theme switches, each of which sets several purposes. */
const SWITCH_KEYS = [
  "deriveFromPrimary", "uppercaseControls", "underlineLinks", "filledFields", "printBackgrounds", "printLinkUrls", "indicatorStyle",
  ...BINDING_SWITCH_KEYS,
] as const;

/** The switches and purpose decisions a theme makes, as the code that makes them. */
function Decisions({ theme }: { theme: ExampleTheme }) {
  const switches = SWITCH_KEYS.flatMap((key) => {
    const value = theme.primitives[key];
    return value !== undefined && value !== primitives[key] ? [[key, String(value)] as const] : [];
  });
  // A per-mode binding shows both of its values.
  const bindings = Object.entries(theme.roleBindings).map(
    ([path, value]) => [path, typeof value === "object" ? `${value.light} (light), ${value.dark} (dark)` : String(value)] as const,
  );
  if (!bindings.length && !switches.length) {
    return <Text tone="secondary">No purpose decisions of its own: the library's defaults, from its primitives.</Text>;
  }
  const count = [
    switches.length ? `${switches.length} ${switches.length === 1 ? "switch" : "switches"}` : "",
    bindings.length ? `${bindings.length} purpose decisions` : "",
  ].filter(Boolean).join(" and ");
  return (
    <details className={styles.decisions}>
      <summary>
        <Text as="span" weight="bold">{count}</Text>
        <Text as="span" tone="secondary"> on top of its palette, type, shape and density</Text>
      </summary>
      <dl className={styles.bindingList}>
        {[...switches, ...bindings].map(([path, value]) => (
          <div key={path} className={styles.binding}>
            <dt><Code>{path}</Code></dt>
            <dd><Code>{value}</Code></dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

/** One theme's band. It carries the theme's variables itself, so its own CSS (the page colour) follows the theme. */
function Band({ theme }: { theme: ExampleTheme }) {
  const scope = useThemeCssVars();
  return (
    <section className={styles.specimen} style={scope.style} aria-labelledby={`theme-${theme.id}`}>
      {scope.provide(
        <>
          <header className={styles.specimenHeader}>
            <div className={styles.titles}>
              <Heading level={2} id={`theme-${theme.id}`}>{theme.name}</Heading>
              <Text tone="secondary">{theme.description}</Text>
            </div>
            <Palette />
          </header>
          <Grid columns={{ mobile: 1, tablet: 2, wide: 3 }} gap="md">
            <Actions />
            <Inputs id={theme.id} />
            <Figures />
          </Grid>
          <Decisions theme={theme} />
        </>,
      )}
    </section>
  );
}

/** One theme, painted on its own page colour. */
function ThemeSpecimen({ theme }: { theme: ExampleTheme }) {
  const { mode } = useSquonkTheme();
  return (
    <SquonkThemeProvider mode={mode} primitives={theme.primitives} roleBindings={theme.roleBindings}>
      <Band theme={theme} />
    </SquonkThemeProvider>
  );
}

export interface ThemeShowcaseProps {
  /** Which example themes to show, by id. Defaults to all of them. */
  themes?: string[];
}

/**
 * The same buttons, fields and figures in every example theme. Only the theme
 * changes: its primitives, and the purpose decisions listed under each.
 */
export function ThemeShowcase({ themes }: ThemeShowcaseProps) {
  useExampleThemeFonts();
  const shown = themes ? EXAMPLE_THEMES.filter((theme) => themes.includes(theme.id)) : EXAMPLE_THEMES;
  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <Heading level={1}>{shown.length === EXAMPLE_THEMES.length ? "One library, every theme" : "One library, different themes"}</Heading>
        <Text tone="secondary">
          Every panel below is the same components with the same props. Each theme sets a handful of primitives
          (palette, typefaces, density, corner radius, depth and motion) and re-points a few purpose tokens: how a
          button rises and what shadow it casts, whether a field is boxed, underlined or filled, how focus shows.
          Hover, press and tab through them to feel the difference.
        </Text>
      </header>
      {shown.map((theme) => <ThemeSpecimen key={theme.id} theme={theme} />)}
    </main>
  );
}
