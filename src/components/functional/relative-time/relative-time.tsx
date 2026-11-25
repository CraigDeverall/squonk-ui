"use client";

import { clsx } from "clsx";
import React from "react";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { Popover } from "../popover/popover";
import styles from "./relative-time.module.css";

export interface RelativeTimeProps {
  /** The moment: an ISO date and time, a timestamp in milliseconds, or a Date. */
  value: string | number | Date;
  /** The locale for the words and the full date. Defaults to the browser's. */
  locale?: string;
  /** The time to count from. Defaults to now, and the text keeps itself current. Pass one for tests and stories. */
  now?: Date;
  /** Merged onto the trigger. */
  className?: string;
  /** Merged onto the trigger. */
  style?: React.CSSProperties;
}

const STEPS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["second", 60],
  ["minute", 60],
  ["hour", 24],
  ["day", 7],
  ["week", 4.35],
  ["month", 12],
  ["year", Number.POSITIVE_INFINITY],
];

/**
 * How long ago (or until) `then` is from `now`, in words: "now",
 * "5 minutes ago", "yesterday", "in 3 days". Under 45 seconds is "now".
 */
export function formatRelativeTime(then: Date, now: Date, locale?: string): string {
  const seconds = (then.getTime() - now.getTime()) / 1000;
  if (Math.abs(seconds) < 45) return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(0, "second");
  const words = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  let amount = seconds;
  for (const [unit, size] of STEPS) {
    if (Math.abs(amount) < size) return words.format(Math.round(amount), unit);
    amount /= size;
  }
  return words.format(Math.round(amount), "year");
}

/** How often the words can change: every 20 seconds within the hour, then every 5 minutes. */
function refreshMs(then: Date, now: Date): number {
  return Math.abs(now.getTime() - then.getTime()) < 3_600_000 ? 20_000 : 300_000;
}

function toDate(value: RelativeTimeProps["value"]): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * A moment shown as how long ago it was ("2 hours ago"), which is quicker to
 * read than a date in a list of recent activity. Pressing it shows the full
 * date and time in a small popover. The text stays current while the page is
 * open. It renders a `<time>` element with the exact moment, so assistive
 * technology and copy and paste get the precise value too.
 */
export function RelativeTime({ value, locale, now, className, style }: RelativeTimeProps) {
  const themeVars = useThemeCssVars();
  const then = toDate(value);
  const [tick, setTick] = React.useState(() => Date.now());
  const current = now ?? new Date(tick);

  // One timeout per tick, so each tick picks the next wait again: every 20
  // seconds while the moment is under an hour old, then every 5 minutes.
  const thenMs = then.getTime();
  React.useEffect(() => {
    if (now || Number.isNaN(thenMs)) return;
    const timer = window.setTimeout(() => setTick(Date.now()), refreshMs(new Date(thenMs), new Date(tick)));
    return () => window.clearTimeout(timer);
  }, [now, thenMs, tick]);

  if (Number.isNaN(then.getTime())) return <span className={className}>{String(value)}</span>;

  const words = formatRelativeTime(then, current, locale);
  const full = new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "short" }).format(then);

  return (
    <Popover
      size="sm"
      placement="top-start"
      trigger={
        <button
          type="button"
          className={clsx(styles.trigger, className)}
          style={{ ...themeVars.style, ...style }}
          aria-label={`${words}, ${full}`}
        >
          <time dateTime={then.toISOString()}>{words}</time>
        </button>
      }
    >
      <span className={styles.full}>{full}</span>
    </Popover>
  );
}
