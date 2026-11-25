import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { ThemeModifier } from "../theme-modifier/theme-modifier";
import { ThemeStyleBlock } from "./theme-style-block";
import { ThemeProbe as Probe } from "./theme-style-block.harness";

test("Resolved overrides survive register and mode rebuilds without leaking to siblings", async ({ mount }) => {
  const component = await mount(
    <SquonkThemeProvider primitives={{ spacingPx: 10 }}>
      <div>
        <ThemeModifier override={{ colors: { primary: "#ff00ff" }, spacing: { md: "42px" } }}>
          <ThemeStyleBlock register="compact" invertMode><Probe id="compact" /></ThemeStyleBlock>
        </ThemeModifier>
        <ThemeStyleBlock register="display">
          <ThemeModifier override={{ colors: { primary: "#00ffff" } }}>
            <ThemeStyleBlock register="normal" invertMode><Probe id="normal" /></ThemeStyleBlock>
          </ThemeModifier>
        </ThemeStyleBlock>
        <Probe id="sibling" />
      </div>
    </SquonkThemeProvider>,
  );
  await expect(component.getByTestId("compact")).toHaveText(JSON.stringify({ mode: "dark", primary: "#ff00ff", sm: "7.5px", md: "42px" }));
  await expect(component.getByTestId("normal")).toHaveText(JSON.stringify({ mode: "dark", primary: "#00ffff", sm: "10px", md: "20px" }));
  await expect(component.getByTestId("sibling")).toContainText('"mode":"light"');
  await expect(component.getByTestId("sibling")).not.toContainText("#ff00ff");
});

test("Mode-only modifiers rebuild colors and later inversion is authoritative", async ({ mount }) => {
  const component = await mount(
    <SquonkThemeProvider>
      <ThemeModifier override={{ mode: "dark" }}>
        <div><Probe id="dark" /><ThemeStyleBlock invertMode><Probe id="light" /></ThemeStyleBlock></div>
      </ThemeModifier>
    </SquonkThemeProvider>,
  );
  await expect(component.getByTestId("dark")).toContainText('"mode":"dark"');
  await expect(component.getByTestId("dark")).toContainText('"primary":"#ff5c4a"');
  await expect(component.getByTestId("light")).toContainText('"mode":"light"');
  await expect(component.getByTestId("light")).toContainText('"primary":"#ef4237"');
});
