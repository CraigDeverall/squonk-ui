import React from "react";
import { Modal } from "./modal";

export function NestedModalHarness() {
  const [outer, setOuter] = React.useState(false);
  const [inner, setInner] = React.useState(false);
  return <>
    <button onClick={() => setOuter(true)}>Open outer</button>
    <Modal open={outer} title="Outer" onClose={() => setOuter(false)}>
      <button onClick={() => setInner(true)}>Open inner</button>
    </Modal>
    <Modal open={inner} title="Inner" onClose={() => setInner(false)}>
      <button onClick={() => setOuter(false)}>Close outer first</button>
      <button onClick={() => setInner(false)}>Finish inner</button>
    </Modal>
  </>;
}
