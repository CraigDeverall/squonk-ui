import type { TokenUse } from "@controller/token-usage";

/** The port a side panel opens to a tab's content script. */
export const PORT_NAME = "squonk-theme-devtools";

/** Side panel → page. */
export type PanelMessage =
  | {
      type: "apply";
      /** A `ThemeDevtoolsOverride` as JSON, or `"null"`: handed to the page's root provider. */
      override: string;
      /** A stylesheet for the page: motion preview, and the theme itself where the page has no bridge. */
      css: string;
      /** Web font stylesheets the theme needs. */
      fonts: string[];
    }
  | { type: "scan" };

/** Page → side panel. */
export type PageMessage =
  | {
      type: "hello";
      origin: string;
      /** Whether the page publishes `--squonk-*` variables. */
      detected: boolean;
      /** The page's background token, to guess its colour mode without a bridge. */
      background: string;
    }
  /** A `ThemeDevtoolsState` as JSON, from a page whose library has the bridge. */
  | { type: "site"; state: string }
  | { type: "tokens"; uses: TokenUse[] };
