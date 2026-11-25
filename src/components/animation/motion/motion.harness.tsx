import React from "react";
import { Button as AriaButton, Dialog, DialogTrigger, Popover } from "react-aria-components";
import type { MotionLevel } from "../../../theme/motion-level";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { Motion } from "./motion";

/** A React Aria button whose own class is a render function, wrapped in Feedback (tests can't pass functions to the browser). */
export function FunctionClassHarness() {
  return (
    <Motion.Feedback>
      <AriaButton className={({ isHovered }) => (isHovered ? "own-hovered" : "own-function")}>B</AriaButton>
    </Motion.Feedback>
  );
}

/** Presence around a notice, with a button that toggles it. */
export function PresenceHarness() {
  const [show, setShow] = React.useState(true);
  const [exited, setExited] = React.useState(0);
  return (
    <div>
      <AriaButton onPress={() => setShow((s) => !s)}>Toggle</AriaButton>
      <output aria-label="Exited">{exited}</output>
      <Motion.Presence show={show} onExited={() => setExited((n) => n + 1)}>
        <Motion.Highlight watch={show}>
          <div role="status" className="own">Saved</div>
        </Motion.Highlight>
      </Motion.Presence>
    </div>
  );
}

/** Swap around content that changes with a button. */
export function SwapHarness() {
  const [n, setN] = React.useState(0);
  return (
    <div>
      <AriaButton onPress={() => setN((v) => v + 1)}>Next</AriaButton>
      <Motion.Swap watch={n}>
        <p aria-label="Content">Step {n}</p>
      </Motion.Swap>
    </div>
  );
}

/** A list under Layout, with a button that reverses it. */
export function LayoutHarness() {
  const [items, setItems] = React.useState(["A", "B", "C"]);
  return (
    <div>
      <AriaButton onPress={() => setItems((list) => [...list].reverse())}>Reverse</AriaButton>
      <AriaButton onPress={() => setItems((list) => [...list, `N${list.length}`])}>Add</AriaButton>
      <Motion.Layout>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {items.map((item) => <li key={item} style={{ height: 32 }}>{item}</li>)}
        </ul>
      </Motion.Layout>
    </div>
  );
}

/** A counting figure, with a button that raises it. */
export function CountHarness() {
  const [value, setValue] = React.useState(1000);
  return (
    <div>
      <AriaButton onPress={() => setValue(5000)}>Raise</AriaButton>
      <p aria-label="Figure"><Motion.Count value={value} formatOptions={{ style: "currency", currency: "NZD" }} /></p>
    </div>
  );
}

/** A popover under a provider with the given motion level. */
export function LevelHarness({ level }: { level: MotionLevel }) {
  return (
    <SquonkThemeProvider motion={level}>
      <DialogTrigger>
        <AriaButton>Open</AriaButton>
        <Motion.Pop>
          <Popover data-testid="popover"><Dialog aria-label="Details">Details</Dialog></Popover>
        </Motion.Pop>
      </DialogTrigger>
    </SquonkThemeProvider>
  );
}
