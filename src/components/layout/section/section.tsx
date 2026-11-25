"use client";

import { clsx } from "clsx";
import React, { useMemo } from "react";
import { SemanticSurface } from "../../../theme/semantic-surface";
import { purposeValue, useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { PolymorphicComponentProps } from "../../../types/polymorphic-types";
import { Container } from "../../layout-primitive/container/container";
import styles from "./section.module.css";
import {
  Presentation,
  type Register,
} from "../../style/presentation/presentation";
import type { SquonkTheme } from "../../../theme/theme-context";

export type SectionTone = "transparent" | "surface" | "subtle";

/** Inner content-shell constraint — part of the public layout contract, not
 *  a theme token. */
const SECTION_CONTAINER_MAX_WIDTH = "1180px";

/** The purpose each tone paints: none (a panel's colour beneath), the page colour, or a recessed well. */
const toneSurface = {
  transparent: "roles.color.surface",
  surface: "roles.color.page",
  subtle: "roles.color.well",
} as const satisfies Record<SectionTone, `roles.${string}`>;

export type SectionProps<E extends React.ElementType = "section"> =
  PolymorphicComponentProps<
    E,
    {
      /** Background tone. `transparent` (default) inherits the page
       *  background; `surface` raises the section onto a paper-toned
       *  background (the "alternating stripe" pattern); `subtle` is a
       *  deeper tint for full-bleed coloured sections. */
      tone?: SectionTone;
      /** Visual register for the section AND its descendants. Section
       *  automatically wraps its children in a `Presentation` context, so
       *  every register-aware component inside (Headings, Buttons, Text,
       *  Cards, ...) sizes itself to match. */
      register?: Register;
      /** Section content. */
      children?: React.ReactNode;
    }
  >;

const useSectionRoot = (tone: SectionTone, register: Register, className?: string, style?: React.CSSProperties) => {
  const themeVars = useThemeCssVars();
  return {
    props: {
      className: clsx(styles.root, className),
      style: { ...themeVars.style, "--section-padding": `var(--squonk-presentation-section-padding-${register})`, ...style },
      "data-tone": tone,
    },
    provide: themeVars.provide,
  };
};

/**
 * `Section` is the standard marketing/page section: a semantic `<section>`
 * with vertical breathing-room (register), an optional background tone, and
 * an inner `Container` constraining the content shell to 1180px.
 *
 * Section sets its own `Presentation` register for descendants — pick the
 * register that suits the section's "voice" (compact / default / large /
 * hero) and every typography & control inside sizes accordingly. There are
 * no per-component `size` props.
 *
 * For full-bleed content (edge-to-edge images, backgrounds with their own
 * width logic), use `BleedSection`. For a visible separator above the
 * section, place a `<Divider />` outside it.
 */
export function Section<E extends React.ElementType = "section">({
  as,
  children,
  tone = "transparent",
  register = "default",
  className,
  style,
  ...otherProps
}: SectionProps<E>) {
  const Component = as || "section";
  const background = useMemo(() => (theme: SquonkTheme) => purposeValue(theme, toneSurface[tone]), [tone]);
  const root = useSectionRoot(tone, register, className, style);
  const content = tone === "transparent" ? children : <SemanticSurface background={background}>{children}</SemanticSurface>;

  return (
    <Component {...root.props} {...otherProps}>
      {root.provide(<Container maxWidth={SECTION_CONTAINER_MAX_WIDTH} gutters>
        <Presentation register={register}>{content}</Presentation>
      </Container>)}
    </Component>
  );
}

/**
 * `BleedSection` is `Section` without the inner `Container` — children flow
 * edge-to-edge. Use for sections whose content provides its own width
 * limits (full-bleed images, custom hero compositions).
 */
export function BleedSection<E extends React.ElementType = "section">({
  as,
  children,
  tone = "transparent",
  register = "default",
  className,
  style,
  ...otherProps
}: SectionProps<E>) {
  const Component = as || "section";
  const background = useMemo(() => (theme: SquonkTheme) => purposeValue(theme, toneSurface[tone]), [tone]);
  const root = useSectionRoot(tone, register, className, style);
  const content = tone === "transparent" ? children : <SemanticSurface background={background}>{children}</SemanticSurface>;

  return (
    <Component {...root.props} {...otherProps}>
      {root.provide(<Presentation register={register}>{content}</Presentation>)}
    </Component>
  );
}
