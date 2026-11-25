import type { MultiSelectProps, SelectProps } from "./select";

export const singleValue: SelectProps<"one"> = { options: [], value: "one", multiple: false };
// @ts-expect-error Select deliberately supports only scalar, single selection.
export const multipleValue: SelectProps = { options: [], multiple: true };
// @ts-expect-error Array values require a different multi-selection control.
export const arrayValue: SelectProps = { options: [], value: ["one"] };

export const searchable: SelectProps = { options: [], searchable: true, filter: false, onSearchChange: () => {}, emptyText: "None" };
// @ts-expect-error Search props only exist on a searchable Select.
export const listWithSearch: SelectProps = { options: [], onSearchChange: () => {} };
export const searchableRef: SelectProps = { options: [], searchable: true, ref: { current: null as HTMLInputElement | null } };

export const multi: MultiSelectProps<"a" | "b"> = { options: [], value: ["a"], onChange: (values) => values.length };
// @ts-expect-error MultiSelect takes an array, not one value.
export const multiScalar: MultiSelectProps = { options: [], value: "one" };
