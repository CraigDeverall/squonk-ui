"use client";

import { clsx } from "clsx";
import React from "react";
import { ToggleButton } from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { Motion } from "../../animation/motion/motion";
import {
  legendKinds,
  resolveLinkKind,
  resolveNodeKind,
  toggleHiddenKind,
  type NetworkGraphHiddenKinds,
  type NetworkGraphLink,
  type NetworkGraphLinkKinds,
  type NetworkGraphNode,
  type NetworkGraphNodeKinds,
} from "./network-graph-kinds";
import { shapePath } from "./network-graph-layout";
import styles from "./network-graph.module.css";

export interface NetworkGraphLegendProps {
  /** The node kinds to list: pass the same object the graph gets. */
  nodeKinds?: NetworkGraphNodeKinds;
  /** The link kinds to list: pass the same object the graph gets. */
  linkKinds?: NetworkGraphLinkKinds;
  /**
   * The graph's nodes. When given, only kinds that occur are listed, each
   * with how many there are. Leave it out to list every described kind.
   */
  nodes?: readonly NetworkGraphNode[];
  /** The graph's links. When given, only link kinds that occur are listed, each with its count. */
  links?: readonly NetworkGraphLink[];
  /** The kinds that are hidden. Pass the same value to the graph. */
  hiddenKinds?: NetworkGraphHiddenKinds;
  /**
   * Called with the new hidden kinds when the reader hides or shows one.
   * Without it the legend is a plain key that cannot be pressed.
   */
  onHiddenKindsChange?: (hiddenKinds: NetworkGraphHiddenKinds) => void;
  /** Merged onto the root element. */
  className?: string;
  /** Merged onto the root element. */
  style?: React.CSSProperties;
}

/** The key's box, in px: room for the largest node shape or a short line. */
const KEY_SIZE = 14;
const KEY_RADIUS = 5;
/** A kind's icon in its key, on a shape that fills the key's box. */
const KEY_ICON_SIZE = 9;

/**
 * The key to a NetworkGraph: each node kind with its shape and colour, each
 * link kind with its line. Give it `onHiddenKindsChange` and each entry
 * becomes a button that hides or shows that kind.
 */
export function NetworkGraphLegend({
  nodeKinds,
  linkKinds,
  nodes,
  links,
  hiddenKinds,
  onHiddenKindsChange,
  className,
  style,
}: NetworkGraphLegendProps) {
  const themeVars = useThemeCssVars();

  const entries = (group: "nodes" | "links") => {
    const listed = group === "nodes" ? legendKinds(nodeKinds, nodes) : legendKinds(linkKinds, links);
    return listed.map(({ key, count }) => {
      const hidden = Boolean(hiddenKinds?.[group]?.includes(key));
      let label: string;
      let keyMark: React.ReactNode;
      if (group === "nodes") {
        const kind = resolveNodeKind(nodeKinds, key);
        label = kind.label;
        keyMark = (
          <svg
            className={styles.legendKey}
            width={KEY_SIZE}
            height={KEY_SIZE}
            viewBox={`${-KEY_SIZE / 2} ${-KEY_SIZE / 2} ${KEY_SIZE} ${KEY_SIZE}`}
            aria-hidden="true"
            focusable="false"
            style={{ "--network-graph-key-color": kind.color } as React.CSSProperties}
          >
            <path className={styles.legendKeyShape} d={shapePath(kind.shape, kind.icon ? KEY_SIZE / 2 : KEY_RADIUS)} />
            {kind.icon ? (
              <g
                className={styles.legendKeyIcon}
                transform={`translate(${-KEY_ICON_SIZE / 2} ${-KEY_ICON_SIZE / 2})`}
                style={{ fontSize: KEY_ICON_SIZE }}
              >
                {kind.icon}
              </g>
            ) : null}
          </svg>
        );
      } else {
        const kind = resolveLinkKind(linkKinds, key);
        label = kind.label;
        keyMark = (
          <svg
            className={styles.legendKey}
            width={KEY_SIZE * 1.6}
            height={KEY_SIZE}
            viewBox={`0 ${-KEY_SIZE / 2} ${KEY_SIZE * 1.6} ${KEY_SIZE}`}
            aria-hidden="true"
            focusable="false"
            data-variant={kind.variant}
            style={kind.color ? ({ "--network-graph-key-color": kind.color } as React.CSSProperties) : undefined}
          >
            <path className={styles.legendKeyLine} d={`M1,0H${KEY_SIZE * 1.6 - 7}`} />
            <path
              className={styles.legendKeyArrow}
              d={`M${KEY_SIZE * 1.6 - 1},0L${KEY_SIZE * 1.6 - 8},-3.5L${KEY_SIZE * 1.6 - 8},3.5Z`}
            />
          </svg>
        );
      }
      const content = (
        <>
          {keyMark}
          <span>{label}</span>
          {count !== undefined ? <span className={styles.legendCount}>{count}</span> : null}
        </>
      );
      return (
        <li key={key}>
          {onHiddenKindsChange ? (
            <Motion.Feedback>
              <ToggleButton
                className={styles.legendItem}
                isSelected={!hidden}
                onChange={() => onHiddenKindsChange(toggleHiddenKind(hiddenKinds, group, key))}
                data-kind-hidden={hidden || undefined}
              >
                {content}
              </ToggleButton>
            </Motion.Feedback>
          ) : (
            <span className={styles.legendItem} data-kind-hidden={hidden || undefined}>
              {content}
            </span>
          )}
        </li>
      );
    });
  };

  const nodeEntries = entries("nodes");
  const linkEntries = entries("links");

  return (
    <div className={clsx(styles.legend, className)} style={{ ...themeVars.style, ...style }}>
      {themeVars.provide(
        <>
          {nodeEntries.length ? (
            <ul className={styles.legendGroup} aria-label={onHiddenKindsChange ? "Node kinds shown" : "Node kinds"}>
              {nodeEntries}
            </ul>
          ) : null}
          {linkEntries.length ? (
            <ul className={styles.legendGroup} aria-label={onHiddenKindsChange ? "Link kinds shown" : "Link kinds"}>
              {linkEntries}
            </ul>
          ) : null}
        </>,
      )}
    </div>
  );
}
