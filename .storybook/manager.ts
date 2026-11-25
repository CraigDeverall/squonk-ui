import { addons } from "storybook/manager-api";
import packageJSON from "../package.json" with {type: "json"};
import favicon from "../public/favicon.svg";
import { primitives } from "../src/theme/theme";
import { darkManagerTheme, lightManagerTheme } from "./theme";
import { modeStore, bindChannel } from "./addons/theme-controller/mode-store";
import { renderSidebarToggleInto, disposeSidebarToggles } from "./addons/theme-controller/sidebar-toggle";
import { mountThemeDock, unmountThemeDock } from "./addons/theme-controller/theme-dock";
import { watchPagesSession } from "./pages-session";
// Use Storybook 10 native navigation; the removed experimental sidebar slot
// cannot safely host the previous replacement tree.

const SQUONK_BRAND = "#ef4237";

/** The library's GitHub repository, from package.json `repository.url`. */
const REPOSITORY_URL = packageJSON.repository.url.replace(/^git\+/, "").replace(/\.git$/, "");

/** GitHub's mark (Simple Icons, CC0), coloured by `currentColor`. */
const GITHUB_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`;

/**
 * Build the manager-side CSS vars block from primitives so the chrome
 * (sidebar buttons, Theme Controller panel, version chip) stays in
 * lockstep with whatever's in src/theme/theme.ts.
 */
function buildManagerCss(): string {
  const light = primitives.colors;
  const dark = primitives.darkColors;
  // Defined on <html> (not <body>) so the iframe's own scrollbar
  // pseudo-elements — which live on html — can resolve these vars.
  return `
    :root {
      --sb-accent: ${SQUONK_BRAND};
    }
    html[data-mode="light"] {
      --sb-bg:            ${light.backgroundDefault};
      --sb-bg-raised:     ${light.backgroundSurface};
      --sb-bg-input:      ${light.backgroundDefault};
      --sb-fg:            ${light.textPrimary};
      --sb-fg-dim:        ${light.textMuted};
      --sb-border:        ${light.borderDefault};
      --sb-border-strong: ${light.borderStrong};
      /* Light: dock sits flush with surround; soft dark shadow lifts it.
         Cards inside the dock are subtly darker than the dock surface. */
      --sb-dock-bg:       ${light.backgroundDefault};
      --sb-dock-shadow:   -8px 0 24px rgba(0, 0, 0, 0.18);
      --sb-card-bg:       ${light.backgroundSurface};
    }
    html[data-mode="dark"] {
      --sb-bg:            ${dark.backgroundDefault};
      --sb-bg-raised:     ${dark.backgroundSurface};
      --sb-bg-input:      ${dark.backgroundSubtle};
      --sb-fg:            ${dark.textPrimary};
      --sb-fg-dim:        ${dark.textMuted};
      --sb-border:        ${dark.borderDefault};
      --sb-border-strong: ${dark.borderStrong};
      /* Dark: dock surface is lighter than surround (elevation by tone),
         backed by a heavier shadow that's visible against the darker
         chrome on either side. Cards step up one more level so they
         sit above the dock surface. */
      --sb-dock-bg:       ${dark.backgroundSurface};
      --sb-dock-shadow:   -8px 0 28px rgba(0, 0, 0, 0.55);
      --sb-card-bg:       ${dark.backgroundSubtle};
    }
    /* Storybook paints the dark-mode selection as a light grey with white
       text. Keep the light highlight and use dark text instead. */
    html[data-mode="dark"] #storybook-explorer-tree [data-selected="true"],
    html[data-mode="dark"] #storybook-explorer-tree [data-selected="true"] svg {
      color: ${dark.textInverse} !important;
    }
  `;
}

const faviconLink = document.createElement("link");
faviconLink.setAttribute("rel", "shortcut icon");
faviconLink.setAttribute("href", favicon);
document.head.appendChild(faviconLink);

const fontsPreconnectGoogle = document.createElement("link");
fontsPreconnectGoogle.setAttribute("rel", "preconnect");
fontsPreconnectGoogle.setAttribute("href", "https://fonts.googleapis.com");
document.head.appendChild(fontsPreconnectGoogle);

const fontsPreconnectGstatic = document.createElement("link");
fontsPreconnectGstatic.setAttribute("rel", "preconnect");
fontsPreconnectGstatic.setAttribute("href", "https://fonts.gstatic.com");
fontsPreconnectGstatic.setAttribute("crossorigin", "");
document.head.appendChild(fontsPreconnectGstatic);

const fontsLink = document.createElement("link");
fontsLink.setAttribute("rel", "stylesheet");
fontsLink.setAttribute(
  "href",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
);
document.head.appendChild(fontsLink);

const style = document.createElement("style");
style.innerHTML = `
  ${buildManagerCss()}

  body {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif!important;
  }

  /* ---- Non-resizable sidebar with a min width ----
     Storybook 8 applies the sidebar width as an inline
     grid-template-columns on a styled-component parent of
     .sidebar-container. We apply a min-width to the inner container,
     and the inner intrinsic size propagates back to the grid track —
     so the sidebar can never go narrower than this, but Storybook's
     own default/persisted width is otherwise left alone. The drag
     handles themselves are hidden via JS in ensureNoResizeHandles()
     (they're emotion-styled with hashed classes, so CSS-only
     selectors aren't reliable). */
  :root {
    --sb-sidebar-min-width: 288px;
  }
  .sidebar-container {
    min-width: var(--sb-sidebar-min-width)!important;
    border-right: 1px solid var(--sb-border-strong);
  }

  .sidebar-subheading {
    font-weight: 600!important;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    font-size: 0.72rem;
  }

  .sidebar-item svg {
    color: var(--sb-fg)!important;
  }

  .search-field code,
  .search-field code span {
    color: var(--sb-fg)!important;
  }

  .search-result-item svg {
    color: var(--sb-fg)!important;
  }

  .sbdocs-wrapper {
    padding: 30px 20px!important;
  }

  /* The custom-sidebar addon forces .sidebar-header to flex-column
     (so the injected nav stacks beneath Storybook's own header chrome).
     We piggy-back on that by wrapping our version chip + light/dark
     toggle in a single row container, which sits beneath the logo
     as its own column-flex child. */
  .sidebar-header > a,
  .sidebar-header > a > img {
    display: block;
    max-width: 100%;
  }
  /* The logo never shrinks: the header wraps instead, and the version,
     repo and mode row drops to its own line when the sidebar is too narrow
     for everything on one. */
  .sidebar-header {
    flex-wrap: wrap;
    row-gap: 4px;
  }

  /* The sidebar's top (logo, settings, version, repo and mode) stays in
     view as the menu scrolls: a frosted strip in the sidebar's colour, with
     a hairline and soft shadow that fade in only once the menu has scrolled
     under it. Its unstyled wrapper steps aside (display: contents) so the
     header sticks against the whole menu, not just its first few items. */
  #storybook-sidebar-region div:has(> .sidebar-header) {
    display: contents;
  }
  /* Scoped by id to outweigh Storybook's own header class. */
  #storybook-sidebar-region .sidebar-header {
    position: sticky;
    top: 0;
    z-index: 3;
    margin-inline: calc(-1 * var(--squonk-sidebar-gutter, 12px));
    padding: 14px var(--squonk-sidebar-gutter, 12px) 8px;
    background: color-mix(in srgb, var(--sb-bg) 86%, transparent);
    -webkit-backdrop-filter: saturate(1.4) blur(12px);
    backdrop-filter: saturate(1.4) blur(12px);
    box-shadow: 0 1px 0 transparent, 0 8px 16px -12px transparent;
  }
  @supports (animation-timeline: scroll()) {
    #storybook-sidebar-region .sidebar-header {
      animation: squonk-sidebar-header-lift linear both;
      animation-timeline: scroll(nearest block);
      animation-range: 0 48px;
    }
  }
  @keyframes squonk-sidebar-header-lift {
    to {
      box-shadow:
        0 1px 0 var(--sb-border),
        0 8px 16px -12px rgb(0 0 0 / 0.35);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    #storybook-sidebar-region .sidebar-header { animation: none; box-shadow: 0 1px 0 var(--sb-border); }
  }
  .sidebar-header > div:has(> a > img) {
    flex: 1 0 auto;
  }
  .sidebar-header > div:has(> a > img) img {
    flex: none;
    width: 128px;
    max-width: none;
    height: auto;
  }
  .sidebar-header > .squonk-meta-row {
    min-width: 0;
    max-width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    padding-bottom: 6px;
  }
  .squonk-meta-row > [data-squonk-mode-toggle] {
    display: inline-flex;
    align-items: center;
  }
  /* A bare icon, like Storybook's settings gear. */
  .squonk-repo-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 24px;
    height: 24px;
    border-radius: 9999px;
    color: var(--sb-fg);
    transition: color 160ms ease;
  }
  .squonk-repo-link:hover {
    color: var(--sb-accent);
  }
  .squonk-repo-link:focus-visible {
    outline: 2px solid var(--sb-accent);
    outline-offset: 2px;
  }

  .squonk-button {
    background: transparent;
    border: 1px solid var(--sb-border-strong);
    padding: 4px 12px;
    border-radius: 9999px;
    text-decoration: none;
    color: var(--sb-fg);
    font-size: 0.8rem;
    font-weight: 500;
    transition: background 160ms ease, color 160ms ease, border-color 160ms ease;
  }

  .squonk-button:hover {
    background: var(--sb-accent);
    border-color: var(--sb-accent);
    color: #1f1f1f;
    cursor: pointer;
  }

  .squonk-version-chip {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 2px 10px;
    border-radius: 9999px;
    background: var(--sb-bg-raised);
    color: var(--sb-fg-dim);
    font-family: ui-monospace, Menlo, Monaco, "Roboto Mono", monospace;
    font-size: 0.7rem;
    letter-spacing: 0.02em;
    border: 1px solid var(--sb-border);
  }

  /* Mode-aware scrollbars across the manager chrome + dock. Track is
     fully transparent in both modes; the thumb uses a transparent
     border + background-clip: padding-box for inset shape so nothing
     paints behind it (avoids the "grey gradient" look when the
     scrolled content's background and the manager bg differ). */
  html, body, * {
    scrollbar-width: thin;
    scrollbar-color: var(--sb-fg-dim) transparent;
  }
  html::-webkit-scrollbar,
  body::-webkit-scrollbar,
  *::-webkit-scrollbar {
    width: 12px;
    height: 12px;
    background: transparent;
  }
  html::-webkit-scrollbar-track,
  body::-webkit-scrollbar-track,
  *::-webkit-scrollbar-track {
    background: transparent;
  }
  html::-webkit-scrollbar-thumb,
  body::-webkit-scrollbar-thumb,
  *::-webkit-scrollbar-thumb {
    background: var(--sb-fg-dim);
    background-clip: padding-box;
    border: 3px solid transparent;
    border-radius: 9999px;
  }
  html::-webkit-scrollbar-thumb:hover,
  body::-webkit-scrollbar-thumb:hover,
  *::-webkit-scrollbar-thumb:hover {
    background: var(--sb-fg);
    background-clip: padding-box;
  }
  html::-webkit-scrollbar-corner,
  body::-webkit-scrollbar-corner,
  *::-webkit-scrollbar-corner {
    background: transparent;
  }
