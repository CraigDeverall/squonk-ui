import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  GOOGLE_FONTS,
  MONOSPACE_FONTS,
  findFont,
  type GoogleFontEntry,
} from "./data/google-fonts";
import {
  fontFamilyStackFor,
  loadGoogleFontInto,
} from "./font-loader";

const PREVIEW_WEIGHTS = [400] as const;
const VISIBLE_LIMIT = 80;

interface FontPickerProps {
  /** "text" picks from every family; "code" filters to Monospace. */
  pool: "text" | "code";
  /** Current value as stored in the theme (the full font-family CSS stack). */
  value: string;
  /** Default value if the user hasn't picked anything yet. */
  placeholder: string;
  /** Called with the new font-family CSS stack. */
  onChange: (cssStack: string) => void;
}

/**
 * Searchable Google Fonts picker. Vanilla React + the Storybook chrome
 * CSS vars (`--sb-bg-input`, `--sb-fg`, `--sb-border`, …) — intentionally
 * no component-library dependency, so the addon stays self-contained in the
 * Storybook manager iframe.
 *
 * Behaviour:
 *   - Trigger button shows the selected family in its own face.
 *   - Opening the dropdown autofocuses the search and previews each
 *     option in its own face (fonts lazy-loaded once visible).
 *   - Keyboard: ↑/↓ to navigate, Enter to select, Esc to close,
 *     Tab leaves naturally.
 *   - Click outside closes.
 *   - When no search is typed, shows the top N families by popularity
 *     (Google's `popularity` rank: 1 = most popular).
 */
