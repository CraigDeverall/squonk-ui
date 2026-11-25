// Shapes shared by the server and the story page.
import type { CustomTheme } from "../themes.ts";

/** What the `preview_story` tool takes, and what the page shows. */
export type StoryInput = {
  /** Storybook story id, e.g. "functional-button--primary". */
  storyId: string;
  theme?: "light" | "dark";
  /** Frame width in CSS pixels; absent fills the page. */
  width?: number;
  /** Arg values to start from, on top of the story's own. */
  args?: Record<string, unknown>;
  /** One of the docs' example themes (e.g. "tidepool"); absent is the library's own theme. */
  exampleTheme?: string;
  /** A theme the user is designing, optionally based on an example theme; wins over exampleTheme. */
  customTheme?: CustomTheme;
};

/** What the page reports once it has tried to render. */
export type StoryStatus = { state: "rendered" } | { state: "error"; message: string };