`;
document.head.appendChild(style);

function applyMode(mode: "light" | "dark") {
  document.documentElement.dataset.mode = mode;
  document.body.dataset.mode = mode;
  addons.setConfig({
    theme: mode === "dark" ? darkManagerTheme : lightManagerTheme,
  });
}

// Initial config + body attribute
applyMode(modeStore.get());
const unsubscribeMode = modeStore.subscribe(applyMode);

// Hook into the Storybook channel so manager + preview stay in sync.
const unbindModeChannel = bindChannel(addons.getChannel());

/**
 * Sidebar header chrome: the version chip and the light/dark toggle
 * sit side-by-side in a `.squonk-meta-row` wrapper beneath the brand
 * logo. The custom-sidebar addon forces `.sidebar-header` to flex
 * column, so we use a single child wrapper to keep the chip + toggle
 * on the same visual row, both left-aligned. Storybook re-renders the
 * sidebar header occasionally and drops non-default children, so this
 * MutationObserver re-runs to recreate / re-parent them.
 */
function ensureSidebarHeaderChrome() {
  const header = document.querySelector<HTMLElement>(".sidebar-header");
  if (!header) return;

  // Row wrapper — single column-flex child of the header.
  let row = header.querySelector<HTMLElement>(":scope > .squonk-meta-row");
  if (!row) {
    row = document.createElement("div");
    row.className = "squonk-meta-row";
    header.appendChild(row);
  }

  // Version chip — first inside the row (left).
  let chip = row.querySelector<HTMLElement>(":scope > .squonk-version-chip");
  if (!chip) {
    chip = document.createElement("span");
    chip.className = "squonk-version-chip";
    chip.textContent = `v${packageJSON.version}`;
    row.appendChild(chip);
  } else if (chip.parentElement !== row) {
    row.appendChild(chip);
  }

  // Repository link — between the chip and the toggle.
  let repoLink = row.querySelector<HTMLAnchorElement>(":scope > .squonk-repo-link");
  if (!repoLink) {
    repoLink = document.createElement("a");
    repoLink.className = "squonk-repo-link";
    repoLink.href = REPOSITORY_URL;
    repoLink.target = "_blank";
    repoLink.rel = "noopener noreferrer";
    repoLink.title = "Source on GitHub";
    repoLink.setAttribute("aria-label", "Source on GitHub (opens in a new tab)");
    repoLink.innerHTML = GITHUB_ICON;
  }
  if (chip.nextElementSibling !== repoLink) chip.after(repoLink);

  // Toggle — last inside the row (right of the repository link).
  let toggleSlot = row.querySelector<HTMLElement>(
    ":scope > [data-squonk-mode-toggle]"
  );
  if (!toggleSlot) {
    toggleSlot = document.createElement("span");
    toggleSlot.setAttribute("data-squonk-mode-toggle", "");
    row.appendChild(toggleSlot);
  } else if (toggleSlot.parentElement !== row) {
    row.appendChild(toggleSlot);
  }
  renderSidebarToggleInto(toggleSlot);
}

ensureSidebarHeaderChrome();

/**
 * Hide Storybook's resize handles. The sidebar and addons-panel wrappers
 * each render a styled-component drag handle immediately before their
 * content root (`.sidebar-container` and `#storybook-panel-root`
 * respectively) — i.e. it's the previousElementSibling of each. The
 * handle is an absolute-positioned div with a hashed class name, so
 * CSS selectors can't reliably target it; hiding via inline display
 * also avoids a stylesheet specificity war with the styled-component
 * classes.
 */
