import React, { useEffect, useState } from "react";
import { useBasePrimitives } from "./base-primitives";
import { addons } from "storybook/manager-api";
import {
  isEasing,
  type Primitives,
  type PrimitivesOverride,
} from "../../../src/theme/theme";
import { sampleEasing, springEasing, springOvershoot } from "../../../src/theme/motion-curves";
import { EVENTS, MOTION_PREVIEW_STORAGE_KEY } from "./constants";
import { readMotionPreview, type MotionPreview } from "./motion-preview";
import { NumericRow, Section, styles } from "./panel";

const MOTION_FIELDS: Array<{ key: keyof Primitives; label: string; min: number; max: number; step: number; suffix: string }> = [
  { key: "transitionDurationMs", label: "Tempo", min: 0, max: 800, step: 10, suffix: "ms" },
  { key: "motionTravelPx", label: "Travel", min: 0, max: 48, step: 1, suffix: "px" },
  { key: "motionStaggerMs", label: "Stagger", min: 0, max: 200, step: 5, suffix: "ms" },
  { key: "motionBounce", label: "Bounce", min: 0, max: 1, step: 0.05, suffix: "" },
];

const CURVE_FIELDS: Array<{ key: "motionEaseEnter" | "motionEaseExit" | "motionEaseStandard"; label: string }> = [
  { key: "motionEaseEnter", label: "Arrive curve" },
  { key: "motionEaseExit", label: "Leave curve" },
  { key: "motionEaseStandard", label: "Move curve" },
];

/** Curves worth starting from, per role. */
const PRESETS: Record<string, Record<string, string>> = {
  motionEaseEnter: {
    Standard: "cubic-bezier(0, 0, 0.2, 1)",
    Crisp: "cubic-bezier(0.2, 0, 0, 1)",
    Soft: "cubic-bezier(0.22, 1, 0.36, 1)",
    Expressive: "cubic-bezier(0.16, 1, 0.3, 1)",
    Linear: "linear",
  },
  motionEaseExit: {
    Standard: "cubic-bezier(0.4, 0, 1, 1)",
    Soft: "cubic-bezier(0.55, 0, 0.75, 0.3)",
    Expressive: "cubic-bezier(0.7, 0, 0.84, 0)",
    Linear: "linear",
  },
  motionEaseStandard: {
    Standard: "cubic-bezier(0.4, 0, 0.2, 1)",
    Crisp: "cubic-bezier(0.2, 0, 0, 1)",
    Soft: "cubic-bezier(0.45, 0, 0.25, 1)",
    Expressive: "cubic-bezier(0.65, 0, 0.35, 1)",
    Linear: "linear",
  },
};

