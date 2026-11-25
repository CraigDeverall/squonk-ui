/**
 * Keeps a reader signed in when the published site sits behind a sign-in
 * proxy, such as an SSO or basic-auth gateway.
 *
 * The proxy signs a reader in with a cookie that expires. After that, every
 * request to the site redirects to the sign-in page, so the next story or
 * docs page Storybook loads in the background fails, and only a full reload
 * gets the reader back to the sign-in. This watches for the expiry and sends
 * the whole window through the sign-in as soon as it happens, instead of
 * waiting for a page to break.
 *
 * A sign-in can return to the path but drop the query string, which is
 * where Storybook keeps the current page (`?path=/docs/…`), so the address is
 * kept in sessionStorage under `squonk-pages-return-to`. manager-head.html puts
 * it back when the reader returns, before Storybook reads the URL.
 *
 * Only runs on the published site (HTTPS, not localhost).
 */

const RETURN_KEY = "squonk-pages-return-to";
const LAST_REDIRECT_KEY = "squonk-pages-last-redirect";
/** How often an open, visible tab checks the session. */
const CHECK_EVERY_MS = 60_000;
/** Never send the reader to the sign-in twice within this window: a guard against a loop. */
const REDIRECT_COOLDOWN_MS = 30_000;

const isPublishedSite = (win: Window) =>
  win.location.protocol === "https:" && !/^(localhost|127\.|\[::1\])/.test(win.location.hostname);

const storage = (win: Window): Storage | undefined => {
  try {
    return win.sessionStorage;
  } catch {
    return undefined;
  }
};

/**
 * Whether the Pages session has expired. A HEAD request skips the service
 * worker (it only handles GET), and `redirect: "manual"` shows the sign-in
 * redirect as an opaque redirect rather than following it to the login page.
 * Offline or any other failure counts as signed in: only a sign-in redirect
 * or a refusal sends the reader away.
 */
export async function pagesSessionExpired(win: Window = window): Promise<boolean> {
  try {
    const probe = new URL("favicon.svg", win.location.href);
    probe.searchParams.set("session-check", String(Date.now()));
    const response = await win.fetch(probe, {
      method: "HEAD",
      cache: "no-store",
      credentials: "same-origin",
      redirect: "manual",
    });
    return response.type === "opaqueredirect" || response.status === 401 || response.status === 403;
  } catch {
    return false;
  }
}

/** Send the top window through the Pages sign-in, remembering where the reader was. */
export function redirectToSignIn(win: Window = window) {
  const top = win.top ?? win;
  const store = storage(top);
  const last = Number(store?.getItem(LAST_REDIRECT_KEY) ?? 0);
  if (Date.now() - last < REDIRECT_COOLDOWN_MS) return;
  store?.setItem(LAST_REDIRECT_KEY, String(Date.now()));
  store?.setItem(RETURN_KEY, top.location.href);
  top.location.reload();
}

/**
 * Watch the session from the manager (the top window): check when the tab
 * comes back into view or regains focus, and every minute while it is shown.
 * Returns a function that stops watching.
 */
export function watchPagesSession(win: Window = window): () => void {
  if (!isPublishedSite(win)) return () => {};

  let checking = false;
  const check = async () => {
    if (checking || win.document.visibilityState !== "visible") return;
    checking = true;
    try {
      if (await pagesSessionExpired(win)) redirectToSignIn(win);
    } finally {
      checking = false;
    }
  };

  const onVisibility = () => void check();
  win.document.addEventListener("visibilitychange", onVisibility);
  win.addEventListener("focus", onVisibility);
  const timer = win.setInterval(onVisibility, CHECK_EVERY_MS);
  void check();

  return () => {
    win.document.removeEventListener("visibilitychange", onVisibility);
    win.removeEventListener("focus", onVisibility);
    win.clearInterval(timer);
  };
}

/**
 * The safety net in the preview iframe: when a story's code fails to load,
 * check whether the session expired and, if so, sign in again rather than
 * leave the reader looking at an error.
 */
export function recoverFromExpiredSession(win: Window = window): () => void {
  if (!isPublishedSite(win)) return () => {};
  const onFailure = async () => {
    if (await pagesSessionExpired(win)) redirectToSignIn(win);
  };
  const onRejection = (event: PromiseRejectionEvent) => {
    const message = String((event.reason as Error | undefined)?.message ?? event.reason ?? "");
    if (/dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(message)) void onFailure();
  };
  // Vite announces a failed preload of a lazily loaded chunk with this event.
  win.addEventListener("vite:preloadError", onFailure);
  win.addEventListener("unhandledrejection", onRejection);
  return () => {
    win.removeEventListener("vite:preloadError", onFailure);
    win.removeEventListener("unhandledrejection", onRejection);
  };
}
