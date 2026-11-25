"use client";

import { clsx } from "clsx";
import React from "react";
import { SemanticSurface } from "../../../theme/semantic-surface";
import { purposeValue, useThemeCssVars } from "../../../theme/use-theme-css-vars";
import {
  Presentation,
  usePresentation,
  type Register,
} from "../../style/presentation/presentation";
import styles from "./header.module.css";
import type { SquonkTheme } from "../../../theme/theme-context";

const surfaceBackground = (theme: SquonkTheme) => purposeValue(theme, "components.header.background");

export type HeaderTone = "default" | "translucent";

export type HeaderProps = {
  /** Tone. `default` is opaque; `translucent` pairs with a backdrop blur
   *  for the frosted-glass nav-over-hero look (intended to be used with
   *  `FixedHeader` over a marketing hero). */
  tone?: HeaderTone;
  /** Visual register for the header AND its descendants. Defaults to
   *  `compact` since headers tend to be utility-dense; promote to
   *  `default` for a tall marketing header. */
  register?: Register;
  /** Element to render instead of `<header>`. */
  as?: React.ElementType;
  /** Passed to the root element. */
  id?: string;
  /** Extra class on the root element. */
  className?: string;
  /** Header content, such as a logo and navigation. Arrange it with an
   *  `HStack`, `VStack` or `Grid`. */
  children?: React.ReactNode;
};

const HeaderRoot = ({
  as,
  children,
  tone,
  register,
  position,
  className,
  ...otherProps
}: Required<Pick<HeaderProps, "tone" | "register">> & HeaderProps & { position?: "fixed" | "sticky" }) => {
  const Component = as || "header";
  const themeVars = useThemeCssVars();

  return (
    <Component
      className={clsx(styles.root, position && styles[position], className)}
      style={{ ...themeVars.style, "--header-padding-block": `var(--squonk-presentation-header-padding-block-${register})` }}
      data-tone={tone}
      {...otherProps}
    >
      {themeVars.provide(<SemanticSurface background={surfaceBackground}><Presentation register={register}>{children}</Presentation></SemanticSurface>)}
    </Component>
  );
};

/**
 * `Header` is a static-positioned semantic `<header>` with chrome:
 * background, bottom border, spacing, typography. **No layout knobs.**
 * Children are arranged via `HStack` / `VStack` (or `Grid`) composed inside.
 *
 * For a header pinned to the viewport over a marketing hero, use
 * `FixedHeader` (sets `tone="translucent"` + adds a backdrop blur + fixes
 * to the top). For sticky positioning during scroll, use `StickyHeader`.
 *
 * Intent props: `tone` (default vs translucent), `register` (compact vs
 * default vs ...). Default register is `compact` — headers are usually
 * dense utility surfaces.
 */
export function Header({
  as,
  children,
  tone = "default",
  register = "compact",
  ...otherProps
}: HeaderProps) {
  return (
    <HeaderRoot as={as} tone={tone} register={register} {...otherProps}>
      {children}
    </HeaderRoot>
  );
}

/**
 * `FixedHeader` is `Header` pinned to the top of the viewport. Defaults to
 * `tone="translucent"` (frosted-glass look) — the typical pairing for a
 * marketing-site nav over a hero. Pair with a same-height spacer below
 * the document `<header>` if you need content to start under it.
 */
export function FixedHeader({
  as,
  children,
  tone = "translucent",
  register = "compact",
  ...otherProps
}: HeaderProps) {
  return (
    <HeaderRoot as={as} tone={tone} register={register} position="fixed" {...otherProps}>
      {children}
    </HeaderRoot>
  );
}

/**
 * `StickyHeader` is `Header` that sticks to the top of its scroll container
 * once it would scroll out of view — ideal for app shells where the nav
 * needs to stay accessible during scroll without being fixed-positioned
 * (so it scrolls with the document up to the top, then sticks).
 */
export function StickyHeader({
  as,
  children,
  tone = "default",
  register = "compact",
  ...otherProps
}: HeaderProps) {
  return (
    <HeaderRoot as={as} tone={tone} register={register} position="sticky" {...otherProps}>
      {children}
    </HeaderRoot>
  );
}

// Helper for downstream code that may want to peek at the register without
// importing from style/presentation directly.
export { usePresentation };
