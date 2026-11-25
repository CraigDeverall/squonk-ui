"use client";

// purpose-tokens: scale-api — `weight` is the consumer's choice of font weight, passed through.
import { clsx } from "clsx";
import React from "react";
import { Link as AriaLink, type LinkProps as AriaLinkProps } from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { PolymorphicComponentProps } from "../../../types/polymorphic-types";
import styles from "./link.module.css";
import { Motion } from "../../animation/motion/motion";

export type LinkVariant = "default" | "subtle" | "muted" | "inherit" | "danger";
export type LinkUnderline = "always" | "hover" | "never";
export type LinkWeight = "regular" | "bold";

export type LinkProps<E extends React.ElementType = "a"> =
  PolymorphicComponentProps<
    E,
    {
      /** Color treatment.
       *  - `default`: the dedicated `colors.link` tone — distinct from
       *    `primary` so consumers can brand buttons without painting links.
       *  - `subtle`: secondary text color — for nav links that should
       *    recede until hovered.
       *  - `muted`: muted text color — for footer / footnote links.
       *  - `inherit`: take the parent text color — for inline links inside
       *    body copy where you want the link to match its surroundings.
       *  - `danger`: error color — for destructive or warning destinations. */
      variant?: LinkVariant;
      /** Underline policy. Leave unset to follow the theme: underlined only
       *  when pointed at, or always when the theme's `underlineLinks` switch
       *  is on. Pick `always` for inline body links where discoverability
       *  matters; `never` for nav / footer links where you don't want
       *  underline noise; `hover` to underline only when pointed at whatever
       *  the theme says. */
      underline?: LinkUnderline;
      /** Font weight. */
      weight?: LinkWeight;
      /** External link marker — sets `target=_blank` and `rel=noopener noreferrer`. */
      external?: boolean;
      /** The link text. */
      children?: React.ReactNode;
    }
  >;

/**
 * A text link built on React Aria's Link. Pass `as` to render another
 * element, such as a router's link component, with the same styling.
 */
export function Link<E extends React.ElementType = "a">({
  as,
  children,
  variant = "default",
  underline,
  weight = "regular",
  external = false,
  className,
  style,
  ...otherProps
}: LinkProps<E>) {
  const themeVars = useThemeCssVars();
  const externalProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  const shared = {
    className: clsx(styles.root, className),
    style: { ...themeVars.style, "--link-weight": `var(--squonk-typography-weights-${weight})`, ...style },
    "data-variant": variant,
    "data-underline": underline ?? "theme",
    ...externalProps,
  };

  // Another element (a router's link, a button styled as a link) keeps the
  // styling; behaviour belongs to that element.
  if (as && as !== "a") {
    const Component: React.ElementType = as;
    return (
      <Motion.Feedback>
        <Component {...shared} {...otherProps}>
          {themeVars.provide(children)}
        </Component>
      </Motion.Feedback>
    );
  }

  // React Aria's Link handles press, hover and focus-visible state, and
  // client-side navigation when the app sets up a RouterProvider.
  return (
    <Motion.Feedback>
      <AriaLink {...shared} {...(otherProps as Omit<AriaLinkProps, "className" | "style">)}>
        {themeVars.provide(children)}
      </AriaLink>
    </Motion.Feedback>
  );
}
