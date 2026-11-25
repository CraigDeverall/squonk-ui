"use client";

import React from "react";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { Badge } from "../../functional/badge/badge";
import { Heading } from "../../functional-primitive/heading/heading";
import { Text } from "../../functional-primitive/text/text";
import styles from "./section-heading.module.css";

export type SectionHeadingAlign = "start" | "center";

/** Default max-width — part of the public API default, not a theme token.
 *  The readability sweet spot for short marketing intros. */
const SECTION_HEADING_DEFAULT_MAX_WIDTH = "720px";

export type SectionHeadingProps = {
  /** Small-caps eyebrow label rendered above the headline. Optional. */
  eyebrow?: React.ReactNode;
  /** The headline content. Pass JSX with `<em>` to color a fragment in the
   *  primary brand color (per `Heading`'s default `<em>` treatment). */
  headline: React.ReactNode;
  /** Sub-copy paragraph below the headline. Optional. */
  sub?: React.ReactNode;
  /** Heading semantic level. Default `2`. Use `1` only when the section
   *  hosts the page's primary heading. */
  level?: 1 | 2 | 3;
  /** Alignment. `center` is the marketing-section default; `start` for
   *  left-aligned editorial layouts. */
  align?: SectionHeadingAlign;
  /** Max width of the heading block (paragraph wraps at this width).
   *  Defaults to 720px (the readability sweet spot for short marketing
   *  intros). */
  maxWidth?: string;
};

/**
 * `SectionHeading` is the eyebrow + headline + sub-copy block that opens a
 * section. The headline and sub-copy size themselves from the ambient
 * `Presentation` register set by the surrounding `Section` — so a hero
 * section's heading is hero-scale, a default section's heading is
 * default-scale. To bump the heading up a notch without enlarging the
 * whole section, wrap the SectionHeading in `<Presentation register="...">`.
 */
export function SectionHeading({
  eyebrow,
  headline,
  sub,
  level = 2,
  align = "center",
  maxWidth = SECTION_HEADING_DEFAULT_MAX_WIDTH,
}: SectionHeadingProps) {
  const themeVars = useThemeCssVars();
  return (
    <div
      className={styles.root}
      style={{ ...themeVars.style, "--section-heading-max-width": maxWidth }}
      data-align={align}
    >
      {themeVars.provide(
        <>
          {eyebrow ? (
            <Badge tone="primary" variant="subtle" caps>
              {eyebrow}
            </Badge>
          ) : null}
          <Heading level={level} weight="heavy">
            {headline}
          </Heading>
          {sub ? <Text tone="secondary">{sub}</Text> : null}
        </>
      )}
    </div>
  );
}
