"use client";

import React, { useEffect, useMemo, useState } from "react";
import * as icons from "../components/functional-primitive/icon/icon";
import type { Icon } from "../components/functional-primitive/icon/icon";
import { CheckIcon } from "../components/functional-primitive/icon/icon";
import { RadioGroup } from "../components/functional/radio/radio";
import { TextField } from "../components/functional/text-field/text-field";
import styles from "./icon-gallery.module.css";

type CopyFormat = "jsx" | "import";

/** Every curated icon, by its public export name. */
const curated = Object.entries(icons).filter(
  (entry): entry is [string, Icon] => /^[A-Z]\w*Icon$/.test(entry[0]) && typeof entry[1] === "function"
);

const snippet = (name: string, format: CopyFormat) =>
  format === "jsx" ? `<${name} />` : `import { ${name} } from "@squonk/ui/icon";`;

/** "ChevronDownIcon" → "chevron down", so searches can use spaces. */
const words = (name: string) => name.replace(/Icon$/, "").replace(/([a-z])([A-Z0-9])/g, "$1 $2").toLowerCase();

/**
 * Browse the curated icon set: search by name, then click an icon to copy
 * its JSX or import line.
 */
export function IconGallery() {
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState<CopyFormat>("jsx");
  const [copied, setCopied] = useState<{ name: string; text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return curated;
    const compact = q.replace(/\s+/g, "");
    return curated.filter(([name]) => name.toLowerCase().includes(compact) || words(name).includes(q));
  }, [query]);

  const copy = async (name: string) => {
    const text = snippet(name, format);
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ name, text, ok: true });
    } catch {
      setCopied({ name, text, ok: false });
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <TextField
          type="search"
          label="Search icons"
          placeholder="close, arrow, user…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <RadioGroup<CopyFormat>
          name="icon-copy-format"
          legend="Copy as"
          direction="row"
          value={format}
          onChange={setFormat}
          options={[
            { value: "jsx", label: "JSX" },
            { value: "import", label: "Import" },
          ]}
        />
      </div>

      <p className={styles.status} role="status">
        {copied ? (
          copied.ok ? (
            <>Copied <code>{copied.text}</code></>
          ) : (
            <>Couldn’t reach the clipboard. Select and copy: <code>{copied.text}</code></>
          )
        ) : (
          `${matches.length} of ${curated.length} icons`
        )}
      </p>

      {matches.length ? (
        <ul className={styles.grid}>
          {matches.map(([name, Glyph]) => {
            const isCopied = copied?.ok && copied.name === name;
            return (
              <li key={name}>
                <button
                  type="button"
                  className={styles.tile}
                  data-copied={isCopied ? "" : undefined}
                  onClick={() => void copy(name)}
                  title={`Copy ${snippet(name, format)}`}
                >
                  {isCopied ? <CheckIcon className={styles.glyph} /> : <Glyph className={styles.glyph} />}
                  <span className={styles.name}>{name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.empty}>
          No icon matches “{query}”. Ask for one to be added to the curated set.
        </p>
      )}
    </div>
  );
}
