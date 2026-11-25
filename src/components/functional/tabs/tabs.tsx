"use client";

import { clsx } from "clsx";
import React from "react";
import {
  SelectionIndicator,
  Tab,
  TabList,
  TabPanel,
  Tabs as AriaTabs,
  type TabsProps as AriaTabsProps,
} from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { usePresentation } from "../../style/presentation/presentation";
import styles from "./tabs.module.css";
import { Motion } from "../../animation/motion/motion";

export interface TabItem<T extends string = string> {
  /** Stable identity, used by `value` and `onValueChange`. */
  value: T;
  /** The tab's label. */
  label: React.ReactNode;
  /** The panel shown while this tab is selected. */
  content: React.ReactNode;
  /** Leading adornment, such as an icon. */
  icon?: React.ReactNode;
  /** Trailing adornment, such as a count `Badge`. */
  badge?: React.ReactNode;
  /** Skip this tab and ignore activation. */
  disabled?: boolean;
}

export type TabsVariant = "line" | "enclosed";

export interface TabsProps<T extends string = string>
  extends Omit<React.ComponentProps<"div">, "children" | "defaultValue" | "onChange"> {
  /** The tabs, in order. */
  items: TabItem<T>[];
  /** Controlled selected tab. */
  value?: T;
  /** Uncontrolled initial tab. Defaults to the first enabled tab. */
  defaultValue?: T;
  /** Notified when the selected tab changes. */
  onValueChange?: (value: T) => void;
  /** `line` underlines the selected tab; `enclosed` is a segmented control
   *  look for switching views of the same data. Defaults to `"line"`. */
  variant?: TabsVariant;
  /** Stretch the tabs to share the full width. */
  fitted?: boolean;
  /** `automatic` (default) selects a tab as arrow keys reach it; `manual`
   *  waits for Enter or Space, for panels that are slow to render. */
  activationMode?: "automatic" | "manual";
  /** Names the tab list. Needed when nothing nearby (a heading) already does. */
  listLabel?: string;
  /** Mount each panel on its first visit instead of all at once. */
  lazy?: boolean;
  /**
   * Keep the tab list in view as the page scrolls past the panels: it sticks
   * this far from the top of the scrolling area, such as `"64px"` below a
   * sticky header, or a `calc()` of custom properties. The panels pass under
   * it. Off by default.
   */
  stickyTop?: string;
  /**
   * What shows behind a sticky tab list, so the panels passing under it don't
   * show through: `page` (default) for tabs on the page, `surface` for tabs in
   * a card or panel.
   */
  stickyBackground?: "page" | "surface";
}

/**
 * Switches between related panels in the same place, built on React Aria's
 * Tabs (the WAI-ARIA tabs pattern): the tab list is one Tab stop, arrow
 * keys move between tabs (Home and End to the ends), and each panel is
 * labelled by its tab. An indicator slides to the selected tab.
 */
export function Tabs<T extends string = string>({
  items,
  value,
  defaultValue,
  onValueChange,
  variant = "line",
  fitted = false,
  activationMode = "automatic",
  listLabel,
  lazy = false,
  stickyTop,
  stickyBackground = "page",
  className,
  style,
  ...otherProps
}: TabsProps<T>) {
  const themeVars = useThemeCssVars();
  const register = usePresentation();
  const firstEnabled = items.find((item) => !item.disabled)?.value;

  const [visited, setVisited] = React.useState(() => new Set<string>());
  const selected = value ?? undefined;
  // Each change of tab swaps the new panel in; nothing plays on first render.
  const [changes, setChanges] = React.useState(0);

  return (
    <AriaTabs
      {...(otherProps as Omit<AriaTabsProps, "className" | "style">)}
      className={clsx(styles.root, fitted && styles.fitted, className)}
      style={{ ...themeVars.style, ...style }}
      data-variant={variant}
      data-register={register}
      selectedKey={selected}
      defaultSelectedKey={value === undefined ? (defaultValue ?? firstEnabled) : undefined}
      onSelectionChange={(key) => {
        if (lazy) setVisited((v) => (v.has(String(key)) ? v : new Set(v).add(String(key))));
        setChanges((n) => n + 1);
        onValueChange?.(key as T);
      }}
      keyboardActivation={activationMode}
      disabledKeys={items.filter((item) => item.disabled).map((item) => item.value)}
    >
      <TabList
        className={styles.list}
        aria-label={listLabel}
        data-sticky={stickyTop !== undefined ? stickyBackground : undefined}
        style={stickyTop !== undefined ? ({ "--tabs-sticky-top": stickyTop } as React.CSSProperties) : undefined}
      >
        {items.map((item) => (
          <Motion.Shift key={item.value}>
            <Tab id={item.value} className={styles.trigger}>
              {item.icon ? <span className={styles.adornment}>{item.icon}</span> : null}
              {themeVars.provide(item.label)}
              {item.badge ? <span className={styles.adornment}>{themeVars.provide(item.badge)}</span> : null}
              <Motion.Shift><SelectionIndicator className={styles.indicator} /></Motion.Shift>
            </Tab>
          </Motion.Shift>
        ))}
      </TabList>
      {items.map((item) => (
        <Motion.Swap key={item.value} watch={value !== undefined ? value : changes}>
          <TabPanel
            id={item.value}
            className={styles.content}
            // Every panel stays mounted (hidden) unless `lazy`, which mounts
            // each on its first visit and keeps it.
            shouldForceMount={!lazy || visited.has(item.value)}
          >
            {themeVars.provide(item.content)}
          </TabPanel>
        </Motion.Swap>
      ))}
    </AriaTabs>
  );
}
