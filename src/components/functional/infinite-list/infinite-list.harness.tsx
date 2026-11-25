import React from "react";
import { InfiniteList } from "./infinite-list";

export interface Notice {
  id: number;
  title: string;
}

const makePage = (page: number, size: number): Notice[] =>
  Array.from({ length: size }, (_, i) => {
    const id = page * size + i + 1;
    return { id, title: `Notice ${id}` };
  });

/** A feed that loads `pageSize` notices per page from a fake server, browser-side. */
export function NoticeFeed({
  pages = 3,
  pageSize = 10,
  delay = 150,
  failOnPage,
  itemHeight = 80,
}: {
  pages?: number;
  pageSize?: number;
  delay?: number;
  /** Fail the first attempt to load this page (0-based). */
  failOnPage?: number;
  itemHeight?: number;
}) {
  const [items, setItems] = React.useState<Notice[]>(() => makePage(0, pageSize));
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const failed = React.useRef(false);
  const loaded = items.length / pageSize;
  return (
    <div>
      <InfiniteList
        aria-label="Notices"
        items={items}
        getKey={(notice) => notice.id}
        renderItem={(notice) => (
          <div style={{ height: itemHeight, borderBottom: "1px solid #ccc" }}>
            <h3 style={{ margin: 0 }}>{notice.title}</h3>
            <a href={`#notice-${notice.id}`}>Open {notice.title}</a>
          </div>
        )}
        hasMore={loaded < pages}
        loading={loading}
        error={error}
        total={pages * pageSize}
        onLoadMore={() => {
          setLoading(true);
          setError(undefined);
          setTimeout(() => {
            setLoading(false);
            if (failOnPage === loaded && !failed.current) {
              failed.current = true;
              setError("Couldn't load more notices.");
              return;
            }
            setItems((current) => [...current, ...makePage(loaded, pageSize)]);
          }, delay);
        }}
      />
      <footer><a href="#help">Help</a></footer>
    </div>
  );
}

/** The same feed inside a 300px scrolling panel. */
export function NoticeFeedInPanel() {
  return (
    <div style={{ height: 300, overflowY: "auto" }} data-testid="panel">
      <NoticeFeed pages={3} pageSize={10} itemHeight={120} />
    </div>
  );
}
