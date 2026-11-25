import type React from "react";
import styles from "./illustration.module.css";

/**
 * The drawings behind each illustration, in one style: a 48-unit square, ink
 * outlines, paper and tint fills and one accent touch. Every colour is a class
 * bound to the theme (see illustration.module.css), so each follows the theme
 * and the colour mode.
 */
const ink = styles.ink;
const paper = `${styles.paper} ${styles.ink}`;
const tint = `${styles.tint} ${styles.ink}`;
const accent = styles.accent;
const accentInked = `${styles.accent} ${styles.ink}`;

/** A four-pointed sparkle centred on (x, y). */
const sparkle = (x: number, y: number, r: number) =>
  `M${x} ${y - r}l${r * 0.28} ${r * 0.72}L${x + r} ${y}l${-r * 0.72} ${r * 0.28}L${x} ${y + r}l${-r * 0.28} ${-r * 0.72}L${x - r} ${y}l${r * 0.72} ${-r * 0.28}z`;

export const DRAWINGS = {
  // A terminal window with a prompt.
  terminal: (
    <>
      <rect className={paper} x="5" y="10" width="36" height="29" rx="4" />
      <path className={ink} d="M5 17h36" />
      <circle className={accent} cx="9.5" cy="13.5" r="1.2" />
      <circle className={accent} cx="13.5" cy="13.5" r="1.2" />
      <circle className={accent} cx="17.5" cy="13.5" r="1.2" />
      <path className={styles.accentLine} d="M12 24l4.5 3.5L12 31" />
      <path className={ink} d="M20 31h9" />
      <path className={accent} d={sparkle(41, 8, 5)} />
    </>
  ),
  // A question answered with a component.
  conversation: (
    <>
      <path className={paper} d="M10 7h20a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H16l-6 5v-5a5 5 0 0 1-5-5v-8a5 5 0 0 1 5-5z" />
      <path className={ink} d="M11 14h17M11 19h10" />
      <rect className={tint} x="22" y="27" width="20" height="15" rx="3" />
      <rect className={accent} x="26" y="32.5" width="12" height="4.5" rx="2.25" />
      <path className={accent} d={sparkle(41, 11, 4.5)} />
    </>
  ),
  // A grid of parts, one picked out.
  components: (
    <>
      <rect className={paper} x="6" y="6" width="16" height="16" rx="3.5" />
      <rect className={paper} x="26" y="6" width="16" height="16" rx="3.5" />
      <rect className={paper} x="6" y="26" width="16" height="16" rx="3.5" />
      <rect className={tint} x="26" y="26" width="16" height="16" rx="3.5" />
      <path className={ink} d="M10 12h8M10 16h5M30 12h8M30 16h5M10 32h8M10 36h5" />
      <circle className={accent} cx="34" cy="34" r="3.5" />
    </>
  ),
  // A button with a focus ring around it.
  focus: (
    <>
      <rect className={styles.focusRing} x="4.5" y="13.5" width="39" height="21" rx="10.5" />
      <rect className={accent} x="9" y="18" width="30" height="12" rx="6" />
      <path className={styles.onAccentLine} d="M18 24h12" />
      <path className={ink} d="M24 38v4M20 42h8" />
    </>
  ),
  // Swatches and the token that names them.
  palette: (
    <>
      <circle className={tint} cx="17" cy="18" r="10" />
      <circle className={accentInked} cx="31" cy="18" r="10" />
      <rect className={paper} x="10" y="32" width="28" height="10" rx="5" />
      <circle className={accent} cx="16" cy="37" r="2.2" />
      <path className={ink} d="M21 37h11" />
    </>
  ),
  // A form, checked.
  form: (
    <>
      <rect className={paper} x="7" y="5" width="28" height="37" rx="4" />
      <path className={ink} d="M12 11h10" />
      <rect className={ink} x="12" y="14" width="18" height="6" rx="2" />
      <path className={ink} d="M12 25h8" />
      <rect className={ink} x="12" y="28" width="18" height="6" rx="2" />
      <circle className={tint} cx="36" cy="36" r="8" />
      <path className={styles.checkLine} d="M32.2 36.2l2.6 2.6 5-5.2" />
    </>
  ),
  // Half sun, half moon.
  lightDark: (
    <>
      <circle className={paper} cx="24" cy="24" r="11" />
      <path className={styles.inkFill} d="M24 13a11 11 0 0 1 0 22z" />
      <path className={ink} d="M24 5v4M10.6 10.6l2.8 2.8M5 24h4M10.6 37.4l2.8-2.8M24 39v4" />
      <path className={accent} d={sparkle(39, 10, 4)} />
      <path className={accent} d={sparkle(41, 33, 2.6)} />
    </>
  ),
  // One thing connected to two others.
  connect: (
    <>
      <path className={ink} d="M17 24h4a4 4 0 0 0 4-4v-3a4 4 0 0 1 4-4M17 24h4a4 4 0 0 1 4 4v3a4 4 0 0 0 4 4" />
      <circle className={paper} cx="11" cy="24" r="6" />
      <circle className={accent} cx="11" cy="24" r="2.4" />
      <rect className={tint} x="29" y="7" width="14" height="12" rx="3" />
      <rect className={tint} x="29" y="29" width="14" height="12" rx="3" />
      <path className={ink} d="M33 13h6M33 35h6" />
    </>
  ),
  // A shield with a tick.
  shield: (
    <>
      <path className={tint} d="M24 5l14 5v10c0 9.5-6 16-14 19.5C16 36 10 29.5 10 20V10z" />
      <path className={styles.checkLine} d="M18 22.5l4.5 4.5L31 18.5" />
      <path className={accent} d={sparkle(39, 37, 4)} />
    </>
  ),
  // An empty tray: nothing here yet.
  inbox: (
    <>
      <path className={paper} d="M6 26l6-15h24l6 15v10a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" />
      <path className={tint} d="M6 26h10l2 5h12l2-5h10v10a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" />
      <path className={ink} d="M17 18h14M19 22h10" />
      <path className={accent} d={sparkle(40, 8, 4.5)} />
    </>
  ),
  // A magnifier over a page: searching, or nothing found.
  search: (
    <>
      <rect className={paper} x="6" y="6" width="24" height="30" rx="3.5" />
      <path className={ink} d="M11 13h14M11 18h10M11 23h12" />
      <circle className={tint} cx="30" cy="29" r="9" />
      <circle className={accent} cx="30" cy="29" r="3" />
      <path className={ink} d="M36.5 35.5L43 42" />
    </>
  ),
  // A tick in a circle, with sparkles: done.
  success: (
    <>
      <circle className={tint} cx="23" cy="25" r="15" />
      <path className={styles.checkLine} d="M16.5 25.5l4.5 4.5 9-9.5" />
      <path className={accent} d={sparkle(39, 9, 5)} />
      <path className={accent} d={sparkle(8, 39, 3)} />
    </>
  ),
  // A warning triangle: something needs attention.
  warning: (
    <>
      <path className={tint} d="M21.4 8.5a3 3 0 0 1 5.2 0l15 26a3 3 0 0 1-2.6 4.5H9a3 3 0 0 1-2.6-4.5z" />
      <path className={styles.inkThick} d="M24 18v9" />
      <circle className={styles.inkFill} cx="24" cy="32.5" r="1.8" />
      <path className={accent} d={sparkle(41, 10, 3.5)} />
    </>
  ),
  // A cloud, crossed out: offline or unreachable.
  offline: (
    <>
      <path className={paper} d="M14 36a8 8 0 0 1-1-15.9A11 11 0 0 1 34 17a8 8 0 0 1 1 19z" />
      <path className={styles.accentLine} d="M8 8l32 32" />
      <path className={ink} d="M19 28h10" />
    </>
  ),
  // A tray with an arrow rising out of it.
  upload: (
    <>
      <path className={tint} d="M6 30h9l2 4h14l2-4h9v6a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" />
      <path className={styles.accentLine} d="M24 26V7M17 14l7-7 7 7" />
      <path className={ink} d="M6 30l4-9h5M42 30l-4-9h-5" />
    </>
  ),
  // A payment card.
  payment: (
    <>
      <rect className={tint} x="11" y="7" width="31" height="21" rx="3.5" transform="rotate(8 26.5 17.5)" />
      <rect className={paper} x="5" y="16" width="32" height="22" rx="3.5" />
      <rect className={accent} x="5" y="21" width="32" height="5" />
      <path className={ink} d="M10 32h8M28 32h4" />
    </>
  ),
  // A calendar with one day marked.
  calendar: (
    <>
      <rect className={paper} x="6" y="9" width="36" height="32" rx="4" />
      <path className={ink} d="M6 17h36M15 5v7M33 5v7" />
      <path className={ink} d="M12 24h4M22 24h4M32 24h4M12 31h4M22 31h4" />
      <circle className={accentInked} cx="34" cy="32" r="3.5" />
    </>
  ),
  // A document with a folded corner.
  document: (
    <>
      <path className={paper} d="M11 5h17l9 9v25a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4z" />
      <path className={tint} d="M28 5v6a3 3 0 0 0 3 3h6z" />
      <path className={ink} d="M13 21h17M13 27h17M13 33h10" />
      <rect className={accent} x="27" y="31" width="5" height="5" rx="1" />
    </>
  ),
  // A padlock: private or secure.
  lock: (
    <>
      <path className={ink} d="M16 22v-6a8 8 0 0 1 16 0v6" />
      <rect className={tint} x="10" y="22" width="28" height="20" rx="4" />
      <circle className={accent} cx="24" cy="30" r="2.8" />
      <path className={ink} d="M24 32.5v4" />
      <path className={accent} d={sparkle(40, 9, 4)} />
    </>
  ),
  // A bell with a dot: something new.
  notification: (
    <>
      <path className={tint} d="M13 33V22a11 11 0 0 1 22 0v11l3 4H10z" />
      <path className={ink} d="M20 41a4 4 0 0 0 8 0" />
      <path className={ink} d="M24 7v4" />
      <circle className={accentInked} cx="35" cy="12" r="4.5" />
    </>
  ),
  // Bars with a rising line: figures and trends.
  chart: (
    <>
      <rect className={paper} x="5" y="6" width="38" height="36" rx="4" />
      <rect className={tint} x="11" y="27" width="6" height="10" rx="1" />
      <rect className={tint} x="21" y="21" width="6" height="16" rx="1" />
      <rect className={tint} x="31" y="16" width="6" height="21" rx="1" />
      <path className={styles.accentLine} d="M11 20l9-6 7 3 10-7" />
      <circle className={accent} cx="37" cy="10" r="2" />
    </>
  ),
  // A server with an alert badge: the service failed.
  serverError: (
    <>
      <rect className={paper} x="6" y="7" width="30" height="13" rx="3" />
      <rect className={paper} x="6" y="24" width="30" height="13" rx="3" />
      <path className={ink} d="M12 13.5h9M12 30.5h9" />
      <circle className={styles.inkFill} cx="28.5" cy="13.5" r="1.5" />
      <circle className={styles.inkFill} cx="28.5" cy="30.5" r="1.5" />
      <circle className={accentInked} cx="37" cy="37" r="7" />
      <path className={styles.onAccentLine} d="M37 33.5v3.5M37 40.2v.1" />
    </>
  ),
  // A traffic cone: under maintenance.
  maintenance: (
    <>
      <path className={tint} d="M20.5 9h7l7.5 27H13z" />
      <path className={accent} d="M17.6 19.5h12.8l1.5 5.5H16.1z" />
      <rect className={paper} x="8" y="36" width="32" height="5" rx="2" />
      <path className={ink} d="M4 41h2M42 41h2" />
    </>
  ),
  // A folded map with a pin: lost, or the page isn't there.
  notFound: (
    <>
      <path className={paper} d="M5 12l12-4 14 4 12-4v28l-12 4-14-4-12 4z" />
      <path className={ink} d="M17 8v28M31 12v28" />
      <path className={styles.focusRing} d="M9 31c3-5 6-6 9-3s6 2 8-3" />
      <path className={accentInked} d="M33 30c-4-4.4-6-7.4-6-10.2a6 6 0 0 1 12 0c0 2.8-2 5.8-6 10.2z" />
      <circle className={paper} cx="33" cy="19.8" r="2.2" />
    </>
  ),
  // A no-entry sign: access denied.
  accessDenied: (
    <>
      <circle className={tint} cx="24" cy="24" r="16" />
      <rect className={accent} x="13" y="20.5" width="22" height="7" rx="3.5" />
    </>
  ),
  // An hourglass run out: a session expired, or waiting.
  sessionExpired: (
    <>
      <path className={paper} d="M16 8c0 9 8 10 8 16s-8 7-8 16h16c0-9-8-10-8-16s8-7 8-16z" />
      <path className={styles.tint} d="M19 14h10c-1 3-2.5 4.5-5 6.5-2.5-2-4-3.5-5-6.5z" />
      <path className={accent} d="M18.5 39.5c.8-4 2.5-6 5.5-7.5 3 1.5 4.7 3.5 5.5 7.5z" />
      <path className={ink} d="M12 8h24M12 40h24" />
      <path className={accent} d={sparkle(41, 18, 3.5)} />
    </>
  ),
  // An open door: welcome, come in.
  welcome: (
    <>
      <path className={tint} d="M12 42V8a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v34" />
      <path className={paper} d="M12 7l11 4v33l-11-2z" />
      <circle className={styles.inkFill} cx="20" cy="27" r="1.4" />
      <path className={ink} d="M5 42h7M34 42h9" />
      <path className={accent} d={sparkle(41, 11, 4.5)} />
    </>
  ),
  // A checklist with the first item done: getting started.
  checklist: (
    <>
      <rect className={paper} x="9" y="6" width="30" height="36" rx="4" />
      <rect className={tint} x="18" y="3.5" width="12" height="5" rx="2" />
      <rect className={accentInked} x="14" y="13" width="7" height="7" rx="1.5" />
      <path className={styles.onAccentLine} d="M15.8 16.6l1.6 1.6 2.6-3" />
      <rect className={ink} x="14" y="23" width="7" height="7" rx="1.5" />
      <path className={ink} d="M25 16.5h9M25 26.5h9M14 36h20" />
    </>
  ),
  // Two people and a plus: invite someone, a team.
  invite: (
    <>
      <circle className={tint} cx="30" cy="15" r="6" />
      <path className={tint} d="M19.5 36a10.5 10.5 0 0 1 21 0z" />
      <circle className={paper} cx="17" cy="19" r="6.5" />
      <path className={paper} d="M5.5 41a11.5 11.5 0 0 1 23 0z" />
      <circle className={accent} cx="39" cy="38" r="6" />
      <path className={styles.onAccentLine} d="M39 35v6M36 38h6" />
    </>
  ),
  // An ID card: identity, verification.
  identity: (
    <>
      <rect className={paper} x="5" y="11" width="38" height="26" rx="4" />
      <rect className={tint} x="10" y="17" width="12" height="14" rx="2" />
      <circle className={accent} cx="16" cy="22" r="2.6" />
      <path className={ink} d="M12 30a4 4 0 0 1 8 0" />
      <path className={ink} d="M27 20h11M27 25h8M27 30h10" />
    </>
  ),
  // Two message bubbles, one still being typed.
  messages: (
    <>
      <path className={paper} d="M9 6h20a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4H16l-6 5v-5H9a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4z" />
      <path className={ink} d="M11 12h15M11 17h9" />
      <path className={tint} d="M21 27h18a4 4 0 0 1 4 4v5a4 4 0 0 1-4 4h-1v4l-5-4H21a4 4 0 0 1-4-4v-5a4 4 0 0 1 4-4z" />
      <circle className={accent} cx="24" cy="33.5" r="1.7" />
      <circle className={accent} cx="30" cy="33.5" r="1.7" />
      <circle className={accent} cx="36" cy="33.5" r="1.7" />
    </>
  ),
  // An envelope with a tick: the email was sent.
  emailSent: (
    <>
      <rect className={paper} x="5" y="11" width="32" height="24" rx="3" />
      <path className={ink} d="M6 13l15 11 15-11" />
      <circle className={accentInked} cx="37" cy="35" r="7.5" />
      <path className={styles.onAccentLine} d="M33.6 35.2l2.4 2.4 4.4-4.6" />
    </>
  ),
  // A shopping cart with things in it.
  cart: (
    <>
      <rect className={tint} x="15" y="8" width="10" height="10" rx="2" />
      <circle className={accentInked} cx="30.5" cy="12" r="4.5" />
      <path className={paper} d="M11.5 16h29l-4 14H14.5z" />
      <path className={ink} d="M4 9h5l5.5 25h22" />
      <circle className={paper} cx="17" cy="39" r="2.6" />
      <circle className={paper} cx="33" cy="39" r="2.6" />
    </>
  ),
  // A till receipt: receipts, invoices, a purchase.
  receipt: (
    <>
      <path className={paper} d="M10 5h28v37l-3.5-2.5L31 42l-3.5-2.5L24 42l-3.5-2.5L17 42l-3.5-2.5L10 42z" />
      <path className={ink} d="M15 12h18M15 18h12M15 24h15M15 32h7" />
      <rect className={accent} x="26" y="29.5" width="7" height="5" rx="1.5" />
    </>
  ),
  // A bank building.
  bank: (
    <>
      <path className={tint} d="M5 17L24 7l19 10z" />
      <circle className={accent} cx="24" cy="13.2" r="2.2" />
      <path className={ink} d="M12 21v12M20 21v12M28 21v12M36 21v12" />
      <rect className={paper} x="6" y="34" width="36" height="7" rx="1.5" />
    </>
  ),
  // Two accounts and arrows between them: a transfer.
  transfer: (
    <>
      <rect className={paper} x="4" y="8" width="20" height="14" rx="3" />
      <rect className={tint} x="24" y="26" width="20" height="14" rx="3" />
      <path className={ink} d="M9 15h9M29 33h9" />
      <path className={styles.accentLine} d="M14 26v3a4 4 0 0 0 4 4h1.5M16.5 30l3 3-3 3" />
      <path className={ink} d="M34 22v-3a4 4 0 0 0-4-4h-1.5M31.5 12l-3 3 3 3" />
    </>
  ),
  // A jar filling with coins: savings.
  savings: (
    <>
      <path className={paper} d="M12 15h24v23a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z" />
      <path className={tint} d="M12 31h24v7a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z" />
      <rect className={paper} x="10" y="9" width="28" height="6" rx="2" />
      <path className={ink} d="M20 12h8" />
      <circle className={accentInked} cx="24" cy="23.5" r="4" />
    </>
  ),
  // A coin with an arrow coming back: a refund.
  refund: (
    <>
      <circle className={tint} cx="27" cy="28" r="12" />
      <path className={ink} d="M30.5 24c-.8-1.3-2.2-2-3.8-2-2.1 0-3.6 1.2-3.6 2.8 0 3.9 7.6 2.3 7.6 6.3 0 1.7-1.6 2.9-3.9 2.9-1.7 0-3.2-.8-4-2.1M27 19.5v2.5M27 34v2.5" />
      <path className={styles.accentLine} d="M37 10.5A17 17 0 0 0 9.5 19M8.5 12.5l1 6.5 6.5-1" />
    </>
  ),
  // A calculator: working out amounts.
  calculator: (
    <>
      <rect className={paper} x="11" y="5" width="26" height="38" rx="4" />
      <rect className={tint} x="15" y="9" width="18" height="8" rx="1.5" />
      <path className={ink} d="M25 13h4" />
      <path className={styles.inkThick} d="M17 23v.1M24 23v.1M31 23v.1M17 30v.1M24 30v.1M17 37v.1M24 37v.1" />
      <rect className={accent} x="29" y="28" width="4" height="11" rx="2" />
    </>
  ),
  // Three sliders: settings and preferences.
  settings: (
    <>
      <path className={ink} d="M7 14h34M7 24h34M7 34h34" />
      <circle className={paper} cx="16" cy="14" r="4.5" />
      <circle className={tint} cx="32" cy="24" r="4.5" />
      <circle className={accentInked} cx="21" cy="34" r="4.5" />
    </>
  ),
  // A funnel with a cross: no matches for the filters.
  filter: (
    <>
      <path className={tint} d="M6 8h34L27 23v12l-8 5V23z" />
      <circle className={accent} cx="38" cy="36" r="6" />
      <path className={styles.onAccentLine} d="M35.8 33.8l4.4 4.4M40.2 33.8l-4.4 4.4" />
    </>
  ),
  // A storage box: archived.
  archive: (
    <>
      <path className={tint} d="M8 17h32v21a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" />
      <rect className={paper} x="5" y="8" width="38" height="9" rx="2" />
      <rect className={accent} x="18.5" y="23" width="11" height="4.5" rx="2.25" />
    </>
  ),
  // A tray with an arrow coming down into it.
  download: (
    <>
      <path className={tint} d="M6 30h9l2 4h14l2-4h9v6a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" />
      <path className={styles.accentLine} d="M24 7v19M17 19l7 7 7-7" />
      <path className={ink} d="M6 30l4-9h5M42 30l-4-9h-5" />
    </>
  ),
  // A cloud with arrows turning: syncing, backed up.
  cloudSync: (
    <>
      <path className={paper} d="M14 38a9 9 0 0 1-1.2-17.9A12 12 0 0 1 35.5 17a9 9 0 0 1 .5 21z" />
      <path className={styles.accentLine} d="M18.5 28a5.5 5.5 0 0 1 9.9-3.3M29 20.8v4.2h-4.2M29.5 28a5.5 5.5 0 0 1-9.9 3.3M19 35.2V31h4.2" />
    </>
  ),
  // A phone showing a code: continue on your phone.
  mobile: (
    <>
      <rect className={paper} x="13" y="4" width="22" height="40" rx="4" />
      <path className={ink} d="M21 8.5h6M21 39.5h6" />
      <rect className={ink} x="17" y="14" width="6" height="6" rx="1" />
      <rect className={ink} x="25" y="14" width="6" height="6" rx="1" />
      <rect className={ink} x="17" y="23" width="6" height="6" rx="1" />
      <rect className={accent} x="25.5" y="23.5" width="5" height="5" rx="1" />
      <path className={ink} d="M17 33h14" />
    </>
  ),
  // A trophy: an achievement, a milestone.
  achievement: (
    <>
      <path className={ink} d="M15 11h-4a5 5 0 0 0 5 7M33 11h4a5 5 0 0 1-5 7" />
      <path className={tint} d="M15 7h18v9a9 9 0 0 1-18 0z" />
      <path className={ink} d="M24 25v7" />
      <rect className={paper} x="16" y="32" width="16" height="8" rx="2" />
      <path className={accent} d={sparkle(41, 27, 4.5)} />
      <path className={accent} d={sparkle(7, 30, 3)} />
    </>
  ),
  // A message bubble with a star: feedback, a rating.
  feedback: (
    <>
      <path className={paper} d="M10 6h28a5 5 0 0 1 5 5v13a5 5 0 0 1-5 5H22l-8 7v-7h-4a5 5 0 0 1-5-5V11a5 5 0 0 1 5-5z" />
      <path className={accentInked} d="M24.0 10.0L25.9 14.8L31.1 15.2L27.1 18.5L28.4 23.6L24.0 20.8L19.6 23.6L20.9 18.5L16.9 15.2L22.1 14.8z" />
    </>
  ),
  // A lifebuoy: help and support.
  support: (
    <>
      <path className={paper} fillRule="evenodd" d="M24 8a16 16 0 1 1 0 32a16 16 0 1 1 0-32zM24 17a7 7 0 1 0 0 14a7 7 0 1 0 0-14z" />
      <path className={tint} d="M38.1 31.5A16 16 0 0 1 31.5 38.1L27.3 30.2A7 7 0 0 0 30.2 27.3z" />
      <path className={tint} d="M16.5 38.1A16 16 0 0 1 9.9 31.5L17.8 27.3A7 7 0 0 0 20.7 30.2z" />
      <path className={tint} d="M9.9 16.5A16 16 0 0 1 16.5 9.9L20.7 17.8A7 7 0 0 0 17.8 20.7z" />
      <path className={tint} d="M31.5 9.9A16 16 0 0 1 38.1 16.5L30.2 20.7A7 7 0 0 0 27.3 17.8z" />
      <path className={accent} d={sparkle(42, 7, 4)} />
    </>
  ),
  // A clock: time, schedules, opening hours.
  schedule: (
    <>
      <circle className={paper} cx="24" cy="25" r="16" />
      <path className={ink} d="M24 12v2.5M37 25h-2.5M24 38v-2.5M11 25h2.5" />
      <path className={styles.inkThick} d="M24 18v7l5 3.5" />
      <circle className={accent} cx="24" cy="25" r="2.2" />
      <path className={accent} d={sparkle(41, 8, 4)} />
    </>
  ),
  // A map pin on the ground: a place, an address.
  location: (
    <>
      <path className={ink} d="M12 40c0-2 5.4-3.5 12-3.5s12 1.5 12 3.5-5.4 3.5-12 3.5S12 42 12 40z" />
      <path className={tint} d="M24 39c-7.5-8-11-13.5-11-19a11 11 0 0 1 22 0c0 5.5-3.5 11-11 19z" />
      <circle className={accentInked} cx="24" cy="20" r="4.2" />
    </>
  ),
  // A database with an arrow going in: importing data.
  dataImport: (
    <>
      <path className={tint} d="M10 18v19c0 2.8 6.3 5 14 5s14-2.2 14-5V18" />
      <path className={ink} d="M10 27.5c0 2.8 6.3 5 14 5s14-2.2 14-5" />
      <ellipse className={paper} cx="24" cy="18" rx="14" ry="5" />
      <path className={styles.accentLine} d="M24 3v14M19 12l5 5 5-5" />
    </>
  ),
  // A document with a signature: sign here.
  signature: (
    <>
      <path className={paper} d="M11 5h17l9 9v25a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4z" />
      <path className={tint} d="M28 5v6a3 3 0 0 0 3 3h6z" />
      <path className={ink} d="M13 15h11M13 21h17" />
      <path className={styles.accentLine} d="M13 33c2-5 4.5-6 4.5-2.5s1.5 4 3.5.5 3-3.5 3.5-.5 2 1.5 5-1" />
      <path className={ink} d="M13 38h18" />
    </>
  ),
} satisfies Record<string, React.ReactNode>;

export type IllustrationName = keyof typeof DRAWINGS;
