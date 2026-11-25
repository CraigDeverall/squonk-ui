import type { MotionLevel } from "../../../src/theme/motion-level";
import { MOTION_PREVIEW_STORAGE_KEY } from "./constants";

/** What the preview shows motion with: not part of the theme, so never exported with it. */
export interface MotionPreview {
  level: MotionLevel;
  /** Every duration is multiplied by this: 1 normally, more for slow motion. */
  slow: number;
}

export const DEFAULT_MOTION_PREVIEW: MotionPreview = { level: "system", slow: 1 };

/** The panel's last motion preview, from storage, so a reloaded preview keeps it. */
export function readMotionPreview(): MotionPreview {
  try {
    const parsed = JSON.parse(localStorage.getItem(MOTION_PREVIEW_STORAGE_KEY) ?? "null") as Partial<MotionPreview> | null;
    const level = parsed?.level === "reduced" || parsed?.level === "none" ? parsed.level : "system";
    const slow = typeof parsed?.slow === "number" && parsed.slow >= 1 && parsed.slow <= 20 ? parsed.slow : 1;
    return { level, slow };
  } catch {
    return DEFAULT_MOTION_PREVIEW;
  }
}
