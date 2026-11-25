"use client";

import Color from "color";
import React from "react";
import { useSquonkTheme } from "../../theme/theme-context";
import { cssVariablesFor } from "../../theme/use-theme-css-vars";
import { Heading } from "../../components/functional-primitive/heading/heading";
import styles from "./foundations.module.css";

/*
 * Every root carries `sb-unstyled` so Storybook's docs typography doesn't
 * restyle the real components inside.
 *
 * Live specimens for the Foundations pages. Every value is read from the
 * active theme, so the pages follow the toolbar's light/dark switch and edits
 * in the Theme panel.
 */

type Token = `--squonk-${string}`;

/** The active theme's `--squonk-*` values. */
export function useTokenValues() {
  return cssVariablesFor(useSquonkTheme());
}

/** A bordered area that shows real components on the page background. */
export function Specimen({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <figure className={`${styles.specimen} sb-unstyled`}>
      <div className={styles.specimenBody}>{children}</div>
      {label ? <figcaption className={styles.caption}>{label}</figcaption> : null}
    </figure>
  );
}

/** Swatches laid out in a responsive grid. */
export function SwatchGrid({ children }: { children: React.ReactNode }) {
  return <div className={`${styles.swatchGrid} sb-unstyled`}>{children}</div>;
}

/** A colour as people read it: hex when opaque, as given otherwise. */
const readable = (value: string) => {
  try {
    const color = Color(value);
    return color.alpha() === 1 ? color.hex().toLowerCase() : value;
  } catch {
    return value;
  }
};

/** One colour token: its chip, name, what it is for and its current value. */
export function Swatch({ token, name, use }: { token: Token; name: string; use?: string }) {
  const value = readable(useTokenValues()[token] ?? "");
  return (
    <div className={styles.swatch}>
      <span className={styles.chip} style={{ background: `var(${token})` }} aria-hidden="true" />
      <span className={styles.swatchText}>
        <span className={styles.swatchName}>{name}</span>
        {use ? <span className={styles.swatchUse}>{use}</span> : null}
        <code className={styles.swatchValue}>{value}</code>
      </span>
    </div>
  );
}

const STEPS = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

/** The spacing scale as bars, with each step's current length. */
export function SpaceScale() {
  const values = useTokenValues();
  return (
    <div className={`${styles.scale} sb-unstyled`}>
      {STEPS.map((step) => {
        const token = `--squonk-spacing-${step}` as Token;
        return (
          <div key={step} className={styles.scaleRow}>
            <code className={styles.scaleName}>spacing.{step}</code>
            <span className={styles.scaleBar} style={{ width: `var(${token})` }} aria-hidden="true" />
            <code className={styles.scaleValue}>{values[token]}</code>
          </div>
        );
      })}
    </div>
  );
}

/** A gap shown as a measured space between two blocks. */
export function GapSample({ token, name, use }: { token: Token; name: string; use: string }) {
  const value = useTokenValues()[token];
  return (
    <div className={styles.gapSample}>
      <div className={styles.gapDemo} style={{ gap: `var(${token})` }} aria-hidden="true">
        <span className={styles.gapBlock} />
        <span className={styles.gapBlock} />
      </div>
      <span className={styles.swatchText}>
        <code className={styles.swatchName}>{name}</code>
        <span className={styles.swatchUse}>{use}</span>
        <code className={styles.swatchValue}>{value}</code>
      </span>
    </div>
  );
}

/** Heading levels 1 to 6 as real headings, with their current sizes. */
export function TypeScale() {
  const values = useTokenValues();
  return (
    <div className={`${styles.typeScale} sb-unstyled`}>
      {([1, 2, 3, 4, 5, 6] as const).map((level) => (
        <div key={level} className={styles.typeRow}>
          <code className={styles.scaleName}>
            h{level} · {values[`--squonk-presentation-heading-sizes-default-${level}` as Token]}
          </code>
          <Heading level={level}>Log a sighting</Heading>
        </div>
      ))}
    </div>
  );
}

/** A surface with one radius role, labelled. */
export function RadiusSample({ token, name, use }: { token: Token; name: string; use: string }) {
  const value = useTokenValues()[token];
  return (
    <div className={styles.shapeSample}>
      <span className={styles.shapeBox} style={{ borderRadius: `var(${token})` }} aria-hidden="true" />
      <span className={styles.swatchText}>
        <code className={styles.swatchName}>{name}</code>
        <span className={styles.swatchUse}>{use}</span>
        <code className={styles.swatchValue}>{value}</code>
      </span>
    </div>
  );
}

/** A surface with one elevation role, labelled. */
export function ElevationSample({ token, name, use }: { token: Token; name: string; use: string }) {
  return (
    <div className={styles.shapeSample}>
      <span className={styles.stage} aria-hidden="true">
        <span className={styles.shapeBox} style={{ display: "block", boxShadow: `var(${token})` }} />
      </span>
      <span className={styles.swatchText}>
        <code className={styles.swatchName}>{name}</code>
        <span className={styles.swatchUse}>{use}</span>
      </span>
    </div>
  );
}

/** Cards that sit side by side and wrap, for groups of specimens. `narrow` fits four to a row. */
export function SampleGrid({ children, narrow = false }: { children: React.ReactNode; narrow?: boolean }) {
  return <div className={`${styles.sampleGrid} sb-unstyled`} data-narrow={narrow || undefined}>{children}</div>;
}
