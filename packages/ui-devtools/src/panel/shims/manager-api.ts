/*
 * Stands in for `storybook/manager-api` (aliased in vite.config.ts), so the
 * Storybook theme panel runs here unchanged: it emits its edits on a channel,
 * and ../session.ts listens on the same one and forwards them to the page.
 */
type Listener = (payload: never) => void;

class Channel {
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, listener: Listener) {
    let set = this.listeners.get(event);
    if (!set) this.listeners.set(event, (set = new Set()));
    set.add(listener);
  }

  off(event: string, listener: Listener) {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: string, payload?: unknown) {
    for (const listener of Array.from(this.listeners.get(event) ?? [])) {
      (listener as (payload: unknown) => void)(payload);
    }
  }
}

export const channel = new Channel();

export const addons = { getChannel: () => channel };