/** A small plot of an easing: time across, progress up, with room for overshoot. */
function CurvePlot({ easing, label }: { easing: string; label: string }) {
  const w = 72;
  const h = 40;
  const values = sampleEasing(easing, 36);
  const top = Math.max(1, ...values);
  const bottom = Math.min(0, ...values);
  const y = (v: number) => h - 4 - ((v - bottom) / (top - bottom)) * (h - 8);
  const points = values.map((v, i) => `${(i / (values.length - 1)) * w},${y(v)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} style={{ flex: "none", overflow: "visible" }}>
      <line x1={0} x2={w} y1={y(1)} y2={y(1)} stroke="currentColor" strokeOpacity={0.2} strokeDasharray="2 2" />
      <line x1={0} x2={w} y1={y(0)} y2={y(0)} stroke="currentColor" strokeOpacity={0.2} />
      <polyline points={points} fill="none" stroke="var(--sb-accent, #ef4237)" strokeWidth={1.75} />
    </svg>
  );
}

const choice: React.CSSProperties = { display: "flex", gap: 4, flexWrap: "wrap" };
const chip = (active: boolean): React.CSSProperties => ({
  padding: "2px 8px",
  borderRadius: 999,
  border: "1px solid var(--sb-border-strong)",
  background: active ? "var(--sb-accent)" : "transparent",
  color: active ? "var(--sb-dock-bg, #fff)" : "inherit",
  fontSize: 11,
  cursor: "pointer",
});

/**
 * The theme's motion: tempo, travel, stagger, bounce and the three curves,
 * plus preview-only switches for the motion level and slow motion.
 */
export const MotionSection: React.FC<{
  overrides: PrimitivesOverride;
  onNumeric: (key: keyof Primitives, value: number) => void;
  onString: (key: keyof Primitives, value: string) => void;
}> = ({ overrides, onNumeric, onString }) => {
  const base = useBasePrimitives();
  const [preview, setPreview] = useState<MotionPreview>(() => readMotionPreview());
  useEffect(() => {
    try {
      localStorage.setItem(MOTION_PREVIEW_STORAGE_KEY, JSON.stringify(preview));
    } catch {
      // Storage may be unavailable; the channel still carries it.
    }
    const channel = addons.getChannel();
    channel.emit(EVENTS.MOTION_PREVIEW_CHANGED, preview);
    const resend = () => channel.emit(EVENTS.MOTION_PREVIEW_CHANGED, preview);
    channel.on(EVENTS.REQUEST_STATE, resend);
    return () => channel.off(EVENTS.REQUEST_STATE, resend);
  }, [preview]);

  const bounce = (overrides.motionBounce as number | undefined) ?? base.motionBounce;
  const spring = springEasing(bounce);

  return (
    <Section title="Motion">
      <p style={styles.sectionHint}>
        How the theme moves. Tempo scales every duration; travel sets how far things move and grow as they
        arrive (0 makes every arrival a fade); stagger spaces items arriving in sequence; bounce makes arrivals
        overshoot and settle like a spring. The motion purpose tokens (under Purpose tokens) derive from these.
      </p>
      <div style={styles.numericList}>
        {MOTION_FIELDS.map((f) => (
          <NumericRow
            key={f.key as string}
            label={f.label}
            tokenKey={f.key as string}
            min={f.min}
            max={f.max}
            step={f.step}
            suffix={f.suffix}
            value={(overrides[f.key] as number | undefined) ?? (base[f.key] as number)}
            isOverridden={overrides[f.key] !== undefined}
            onChange={(v) => onNumeric(f.key, v)}
          />
        ))}
        {spring ? (
          <div style={{ ...styles.numericRow, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <CurvePlot easing={spring} label="Spring curve" />
            <span style={styles.sectionHint}>
              Spring: overshoots by {Math.round(springOvershoot(bounce) * 100)}% before settling. Used for popovers,
              toasts and content appearing; never for drawers.
            </span>
          </div>
        ) : null}
        {CURVE_FIELDS.map((f) => {
          const value = (overrides[f.key] as string | undefined) ?? base[f.key];
          const valid = isEasing(value);
          const presets = PRESETS[f.key];
          const preset = Object.entries(presets).find(([, v]) => v === value.trim())?.[0] ?? "";
          return (
            <div key={f.key} style={styles.numericRow}>
              <div style={styles.numericHeader}>
                <span style={styles.numericLabelGroup}>
                  <span style={{ ...styles.overrideDot, opacity: overrides[f.key] !== undefined ? 1 : 0 }} />
                  <span style={styles.numericLabel}>{f.label}</span>
                  <span style={styles.numericKey}>{f.key}</span>
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <CurvePlot easing={valid ? value : "linear"} label={`${f.label}: ${value}`} />
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                  <select
                    aria-label={`${f.label} preset`}
                    value={preset}
                    onChange={(e) => e.target.value && onString(f.key, presets[e.target.value])}
                    style={{ ...styles.stringInput, appearance: "auto" }}
                  >
                    <option value="">Custom</option>
                    {Object.keys(presets).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    aria-label={f.label}
                    aria-invalid={!valid}
                    value={value}
                    onChange={(e) => onString(f.key, e.target.value)}
                    style={{ ...styles.stringInput, ...(valid ? {} : { borderColor: "#d92d20" }) }}
                    spellCheck={false}
                  />
                  {valid ? null : (
                    <span style={{ ...styles.sectionHint, color: "#d92d20" }}>
                      Not an easing: use a keyword, cubic-bezier() or linear(). The default curve is used meanwhile.
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ ...styles.sectionHint, marginTop: 12 }}>
        Preview only (not part of the theme): the motion level an app sets with{" "}
        <code style={styles.codeInline}>{`<SquonkThemeProvider motion="…">`}</code>, and slow motion to study the curves.
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        <div role="radiogroup" aria-label="Motion level" style={choice}>
          {(["system", "reduced", "none"] as const).map((level) => (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={preview.level === level}
              style={chip(preview.level === level)}
              onClick={() => setPreview((p) => ({ ...p, level }))}
            >
              {level === "system" ? "System" : level === "reduced" ? "Reduced" : "None"}
            </button>
          ))}
        </div>
        <div role="radiogroup" aria-label="Slow motion" style={choice}>
          {[1, 4, 10].map((slow) => (
            <button
              key={slow}
              type="button"
              role="radio"
              aria-checked={preview.slow === slow}
              style={chip(preview.slow === slow)}
              onClick={() => setPreview((p) => ({ ...p, slow }))}
            >
              {slow === 1 ? "Real time" : `${slow}× slower`}
            </button>
          ))}
        </div>
      </div>
    </Section>
  );
};
