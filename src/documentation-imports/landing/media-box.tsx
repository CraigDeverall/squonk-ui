import { clsx } from "clsx";
import React from "react";
import { AspectRatio } from "../../components";
import styles from "./media-box.module.css";

/**
 * The Introduction page's standard media box: an `AspectRatio` well that
 * holds a spot illustration (1:1) or a device preview (16:10). Decorative:
 * the card's heading says what it shows.
 */
export function MediaBox({
  ratio,
  className,
  children,
}: {
  /** Width / height, as for `AspectRatio`. */
  ratio: number | string;
  /** Sizes or pads the box for what it holds. */
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <AspectRatio as="span" ratio={ratio} className={clsx(styles.box, className)} aria-hidden="true">
      {children}
    </AspectRatio>
  );
}
