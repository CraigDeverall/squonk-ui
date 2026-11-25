import React from "react";
import {
  ComponentsIllustration,
  ConnectIllustration,
  ConversationIllustration,
  FocusIllustration,
  FormIllustration,
  LightDarkIllustration,
  PaletteIllustration,
  ShieldIllustration,
  TerminalIllustration,
} from "../../components/functional-primitive/illustration/illustration";
import { MediaBox } from "./media-box";
import styles from "./spot-graphics.module.css";

/**
 * The Introduction page's card illustrations: the library's own
 * illustrations, in the page's standard media box. Decorative: the card's
 * heading says what each one means.
 */
const SPOTS = {
  build: TerminalIllustration,
  agent: ConversationIllustration,
  browse: ComponentsIllustration,
  accessible: FocusIllustration,
  theme: PaletteIllustration,
  forms: FormIllustration,
  modes: LightDarkIllustration,
  agents: ConnectIllustration,
  tested: ShieldIllustration,
} satisfies Record<string, React.ComponentType<{ className?: string }>>;

export type SpotName = keyof typeof SPOTS;

/** One spot illustration, in the standard square box. */
export function Spot({ name }: { name: SpotName }) {
  const Drawing = SPOTS[name];
  return (
    <MediaBox ratio={1} className={styles.tile}>
      <Drawing className={styles.drawing} />
    </MediaBox>
  );
}
