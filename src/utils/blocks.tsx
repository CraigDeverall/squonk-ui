import React, { type ComponentProps } from "react";
import { Source } from "@storybook/addon-docs/blocks";
import styles from "./blocks.module.css";

type SourceLanguage = NonNullable<ComponentProps<typeof Source>["language"]>;

/*
 * Match the visual containment of <CodePanel> in resizable-canvas.tsx so
 * inline prose examples and the live-canvas Source tab read as the same
 * surface. Storybook's <Source> ships with its own border / shadow /
 * margin / Copy-button styling — flatten them here so the panel reads
 * as a single uniform code block sitting in the docs flow.
 */

/*
 * Render an MDX prose code example as a syntax-highlighted, monospaced
 * code block. Children must be a string (template literal); `<Source>`
 * runs the same Prism pass as the live-canvas Source tab so colour
 * tokens, font, and copy button all match.
 */
export const InlineCodeExample: React.FC<{
  children: string;
  language?: string;
}> = ({ children, language = "tsx" }) => (
  <div className={`${styles.panel} sb-unstyled`}>
    <Source code={children} language={language as SourceLanguage} />
  </div>
);
