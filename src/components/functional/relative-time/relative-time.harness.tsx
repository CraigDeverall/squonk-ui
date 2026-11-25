import React from "react";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { RelativeTime } from "./relative-time";

/**
 * Times in a byline, counted from a fixed moment so the words never change
 * between runs. Dates are built here, in the browser, from ISO strings.
 */
export function BylineHarness({ mode = "light", nowIso = "2026-11-13T12:00:00Z" }: { mode?: "light" | "dark"; nowIso?: string }) {
  const now = new Date(nowIso);
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();
  return (
    <SquonkThemeProvider mode={mode}>
      <div style={{ display: "grid", gap: 8, padding: 8, width: 280 }}>
        {[5, 125, 26 * 60].map((minutes) => (
          <span key={minutes}>
            Aroha, <RelativeTime value={ago(minutes)} now={now} locale="en-NZ" />
          </span>
        ))}
      </div>
    </SquonkThemeProvider>
  );
}

/** One time that counts from the browser's clock, so it updates on its own. */
export function LiveHarness({ minutesAgo }: { minutesAgo: number }) {
  const [value] = React.useState(() => new Date(Date.now() - minutesAgo * 60_000).toISOString());
  return <RelativeTime value={value} locale="en-NZ" />;
}
