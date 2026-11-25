import React from "react";
import {
  Button,
  Code,
  Heading,
  IconButton,
  InteractiveCard,
  Link,
  Motion,
  Select,
  Text,
  VStack,
} from "../../components";
import {
  ArrowDownIcon,
  CheckIcon,
  CopyIcon,
  DarkModeIcon,
  LightModeIcon,
} from "../../components/functional-primitive/icon/icon";
import { useSquonkTheme } from "../../theme/theme-context";
import darkLogo from "../../../public/squonk-ui-components-dark.svg";
import lightLogo from "../../../public/squonk-ui-components.svg";
import { DocsNavigation, docsHref } from "../docs-navigation";
import { EXAMPLE_THEMES, exampleTheme } from "../../design-system/themes/themes";
import { setColorMode, setThemePreset, useThemePreset } from "../../design-system/themes/theme-preset-store";
import washDark from "./hero-wash-dark.webp";
import washLight from "./hero-wash-light.webp";
import styles from "./landing.module.css";
import { ThemeCluster } from "./theme-cluster";
import { Spot, type SpotName } from "./spot-graphics";
import { MediaBox } from "./media-box";
import { DeviceScreen } from "./device-screen";
import { DuesInstalmentPlan } from "../../demos/dues-instalment-plan";
import { JoinTheSociety } from "../../demos/join-the-society";
import { LogASighting } from "../../demos/log-a-sighting";
import { MemberDashboard } from "../../demos/member-dashboard";
import { MemberSignIn } from "../../demos/member-sign-in";
import { SocietySecretary } from "../../demos/society-secretary";

const SETUP = "npx @squonk/ui";

/**
 * Switches every page to one of the example themes, as the toolbar's Theme
 * menu does, and between light and dark, as its mode toggle does.
 */
function ThemePicker() {
  const current = useThemePreset();
  const { mode } = useSquonkTheme();
  return (
    <div className={styles.themePicker}>
      <div className={styles.themeSelect}>
        <Select
          label="Theme"
          value={current}
          onChange={(id) => id && setThemePreset(id)}
          options={EXAMPLE_THEMES.map((theme) => ({ value: theme.id, label: theme.name }))}
          helperText={exampleTheme(current).description}
        />
      </div>
      {/* The sidebar's mode toggle, larger: a round button showing the mode it switches to. */}
      <IconButton
        className={styles.modeToggle}
        variant="secondary"
        shape="pill"
        icon={mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
        label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
        onClick={() => setColorMode(mode === "dark" ? "light" : "dark")}
      />
    </div>
  );
}

/** The setup command, with a copy button. */
function SetupCommand() {
  const [copied, setCopied] = React.useState(false);
  return (
    <div className={styles.command}>
      <Code className={styles.commandText}>{SETUP}</Code>
      <IconButton
        icon={copied ? <CheckIcon /> : <CopyIcon />}
        label={copied ? "Copied" : "Copy the setup command"}
        variant="ghost"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(SETUP);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          } catch {
            /* clipboard blocked: the command is still selectable */
          }
        }}
      />
    </div>
  );
}

const WAYS_IN: { href: string; spot: SpotName; title: string; text: string }[] = [
  {
    href: docsHref("get-started-getting-started--docs"),
    spot: "build",
    title: "Build an app",
    text: "One command sets up the package, the theme and your agent. Then build your first screen.",
  },
  {
    href: docsHref("get-started-working-with-your-agent--docs"),
    spot: "agent",
    title: "Work with your agent",
    text: "Claude Code, Codex, Copilot and Cursor look up components and preview screens as they build.",
  },
  {
    href: docsHref("components-overview--docs"),
    spot: "browse",
    title: "Browse the components",
    text: "Every component, grouped by what it's for, each with live examples and guidance.",
  },
];

const FEATURES: { spot: SpotName; title: string; text: React.ReactNode }[] = [
  { spot: "accessible", title: "Accessible by default", text: "Built on React Aria: labels, keyboard and focus behave the way people expect." },
  { spot: "theme", title: "A theme with intent", text: "Purpose tokens name every decision, so one change reaches every component that shares it." },
  { spot: "forms", title: "Forms, done once", text: <>Field errors, an error summary and <Link href={docsHref("patterns-forms-server-errors--docs")}>errors returned by your API</Link>, all handled.</> },
  { spot: "modes", title: "Light and dark", text: "Every component in both modes, with contrast checked in tests." },
  { spot: "agents", title: "Ready for agents", text: "An MCP server, a skill and lint rules keep generated code on the library." },
  { spot: "tested", title: "Tested", text: "Hundreds of component tests in four browsers, with visual baselines." },
];

/** Each shows the live screen in a device: a laptop's screen or a phone's. */
const EXAMPLES: { id: string; title: string; text: string; device: "monitor" | "phone"; screen: React.ComponentType }[] = [
  { id: "examples-member-dashboard--overview", title: "Member dashboard", text: "Balances, tabs, a sortable table and a payment dialog.", device: "monitor", screen: MemberDashboard },
  { id: "examples-member-sign-in--sign-in", title: "Sign in", text: "A split page with a validated form and help.", device: "phone", screen: MemberSignIn },
  { id: "examples-join-the-society--registration", title: "Join the Society", text: "A long form in sections with conditional questions.", device: "monitor", screen: JoinTheSociety },
  { id: "examples-log-a-sighting--sighting-report", title: "Log a sighting", text: "A form with a live summary beside it.", device: "monitor", screen: LogASighting },
  { id: "examples-dues-instalment-plan--new-arrangement", title: "Dues instalment plan", text: "An instalment plan builder with a live schedule.", device: "phone", screen: DuesInstalmentPlan },
  { id: "examples-society-secretary--work-queue", title: "Work queue", text: "Search, filters, bulk actions and a case drawer.", device: "monitor", screen: SocietySecretary },
];

