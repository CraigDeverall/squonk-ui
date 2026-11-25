// Global (no imports): CSS modules export their scoped class names.
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
