"use client";

import { clsx } from "clsx";
import React from "react";
import {
  Button,
  Label,
  Tag as AriaTag,
  TagGroup as AriaTagGroup,
  TagList,
  type Key,
} from "react-aria-components";
import { toneProps } from "../../../theme/tone";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { usePresentation } from "../../style/presentation/presentation";
import { CloseIcon } from "../../functional-primitive/icon/icon";
import styles from "./tag.module.css";

/** Tag colours group values; they never mean a status, which is Badge's job. */
export type TagTone = "neutral" | "primary" | "info";
export type TagVariant = "subtle" | "outline";

const builtInTones: readonly TagTone[] = ["neutral", "primary", "info"];

export interface TagProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** The tag's text. */
  children: React.ReactNode;
  /** Grouping colour: a built-in tone, or the key of a colour the theme added
   *  (`addedColorPrimitives`), such as `"violet"`. Defaults to `"neutral"`.
   *  Status (success, warning, error) belongs on a `Badge`. */
  tone?: TagTone | (string & {});
  /** Filled tint or outline. Defaults to `"subtle"`. */
  variant?: TagVariant;
  /** Leading adornment, such as an icon or a colour dot. */
  icon?: React.ReactNode;
  /** Show a remove button that calls this. */
  onRemove?: () => void;
  /** Accessible name of the remove button. Defaults to `"Remove <text>"`
   *  when `children` is a string; pass it when `children` is not. */
  removeLabel?: string;
  /** Dim the tag and disable its remove button. */
  disabled?: boolean;
}

/** Each grouped Tag registers its own onRemove here, keyed by its id. */
const TagGroupContext = React.createContext<Map<Key, () => void> | null>(null);

/**
 * A compact label for a category, keyword, filter or entered value. Unlike
 * `Badge`, which reports a status, a Tag names something and can be removed.
 * The remove button is a real button with its own name, so a list of tags
 * reads as "Remove Night watches", "Remove Tear pools" rather than a row of "×".
 *
 * Inside a `TagGroup` it becomes a React Aria Tag: one tab stop for the
 * whole row, arrow keys between tags, and Delete or Backspace to remove.
 */
export function Tag({
  children,
  tone = "neutral",
  variant = "subtle",
  icon,
  onRemove,
  removeLabel,
  disabled = false,
  className,
  style,
  id,
  ...otherProps
}: TagProps) {
  const register = usePresentation();
  const themeVars = useThemeCssVars();
  const group = React.useContext(TagGroupContext);
  const text = typeof children === "string" || typeof children === "number" ? String(children) : undefined;
  const name = removeLabel ?? (text !== undefined ? `Remove ${text}` : "Remove");
  const key = id ?? text;

  React.useLayoutEffect(() => {
    if (!group || key === undefined || !onRemove) return;
    group.set(key, onRemove);
    return () => { group.delete(key); };
  }, [group, key, onRemove]);

  const toned = toneProps(tone, builtInTones);
  const shared = {
    className: clsx(styles.root, className),
    style: { ...themeVars.style, ...toned.style, ...style },
    "data-tone": toned["data-tone"],
    "data-variant": variant,
    "data-register": register,
  };
  const content = (
    <>
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      <span className={styles.label}>{themeVars.provide(children)}</span>
    </>
  );

  if (group) {
    return (
      <AriaTag {...shared} id={key} textValue={text ?? removeLabel} isDisabled={disabled}>
        {content}
        {onRemove ? (
          <Button slot="remove" className={styles.remove} aria-label={name}>
            <CloseIcon />
          </Button>
        ) : null}
      </AriaTag>
    );
  }

  return (
    <span {...shared} id={id} data-disabled={disabled ? "" : undefined} {...otherProps}>
      {content}
      {onRemove ? (
        <Button className={styles.remove} aria-label={name} isDisabled={disabled} onPress={onRemove}>
          <CloseIcon />
        </Button>
      ) : null}
    </span>
  );
}

export interface TagGroupProps {
  /** `Tag`s. Each needs an `id`, or plain-text children to use as one. */
  children: React.ReactNode;
  /** A visible label for the group. Pass this or `aria-label`. */
  label?: React.ReactNode;
  /** Accessible name for the group when there is no visible `label`. */
  "aria-label"?: string;
  /** Id of an element that names the group. */
  "aria-labelledby"?: string;
  /** Class added to the group element. */
  className?: string;
  /** Inline styles merged onto the group element. */
  style?: React.CSSProperties;
}

/**
 * A row of related tags, such as active filters, built on React Aria's
 * TagGroup. The row is one tab stop; arrow keys move between tags, and
 * Delete or Backspace calls the focused tag's `onRemove`.
 */
export function TagGroup({ children, label, className, style, ...ariaProps }: TagGroupProps) {
  const themeVars = useThemeCssVars();
  const [removers] = React.useState(() => new Map<Key, () => void>());

  return (
    <AriaTagGroup
      {...ariaProps}
      className={clsx(styles.group, className)}
      style={{ ...themeVars.style, ...style }}
      onRemove={(keys) => keys.forEach((key) => removers.get(key)?.())}
    >
      {label ? <Label className={styles.groupLabel}>{themeVars.provide(label)}</Label> : null}
      <TagGroupContext.Provider value={removers}>
        <TagList className={styles.list}>{children}</TagList>
      </TagGroupContext.Provider>
    </AriaTagGroup>
  );
}
