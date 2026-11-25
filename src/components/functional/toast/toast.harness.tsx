import React from "react";
import { useToast } from "./toast";

/**
 * CT-only trigger buttons. Playwright component tests can't mount components
 * declared inside the test file itself, so the harness lives here.
 */
export function ToastTestHarness() {
  const toast = useToast();
  return (
    <div style={{ height: "400px" }}>
      <button
        type="button"
        onClick={() => toast.success("Invite sent.", "Done")}
      >
        fire success
      </button>
      <button type="button" onClick={() => toast.error("Save failed.")}>
        fire error
      </button>
    </div>
  );
}

export function ToastQueueHarness() {
  const toast = useToast();
  return <button type="button" onClick={() => {
    toast.show({ message: "First queued toast" });
    toast.show({ message: "Second queued toast" });
    toast.show({ message: "Overflow toast" });
  }}>Queue burst</button>;
}

/** Fires a sticky toast with an "Undo" action and shows how often it ran. */
export function ToastActionHarness() {
  const toast = useToast();
  const [undone, setUndone] = React.useState(0);
  return (
    <div style={{ height: "400px" }}>
      <button
        type="button"
        onClick={() => toast.show({
          message: "Case archived.",
          duration: 0,
          action: { label: "Undo", onAction: () => setUndone((n) => n + 1) },
        })}
      >
        fire action
      </button>
      <output>undone {undone}</output>
    </div>
  );
}
