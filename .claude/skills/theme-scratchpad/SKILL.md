---
name: theme-scratchpad
description: Explore an @squonk/ui theme or density change across existing components using the real Squonk theme providers, without changing canonical defaults. Use for scoped brand, light/dark, primitive scaling or semantic token comparisons.
---

# Theme Scratchpad

Execution context: [repository skill contract](../README.md#skill-execution-contract).
Rendering requires a running Storybook or the component-test harness in an
authorised checkout; reading this skill is not a render.

## Choose the right boundary

| Intent | Supported mechanism |
| --- | --- |
| Root font/spacing/radius/color primitives or root light/dark mode | `SquonkThemeProvider` |
| Compact/default/large/hero component presentation | `Presentation` |
| Subtree primitive scaling (`normal`, `compact`, `display`) or mode inversion | `ThemeStyleBlock` |
| Scoped resolved semantic overrides | `ThemeModifier` |

Do not pass a resolved theme straight into `SquonkThemeContext` for a
nested composition test: it bypasses Squonk theme transformation metadata. A new Squonk
root starts a new scope. Later mode boundaries select the mode; ordered explicit
semantic overrides remain explicit. `Presentation` and `ThemeStyleBlock` are distinct controls,
not two names for the same scale.

```tsx
import { Button, Card, Presentation, SquonkThemeProvider, TextField,
  ThemeModifier, ThemeStyleBlock, VStack } from "@squonk/ui";

<SquonkThemeProvider mode="dark">
  <ThemeModifier override={{ colors: { primary: "#58a6ff" } }}>
    <ThemeStyleBlock register="compact">
      <Presentation register="compact">
        <Card><VStack gap="sm">
          <TextField label="Project name" defaultValue="Northstar" />
          <Button>Save changes</Button>
        </VStack></Card>
      </Presentation>
    </ThemeStyleBlock>
  </ThemeModifier>
</SquonkThemeProvider>
```

This is an exploratory override, not a request to replace the canonical color.
Compare it with the current defaults on the same real components. Include normal,
focus, disabled, error and busy states; a theme that looks good only on empty cards
is insufficient. Check narrow parents, light/dark, and nested painted surfaces.

## What to inspect

Read `src/theme/theme.ts` and `src/theme/theme.mdx` for existing tokens and supported
imported JSON. Imported colors must be concrete parseable strings; browser-only
expressions are not accepted by that import path. Custom colors require both light
and dark values. Preserve `version`, `primitives`, `bindings`, `addedPrimitives`.

ThemeStyleBlock scales primitive-derived spacing, fonts and named presentation
sizes; fixed control geometry and optical proportions are documented exceptions.
Do not describe it as a uniform zoom. Custom backgrounds, translucent/image
composites and explicit semantic tones still need rendered contrast verification.

Use a temporary story or the theme viewer, keeping saved user presets intact.
Capture comparable before/after evidence when browser tooling exists. Remove only
scratch files created for this task. If a new token is justified after comparison,
use `add-token` with its role, affected components and compatibility classification.
