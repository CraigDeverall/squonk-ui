"use client";

import React from "react";
import { Button, Motion, Popover, Switch, Text } from "../../components";
import { sampleEasing, springOvershoot } from "../../theme/motion-curves";
import { MOTION_LEVEL_VARS } from "../../theme/motion-level";
import { buildTheme } from "../../theme/theme";
import { useSquonkTheme } from "../../theme/theme-context";
import { SquonkThemeProvider } from "../../theme/theme-provider";
import { useThemeCssVars } from "../../theme/use-theme-css-vars";
import { EXAMPLE_THEMES, type ExampleTheme } from "../themes/themes";
import { useExampleThemeFonts } from "../themes/use-theme-fonts";
import styles from "./motion-blocks.module.css";

/*
 * Live motion specimens for the Foundations › Motion page. Each example theme
 * plays the same small scene in its own scope, so the only difference you
 * see is the theme's motion character.
 */

const FUNDS = ["Annual dues", "Swamp Fund levy", "Night-watch kit hire", "Field-trip deposit"];
const TOTALS = [48210.5, 51934.2, 46102.75, 53388.1];

/** The list in a new order for each play: each item one place further on. */
const rotated = (run: number) => FUNDS.map((_, i) => FUNDS[(i + run) % FUNDS.length]);

function SceneBody({ theme, run }: { theme: ExampleTheme; run: number }) {
  const scope = useThemeCssVars();
  return (
    <section className={styles.scene} style={scope.style} aria-label={`${theme.name} motion`}>
      {scope.provide(
        <>
          <header className={styles.sceneHeader}>
            <span className={styles.sceneName}>{theme.name}</span>
            <Popover trigger={<Button variant="ghost">Details</Button>} title={theme.name} placement="bottom-end" size="sm">
              {theme.description}
            </Popover>
          </header>
          <div className={styles.sceneCards} key={run}>
            <Motion.Stagger>
              {FUNDS.slice(0, 3).map((label) => (
                <Motion.Presence key={label} show playOnMount={run > 0}>
                  <div className={styles.sceneCard}>{label}</div>
                </Motion.Presence>
              ))}
            </Motion.Stagger>
          </div>
          <Motion.Highlight watch={run}>
            <div className={styles.sceneFigure}>
              <Text tone="secondary">Dues owing</Text>
              <Motion.Count value={TOTALS[run % TOTALS.length]} formatOptions={{ style: "currency", currency: "NZD" }} />
            </div>
          </Motion.Highlight>
          <Motion.Layout>
            <ul className={styles.sceneList}>
              {rotated(run).map((label) => (
                <li key={label} className={styles.sceneItem}>{label}</li>
              ))}
            </ul>
          </Motion.Layout>
        </>,
      )}
    </section>
  );
}

function ThemeScene({ theme, run }: { theme: ExampleTheme; run: number }) {
  const { mode } = useSquonkTheme();
  return (
    <SquonkThemeProvider mode={mode} primitives={theme.primitives} roleBindings={theme.roleBindings}>
      <SceneBody theme={theme} run={run} />
    </SquonkThemeProvider>
  );
}

export interface MotionLabProps {
  /** Which example themes to show, by id. Defaults to all of them. */
  themes?: string[];
}

/**
 * Every example theme playing the same scene: cards arriving in sequence, a
 * figure counting and highlighting, a list reordering, and a popover. Play
 * runs them all at once; slow motion and reduced motion apply to the lab
 * only, through the same `--squonk-motion-level-*` properties the app's
 * `motion` prop sets.
 */
export function MotionLab({ themes }: MotionLabProps) {
  useExampleThemeFonts();
  const [run, setRun] = React.useState(0);
  const [slow, setSlow] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);
  const list = themes ? EXAMPLE_THEMES.filter((t) => themes.includes(t.id)) : EXAMPLE_THEMES;
  const level = {
    ...(slow ? { [MOTION_LEVEL_VARS.time]: 4 } : {}),
    ...(reduced ? { [MOTION_LEVEL_VARS.reduced]: 1, [MOTION_LEVEL_VARS.decor]: "paused" } : {}),
  } as React.CSSProperties;
  return (
    <div className={`${styles.lab} sb-unstyled`} style={level}>
      <div className={styles.labBar}>
        <Button variant="primary" onClick={() => setRun((n) => n + 1)}>Play</Button>
        <Switch label="Slow motion (4×)" checked={slow} onChange={setSlow} />
        <Switch label="Reduced motion" checked={reduced} onChange={setReduced} />
      </div>
      <div className={styles.labGrid}>
        {list.map((theme) => (
          <ThemeScene key={theme.id} theme={theme} run={run} />
        ))}
      </div>
    </div>
  );
}

/** An easing plotted: time across, progress up, with room for a spring's overshoot. */
function Curve({ easings }: { easings: { easing: string; kind: "enter" | "exit" | "spring" }[] }) {
  const w = 120;
  const h = 72;
  const all = easings.map((e) => sampleEasing(e.easing, 60));
  const top = Math.max(1.12, ...all.flat());
  const y = (v: number) => h - 6 - (v / top) * (h - 12);
  return (
    <svg className={styles.curve} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <line x1={0} x2={w} y1={y(1)} y2={y(1)} className={styles.curveGuide} vectorEffect="non-scaling-stroke" />
      <line x1={0} x2={w} y1={y(0)} y2={y(0)} className={styles.curveAxis} vectorEffect="non-scaling-stroke" />
      {easings.map((e, i) => (
        <polyline
          key={e.kind}
          className={styles[e.kind]}
          fill="none"
          vectorEffect="non-scaling-stroke"
          points={all[i].map((v, j) => `${(j / (all[i].length - 1)) * w},${y(v)}`).join(" ")}
        />
      ))}
    </svg>
  );
}

/** Each example theme's motion character: its numbers and its curves. */
export function MotionCharacters() {
  return (
    <div className={`${styles.characters} sb-unstyled`}>
      {EXAMPLE_THEMES.map((theme) => {
        const built = buildTheme(theme.primitives);
        const bounce = theme.primitives.motionBounce ?? 0;
        const curves: { easing: string; kind: "enter" | "exit" | "spring" }[] = [
          { easing: built.motion.easings.enter, kind: "enter" },
          { easing: built.motion.easings.exit, kind: "exit" },
        ];
        if (bounce > 0) curves.push({ easing: built.motion.easings.spring, kind: "spring" });
        return (
          <figure key={theme.id} className={styles.character}>
            <Curve easings={curves} />
            <figcaption className={styles.characterText}>
              <strong>{theme.name}</strong>
              <span>
                {built.motion.durations.fast} tempo · {built.motion.distances.md} travel · {built.motion.stagger} stagger
                {bounce > 0 ? ` · springs ${Math.round(springOvershoot(bounce) * 100)}% past` : ""}
              </span>
              <span className={styles.characterMeta}>grows from {built.motion.scales.pop}×</span>
            </figcaption>
          </figure>
        );
      })}
      <p className={styles.legend}>
        <span className={styles.legendEnter}>Arriving</span>
        <span className={styles.legendExit}>Leaving</span>
        <span className={styles.legendSpring}>Spring</span>
      </p>
    </div>
  );
}
