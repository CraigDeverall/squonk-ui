"use client";

import React from "react";
import { themeHelpers } from "../../../theme/theme";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { useSquonkTheme } from "../../../theme/theme-context";
import { usePresentation } from "../../style/presentation/presentation";
import styles from "./avatar.module.css";

export type AvatarShape = "circle" | "rounded";

export interface AvatarProps {
  /** Image URL. If absent or fails to load, falls back to `name` initials. */
  src?: string;
  /** Full name. Used to compute initials and the `alt` text for screen readers. */
  name: string;
  /** Visual shape. */
  shape?: AvatarShape;
  /** Manually override the computed initials (e.g. for ideographic names). */
  initials?: string;
}

const computeInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
};

const hashHue = (input: string): number => {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 360;
};

/** Shows `src` once it has loaded; until then, or if it fails, nothing. */
function AvatarImage({ src, onLoaded }: { src: string; onLoaded: (loaded: boolean) => void }) {
  const [loaded, setLoaded] = React.useState(false);
  const ref = React.useRef<HTMLImageElement>(null);
  const report = (ok: boolean) => { setLoaded(ok); onLoaded(ok); };

  // An image already in the cache can finish before React attaches onLoad.
  React.useEffect(() => {
    const img = ref.current;
    if (img?.complete) report(img.naturalWidth > 0);
    return () => onLoaded(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <img
      ref={ref}
      className={styles.image}
      src={src}
      alt=""
      hidden={!loaded}
      onLoad={() => report(true)}
      onError={() => report(false)}
    />
  );
}

/**
 * The initials show until the image has loaded, and again if it fails; a
 * new `src` retries. React Aria has no avatar, and this needs no behaviour
 * beyond tracking the image's load state.
 */
export function Avatar({ src, name, shape = "circle", initials }: AvatarProps) {
  const text = initials ?? computeInitials(name);
  const register = usePresentation();
  const themeVars = useThemeCssVars();
  const theme = useSquonkTheme();
  // An identity colour from the name, not a theme value, so its readable
  // text colour is computed here rather than published as a token.
  const background = `hsl(${hashHue(name)}, 60%, 70%)`;
  const [imageShown, setImageShown] = React.useState(false);

  return (
    <span
      className={styles.root}
      style={{
        ...themeVars.style,
        "--avatar-bg": background,
        "--avatar-fg": themeHelpers.getMinContrastTextColor(background, theme.contrast.lightTextBalance, theme.contrast.textOnFillStrength),
      }}
      data-register={register}
      data-shape={shape}
      role="img"
      aria-label={name}
      title={name}
    >
      <span className={styles.fallback} hidden={imageShown}>{text}</span>
      {src ? <AvatarImage key={src} src={src} onLoaded={setImageShown} /> : null}
    </span>
  );
}