export const FontPicker: React.FC<FontPickerProps> = ({
  pool,
  value,
  placeholder,
  onChange,
}) => {
  const fonts = pool === "code" ? MONOSPACE_FONTS : GOOGLE_FONTS;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => findFont(value) ?? findFont(placeholder),
    [value, placeholder]
  );

  // Preview the trigger's currently-selected face by loading just its
  // 400 weight into the manager doc.
  useEffect(() => {
    if (selected) loadGoogleFontInto(document, selected, PREVIEW_WEIGHTS);
  }, [selected]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...fonts].sort((a, b) => a.popularity - b.popularity);
    if (!q) return sorted.slice(0, VISIBLE_LIMIT);
    return sorted
      .filter((f) => f.family.toLowerCase().includes(q))
      .slice(0, VISIBLE_LIMIT);
  }, [fonts, search]);

  // Lazy-load preview CSS for the visible option set. Single rAF batch
  // so rapid typing doesn't hammer the head.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      for (const f of filtered) loadGoogleFontInto(document, f, PREVIEW_WEIGHTS);
    });
    return () => cancelAnimationFrame(id);
  }, [open, filtered]);

  // Focus follows the open DOM; selection/search reset in the opening event.
  useLayoutEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // Keep the highlighted option scrolled into view as the user navigates.
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const target = list.querySelector<HTMLElement>(
      `[data-option-index="${highlight}"]`
    );
    if (target) {
      const top = target.offsetTop;
      const bottom = top + target.offsetHeight;
      const viewTop = list.scrollTop;
      const viewBottom = viewTop + list.clientHeight;
      if (top < viewTop) list.scrollTop = top;
      else if (bottom > viewBottom) list.scrollTop = bottom - list.clientHeight;
    }
  }, [highlight, open]);

  // Click-outside / focus-outside closes the dropdown.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const commit = useCallback(
    (font: GoogleFontEntry) => {
      loadGoogleFontInto(document, font);
      onChange(fontFamilyStackFor(font));
      setOpen(false);
    },
    [onChange]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange("");
      setSearch("");
    },
    [onChange]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => Math.min(h + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => Math.max(h - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const choice = filtered[highlight];
        if (choice) commit(choice);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === "Home") {
        e.preventDefault();
        setHighlight(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setHighlight(Math.max(0, filtered.length - 1));
      }
    },
    [filtered, highlight, commit]
  );

  return (
    <div ref={rootRef} style={styles.root}>
      <button
        type="button"
        onClick={() => { setSearch(""); setHighlight(0); setOpen((o) => !o); }}
        style={{
          ...styles.trigger,
          fontFamily: selected ? fontFamilyStackFor(selected) : "inherit",
          color: selected ? "var(--sb-fg)" : "var(--sb-fg-dim)",
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={styles.triggerLabel}>
          {selected ? selected.family : placeholder}
        </span>
        {selected ? (
          <span
            role="button"
            tabIndex={-1}
            onClick={handleClear}
            title="Reset to default"
            aria-label="Reset font"
            style={styles.clearBtn}
          >
            ×
          </span>
        ) : (
          <span style={styles.chevron} aria-hidden>
            ▾
          </span>
        )}
      </button>

      {open && (
        <div style={styles.dropdown} role="listbox">
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setHighlight(0); }}
            onKeyDown={onKeyDown}
            placeholder={
              pool === "code"
                ? "Search monospace fonts"
                : "Search Google Fonts"
            }
            style={styles.search}
            spellCheck={false}
          />
          <div ref={listRef} style={styles.list}>
            {filtered.length === 0 ? (
              <div style={styles.empty}>No matching fonts</div>
            ) : (
              filtered.map((font, i) => {
                const isSelected = selected?.family === font.family;
                const isHighlighted = highlight === i;
                return (
                  <div
                    key={font.family}
                    role="option"
                    aria-selected={isSelected}
                    data-option-index={i}
                    onMouseEnter={() => setHighlight(i)}
                    onMouseDown={(e) => {
                      // Prevent the search input from losing focus
                      // before the click handler fires.
                      e.preventDefault();
                    }}
                    onClick={() => commit(font)}
                    style={{
                      ...styles.option,
                      background: isHighlighted
                        ? "var(--sb-card-bg)"
                        : "transparent",
                      borderLeft: `2px solid ${
                        isSelected ? "var(--sb-accent)" : "transparent"
                      }`,
                    }}
                  >
                    <span
                      style={{
                        ...styles.optionName,
                        fontFamily: fontFamilyStackFor(font),
                      }}
                    >
                      {font.family}
                    </span>
                    <span style={styles.optionMeta}>{font.category}</span>
                  </div>
                );
              })
            )}
          </div>
          <div style={styles.footer}>
            {search
              ? `${filtered.length} match${filtered.length === 1 ? "" : "es"}`
              : `Top ${VISIBLE_LIMIT} of ${fonts.length.toLocaleString()} — type to search`}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: "relative",
    width: "100%",
  },
  trigger: {
    width: "100%",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "5px 8px",
    border: "1px solid var(--sb-border)",
    borderRadius: 4,
    background: "var(--sb-bg-input)",
    color: "var(--sb-fg)",
    fontSize: 12,
    lineHeight: "20px",
    cursor: "pointer",
    textAlign: "left",
    outline: "none",
  },
  triggerLabel: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  chevron: {
    fontSize: 10,
    color: "var(--sb-fg-dim)",
  },
  clearBtn: {
    cursor: "pointer",
    color: "var(--sb-fg-dim)",
    fontSize: 14,
    lineHeight: 1,
    padding: "0 2px",
    borderRadius: 2,
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    zIndex: 1100,
    background: "var(--sb-bg-raised)",
    border: "1px solid var(--sb-border-strong)",
    borderRadius: 6,
    boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  search: {
    border: "none",
    borderBottom: "1px solid var(--sb-border)",
    background: "transparent",
    color: "var(--sb-fg)",
    padding: "8px 10px",
    fontSize: 12,
    outline: "none",
  },
  list: {
    maxHeight: 320,
    overflowY: "auto",
  },
  option: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
    padding: "6px 10px",
    cursor: "pointer",
  },
  optionName: {
    fontSize: 14,
    lineHeight: 1.2,
    color: "var(--sb-fg)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  optionMeta: {
    fontSize: 10,
    color: "var(--sb-fg-dim)",
    textTransform: "lowercase",
    letterSpacing: "0.02em",
  },
  empty: {
    padding: "14px 10px",
    fontSize: 12,
    color: "var(--sb-fg-dim)",
    textAlign: "center",
  },
  footer: {
    padding: "6px 10px",
    fontSize: 10,
    color: "var(--sb-fg-dim)",
    borderTop: "1px solid var(--sb-border)",
  },
};
