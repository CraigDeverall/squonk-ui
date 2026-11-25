"use client";

import React, { useEffect, useState } from "react";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import type { ColorMode, PrimitivesOverride } from "../../../theme/theme";
import { Block } from "../../layout-primitive/block/block";
import { VStack } from "../../layout-primitive/vstack/vstack";
import { Grid } from "../../layout-primitive/grid/grid";
import { Cluster } from "../../layout/cluster/cluster";
import { Heading } from "../../functional-primitive/heading/heading";
import { Text } from "../../functional-primitive/text/text";
import { Button } from "../../functional/button/button";
import { Badge } from "../../functional/badge/badge";
import { ThemeStyleBlock } from "./theme-style-block";

/*
 * Showcase for the `ThemeStyleBlock` component used by the
 * Style/Theme Style Block MDX page. Bundled as a component (not raw MDX JSX)
 * because Storybook's docs container doesn't reliably propagate the
 * theme provider context into MDX content — wrapping the demos in
 * a fresh `SquonkThemeProvider` makes them work regardless.
 *
 * The provider here mirrors the global Storybook mode store + theme-controller
 * primitive overrides via a `localStorage`/storage-event bridge so toggling
 * mode or dragging the Modifier-ratio sliders updates the showcase in step
 * with the rest of the docs.
 */

const MODE_STORAGE_KEY = "squonk-storybook-mode";
const OVERRIDES_STORAGE_KEY = "squonk-theme-controller:state:v1";

function readStoredMode(): ColorMode {
  if (typeof window === "undefined") return "light";
  try {
    return localStorage.getItem(MODE_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function useStorybookMode(): ColorMode {
  const [mode, setMode] = useState<ColorMode>(readStoredMode);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== MODE_STORAGE_KEY) return;
      setMode(e.newValue === "dark" ? "dark" : "light");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return mode;
}

function readStoredOverrides(): PrimitivesOverride {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PrimitivesOverride) : {};
  } catch {
    return {};
  }
}

/*
 * Sync to the theme-controller panel's primitive overrides via the same
 * localStorage key (and same-origin `storage` events) the addon uses. The
 * docs container's `SquonkThemeProvider` is built without these overrides,
 * so the showcase has to pull them itself — otherwise dragging the
 * Register-ratio sliders would only affect stories, not the docs page.
 */
function useStorybookOverrides(): PrimitivesOverride {
  const [overrides, setOverrides] = useState<PrimitivesOverride>(
    readStoredOverrides
  );
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== OVERRIDES_STORAGE_KEY) return;
      try {
        setOverrides(e.newValue ? (JSON.parse(e.newValue) as PrimitivesOverride) : {});
      } catch {
        setOverrides({});
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return overrides;
}

const DemoCard: React.FC<{
  title: string;
  caption: string;
  ratio: string;
  background?: "default" | "surface";
}> = ({ title, caption, ratio, background = "surface" }) => (
  <Block padding="md" background={background} radius="base" bordered>
    <VStack gap="sm">
      <Cluster gap="xs">
        <Heading level={4}>{title}</Heading>
        <Badge tone="info" variant="subtle">
          {ratio}
        </Badge>
      </Cluster>
      <Text>{caption}</Text>
      <Cluster gap="xs">
        <Button variant="primary">Save</Button>
        <Button variant="ghost">Cancel</Button>
      </Cluster>
    </VStack>
  </Block>
);

const RegisterRow: React.FC = () => (
  <Block padding="md" background="subtle" radius="md">
    <Grid columns={3} gap="md">
      <ThemeStyleBlock register="compact">
        <DemoCard
          title="Compact"
          caption="Toolbar, sidebar, settings density."
          ratio="× 0.75 / 0.875 / 0.75"
        />
      </ThemeStyleBlock>
      <ThemeStyleBlock register="normal">
        <DemoCard
          title="Normal"
          caption="The library default."
          ratio="× 1"
        />
      </ThemeStyleBlock>
      <ThemeStyleBlock register="display">
        <DemoCard
          title="Display"
          caption="Hero, marketing, splash density."
          ratio="× 1.5 / 1.25 / 1.5"
        />
      </ThemeStyleBlock>
    </Grid>
  </Block>
);

const InverseRow: React.FC = () => (
  <Block padding="md" background="subtle" radius="md">
    <Grid columns={2} gap="md">
      <DemoCard
        title="Inherited"
        caption="Same mode as the page above."
        ratio="mode = parent"
      />
      <ThemeStyleBlock invertMode>
        <DemoCard
          title="Inverse"
          caption="Flipped from the page above."
          ratio="mode = flipped"
          background="default"
        />
      </ThemeStyleBlock>
    </Grid>
  </Block>
);

const CompositionRow: React.FC = () => (
  <Block padding="md" background="subtle" radius="md">
    <Grid columns={3} gap="md">
      <ThemeStyleBlock register="compact" invertMode>
        <DemoCard
          title="Compact + Inverse"
          caption="Dense, flipped."
          ratio="compact + flip"
          background="default"
        />
      </ThemeStyleBlock>
      <ThemeStyleBlock register="display" invertMode>
        <DemoCard
          title="Display + Inverse"
          caption="Hero, flipped."
          ratio="display + flip"
          background="default"
        />
      </ThemeStyleBlock>
      <ThemeStyleBlock register="display">
        <ThemeStyleBlock register="normal">
          <DemoCard
            title="Display → Normal"
            caption="Reset to root sizing inside a Display tree."
            ratio="display escape"
          />
        </ThemeStyleBlock>
      </ThemeStyleBlock>
    </Grid>
  </Block>
);

/**
 * Section-sized showcase: side-by-side size registers. Mounts its own
 * `SquonkThemeProvider` so it works inside MDX docs pages.
 */
export const RegisterShowcase: React.FC = () => {
  const mode = useStorybookMode();
  const primitives = useStorybookOverrides();
  return (
    <SquonkThemeProvider mode={mode} primitives={primitives}>
      <RegisterRow />
    </SquonkThemeProvider>
  );
};

/** Section-sized showcase: parent vs `<ThemeStyleBlock invertMode>`. */
export const InverseShowcase: React.FC = () => {
  const mode = useStorybookMode();
  const primitives = useStorybookOverrides();
  return (
    <SquonkThemeProvider mode={mode} primitives={primitives}>
      <InverseRow />
    </SquonkThemeProvider>
  );
};

/** Section-sized showcase: composing inverse with the size registers. */
export const CompositionShowcase: React.FC = () => {
  const mode = useStorybookMode();
  const primitives = useStorybookOverrides();
  return (
    <SquonkThemeProvider mode={mode} primitives={primitives}>
      <CompositionRow />
    </SquonkThemeProvider>
  );
};
