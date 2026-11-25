"use client";

import { createFormHook, createFormHookContexts, useStore } from "@tanstack/react-form";
import { clsx } from "clsx";
import React from "react";
import { Form as AriaForm, type FormProps as AriaFormProps } from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { Button, type ButtonProps } from "../button/button";
import { Checkbox, type CheckboxProps } from "../checkbox/checkbox";
import { CheckboxGroup, type CheckboxGroupProps } from "../checkbox-group/checkbox-group";
import { CurrencyField, type CurrencyFieldProps } from "../currency-field/currency-field";
import { RadioGroup, type RadioGroupProps } from "../radio/radio";
import { Select, type ListSelectProps, type SearchableSelectPublicProps } from "../select/select";
import { Switch, type SwitchProps } from "../switch/switch";
import { TextField, type TextFieldProps } from "../text-field/text-field";
import { Textarea, type TextareaProps } from "../textarea/textarea";
import styles from "./form.module.css";

const contexts = createFormHookContexts();
export const fieldContext = contexts.fieldContext;
export const formContext = contexts.formContext;
/** The bound field inside a custom field component. */
export const useFieldContext = contexts.useFieldContext;
/** The form inside a custom form component. */
export const useFormContext = contexts.useFormContext;

// Field ids are `<form id>-<field name>`, so the error summary can link to
// a field it has never rendered.
const FormIdContext = React.createContext("form");
const SummaryRefContext = React.createContext<React.RefObject<HTMLDivElement | null> | null>(null);
const fieldId = (formId: string, name: string) => `${formId}-${name.replace(/[^\w-]/g, "-")}`;

// TanStack keeps `{ form: "…" }` from a form validator as the error itself
// unless it also has `fields`, so read `form` as well as `message`.
const messageOf = (error: unknown): string | undefined => {
  if (typeof error === "string") return error;
  if (!error || typeof error !== "object") return undefined;
  if ("message" in error) return String(error.message);
  return "form" in error ? messageOf(error.form) : undefined;
};

// The context form is untyped (any form can render these), so field meta
// is read loosely.
const errorsOf = (meta: unknown): readonly unknown[] => (meta as { errors?: unknown[] } | undefined)?.errors ?? [];

/** The messages for a field's errors, deduplicated across validators. */
function messagesOf(errors: readonly unknown[]): string[] {
  return [...new Set(errors.map(messageOf).filter((m): m is string => Boolean(m)))];
}

/**
 * The bound field's error, once it should show: after the field is left
 * or a submit is attempted, so people aren't told off while typing.
 */
function useFieldError(): string | undefined {
  const field = useFieldContext<unknown>();
  const attempts = useStore(field.form.store, (state) => state.submissionAttempts);
  const errors = useStore(field.store, (state) => state.meta.errors);
  const blurred = useStore(field.store, (state) => state.meta.isBlurred);
  if (!blurred && attempts === 0) return undefined;
  return messagesOf(errors)[0];
}

/** Wraps a bound field: the target of its error-summary link. */
function FieldSlot({ children }: { children: React.ReactNode }) {
  const field = useFieldContext<unknown>();
  const formId = React.useContext(FormIdContext);
  return (
    <div id={fieldId(formId, field.name)} className={styles.field} data-form-field={field.name}>
      {children}
    </div>
  );
}

type Bound<P, Omitted extends string> = Omit<P, Omitted | "value" | "defaultValue" | "onChange" | "error" | "name">;

function BoundTextField(props: Bound<TextFieldProps, "onBlur">) {
  const field = useFieldContext<string>();
  return (
    <FieldSlot>
      <TextField {...props} name={field.name} value={field.state.value ?? ""} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} error={useFieldError()} />
    </FieldSlot>
  );
}

function BoundTextarea(props: Bound<TextareaProps, "onBlur">) {
  const field = useFieldContext<string>();
  return (
    <FieldSlot>
      <Textarea {...props} name={field.name} value={field.state.value ?? ""} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} error={useFieldError()} />
    </FieldSlot>
  );
}

function BoundCurrencyField(props: Bound<CurrencyFieldProps, "onBlur">) {
  const field = useFieldContext<number | null>();
  return (
    <FieldSlot>
      <CurrencyField {...props} name={field.name} value={field.state.value ?? null} onChange={(v) => field.handleChange(v)} onBlur={field.handleBlur} error={useFieldError()} />
    </FieldSlot>
  );
}

