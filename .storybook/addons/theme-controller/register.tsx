// The Theme Controller no longer registers a Storybook addon panel.
// It's mounted as an always-present right-side dock by ./theme-dock.tsx,
// invoked from .storybook/manager.ts. This file is intentionally left
// as a no-op import target in case any tooling still references it.
export {};
