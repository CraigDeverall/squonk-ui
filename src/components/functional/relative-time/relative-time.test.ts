import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "./relative-time";

const now = new Date("2026-11-13T12:00:00Z");
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000);

describe("formatRelativeTime", () => {
  it("says just now under 45 seconds", () => {
    expect(formatRelativeTime(ago(10), now, "en-NZ")).toBe("now");
  });

  it("counts minutes, hours and days", () => {
    expect(formatRelativeTime(ago(5 * 60), now, "en-NZ")).toBe("5 minutes ago");
    expect(formatRelativeTime(ago(2 * 3600), now, "en-NZ")).toBe("2 hours ago");
    expect(formatRelativeTime(ago(3 * 86400), now, "en-NZ")).toBe("3 days ago");
  });

  it("uses words such as yesterday and last week", () => {
    expect(formatRelativeTime(ago(26 * 3600), now, "en-NZ")).toBe("yesterday");
    expect(formatRelativeTime(ago(8 * 86400), now, "en-NZ")).toBe("last week");
  });

  it("counts forward for a time to come", () => {
    expect(formatRelativeTime(new Date(now.getTime() + 2 * 3600 * 1000), now, "en-NZ")).toBe("in 2 hours");
  });

  it("moves to months and years", () => {
    expect(formatRelativeTime(ago(70 * 86400), now, "en-NZ")).toBe("2 months ago");
    expect(formatRelativeTime(ago(800 * 86400), now, "en-NZ")).toBe("2 years ago");
  });
});
