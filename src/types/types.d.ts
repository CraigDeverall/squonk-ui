export {};

// CSS-module components pass token and free-form values as custom properties.
declare module "react" {
  interface CSSProperties {
    [property: `--${string}`]: string | number | undefined;
  }
}
