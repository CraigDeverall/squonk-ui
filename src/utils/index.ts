import type { ArgTypes } from "storybook/internal/types";
import { as, ref } from "./common-args";

// This barrel is STORYBOOK-AUTHORING territory, imported by stories via
// `@src/utils`. It is deliberately NOT re-exported from src/index.ts — these
// helpers must never reach the runtime public API. Theme providers live in
// src/theme; docs-surface pieces (resizable-canvas, blocks) are re-exported
// from `@squonk/ui/docs` (src/docs.ts) because their runtime reads `document`
// at module load and crashes SSR consumers.

export const commonArgTypes = { as, ref } as ArgTypes;
