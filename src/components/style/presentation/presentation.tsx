"use client";

import React, { createContext, useContext } from "react";

/**
 * The visual "register" applied to descendants. Every register-aware
 * component (`Button`, `Text`, `Heading`, `Badge`, `Spinner`, `Avatar`,
 * `TextField`, `Card`, `Section`, ...) reads this and sizes itself
 * accordingly — there are no individual `size` props on those components.
 *
 * - `compact` — dense UI: forms, sidebars, toolbars.
 * - `default` — standard application register.
 * - `large` — display sections, marketing slabs.
 * - `hero` — the page's headline moment.
 *
 * Nest `Presentation`s to step a subtree down (or up) inside a larger
 * one — e.g. a `<Card>` inside a hero section can opt back to `default`.
 */
export type Register = "compact" | "default" | "large" | "hero";

const PresentationContext = createContext<Register>("default");

export interface PresentationProps {
  /** The register to apply to all register-aware descendants. */
  register: Register;
  /** The subtree that takes the register. */
  children?: React.ReactNode;
}

/**
 * `Presentation` is a render-less context provider that sets the visual
 * register for its descendants. It produces no DOM of its own.
 *
 * Pair with layout primitives for visual containment:
 *
 * ```tsx
 * <Presentation register="hero">
 *   <Heading level={1}>Big headline</Heading>
 *   <Button>Primary CTA</Button>
 * </Presentation>
 * ```
 *
 * `Section` (and `SectionHeading`) provide their own Presentation contexts
 * automatically — you only need to reach for `Presentation` when scoping
 * a register to a subtree that isn't a section.
 */
export function Presentation({ register, children }: PresentationProps) {
  return (
    <PresentationContext.Provider value={register}>
      {children}
    </PresentationContext.Provider>
  );
}

/**
 * Read the current visual register. Library components use this internally;
 * application code rarely needs it (compose with `Presentation` instead).
 */
export function usePresentation(): Register {
  return useContext(PresentationContext);
}
