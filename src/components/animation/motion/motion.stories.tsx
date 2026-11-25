import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import {
  Button as AriaButton,
  Dialog,
  DialogTrigger,
  Disclosure,
  DisclosurePanel,
  Heading as AriaHeading,
  Modal,
  ModalOverlay,
  Popover,
} from "react-aria-components";
import { Motion } from "./motion";
import styles from "./motion-stories.module.css";

const meta: Meta = {
  title: "Components/Theme and motion/Motion",
  id: "animation-motion",
  parameters: {
    docs: { description: { component: "The library's motion, as components that wrap the element that moves." } },
  },
};

export default meta;
type Story = StoryObj;

/** A control answering hover, press and focus: instantly in, a short fade back. */
export const Feedback: Story = {
  render: () => (
    <Motion.Feedback>
      <AriaButton className={styles.control}>Hover or press me</AriaButton>
    </Motion.Feedback>
  ),
};

/** An anchored overlay fading and growing in, and shrinking away. */
export const Pop: Story = {
  render: () => (
    <DialogTrigger>
      <AriaButton className={styles.control}>Open a popover</AriaButton>
      <Motion.Pop>
        <Popover className={styles.panel} placement="bottom start" offset={6}>
          <Dialog aria-label="Example" className={styles.dialog}>Logged sightings appear here.</Dialog>
        </Popover>
      </Motion.Pop>
    </DialogTrigger>
  ),
};

/** A dialog: the backdrop dims, and the box pops in at the arrival pace. */
export const DimAndPop: Story = {
  render: () => (
    <DialogTrigger>
      <AriaButton className={styles.control}>Open a dialog</AriaButton>
      <Motion.Dim>
        <ModalOverlay className={styles.backdrop} isDismissable>
          <Motion.Pop pace="arrive">
            <Modal className={styles.panel}>
              <Dialog className={styles.dialog}>
                <AriaHeading slot="title" className={styles.title}>Sighting logged</AriaHeading>
                Press Escape or outside to close.
              </Dialog>
            </Modal>
          </Motion.Pop>
        </ModalOverlay>
      </Motion.Dim>
    </DialogTrigger>
  ),
};

/** A panel arriving from the end edge, as a drawer does. */
export const Slide: Story = {
  render: () => (
    <DialogTrigger>
      <AriaButton className={styles.control}>Open a panel</AriaButton>
      <Motion.Dim pace="arrive">
        <ModalOverlay className={styles.backdrop} isDismissable>
          <Motion.Slide from="end">
            <Modal className={styles.sheet}>
              <Dialog className={styles.dialog}>
                <AriaHeading slot="title" className={styles.title}>Case 4021</AriaHeading>
                Press Escape or outside to close.
              </Dialog>
            </Modal>
          </Motion.Slide>
        </ModalOverlay>
      </Motion.Dim>
    </DialogTrigger>
  ),
};

/** A disclosure panel growing open and shrinking closed, with its chevron turning. */
export const CollapseAndShift: Story = {
  render: () => (
    <Disclosure className={styles.disclosure}>
      <AriaHeading level={3} className={styles.title}>
        <AriaButton slot="trigger" className={styles.control}>
          Payment options{" "}
          <Motion.Shift>
            <span className={styles.chevron} aria-hidden="true">⌄</span>
          </Motion.Shift>
        </AriaButton>
      </AriaHeading>
      <Motion.Collapse>
        <DisclosurePanel>
          <p className={styles.body}>Pay in full, set up an arrangement, or pay by instalments.</p>
        </DisclosurePanel>
      </Motion.Collapse>
    </Disclosure>
  ),
};

/** The loops: working, loading and live. */
export const Loops: Story = {
  render: () => (
    <div className={styles.row}>
      <Motion.Spin><span className={styles.spinner} aria-label="Loading" role="img" /></Motion.Spin>
      <span className={styles.track}><Motion.Sweep><span className={styles.sweep} /></Motion.Sweep></span>
      <Motion.Shimmer><span className={styles.shimmer} /></Motion.Shimmer>
      <Motion.Pulse><span className={styles.dot} /></Motion.Pulse>
      <svg width="80" height="16" aria-hidden="true">
        <Motion.Flow><path className={`${styles.line} ${styles.dashes}`} d="M4,8 L76,8" /></Motion.Flow>
      </svg>
      <svg width="80" height="16" aria-hidden="true">
        <path className={styles.line} d="M4,8 L76,8" opacity={0.3} />
        <Motion.Travel><circle className={styles.traveller} r={4} /></Motion.Travel>
      </svg>
    </div>
  ),
};

/** Content rising into place as it scrolls into view, staggered. */
export const Reveal: Story = {
  render: () => (
    <div className={styles.row}>
      {["Annual dues", "Swamp Fund levy", "Kit hire"].map((label, i) => (
        <Motion.Reveal key={label} delayMs={i * 120}>
          <span className={styles.control}>{label}</span>
        </Motion.Reveal>
      ))}
    </div>
  ),
};

