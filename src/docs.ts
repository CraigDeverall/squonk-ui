// Docs-only entry point. Consumers writing Storybook stories or MDX
// documentation can import these helpers; production app code should
// not — they depend on `@storybook/addon-docs/blocks`, whose runtime touches
// `document` at module load and crashes SSR.

export { ResizableCanvas } from "./utils/resizable-canvas";
export type { RecipeKey, OverflowChoice } from "./utils/resizable-canvas";
export { InlineCodeExample } from "./utils/blocks";