type BoundSelectProps =
  | Bound<ListSelectProps, "onBlur">
  | Bound<SearchableSelectPublicProps, "onBlur">;

function BoundSelect(props: BoundSelectProps) {
  const field = useFieldContext<string>();
  const shared = { name: field.name, value: field.state.value ?? "", onChange: (v: string) => field.handleChange(v), error: useFieldError() };
  return (
    <FieldSlot>
      <div onBlur={field.handleBlur}>
        {props.searchable ? <Select {...props} {...shared} /> : <Select {...(props as Bound<ListSelectProps, "onBlur">)} {...shared} />}
      </div>
    </FieldSlot>
  );
}

function BoundCheckbox(props: Omit<CheckboxProps, "checked" | "defaultChecked" | "onChange" | "error" | "name" | "onBlur">) {
  const field = useFieldContext<boolean>();
  return (
    <FieldSlot>
      <Checkbox {...props} name={field.name} checked={Boolean(field.state.value)} onChange={(checked) => field.handleChange(checked)} onBlur={field.handleBlur} error={useFieldError()} />
    </FieldSlot>
  );
}

function BoundSwitch(props: Omit<SwitchProps, "checked" | "defaultChecked" | "onChange" | "name" | "onBlur">) {
  const field = useFieldContext<boolean>();
  return (
    <FieldSlot>
      <Switch {...props} name={field.name} checked={Boolean(field.state.value)} onChange={(checked) => field.handleChange(checked)} onBlur={field.handleBlur} />
    </FieldSlot>
  );
}

function BoundCheckboxGroup(props: Bound<CheckboxGroupProps, "onBlur">) {
  const field = useFieldContext<string[]>();
  return (
    <FieldSlot>
      <CheckboxGroup {...props} name={field.name} value={field.state.value ?? []} onChange={(v) => field.handleChange(v)} onBlur={field.handleBlur} error={useFieldError()} />
    </FieldSlot>
  );
}

function BoundRadioGroup(props: Bound<RadioGroupProps, never>) {
  const field = useFieldContext<string>();
  return (
    <FieldSlot>
      <div onBlur={field.handleBlur}>
        <RadioGroup {...props} name={field.name} value={field.state.value} onChange={(v) => field.handleChange(v)} error={useFieldError()} />
      </div>
    </FieldSlot>
  );
}

export interface FormProps
  extends Omit<AriaFormProps, "onSubmit" | "children" | "className" | "style" | "validationBehavior" | "validationErrors"> {
  /** Extra class on the `<form>`. */
  className?: string;
  /** Inline styles on the `<form>`. */
  style?: React.CSSProperties;
  /** The form's content: `AppField` fields, an `ErrorSummary` and a `SubmitButton`. */
  children?: React.ReactNode;
}

/**
 * The `<form>` for a `useAppForm` form, on React Aria's Form. Validation is
 * the form's, not the browser's: React Aria's `validationBehavior="aria"`
 * reaches every field inside and sets `noValidate`. Submitting runs the validators; if any field is
 * invalid, focus moves to the `ErrorSummary` (or the first invalid field
 * when there is no summary).
 */
function Form({ children, className, id, ...formProps }: FormProps) {
  const form = useFormContext();
  const fallbackId = React.useId();
  const formId = id ?? `form${fallbackId.replace(/:/g, "")}`;
  const summaryRef = React.useRef<HTMLDivElement>(null);
  const themeVars = useThemeCssVars();

  return (
    <AriaForm
      {...formProps}
      id={formId}
      validationBehavior="aria"
      className={clsx(styles.form, className)}
      style={{ ...themeVars.style, ...formProps.style }}
      onSubmit={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await form.handleSubmit();
        if (form.state.isValid) return;
        requestAnimationFrame(() => {
          if (summaryRef.current) return summaryRef.current.focus();
          const first = Object.entries(form.state.fieldMeta).find(([, meta]) => messagesOf(errorsOf(meta)).length > 0)?.[0];
          if (first) focusField(fieldId(formId, first));
        });
      }}
    >
      <FormIdContext.Provider value={formId}>
        <SummaryRefContext.Provider value={summaryRef}>{themeVars.provide(children)}</SummaryRefContext.Provider>
      </FormIdContext.Provider>
    </AriaForm>
  );
}

