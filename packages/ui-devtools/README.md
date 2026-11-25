# Squonk UI Theme Devtools

A Chrome extension that edits the theme of any site built with `@squonkstack/ui`,
live, from the browser's side panel. The panel is the same one the Storybook
docs show on the right: primitives, colours for both modes, purpose tokens,
switches, fonts, motion, example themes, import, export and "Copy diff".

It is not in the Chrome Web Store. Download the build that ships with the
documentation site, or build it yourself, and load it unpacked.

## Install

Download
[squonk-ui-theme-devtools.zip](https://ui.squonkstack.io/downloads/squonk-ui-theme-devtools.zip)
and unzip it. `squonk-ui-theme-devtools.zip.sha256` and
`squonk-ui-theme-devtools.json` (version, size, checksum) sit beside it at the
same address. Or build from this repository, which leaves the same files in
`packages/ui-devtools/dist`:

```bash
npm run build -w @squonkstack/ui-devtools
```

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Choose **Load unpacked** and pick the unzipped folder (or
   `packages/ui-devtools/dist`).
3. Pin the extension, open a site built with Squonk UI and click its toolbar
   button. The side panel opens and follows the active tab.

Tabs that were already open when the extension was installed need a reload.
After rebuilding, press the reload button on the extension's card.

## How it reaches the page

A site's theme lives in the props of its root `SquonkThemeProvider`, which a
browser tool cannot see. So there are two ways in, and the panel's header says
which one a page is using.

**Live theme.** From the library version that includes
`src/theme/theme-devtools.ts`, the root provider reports its own theme inputs
when the extension asks, and lays the panel's edits over them before it builds
the theme. The panel starts from the site's real values, and everything that
derives from the theme follows: scoped areas (`ThemeStyleBlock`,
`ThemeModifier`, semantic surfaces), computed colours and the colour mode. The
two sides talk through DOM events on `window`
(`src/theme/theme-devtools-protocol.ts`). An app that no tool is attached to
sends nothing.

**CSS variables only.** On a site built with an earlier library version, the
panel computes the theme itself and writes the `--squonk-*` variables that
differ from the default theme onto the page root. That has limits: the panel
starts from the library defaults rather than the site's values, and areas that
set their own variables (scoped themes, inverted surfaces) do not follow.

Edits are kept per site, in the extension's own storage, and are applied while
the panel is open on that tab. Closing the panel, or switching to another tab,
puts the page back as its site built it. Nothing is sent anywhere: the
extension has no network access of its own, and the only thing it adds to a
page besides variables is a Google Fonts stylesheet when you pick one of those
fonts (a site's content security policy may refuse it).

## Layout

- `src/content.ts`: runs in every page, idle until the panel connects.
- `src/panel/session.ts`: the panel's link to the active tab; turns the
  panel's edits into the message the page gets.
- `src/panel/shims/`: stand-ins for the Storybook modules the theme panel
  imports, so `.storybook/addons/theme-controller/panel.tsx` runs here
  unchanged. A change to that panel shows up in the extension on its next build.

## Packaging

```bash
npm run package -w @squonkstack/ui-devtools
```

builds the extension and zips it into `packages/ui-devtools/package/`. CI runs
this in the `build_devtools_extension` job and keeps the zip as a job artifact.
The documentation image (`storybook-hosting/Dockerfile`) runs it too and serves
the result at `/downloads/`; after a release that copy carries the library's
version number instead of the one in `public/manifest.json`.

## Checks

```bash
npm run typecheck -w @squonkstack/ui-devtools
npm test -w @squonkstack/ui-devtools
npm run test:e2e -w @squonkstack/ui-devtools
```

The end-to-end test loads the built extension into Playwright's Chromium
(`npx playwright install chromium`) and themes two fixture pages, one through
each route. It opens the panel as an ordinary tab, so the side panel's own
tab-following is not covered by it.
