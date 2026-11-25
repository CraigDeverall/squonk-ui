import React from "react";
import { MultiSelect, Select, type SelectOption } from "./select";

const offices: SelectOption[] = [
  { value: "wlg", label: "Wellington" },
  { value: "akl", label: "Auckland" },
  { value: "chc", label: "Christchurch" },
];

/**
 * An uncontrolled MultiSelect in a form. Submitting shows every value the
 * form sends for `offices`, and what was chosen shows as it changes.
 */
export function MultiInForm({ disabled, readOnly }: { disabled?: boolean; readOnly?: boolean }) {
  const [chosen, setChosen] = React.useState<string[]>([]);
  const [sent, setSent] = React.useState("");
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSent(new FormData(event.currentTarget).getAll("offices").join(","));
      }}
      style={{ width: 360 }}
    >
      <MultiSelect
        label="Offices"
        name="offices"
        options={offices}
        defaultValue={disabled || readOnly ? ["wlg"] : undefined}
        disabled={disabled}
        readOnly={readOnly}
        onChange={setChosen}
      />
      <output data-testid="chosen">{chosen.join(",")}</output>
      <output data-testid="sent">{sent}</output>
      <button type="submit">Send</button>
    </form>
  );
}

/** A MultiSelect over server results: each search replaces the options. */
export function MultiServerSearch() {
  const people = ["Aroha Ngata", "Ben Carter", "Priya Singh"];
  const [results, setResults] = React.useState<SelectOption[]>([]);
  const [value, setValue] = React.useState<string[]>([]);
  return (
    <div style={{ width: 360 }}>
      <MultiSelect
        label="Invite"
        filter={false}
        options={results}
        value={value}
        onChange={setValue}
        onSearchChange={(text) =>
          setResults(
            text
              ? people
                  .filter((name) => name.toLowerCase().includes(text.toLowerCase()))
                  .map((name) => ({ value: name.split(" ")[0].toLowerCase(), label: name }))
              : [],
          )
        }
      />
    </div>
  );
}

/** A searchable Select in a form that counts submits, browser-side. */
export function SearchableInForm() {
  const [submits, setSubmits] = React.useState(0);
  return (
    <form onSubmit={(event) => { event.preventDefault(); setSubmits((n) => n + 1); }}>
      <Select searchable label="Region" name="region" options={[{ value: "wlg", label: "Wellington" }, { value: "akl", label: "Auckland" }]} />
      <output data-testid="submits">{submits}</output>
    </form>
  );
}
