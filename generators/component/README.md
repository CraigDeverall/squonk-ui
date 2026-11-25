# Component scaffolding

Run `npm run generate` and answer the prompts, or pass `--name`, `--type`, `--base`, `--purpose`, `--children` and `--polymorphic` options after `--`. Each component is generated as `<name>.tsx`, `<name>.module.css`, stories, a test and an MDX page. The four supported types map directly to `layout-primitive`, `layout`, `functional-primitive` and `functional` folders. Only `LayoutPrimitive` forces polymorphism.

The scaffold contains a client component, light/dark stories, native attribute/ref types, an MDX page with a runnable default example, and component screenshot tests. Native void elements never accept children; button bases default to `type="button"`. Existing component folders are rejected rather than overwritten.

This is a starting point. Implement the actual component states, theme roles, keyboard behavior, variants and composition examples before publishing. Generate and review screenshot baselines using the repository's canonical Linux workflow, then run the build to refresh package exports.

Run `node --test generators/component/generator.test.mjs` to generate an isolated eight-component matrix and verify source, stories, test types, MDX compilation, native server rendering, and overwrite/name protections. The check removes its temporary output.