// Move focus to the first control inside a field's slot.
function focusField(id: string) {
  const slot = document.getElementById(id);
  const control = slot?.querySelector<HTMLElement>(
    'input:not([type="hidden"]):not([hidden]):not([aria-hidden="true"]), textarea, button[role="combobox"], select:not([aria-hidden="true"]), button'
  );
  control?.focus();
  slot?.scrollIntoView({ block: "center", behavior: "smooth" });
}

export interface ErrorSummaryProps {
  /** The summary's heading. Defaults to `"There is a problem"`. */
  title?: string;
}

/**
 * Lists every field error after a submit attempt, each linking to its
 * field. Takes focus when a submit fails, so screen-reader users hear what
 * to fix. Write field messages that make sense on their own here ("Enter
 * your email address", not "Required").
 */
function ErrorSummary({ title = "There is a problem" }: ErrorSummaryProps) {
  const form = useFormContext();
  const formId = React.useContext(FormIdContext);
  const summaryRef = React.useContext(SummaryRefContext);
  const titleId = `${formId}-error-summary`;
  const attempts = useStore(form.store, (state) => state.submissionAttempts);
  const fieldMeta = useStore(form.store, (state) => state.fieldMeta);
  const formErrors = useStore(form.store, (state) => messagesOf(state.errors));
  const fieldErrors = Object.entries(fieldMeta).flatMap(([name, meta]) =>
    messagesOf(errorsOf(meta)).slice(0, 1).map((message) => ({ name, message }))
  );
  if (attempts === 0 || (fieldErrors.length === 0 && formErrors.length === 0)) return null;

  return (
    <div ref={summaryRef} className={styles.summary} tabIndex={-1} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.summaryTitle}>{title}</h2>
      <ul className={styles.summaryList}>
        {formErrors.map((message) => <li key={message}>{message}</li>)}
        {fieldErrors.map(({ name, message }) => (
          <li key={name}>
            <a
              href={`#${fieldId(formId, name)}`}
              onClick={(event) => {
                event.preventDefault();
                focusField(fieldId(formId, name));
              }}
            >
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface SubmitButtonProps extends Omit<ButtonProps<"button">, "type" | "as"> {
  /** Label while submitting. Defaults to the children. */
  pendingLabel?: React.ReactNode;
}

/**
 * The form's submit button. It stays enabled (a disabled button can't
 * explain itself); while submitting it is marked busy and ignores presses.
 */
function SubmitButton({ children, pendingLabel, variant = "primary", onClick, ...buttonProps }: SubmitButtonProps) {
  const form = useFormContext();
  const submitting = useStore(form.store, (state) => state.isSubmitting);
  return (
    <Button
      {...buttonProps}
      type="submit"
      variant={variant}
      aria-busy={submitting || undefined}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        if (submitting) event.preventDefault();
        onClick?.(event);
      }}
    >
      {submitting && pendingLabel ? pendingLabel : children}
    </Button>
  );
}

/**
 * The library's form hook, on TanStack Form. `useAppForm` takes TanStack's
 * options (`defaultValues`, `validators`, `onSubmit`) and returns a form
 * whose `AppField` children render library fields already bound to the
 * value, blur state and errors. Validators accept any Standard Schema
 * (Zod, Valibot, ArkType).
 */
const formHook = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField: BoundTextField,
    Textarea: BoundTextarea,
    CurrencyField: BoundCurrencyField,
    Select: BoundSelect,
    Checkbox: BoundCheckbox,
    Switch: BoundSwitch,
    CheckboxGroup: BoundCheckboxGroup,
    RadioGroup: BoundRadioGroup,
  },
  formComponents: { Form, ErrorSummary, SubmitButton },
});

/** Create a form with the library's fields bound. See the Form docs. */
export const useAppForm = formHook.useAppForm;
/** Split a large form into components that receive the form. */
export const withForm = formHook.withForm;
/** Reuse a group of fields across forms. */
export const withFieldGroup = formHook.withFieldGroup;
/** Add your own field or form components to the library's set. */
export const extendForm = formHook.extendForm;
