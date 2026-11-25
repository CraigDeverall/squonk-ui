"use client";

import React from "react";
import { ListBox, ListBoxItem, Text } from "react-aria-components";
import { CheckIcon } from "../../functional-primitive/icon/icon";

import type { SelectOption } from "./select";

// Internal: the option list shared by Select's list and searchable modes.

/** The option rows, shared by the list and searchable Selects. */
export function SelectOptions<T extends string>({
  options,
  styles: css,
  emptyText,
}: {
  options: SelectOption<T>[];
  styles: Record<string, string>;
  emptyText?: string;
}) {
  return (
    <ListBox
      className={css.list}
      renderEmptyState={emptyText === undefined ? undefined : () => <div className={css.empty}>{emptyText}</div>}
    >
      {options.map((option) => (
        <ListBoxItem
          key={option.value}
          id={option.value}
          textValue={option.label}
          isDisabled={option.disabled}
          className={css.item}
        >
          {({ isSelected }) => (
            <>
              <span className={css.itemText}>
                <Text slot="label">{option.label}</Text>
                {option.description ? <Text slot="description" className={css.itemDescription}>{option.description}</Text> : null}
              </span>
              {isSelected ? <span className={css.itemIndicator} aria-hidden="true"><CheckIcon /></span> : null}
            </>
          )}
        </ListBoxItem>
      ))}
    </ListBox>
  );
}
