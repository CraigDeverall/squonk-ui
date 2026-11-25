import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { InfiniteList } from "./infinite-list";
import { Badge } from "../badge/badge";
import { Link } from "../link/link";
import { EmptyState } from "../../layout/empty-state/empty-state";
import { ScrollBox } from "../../layout-primitive/scroll-box/scroll-box";
import { Text } from "../../functional-primitive/text/text";

interface Activity {
  id: number;
  title: string;
  detail: string;
  when: string;
  tone: "success" | "info" | "warning";
}

const kinds = [
  { title: "Payment received", detail: "$124.00 towards annual dues", tone: "success" as const },
  { title: "Sighting logged", detail: "Tear pool near Hamilton Lake, 30 September", tone: "info" as const },
  { title: "Reminder sent", detail: "Swamp Fund levy due on 20 November", tone: "warning" as const },
  { title: "Address updated", detail: "Postal address changed by Aroha Ngata", tone: "info" as const },
];

const activity = (id: number): Activity => ({
  id,
  ...kinds[id % kinds.length],
  when: new Date(2026, 10, 3, 17 - (id % 9), 0, 0 - id * 1000).toLocaleString("en-NZ", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }),
});

/** A fake server: `size` items a page, `delay` ms a request, `pages` pages. */
function useActivity({ pages = 5, size = 12, delay = 700, failOnce = false } = {}) {
  const [items, setItems] = React.useState<Activity[]>(() => Array.from({ length: size }, (_, i) => activity(i)));
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const failed = React.useRef(!failOnce);
  return {
    items,
    loading,
    error,
    hasMore: items.length < pages * size,
    total: pages * size,
    onLoadMore: () => {
      setLoading(true);
      setError(undefined);
      setTimeout(() => {
        setLoading(false);
        if (!failed.current) {
          failed.current = true;
          setError("Couldn't load more activity. Check your connection.");
          return;
        }
        setItems((current) => [...current, ...Array.from({ length: size }, (_, i) => activity(current.length + i))]);
      }, delay);
    },
  };
}

const renderActivity = (item: Activity) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "12px 0", borderBottom: "1px solid var(--squonk-colors-border-default)" }}>
    <div style={{ display: "grid", gap: 4 }}>
      <Text weight="bold" as="h3" style={{ margin: 0, fontSize: "inherit" }}>{item.title}</Text>
      <Text tone="secondary">{item.detail}</Text>
      <Link href={`#activity-${item.id}`}>View details</Link>
    </div>
    <div style={{ display: "grid", gap: 4, justifyItems: "end", alignContent: "start" }}>
      <Badge tone={item.tone}>{item.tone === "success" ? "Paid" : item.tone === "warning" ? "Due soon" : "Update"}</Badge>
      <Text tone="secondary" as="span">{item.when}</Text>
    </div>
  </div>
);

const meta: Meta<typeof InfiniteList<Activity>> = {
  title: "Components/Data display/InfiniteList",
  // Keeps the URL from before components were grouped by job.
  id: "functional-infinitelist",
  component: InfiniteList,
  argTypes: {
    threshold: { control: "text" },
    loadingText: { control: "text" },
    endText: { control: "text" },
  },
  // Demos scroll inside a box up to 420px tall, so loading happens in view in
  // the docs. It takes the full width of its container.
  decorators: [
    (Story) => (
      <ScrollBox maxHeight="420px" style={{ width: "100%", boxSizing: "border-box", border: "1px solid var(--squonk-colors-border-default)", borderRadius: 8, padding: "0 16px" }}>
        <Story />
      </ScrollBox>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof InfiniteList<Activity>>;

/** Scroll down: the next page loads before the end reaches the screen. */
export const Default: Story = {
  render: function Default(args) {
    const feed = useActivity();
    return <InfiniteList {...args} {...feed} aria-label="Account activity" getKey={(item) => item.id} renderItem={renderActivity} />;
  },
};

/**
 * New activity arrives at the top every few seconds, as live updates would
 * bring it. With `animateArrivals` each one slides in and flashes once, and
 * the rest glide down. Scrolling loads older pages at the end without motion.
 */
export const LiveArrivals: Story = {
  render: function LiveArrivals(args) {
    const feed = useActivity();
    const [arrivals, setArrivals] = React.useState<Activity[]>([]);
    React.useEffect(() => {
      let next = -1;
      const timer = window.setInterval(() => {
        next += 1;
        const item = activity(1000 + next);
        setArrivals((current) => [{ ...item, id: -1 - next, when: "Just now" }, ...current]);
      }, 3000);
      return () => window.clearInterval(timer);
    }, []);
    return (
      <InfiniteList
        {...args}
        {...feed}
        items={[...arrivals, ...feed.items]}
        total={feed.total + arrivals.length}
        animateArrivals
        aria-label="Account activity"
        getKey={(item) => item.id}
        renderItem={renderActivity}
      />
    );
  },
};

/** The first load beyond the first page fails; Try again resumes. */
export const LoadError: Story = {
  render: function LoadError(args) {
    const feed = useActivity({ failOnce: true });
    return <InfiniteList {...args} {...feed} aria-label="Account activity" getKey={(item) => item.id} renderItem={renderActivity} />;
  },
};

/** Everything fits in two pages, then the end is marked. */
export const ReachesTheEnd: Story = {
  render: function ReachesTheEnd(args) {
    const feed = useActivity({ pages: 2, size: 6, delay: 400 });
    return <InfiniteList {...args} {...feed} aria-label="Account activity" getKey={(item) => item.id} renderItem={renderActivity} />;
  },
};

export const Empty: Story = {
  render: (args) => (
    <InfiniteList<Activity>
      {...args}
      aria-label="Account activity"
      items={[]}
      hasMore={false}
      onLoadMore={() => {}}
      getKey={(item) => item.id}
      renderItem={renderActivity}
      emptyState={<EmptyState title="No activity yet" body="Payments, sightings and newsletters will show here." />}
    />
  ),
};
