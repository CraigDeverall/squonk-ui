import React from "react";
import { CheckIcon, CloseIcon } from "../../components";
import styles from "./pattern-blocks.module.css";

/** A framed live example, with an optional caption under it. */
export function Example({ caption, children }: { caption?: React.ReactNode; children: React.ReactNode }) {
  return (
    // sb-unstyled keeps Storybook's docs typography off the live components.
    <figure className={`${styles.example} sb-unstyled`}>
      {children}
      {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
    </figure>
  );
}

/** A do and a don't, side by side. */
export function DoDont({ children }: { children: React.ReactNode }) {
  return <div className={styles.pair}>{children}</div>;
}

function Verdict({ verdict, caption, children }: { verdict: "do" | "dont"; caption: React.ReactNode; children: React.ReactNode }) {
  return (
    <figure className={`${styles.verdict} sb-unstyled`} data-verdict={verdict}>
      <span className={styles.label}>
        {verdict === "do" ? <CheckIcon size="control" /> : <CloseIcon size="control" />}
        {verdict === "do" ? "Do" : "Don't"}
      </span>
      <div className={styles.stage}>{children}</div>
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  );
}

/** What to do, and why. */
export const Do = (props: { caption: React.ReactNode; children: React.ReactNode }) => <Verdict verdict="do" {...props} />;
/** What not to do, and why. */
export const Dont = (props: { caption: React.ReactNode; children: React.ReactNode }) => <Verdict verdict="dont" {...props} />;
