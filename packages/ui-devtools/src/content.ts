/*
 * Runs in every page. Idle until the side panel connects; then it relays
 * between the panel and the page's root SquonkThemeProvider (DOM events, see
 * src/theme/theme-devtools-protocol.ts), writes the panel's stylesheet, and
 * reports which theme tokens the page uses. Everything it added is removed
 * when the panel goes away.
 */
import { THEME_DEVTOOLS_EVENTS as EVENTS } from "@theme/theme-devtools-protocol";
import { rescanTokenUse, watchTokenUse, type TokenUse } from "@controller/token-usage";
import { PORT_NAME, type PageMessage, type PanelMessage } from "./protocol";

const STYLE_ID = "squonk-theme-devtools-style";
const FONT_ATTR = "data-squonk-theme-devtools-font";
const BACKGROUND_VAR = "--squonk-colors-background-default";

const send = (name: string, detail?: string) => window.dispatchEvent(new CustomEvent(name, { detail }));

function setStyle(css: string) {
  let style = document.getElementById(STYLE_ID);
  if (!css) {
    style?.remove();
    return;
  }
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    // After <head> and <body>, so it follows the provider's own :root rule.
    document.documentElement.appendChild(style);
  }
  if (style.textContent !== css) style.textContent = css;
}

function setFonts(urls: string[]) {
  const wanted = new Set(urls.filter((url) => url.startsWith("https://fonts.googleapis.com/")));
  for (const link of document.querySelectorAll<HTMLLinkElement>(`link[${FONT_ATTR}]`)) {
    if (wanted.has(link.href)) wanted.delete(link.href);
    else link.remove();
  }
  for (const url of wanted) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.setAttribute(FONT_ATTR, "");
    document.head.appendChild(link);
  }
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== PORT_NAME) return;
  let open = true;
  const post = (message: PageMessage) => {
    if (!open) return;
    try {
      port.postMessage(message);
    } catch {
      // The panel closed between the check and the send.
    }
  };

  const onState = (event: Event) => {
    const detail = (event as CustomEvent<unknown>).detail;
    if (typeof detail === "string") post({ type: "site", state: detail });
  };
  // A provider that mounts after the panel connected announces itself.
  const onReady = () => send(EVENTS.request);
  window.addEventListener(EVENTS.state, onState);
  window.addEventListener(EVENTS.ready, onReady);

  const background = getComputedStyle(document.documentElement).getPropertyValue(BACKGROUND_VAR).trim();
  post({ type: "hello", origin: location.origin, detected: background !== "", background });
  send(EVENTS.request);

  const reportTokens = (uses: TokenUse[]) => post({ type: "tokens", uses });
  const stopWatching = watchTokenUse(reportTokens);

  port.onMessage.addListener((message: PanelMessage) => {
    if (message.type === "scan") rescanTokenUse(reportTokens);
    else if (message.type === "apply") {
      send(EVENTS.set, message.override);
      setStyle(message.css);
      setFonts(message.fonts);
    }
  });

  port.onDisconnect.addListener(() => {
    open = false;
    stopWatching();
    window.removeEventListener(EVENTS.state, onState);
    window.removeEventListener(EVENTS.ready, onReady);
    send(EVENTS.set, "null");
    setStyle("");
    setFonts([]);
  });
});
