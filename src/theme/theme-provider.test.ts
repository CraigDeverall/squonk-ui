import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SquonkThemeProvider } from "./theme-provider";

const render = (props: Parameters<typeof SquonkThemeProvider>[0]) => renderToStaticMarkup(createElement(SquonkThemeProvider, props));
const gradient = "linear-gradient(180deg, #ffffff, #eef2ff)";

describe("SquonkThemeProvider global styles", () => {
  it("writes no stylesheet for the default theme", () => {
    expect(render({})).toBe("");
  });

  it("paints the body colour only, by default", () => {
    const html = render({ withGlobalStyles: true });
    expect(html).toContain("background-color:var(--squonk-colors-background-default)");
    expect(html).not.toContain("background-image");
    expect(html).not.toContain("background-attachment");
  });

  it("paints the page background image over the body colour when the theme binds one", () => {
    const html = render({ withGlobalStyles: true, roleBindings: { "components.page.backgroundImage": gradient } });
    expect(html).toContain(`--squonk-components-page-background-image:${gradient}`);
    expect(html).toContain(
      "body{background-image:var(--squonk-components-page-background-image);background-attachment:fixed;background-repeat:no-repeat}",
    );
  });

  it("leaves the body alone without withGlobalStyles, and still publishes the variable", () => {
    const html = render({ roleBindings: { "components.page.backgroundImage": gradient } });
    expect(html).toContain(`--squonk-components-page-background-image:${gradient}`);
    expect(html).not.toContain("body{");
  });

  it("uses the mode's value from a per-mode binding", () => {
    const roleBindings = { "components.page.backgroundImage": { light: "none", dark: "radial-gradient(#1e1b4b, #020617)" } };
    expect(render({ withGlobalStyles: true, mode: "light", roleBindings })).not.toContain("background-image");
    const dark = render({ withGlobalStyles: true, mode: "dark", roleBindings });
    expect(dark).toContain("--squonk-components-page-background-image:radial-gradient(#1e1b4b, #020617)");
    expect(dark).toContain("body{background-image:var(--squonk-components-page-background-image)");
  });

  it("gives a heading colour that differs by mode", () => {
    const roleBindings = { "roles.color.heading": { light: "#1d3557", dark: "#f1faee" } };
    expect(render({ roleBindings })).toContain("--squonk-roles-color-heading:#1d3557");
    expect(render({ mode: "dark", roleBindings })).toContain("--squonk-roles-color-heading:#f1faee");
  });
});
