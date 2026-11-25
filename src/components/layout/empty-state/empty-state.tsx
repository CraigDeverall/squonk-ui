"use client";

import React from "react";
import { VStack } from "../../layout-primitive/vstack/vstack";
import { Heading } from "../../functional-primitive/heading/heading";
import { Text } from "../../functional-primitive/text/text";
import { Presentation } from "../../style/presentation/presentation";

export interface EmptyStateProps {
  /** Optional illustration or icon rendered above the title. */
  icon?: React.ReactNode;
  /** The primary "nothing here yet" headline. Plain string for the
   *  typical case; pass a `ReactNode` if the headline needs accents. */
  title: React.ReactNode;
  /** Sub-copy explaining the state or pointing toward the next step. */
  body?: React.ReactNode;
  /** Trailing call-to-action — typically a `Button`. */
  action?: React.ReactNode;
}

/**
 * `EmptyState` is the centred "no data yet" composition: an optional icon,
 * a title, supporting copy, and an optional call-to-action. Use it
 * anywhere a list, table, or panel has no content to show — the user
 * sees *why* it's empty and *what to do next*, not a blank surface.
 *
 * Composes `VStack` for the vertical column and renders the title and
 * body with the library's `Heading`/`Text` so they inherit the ambient
 * `Presentation` register. The whole block is centred on both axes.
 *
 * ```tsx
 * <EmptyState
 *   icon={<InboxIcon />}
 *   title="No projects yet"
 *   body="Create your first project to get started."
 *   action={<Button variant="primary">New project</Button>}
 * />
 * ```
 */
export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <Presentation register="compact">
      <VStack align="center" justify="center" gap="md">
        {icon ? <div aria-hidden="true">{icon}</div> : null}
        <Heading level={3} weight="bold">
          {title}
        </Heading>
        {body ? (
          <Text tone="secondary" align="center">
            {body}
          </Text>
        ) : null}
        {action ? <div>{action}</div> : null}
      </VStack>
    </Presentation>
  );
}
