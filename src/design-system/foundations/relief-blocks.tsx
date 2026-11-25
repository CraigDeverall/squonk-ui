"use client";

import React from "react";
import { Button } from "../../components/functional/button/button";
import { Select } from "../../components/functional/select/select";
import { Switch } from "../../components/functional/switch/switch";
import { Tabs } from "../../components/functional/tabs/tabs";
import { Text } from "../../components/functional-primitive/text/text";
import { TextField } from "../../components/functional/text-field/text-field";
import { Card } from "../../components/layout/card/card";
import { HStack } from "../../components/layout-primitive/hstack/hstack";
import { VStack } from "../../components/layout-primitive/vstack/vstack";
import type { RoleBindingsOverride } from "../../theme/purpose";
import type { PrimitivesOverride } from "../../theme/theme";
import { SquonkThemeProvider } from "../../theme/theme-provider";
import { useThemeMeta } from "../../theme/theme-meta-context";
import { Specimen } from "./foundation-blocks";
import styles from "./foundations.module.css";

/*
 * Relief specimens for the Shape and elevation page. Each one rebuilds the
 * active theme (the toolbar's theme, mode and Theme panel edits) with a few
 * relief primitives on top, so the same controls can be compared.
 */

/** Real controls in each relief posture: a card, a field, a select, a switch, a segmented control and buttons. */
function ReliefControls() {
  return (
    <Card variant="elevated">
      <VStack gap="md">
        <TextField label="Project name" defaultValue="Northstar" />
        <Select
          label="Environment"
          options={[
            { value: "staging", label: "Staging" },
            { value: "production", label: "Production" },
          ]}
          defaultValue="staging"
        />
        <Tabs
          variant="enclosed"
          fitted
          listLabel="Period"
          items={[
            { value: "day", label: "Day", content: null },
            { value: "week", label: "Week", content: null },
          ]}
        />
        <Switch label="Email me about deploys" defaultChecked />
        <HStack gap="sm" wrap>
          <Button variant="primary" shape="rounded">Save</Button>
          <Button variant="secondary" shape="rounded">Cancel</Button>
        </HStack>
      </VStack>
    </Card>
  );
}

/** The active theme with relief primitives and purpose bindings layered on top. */
export function ReliefScope({
  primitives,
  roleBindings,
  children,
}: {
  primitives?: PrimitivesOverride;
  roleBindings?: RoleBindingsOverride;
  children: React.ReactNode;
}) {
  const meta = useThemeMeta();
  return (
    <SquonkThemeProvider
      mode={meta.mode}
      primitives={{ ...meta.primitives, ...primitives }}
      colorBindings={meta.colorBindings}
      addedColorPrimitives={meta.addedColorPrimitives}
      roleBindings={{ ...meta.roleBindings, ...roleBindings }}
    >
      {children}
    </SquonkThemeProvider>
  );
}

/** One relief recipe on real controls, captioned with what it sets. */
export function ReliefSpecimen({
  primitives,
  roleBindings,
  label,
}: {
  primitives?: PrimitivesOverride;
  roleBindings?: RoleBindingsOverride;
  label: string;
}) {
  return (
    <Specimen label={label}>
      <ReliefScope primitives={primitives} roleBindings={roleBindings}>
        <ReliefControls />
      </ReliefScope>
    </Specimen>
  );
}

/** Relief specimens side by side. */
export function ReliefGrid({ children }: { children: React.ReactNode }) {
  return <div className={`${styles.sampleGrid} sb-unstyled`}>{children}</div>;
}

/** A filled card next to an elevated one, under the given relief. */
export function ReliefCards({ primitives }: { primitives: PrimitivesOverride }) {
  return (
    <Specimen label="A raised card beside a filled card, which relief treats as a well.">
      <ReliefScope primitives={primitives}>
        <HStack gap="md" wrap>
          <Card variant="elevated"><Text>Elevated: stands off the page.</Text></Card>
          <Card variant="filled"><Text>Filled: sits into the page.</Text></Card>
        </HStack>
      </ReliefScope>
    </Specimen>
  );
}
