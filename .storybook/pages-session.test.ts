import { describe, expect, it, vi } from "vitest";
import { pagesSessionExpired, redirectToSignIn, watchPagesSession } from "./pages-session";

function fakeWindow({ href = "https://ui.squonkstack.io/?path=/docs/button", response }: { href?: string; response?: Partial<Response> | Error } = {}) {
  const store = new Map<string, string>();
  const win = {
    location: { href, protocol: new URL(href).protocol, hostname: new URL(href).hostname, reload: vi.fn() },
    sessionStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    },
    fetch: vi.fn(async () => {
      if (response instanceof Error) throw response;
      return { type: "basic", status: 200, ...response };
    }),
    document: { visibilityState: "visible", addEventListener: vi.fn(), removeEventListener: vi.fn() },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    setInterval: vi.fn(() => 1),
    clearInterval: vi.fn(),
  } as unknown as Window & { location: { reload: ReturnType<typeof vi.fn> } };
  (win as { top: Window }).top = win;
  return { win, store };
}

describe("pagesSessionExpired", () => {
  it("is false while the site answers", async () => {
    expect(await pagesSessionExpired(fakeWindow().win)).toBe(false);
  });

  it("is true when the site redirects to the sign-in", async () => {
    expect(await pagesSessionExpired(fakeWindow({ response: { type: "opaqueredirect", status: 0 } }).win)).toBe(true);
  });

  it("is true when the site refuses the request", async () => {
    expect(await pagesSessionExpired(fakeWindow({ response: { status: 401 } }).win)).toBe(true);
  });

  it("is false offline, so a dropped connection never sends the reader away", async () => {
    expect(await pagesSessionExpired(fakeWindow({ response: new TypeError("Failed to fetch") }).win)).toBe(false);
  });

  it("asks without following redirects or using a cached answer", async () => {
    const { win } = fakeWindow();
    await pagesSessionExpired(win);
    expect(win.fetch).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ method: "HEAD", redirect: "manual", cache: "no-store" }));
  });
});

describe("redirectToSignIn", () => {
  it("remembers the page, including its query, and reloads the window", () => {
    const { win, store } = fakeWindow();
    redirectToSignIn(win);
    expect(store.get("squonk-pages-return-to")).toBe("https://ui.squonkstack.io/?path=/docs/button");
    expect(win.location.reload).toHaveBeenCalledOnce();
  });

  it("doesn't loop: a second redirect straight after the first is ignored", () => {
    const { win } = fakeWindow();
    redirectToSignIn(win);
    redirectToSignIn(win);
    expect(win.location.reload).toHaveBeenCalledOnce();
  });
});

describe("watchPagesSession", () => {
  it("does nothing in local Storybook", () => {
    const { win } = fakeWindow({ href: "http://localhost:6006/?path=/docs/button" });
    watchPagesSession(win);
    expect(win.fetch).not.toHaveBeenCalled();
    expect(win.setInterval).not.toHaveBeenCalled();
  });

  it("checks straight away on the published site, and redirects once expired", async () => {
    const { win } = fakeWindow({ response: { type: "opaqueredirect", status: 0 } });
    const stop = watchPagesSession(win);
    await vi.waitFor(() => expect(win.location.reload).toHaveBeenCalledOnce());
    stop();
    expect(win.clearInterval).toHaveBeenCalled();
  });
});