const FIGURES = [
  { label: "Sightings logged", value: 1284 },
  { label: "Paid on time", value: 0.94, percent: true },
  { label: "Overdue", value: 37 },
  { label: "Instalment plans", value: 212 },
];

/** Cards arriving one after another: Stagger orders the Reveals inside it. Replay to see it again. */
export const Stagger: Story = {
  render: function StaggerStory() {
    const [run, setRun] = React.useState(0);
    return (
      <div className={styles.stack}>
        <AriaButton className={styles.control} onPress={() => setRun((n) => n + 1)}>Replay</AriaButton>
        <div className={styles.grid} key={run}>
          <Motion.Stagger>
            {FIGURES.map((figure) => (
              <Motion.Presence key={figure.label} show playOnMount>
                <div className={styles.card}>
                  <span>{figure.label}</span>
                  <span className={styles.figure}>{figure.percent ? `${figure.value * 100}%` : figure.value}</span>
                </div>
              </Motion.Presence>
            ))}
          </Motion.Stagger>
        </div>
      </div>
    );
  },
};

/** An element joining and leaving: it nudges in, and nudges out before it unmounts. */
export const Presence: Story = {
  render: function PresenceStory() {
    const [show, setShow] = React.useState(true);
    return (
      <div className={styles.stack}>
        <AriaButton className={styles.control} onPress={() => setShow((s) => !s)}>{show ? "Dismiss" : "Show again"}</AriaButton>
        <Motion.Presence show={show}>
          <div className={styles.notice} role="status">Your return was saved as a draft.</div>
        </Motion.Presence>
      </div>
    );
  },
};

const PERIODS = {
  month: "October: 1,284 sightings logged, 37 overdue.",
  quarter: "July to September: 3,912 sightings logged, 104 overdue.",
  year: "2025–26: 15,408 sightings logged, 412 overdue.",
} as const;

/** Content replaced in place: each change swaps the new content in. */
export const Swap: Story = {
  render: function SwapStory() {
    const [period, setPeriod] = React.useState<keyof typeof PERIODS>("month");
    return (
      <div className={styles.stack}>
        <div className={styles.row}>
          {(Object.keys(PERIODS) as (keyof typeof PERIODS)[]).map((key) => (
            <AriaButton key={key} className={styles.control} onPress={() => setPeriod(key)} aria-pressed={period === key}>
              {key[0].toUpperCase() + key.slice(1)}
            </AriaButton>
          ))}
        </div>
        <Motion.Swap watch={period}>
          <p className={styles.card}>{PERIODS[period]}</p>
        </Motion.Swap>
      </div>
    );
  },
};

/** A figure that just changed: it counts to its new value and its row highlights. */
export const CountAndHighlight: Story = {
  render: function CountStory() {
    const [total, setTotal] = React.useState(48210.5);
    return (
      <div className={styles.stack}>
        <AriaButton className={styles.control} onPress={() => setTotal((t) => Math.round((t + 1000 + Math.random() * 9000) * 100) / 100)}>
          Recalculate
        </AriaButton>
        <Motion.Highlight watch={total}>
          <div className={styles.item}>
            <span>Amount owing</span>
            <Motion.Count value={total} formatOptions={{ style: "currency", currency: "NZD" }} />
          </div>
        </Motion.Highlight>
      </div>
    );
  },
};

const ACCOUNTS = ["Annual dues", "Swamp Fund levy", "Night-watch kit hire", "Field-trip deposit", "Dues instalment plan", "Newsletter subscription"];

/** A list's items gliding to their new places as it's sorted, gains or loses items. */
export const Layout: Story = {
  render: function LayoutStory() {
    const [items, setItems] = React.useState(ACCOUNTS.slice(0, 4));
    return (
      <div className={styles.stack}>
        <div className={styles.row}>
          <AriaButton className={styles.control} onPress={() => setItems((list) => [...list].sort(() => Math.random() - 0.5))}>Shuffle</AriaButton>
          <AriaButton className={styles.control} onPress={() => setItems((list) => [...list].sort((a, b) => a.localeCompare(b)))}>Sort</AriaButton>
          <AriaButton
            className={styles.control}
            onPress={() => setItems((list) => (list.length < ACCOUNTS.length ? [ACCOUNTS.find((t) => !list.includes(t))!, ...list] : list.slice(1)))}
          >
            Add or remove
          </AriaButton>
        </div>
        <Motion.Layout>
          <ul className={styles.list}>
            {items.map((item) => (
              <li key={item} className={styles.item}>{item}</li>
            ))}
          </ul>
        </Motion.Layout>
      </div>
    );
  },
};
