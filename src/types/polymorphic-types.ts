import type React from "react";

export type PolymorphicRef<E extends React.ElementType> =
  React.ComponentPropsWithRef<E>["ref"];

export type PolymorphicComponentProps<
  E extends React.ElementType,
  Props = object,
> = Props & {
  as?: E;
  ref?: PolymorphicRef<E>;
} & Omit<React.ComponentProps<E>, keyof Props | "as" | "ref">;
