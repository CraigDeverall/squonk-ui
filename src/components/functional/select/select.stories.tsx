import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { MultiSelect, Select, type SelectOption } from "./select";
import { Button } from "../button/button";
import { Presentation } from "../../style/presentation/presentation";

const meta: Meta<typeof Select> = {
  title: "Components/Inputs/Select",
  // Keeps the URL from before components were grouped by job.
  id: "functional-select",
  component: Select,
  argTypes: {
    label: { control: "text" },
    helperText: { control: "text" },
    error: { control: "text" },
    placeholder: { control: "text" },
    fullWidth: { control: "boolean" },
    disabled: { control: "boolean" },
    searchable: { control: "boolean" },
    clearable: { control: "boolean" },
    options: { control: false },
    ref: {
      description: "Ref to the underlying DOM element",
      control: false,
      table: { type: { summary: "React.RefObject<HTMLSelectElement> (HTMLInputElement when searchable)" } },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Select>;

const envOptions = [
  { value: "staging", label: "staging (← develop)" },
  { value: "production", label: "production (← staging)" },
  { value: "uat", label: "uat (← release/*)" },
];

export const Default: Story = {
  args: {
    label: "Promote from",
    options: envOptions,
    placeholder: "Pick an upstream env…",
  },
};

export const WithValue: Story = {
  args: {
    label: "Promote from",
    options: envOptions,
    defaultValue: "staging",
  },
};

export const WithHelperText: Story = {
  args: {
    label: "Promote from",
    options: envOptions,
    placeholder: "Pick an upstream env…",
    helperText:
      "The new env will run whatever image succeeded on the upstream env.",
  },
};

export const WithError: Story = {
  args: {
    label: "Promote from",
    options: envOptions,
    placeholder: "Pick an upstream env…",
    error: "Pick an upstream environment.",
  },
};

export const Disabled: Story = {
  args: {
    label: "Promote from",
    options: envOptions,
    defaultValue: "staging",
    disabled: true,
  },
};

export const WithDisabledOption: Story = {
  args: {
    label: "Environment",
    options: [
      { value: "dev", label: "dev" },
      { value: "staging", label: "staging" },
      { value: "production", label: "production (locked)", disabled: true },
    ],
    placeholder: "Pick an env…",
  },
};

export const Compact: Story = {
  args: {
    label: "Status",
    options: [
      { value: "open", label: "Open" },
      { value: "in-progress", label: "In progress" },
      { value: "done", label: "Done" },
    ],
    defaultValue: "open",
  },
  render: (args) => (
    <Presentation register="compact">
      <Select {...args} />
    </Presentation>
  ),
};

export const Large: Story = {
  args: {
    label: "Plan",
    options: [
      { value: "free", label: "Free" },
      { value: "pro", label: "Pro" },
      { value: "team", label: "Team" },
    ],
    placeholder: "Pick a plan…",
  },
  render: (args) => (
    <Presentation register="large">
      <Select {...args} />
    </Presentation>
  ),
};

export const NotFullWidth: Story = {
  args: {
    label: "Sort by",
    options: [
      { value: "newest", label: "Newest" },
      { value: "oldest", label: "Oldest" },
      { value: "alpha", label: "A → Z" },
    ],
    defaultValue: "newest",
    fullWidth: false,
  },
};

const countries: SelectOption[] = [
  "Australia", "Austria", "Belgium", "Brazil", "Canada", "Chile", "China", "Cook Islands", "Denmark", "Fiji",
  "Finland", "France", "Germany", "Hong Kong", "India", "Indonesia", "Ireland", "Italy", "Japan", "Korea",
  "Malaysia", "Netherlands", "New Caledonia", "New Zealand", "Niue", "Norway", "Philippines", "Samoa",
  "Singapore", "South Africa", "Spain", "Sweden", "Switzerland", "Tonga", "United Kingdom", "United States",
].map((name) => ({ value: name.toLowerCase().replace(/\s+/g, "-"), label: name }));

const offices: SelectOption[] = [
  { value: "akl", label: "Auckland", description: "Takapuna, Manukau, Henderson" },
  { value: "ham", label: "Hamilton", description: "Waikato" },
  { value: "wlg", label: "Wellington", description: "Head office, Lower Hutt" },
  { value: "chc", label: "Christchurch", description: "Canterbury" },
  { value: "dud", label: "Dunedin", description: "Otago" },
  { value: "nsn", label: "Nelson", description: "Temporarily closed", disabled: true },
];

/** Type to filter a long list. */
export const Searchable: Story = {
  args: {
    searchable: true,
    label: "Country of residence",
    placeholder: "Start typing a country",
    options: countries,
  },
  decorators: [(Story) => <div style={{ maxWidth: 400, minHeight: 380 }}><Story /></div>],
};

/** A second line in each option. When searchable, typing matches it too: try "otago". */
export const WithDescriptions: Story = {
  args: {
    searchable: true,
    clearable: true,
    label: "Nearest office",
    placeholder: "Town or region",
    helperText: "Search by town or region.",
    options: offices,
    defaultValue: "wlg",
  },
  decorators: [(Story) => <div style={{ maxWidth: 400, minHeight: 420 }}><Story /></div>],
};

export const Clearable: Story = {
  args: { label: "Environment", options: envOptions, defaultValue: "staging", clearable: true },
};

/** Options from a server: filtering is off and results arrive as people type. */
export const ServerSearch: Story = {
  render: function ServerSearch() {
    const [results, setResults] = React.useState<SelectOption[]>([]);
    const [value, setValue] = React.useState("");
    const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
    return (
      <div style={{ maxWidth: 400, minHeight: 320 }}>
        <Select
          searchable
          label="Member"
          placeholder="Name or membership number"
          helperText="Searches the member directory."
          filter={false}
          emptyText="Type at least two letters"
          options={results}
          value={value}
          onChange={setValue}
          onSearchChange={(text) => {
            clearTimeout(timer.current);
            if (text.length < 2) return setResults([]);
            timer.current = setTimeout(() => {
              const names = ["Aroha Ngata", "Aroha Parata", "Kowhai Street household", "Karaka Walkers", "Koru Hemlock household"];
              setResults(
                names
                  .filter((name) => name.toLowerCase().includes(text.toLowerCase()))
                  .map((name, i) => ({ value: `SQ-104-77${i}`, label: name, description: `Membership SQ-104-77${i}` }))
              );
            }, 250);
          }}
        />
      </div>
    );
  },
};

/** Several choices: each shows as a removable tag. Backspace in the empty input removes the last. */
export const Multiple: Story = {
  render: function Multiple() {
    const [value, setValue] = React.useState<string[]>(["wlg"]);
    return (
      <div style={{ maxWidth: 400, minHeight: 420 }}>
        <MultiSelect label="Offices" placeholder="Town or region" options={offices} value={value} onChange={setValue} />
      </div>
    );
  },
};

/** People from a server, several at once. Chosen people keep their names when later results leave them out. */
export const MultipleServerSearch: Story = {
  render: function MultipleServerSearch() {
    const people = ["Aroha Ngata", "Ben Carter", "Mere Tūhoe", "Priya Singh", "Sam Lee", "Tama Walker"];
    const [results, setResults] = React.useState<SelectOption[]>([]);
    const [value, setValue] = React.useState<string[]>([]);
    return (
      <div style={{ maxWidth: 400, minHeight: 360 }}>
        <MultiSelect
          label="Invite"
          placeholder="Name or email"
          filter={false}
          emptyText="Type a name"
          options={results}
          value={value}
          onChange={setValue}
          onSearchChange={(text) =>
            setResults(
              text
                ? people
                    .filter((name) => name.toLowerCase().includes(text.toLowerCase()))
                    .map((name) => ({ value: name.toLowerCase().replace(/\s/g, "."), label: name }))
                : [],
            )
          }
        />
      </div>
    );
  },
};

/** In a form: name submits the chosen value in both modes, never the typed text. */
export const InAForm: Story = {
  render: function InAForm() {
    const [submitted, setSubmitted] = React.useState<string>();
    return (
      <form
        style={{ display: "grid", gap: 12, maxWidth: 400, minHeight: 380 }}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setSubmitted(`environment=${data.get("environment")}, country=${data.get("country")}`);
        }}
      >
        <Select label="Environment" name="environment" options={envOptions} defaultValue="uat" />
        <Select searchable label="Country" name="country" options={countries} defaultValue="samoa" />
        <div><Button type="submit" variant="primary">Save</Button></div>
        {submitted ? <p role="status">Submitted {submitted}</p> : null}
      </form>
    );
  },
};