function ensureNoResizeHandles() {
  for (const selector of [".sidebar-container", "#storybook-panel-root"]) {
    const content = document.querySelector<HTMLElement>(selector);
    const handle = content?.previousElementSibling;
    if (handle instanceof HTMLElement) handle.style.display = "none";
  }
}

ensureNoResizeHandles();

const managerChromeObserver = new MutationObserver(() => {
  ensureSidebarHeaderChrome();
  ensureNoResizeHandles();
});
managerChromeObserver.observe(document.body, { childList: true, subtree: true });

mountThemeDock();

// On the private Pages site, go back through the sign-in as soon as it expires.
const stopWatchingSession = watchPagesSession();

// Storybook hard-codes "Storybook" as the tab-title suffix ("Button ⋅ Storybook")
// and offers no setting for it, so rename it whenever the title changes.
function brandDocumentTitle() {
  const branded = document.title.replace(/Storybook$/, "SquonkUI");
  if (branded !== document.title) document.title = branded;
}
const titleObserver = new MutationObserver(brandDocumentTitle);
titleObserver.observe(document.head, { childList: true, subtree: true, characterData: true });
brandDocumentTitle();

if (import.meta.hot) import.meta.hot.dispose(() => {
  unsubscribeMode();
  unbindModeChannel();
  managerChromeObserver.disconnect();
  titleObserver.disconnect();
  disposeSidebarToggles();
  unmountThemeDock();
  stopWatchingSession();
  for (const node of [style, faviconLink, fontsLink, fontsPreconnectGoogle, fontsPreconnectGstatic]) node.remove();
});