/** A laptop or phone, drawn in CSS, showing a live screen, in the page's standard 16:10 media box. */
function Device({ kind, label, children }: { kind: "monitor" | "phone"; label: string; children: React.ReactNode }) {
  return (
    <MediaBox ratio="16 / 10">
      <span className={styles.device} data-kind={kind}>
        {kind === "monitor" ? (
          <DeviceScreen label={label} width={1280} height={800}>{children}</DeviceScreen>
        ) : (
          <DeviceScreen label={label} width={390} height={844}>{children}</DeviceScreen>
        )}
      </span>
    </MediaBox>
  );
}

/** Scrolls to the real screens, smoothly unless motion is reduced. */
function showExamples(event: React.MouseEvent) {
  const target = document.getElementById("examples");
  if (!target) return;
  event.preventDefault();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

/** The Introduction page. */
export function Landing() {
  const theme = useSquonkTheme();
  return (
    <DocsNavigation>
      <div className={styles.landing}>
        <div
          className={styles.wash}
          data-mode={theme.mode}
          style={{ backgroundImage: `url(${theme.mode === "dark" ? washDark : washLight})` }}
          aria-hidden="true"
        />
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <img src={theme.mode === "dark" ? darkLogo : lightLogo} alt="SquonkUI" className={styles.logo} />
            <h1 className={styles.title}>Build interfaces that look right and work for everyone.</h1>
            <Text className={styles.lead}>
              The React components, theme and patterns behind Squonk's products, ready for you and
              your coding agent to build with.
            </Text>
            <div className={styles.actions}>
              <Button as="a" href={docsHref("get-started-getting-started--docs")} variant="primary">Get started</Button>
              <Button as="a" href={docsHref("get-started-working-with-your-agent--docs")} variant="secondary">Work with your agent</Button>
              <Button as="a" href="#examples" variant="ghost" onClick={showExamples}>
                See it in real screens <ArrowDownIcon />
              </Button>
            </div>
            <div className={styles.setupRow}>
              <VStack gap="xs">
                <Text tone="secondary">Set up an app in one command:</Text>
                <SetupCommand />
              </VStack>
              <ThemePicker />
            </div>
          </div>
          <ThemeCluster />
        </section>

        <section className={styles.section} aria-labelledby="ways-in">
          <Heading level={2} id="ways-in">Start here</Heading>
          <div className={styles.cards}>
            <Motion.Stagger>
              {WAYS_IN.map((way) => (
                <Motion.Reveal key={way.title}>
                  <div className={styles.cell}>
                    <InteractiveCard as="a" href={way.href} className={styles.card}>
                      <Spot name={way.spot} />
                      <Heading level={5} as="span" className={styles.cardTitle}>{way.title}</Heading>
                      <Text tone="secondary">{way.text}</Text>
                    </InteractiveCard>
                  </div>
                </Motion.Reveal>
              ))}
            </Motion.Stagger>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="what-you-get">
          <Heading level={2} id="what-you-get">What you get</Heading>
          <div className={styles.features}>
            <Motion.Stagger>
              {FEATURES.map((feature) => (
                <Motion.Reveal key={feature.title}>
                  <div className={styles.feature}>
                    <Spot name={feature.spot} />
                    <Heading level={6} as="h3" className={styles.featureTitle}>{feature.title}</Heading>
                    <Text tone="secondary">{feature.text}</Text>
                  </div>
                </Motion.Reveal>
              ))}
            </Motion.Stagger>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="examples">
          <Heading level={2} id="examples">See it in real screens</Heading>
          <Text tone="secondary">Six complete screens, built only from the library. Open one and try it.</Text>
          <div className={styles.cards}>
            <Motion.Stagger>
              {EXAMPLES.map((example) => (
                <Motion.Reveal key={example.id}>
                  <div className={styles.cell}>
                    <InteractiveCard as="a" href={docsHref(example.id)} className={styles.card}>
                      <Device kind={example.device} label={`The ${example.title} screen`}>
                        <example.screen />
                      </Device>
                      <Heading level={5} as="span" className={styles.cardTitle}>{example.title}</Heading>
                      <Text tone="secondary">{example.text}</Text>
                    </InteractiveCard>
                  </div>
                </Motion.Reveal>
              ))}
            </Motion.Stagger>
          </div>
        </section>

        <section className={styles.section}>
          <Text tone="secondary" className={styles.more}>
            More: <Link href={docsHref("foundations-overview--docs")}>Foundations</Link> ·{" "}
            <Link href={docsHref("patterns-overview--docs")}>Patterns</Link> ·{" "}
            <Link href={docsHref("contributing-developing-the-library--docs")}>Contributing</Link>
          </Text>
        </section>
      </div>
    </DocsNavigation>
  );
}
