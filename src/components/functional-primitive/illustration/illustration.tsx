"use client";

import { clsx } from "clsx";
import type React from "react";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { DRAWINGS, type IllustrationName } from "./drawings";
import styles from "./illustration.module.css";

export type { IllustrationName };

/** How large an illustration is drawn: 48, 64, 96 or 128px square by default (component tokens). */
export type IllustrationSize = "sm" | "md" | "lg" | "xl";

export type IllustrationProps = Omit<React.ComponentPropsWithRef<"span">, "children"> & {
  /**
   * Its size, from the theme's `components.illustration.size.*` tokens.
   * Defaults to `md` (64px).
   */
  size?: IllustrationSize;
  /**
   * What it shows, for assistive technology, when the illustration carries
   * meaning the text beside it doesn't. Leave it out (the usual case) when a
   * heading or message next to it already says it; it's then hidden from
   * assistive technology.
   */
  label?: string;
  children?: never;
};

/**
 * Make a named illustration component. The library's illustrations are built
 * with it; `name` is also its `data-illustration` attribute.
 */
function createIllustration(name: IllustrationName) {
  function LibraryIllustration({ size = "md", label, className, style, ...otherProps }: IllustrationProps) {
    const themeVars = useThemeCssVars();
    return (
      <span
        className={clsx(styles.root, className)}
        style={{ ...themeVars.style, ...style }}
        data-size={size}
        data-illustration={name}
        {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
        {...otherProps}
      >
        <svg viewBox="0 0 48 48" className={styles.svg} focusable="false" aria-hidden="true">
          {DRAWINGS[name]}
        </svg>
      </span>
    );
  }
  LibraryIllustration.displayName = `${name[0]!.toUpperCase()}${name.slice(1)}Illustration`;
  return LibraryIllustration;
}

/** A terminal window with a prompt: setting up, the command line, building. */
export const TerminalIllustration = /* @__PURE__ */ createIllustration("terminal");
/** A question answered with a component: help, chat, an assistant. */
export const ConversationIllustration = /* @__PURE__ */ createIllustration("conversation");
/** A grid of parts with one picked out: browsing, a catalogue, choosing. */
export const ComponentsIllustration = /* @__PURE__ */ createIllustration("components");
/** A button with a focus ring: accessibility, keyboard use. */
export const FocusIllustration = /* @__PURE__ */ createIllustration("focus");
/** Swatches and a token: themes, branding, appearance settings. */
export const PaletteIllustration = /* @__PURE__ */ createIllustration("palette");
/** A checked form: forms, applications, a step completed. */
export const FormIllustration = /* @__PURE__ */ createIllustration("form");
/** Half sun, half moon: light and dark mode, display settings. */
export const LightDarkIllustration = /* @__PURE__ */ createIllustration("lightDark");
/** One thing connected to two others: integrations, connected services. */
export const ConnectIllustration = /* @__PURE__ */ createIllustration("connect");
/** A shield with a tick: security, verified, tested. */
export const ShieldIllustration = /* @__PURE__ */ createIllustration("shield");
/** An empty tray: nothing here yet, an empty list or inbox. */
export const InboxIllustration = /* @__PURE__ */ createIllustration("inbox");
/** A magnifier over a page: searching, or no results. */
export const SearchIllustration = /* @__PURE__ */ createIllustration("search");
/** A tick in a circle: done, submitted, saved. */
export const SuccessIllustration = /* @__PURE__ */ createIllustration("success");
/** A warning triangle: something needs attention, or went wrong. */
export const WarningIllustration = /* @__PURE__ */ createIllustration("warning");
/** A crossed-out cloud: offline, or a service can't be reached. */
export const OfflineIllustration = /* @__PURE__ */ createIllustration("offline");
/** An arrow rising from a tray: uploading, adding files. */
export const UploadIllustration = /* @__PURE__ */ createIllustration("upload");
/** A payment card: payments, billing, a balance. */
export const PaymentIllustration = /* @__PURE__ */ createIllustration("payment");
/** A calendar with a day marked: dates, deadlines, scheduling. */
export const CalendarIllustration = /* @__PURE__ */ createIllustration("calendar");
/** A document: records, statements, correspondence. */
export const DocumentIllustration = /* @__PURE__ */ createIllustration("document");
/** A padlock: private, signed out, permissions. */
export const LockIllustration = /* @__PURE__ */ createIllustration("lock");
/** A bell with a dot: notifications, something new. */
export const NotificationIllustration = /* @__PURE__ */ createIllustration("notification");
/** Bars and a rising line: reports, figures, trends. */
export const ChartIllustration = /* @__PURE__ */ createIllustration("chart");

/** A server with an alert badge: a server error, the service failed. */
export const ServerErrorIllustration = /* @__PURE__ */ createIllustration("serverError");
/** A traffic cone: under maintenance, temporarily unavailable. */
export const MaintenanceIllustration = /* @__PURE__ */ createIllustration("maintenance");
/** A folded map with a pin: page not found, lost. */
export const NotFoundIllustration = /* @__PURE__ */ createIllustration("notFound");
/** A no-entry sign: access denied, not allowed. */
export const AccessDeniedIllustration = /* @__PURE__ */ createIllustration("accessDenied");
/** An hourglass run out: a session expired, a link timed out, waiting. */
export const SessionExpiredIllustration = /* @__PURE__ */ createIllustration("sessionExpired");
/** An open door: welcome, first sign-in, come in. */
export const WelcomeIllustration = /* @__PURE__ */ createIllustration("welcome");
/** A checklist with the first item ticked: getting started, onboarding steps. */
export const ChecklistIllustration = /* @__PURE__ */ createIllustration("checklist");
/** Two people and a plus: invite someone, a team, sharing access. */
export const InviteIllustration = /* @__PURE__ */ createIllustration("invite");
/** An ID card: identity, verification, a profile. */
export const IdentityIllustration = /* @__PURE__ */ createIllustration("identity");
/** Two message bubbles, one being typed: messages, an empty chat. */
export const MessagesIllustration = /* @__PURE__ */ createIllustration("messages");
/** An envelope with a tick: email sent, check your inbox. */
export const EmailSentIllustration = /* @__PURE__ */ createIllustration("emailSent");
/** A shopping cart: a cart, checkout, an order. */
export const CartIllustration = /* @__PURE__ */ createIllustration("cart");
/** A till receipt: receipts, invoices, a purchase record. */
export const ReceiptIllustration = /* @__PURE__ */ createIllustration("receipt");
/** A bank building: bank accounts, linking a bank. */
export const BankIllustration = /* @__PURE__ */ createIllustration("bank");
/** Two accounts with arrows between them: a transfer, moving money. */
export const TransferIllustration = /* @__PURE__ */ createIllustration("transfer");
/** A jar filling with coins: savings, a goal, a balance growing. */
export const SavingsIllustration = /* @__PURE__ */ createIllustration("savings");
/** A coin with an arrow coming back: a refund, money returned. */
export const RefundIllustration = /* @__PURE__ */ createIllustration("refund");
/** A calculator: working out amounts, estimates. */
export const CalculatorIllustration = /* @__PURE__ */ createIllustration("calculator");
/** Three sliders: settings, preferences, options. */
export const SettingsIllustration = /* @__PURE__ */ createIllustration("settings");
/** A funnel with a cross: no matches for the filters. */
export const FilterIllustration = /* @__PURE__ */ createIllustration("filter");
/** A storage box: archived, stored away, nothing active. */
export const ArchiveIllustration = /* @__PURE__ */ createIllustration("archive");
/** An arrow into a tray: downloading, an export ready. */
export const DownloadIllustration = /* @__PURE__ */ createIllustration("download");
/** A cloud with turning arrows: syncing, backed up. */
export const CloudSyncIllustration = /* @__PURE__ */ createIllustration("cloudSync");
/** A phone showing a code: continue on your phone, scan to sign in. */
export const MobileIllustration = /* @__PURE__ */ createIllustration("mobile");
/** A trophy: an achievement, a milestone reached. */
export const AchievementIllustration = /* @__PURE__ */ createIllustration("achievement");
/** A message bubble with a star: feedback, a rating, a review. */
export const FeedbackIllustration = /* @__PURE__ */ createIllustration("feedback");
/** A lifebuoy: help and support, contact us. */
export const SupportIllustration = /* @__PURE__ */ createIllustration("support");
/** A clock: time, schedules, opening hours. */
export const ScheduleIllustration = /* @__PURE__ */ createIllustration("schedule");
/** A map pin: a place, an address, nearby. */
export const LocationIllustration = /* @__PURE__ */ createIllustration("location");
/** A database with an arrow going in: importing data. */
export const DataImportIllustration = /* @__PURE__ */ createIllustration("dataImport");
/** A document with a signature: sign here, an agreement. */
export const SignatureIllustration = /* @__PURE__ */ createIllustration("signature");

/**
 * Every illustration by name, for galleries and pickers. Importing this
 * brings in every drawing; import the named components to keep the rest out
 * of your bundle.
 */
export const ILLUSTRATIONS: Record<IllustrationName, ReturnType<typeof createIllustration>> = {
  // Empty and searching
  inbox: InboxIllustration,
  search: SearchIllustration,
  filter: FilterIllustration,
  messages: MessagesIllustration,
  archive: ArchiveIllustration,
  // Success and milestones
  success: SuccessIllustration,
  emailSent: EmailSentIllustration,
  achievement: AchievementIllustration,
  // Errors and blockers
  warning: WarningIllustration,
  offline: OfflineIllustration,
  serverError: ServerErrorIllustration,
  maintenance: MaintenanceIllustration,
  notFound: NotFoundIllustration,
  accessDenied: AccessDeniedIllustration,
  sessionExpired: SessionExpiredIllustration,
  lock: LockIllustration,
  // Money
  payment: PaymentIllustration,
  cart: CartIllustration,
  receipt: ReceiptIllustration,
  bank: BankIllustration,
  transfer: TransferIllustration,
  savings: SavingsIllustration,
  refund: RefundIllustration,
  calculator: CalculatorIllustration,
  // People
  invite: InviteIllustration,
  identity: IdentityIllustration,
  conversation: ConversationIllustration,
  feedback: FeedbackIllustration,
  support: SupportIllustration,
  notification: NotificationIllustration,
  // Files and data
  document: DocumentIllustration,
  signature: SignatureIllustration,
  upload: UploadIllustration,
  download: DownloadIllustration,
  cloudSync: CloudSyncIllustration,
  dataImport: DataImportIllustration,
  chart: ChartIllustration,
  // Time and place
  calendar: CalendarIllustration,
  schedule: ScheduleIllustration,
  location: LocationIllustration,
  // Onboarding and settings
  welcome: WelcomeIllustration,
  checklist: ChecklistIllustration,
  mobile: MobileIllustration,
  settings: SettingsIllustration,
  form: FormIllustration,
  shield: ShieldIllustration,
  connect: ConnectIllustration,
  terminal: TerminalIllustration,
  components: ComponentsIllustration,
  palette: PaletteIllustration,
  lightDark: LightDarkIllustration,
  focus: FocusIllustration,
};

/** Every illustration name. */
export const ILLUSTRATION_NAMES = Object.keys(ILLUSTRATIONS) as IllustrationName[];
