import React from "react";
import {
  NavList,
  Avatar,
  Badge,
  Breadcrumb,
  Container,
  Drawer,
  DropdownMenu,
  Heading,
  IconButton,
  Link,
  Popover,
  Sidebar,
  StickyHeader,
  Text,
  ToastProvider,
} from "../components";
import { HelpIcon, MenuIcon, NotificationIcon } from "../components/functional-primitive/icon/icon";
import { activity, MEMBER } from "./fixtures";
import styles from "./demo-shell.module.css";

export const NAV = ["Overview", "Membership", "Sightings", "Payments", "Instalment plans", "Newsletters", "Settings"];

/** The app's side navigation: the library's NavList, marking the current page as the theme says. */
function NavLinks({ items, label, active, onNavigate }: { items: readonly string[]; label: string; active?: string; onNavigate?: () => void }) {
  const slug = (item: string) => item.toLowerCase().replace(/\s+/g, "-");
  return (
    <NavList
      label={label}
      className={styles.nav}
      items={items.map((item) => ({ id: item, label: item, href: `#${slug(item)}` }))}
      current={active}
      onNavigate={onNavigate}
    />
  );
}

function Notifications() {
  const unread = [activity(2), activity(3), activity(0)];
  return (
    <Popover
      placement="bottom-end"
      title="Notifications"
      description={`${unread.length} new since you last signed in`}
      trigger={
        <span className={styles.badgeAnchor}>
          <IconButton icon={<NotificationIcon />} label={`Notifications, ${unread.length} new`} tooltip={false} />
          <span className={styles.count} aria-hidden="true">{unread.length}</span>
        </span>
      }
      footer={<Link href="#newsletters">See all activity</Link>}
    >
      <ul className={styles.notifications}>
        {unread.map((item) => (
          <li key={item.id}>
            <Text weight="bold">{item.title}</Text>
            <Text tone="secondary">{item.detail} · {item.when}</Text>
          </li>
        ))}
      </ul>
    </Popover>
  );
}

export interface SocietyAppShellProps {
  /** The service name in the header. Defaults to "Squonk Society". */
  brand?: string;
  /** Navigation items. Defaults to the member's account sections. */
  nav?: readonly string[];
  /** Names the navigation landmark. Defaults to "Account". */
  navLabel?: string;
  /** Who is signed in, and the member or household shown above the navigation. */
  account?: { person: string; org: string; detail: string };
  /** The current section, marked in the navigation. */
  active?: string;
  /** The breadcrumb trail above the page title. The last item is this page. */
  crumbs?: { label: string; href?: string }[];
  /** The page's h1. */
  title: string;
  /** A line under the title. */
  description?: React.ReactNode;
  /** Actions at the end of the title row. */
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

/** The signed-in frame shared by the demo screens. */
export function SocietyAppShell({
  brand = "Squonk Society",
  nav = NAV,
  navLabel = "Account",
  account = { person: MEMBER.contact, org: MEMBER.chapter, detail: `Member ${MEMBER.membershipNumber}` },
  active,
  crumbs,
  title,
  description,
  actions,
  children,
}: SocietyAppShellProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <ToastProvider>
      <div className={styles.app}>
        <StickyHeader>
          <div className={styles.headerRow}>
            <div className={styles.brandRow}>
              <span className={styles.menuButton}>
                <IconButton icon={<MenuIcon />} label="Open menu" onClick={() => setMenuOpen(true)} tooltip={false} />
              </span>
              <span className={styles.brand}>
                <span className={styles.mark} aria-hidden="true">S</span>
                {brand}
              </span>
            </div>
            <div className={styles.tools}>
              <Notifications />
              <IconButton icon={<HelpIcon />} label="Help" />
              <DropdownMenu
                align="end"
                triggerLabel={`Account: ${account.person}, ${account.org}`}
                trigger={<Avatar name={account.person} />}
                items={[
                  { key: "profile", label: "Your details" },
                  { key: "switch", label: "Switch membership" },
                  "separator",
                  { key: "sign-out", label: "Sign out", tone: "danger" },
                ]}
              />
            </div>
          </div>
        </StickyHeader>

        <div className={styles.body}>
          <Sidebar className={styles.sidebar} width="232px">
            <div className={styles.business}>
              <Text weight="bold">{account.org}</Text>
              <Text tone="secondary">{account.detail}</Text>
            </div>
            <NavLinks items={nav} label={navLabel} active={active} />
          </Sidebar>

          <main className={styles.main}>
            <Container size="full">
              <div className={styles.pageHeader}>
                {crumbs ? <Breadcrumb items={crumbs} homeIcon /> : null}
                <div className={styles.titleRow}>
                  <div className={styles.titles}>
                    <Heading level={1}>{title}</Heading>
                    {description ? <Text tone="secondary">{description}</Text> : null}
                  </div>
                  {actions ? <div className={styles.actions}>{actions}</div> : null}
                </div>
              </div>
              {children}
            </Container>
          </main>
        </div>

        <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} placement="start" size="sm" title={account.org}>
          <Text tone="secondary">{account.detail}</Text>
          <NavLinks items={nav} label={navLabel} active={active} onNavigate={() => setMenuOpen(false)} />
        </Drawer>
      </div>
    </ToastProvider>
  );
}

/** A labelled figure for summary cards. */
export function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "success" | "warning" | "error" | "info" }) {
  return (
    <div className={styles.stat}>
      <Text tone="secondary">{label}</Text>
      <span className={styles.statValue}>{value}</span>
      {tone ? <Badge tone={tone}>{tone === "error" ? "Action needed" : tone === "warning" ? "Due soon" : tone === "success" ? "Up to date" : "Info"}</Badge> : null}
    </div>
  );
}
