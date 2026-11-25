import React from "react";
import { UserIcon } from "../../functional-primitive/icon/icon";
import {
  NetworkGraph,
  NetworkGraphLegend,
  type NetworkGraphHiddenKinds,
  type NetworkGraphLink,
  type NetworkGraphLinkKinds,
  type NetworkGraphNode,
  type NetworkGraphNodeKinds,
} from "./network-graph";

const nodeKinds: NetworkGraphNodeKinds = {
  company: { label: "Chapter" },
  person: { label: "Member", shape: "square" },
  trust: { label: "Household", shape: "diamond", tone: "success" },
};

const linkKinds: NetworkGraphLinkKinds = {
  owns: { label: "Funds" },
  directs: { label: "Leads", variant: "dashed" },
};

const nodes: NetworkGraphNode[] = [
  { id: "waikato", label: "Waikato Chapter", kind: "company" },
  { id: "hollow", label: "Hemlock Hollow Chapter", kind: "company" },
  { id: "avery", label: "Avery Chen", kind: "person" },
  { id: "priya", label: "Priya Singh", kind: "person" },
  { id: "trust", label: "Chen Household", kind: "trust" },
  {
    id: "old",
    label: "Waikato Watchers (1998) Group, formerly Waikato and Coastal Watchers",
    kind: "company",
    variant: "dashed",
    description: "Closed chapter",
  },
];

const links: NetworkGraphLink[] = [
  { source: "trust", target: "waikato", kind: "owns", label: "Funds 60%" },
  { source: "avery", target: "trust", kind: "directs" },
  { source: "waikato", target: "hollow", kind: "owns" },
  { source: "priya", target: "hollow", kind: "directs" },
  { source: "waikato", target: "old", kind: "owns", variant: "dashed" },
];

const frame: React.CSSProperties = { width: 640, height: 420 };

/** A graph of a fixed size, so its drawing and hit targets are the same on every run. */
export function GraphHarness(props: Partial<React.ComponentProps<typeof NetworkGraph>>) {
  return (
    <div style={frame}>
      <NetworkGraph
        label="Chapter links in the Waikato region"
        nodes={nodes}
        links={links}
        nodeKinds={nodeKinds}
        linkKinds={linkKinds}
        {...props}
      />
    </div>
  );
}

/**
 * A search that narrows the graph, with autoFit and settleOnChange on. With
 * `fullscreen`, the graph offers full screen and keeps a search field over it.
 * The Narrow button sits outside the graph, so full screen covers it.
 */
export function FitHarness({ fullscreen = false }: { fullscreen?: boolean }) {
  const [narrow, setNarrow] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const shown = narrow ? nodes.filter((node) => node.id === "waikato" || node.id === "hollow") : nodes;
  return (
    <div>
      <button type="button" onClick={() => setNarrow((on) => !on)}>
        Narrow
      </button>
      <div style={frame}>
        <NetworkGraph
          label="Chapter links in the Waikato region"
          nodes={shown}
          links={links}
          nodeKinds={nodeKinds}
          linkKinds={linkKinds}
          autoFit
          settleOnChange
          maxFitZoom={2}
          allowFullscreen={fullscreen}
          selectedId={selectedId}
          onSelectionChange={setSelectedId}
          fullscreenToolbar={fullscreen ? <input aria-label="Search the graph" /> : undefined}
          fullscreenAside={fullscreen && selectedId ? <p style={{ width: 300 }}>Details of {selectedId}</p> : null}
        />
      </div>
    </div>
  );
}

/** People drawn with a person icon, on the graph and in the legend. */
export function IconHarness() {
  const kinds: NetworkGraphNodeKinds = { ...nodeKinds, person: { label: "Member", icon: <UserIcon /> } };
  return (
    <div>
      <NetworkGraphLegend nodeKinds={kinds} linkKinds={linkKinds} />
      <div style={frame}>
        <NetworkGraph label="Chapter links in the Waikato region" nodes={nodes} links={links} nodeKinds={kinds} linkKinds={linkKinds} />
      </div>
    </div>
  );
}

/** The legend over the same kinds, as a plain key or with the given hidden kinds. */
export function KeyHarness({ hiddenKinds }: { hiddenKinds?: NetworkGraphHiddenKinds }) {
  return <NetworkGraphLegend nodeKinds={nodeKinds} linkKinds={linkKinds} hiddenKinds={hiddenKinds} />;
}

/** A graph that reports its selection, held by the graph itself or by the parent. */
export function SelectionHarness({ controlled = false }: { controlled?: boolean }) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [calls, setCalls] = React.useState<string[]>([]);
  return (
    <div>
      <output aria-label="Selection changes">{calls.join(" ")}</output>
      <GraphHarness
        selectedId={controlled ? selectedId : undefined}
        onSelectionChange={(id) => {
          setSelectedId(id);
          setCalls((previous) => [...previous, id ?? "none"]);
        }}
      />
    </div>
  );
}

/** A graph and its legend sharing the hidden kinds. */
export function LegendHarness() {
  const [hiddenKinds, setHiddenKinds] = React.useState<NetworkGraphHiddenKinds>({});
  return (
    <div>
      <NetworkGraphLegend
        nodeKinds={nodeKinds}
        linkKinds={linkKinds}
        nodes={nodes}
        links={links}
        hiddenKinds={hiddenKinds}
        onHiddenKindsChange={setHiddenKinds}
      />
      <GraphHarness hiddenKinds={hiddenKinds} />
    </div>
  );
}

/** A graph whose data grows and shrinks at the press of a button. */
export function LiveHarness() {
  const [extra, setExtra] = React.useState(0);
  const added: NetworkGraphNode[] = Array.from({ length: extra }, (_, i) => ({
    id: `new-${i}`,
    label: `New chapter ${i + 1}`,
    kind: "company",
  }));
  return (
    <div>
      <button type="button" onClick={() => setExtra((count) => count + 1)}>Add a node</button>
      <button type="button" onClick={() => setExtra((count) => Math.max(0, count - 1))}>Remove a node</button>
      <GraphHarness
        nodes={[...nodes, ...added]}
        links={[...links, ...added.map((node) => ({ source: "hollow", target: node.id, kind: "owns" }))]}
      />
    </div>
  );
}

/** A supply chain with sizes, icons, an image, thick and animated links, for the newer drawing options. */
export function RichHarness(props: Partial<React.ComponentProps<typeof NetworkGraph>>) {
  return (
    <div style={frame}>
      <NetworkGraph
        label="Supply chain"
        nodeKinds={{
          grower: { label: "Grower", icon: <circle data-testid="kind-icon" r={4} /> },
          packer: { label: "Packer", shape: "square" },
          shop: { label: "Shop", shape: "hexagon" },
        }}
        linkKinds={{
          supplies: { label: "Shares maps", thickness: 4, animation: "flow", animationDuration: 900 },
          sells: { label: "Sells" },
        }}
        nodes={[
          { id: "orchard", label: "Orchard", kind: "grower", size: 2 },
          { id: "farm", label: "Farm", kind: "grower" },
          { id: "packhouse", label: "Packhouse", kind: "packer", image: "data:image/gif;base64,R0lGODlhAQABAAAAACw=" },
          { id: "shop-a", label: "Shop A", kind: "shop" },
          { id: "shop-b", label: "Shop B", kind: "shop" },
          { id: "other", label: "Other shop", kind: "shop" },
        ]}
        links={[
          { source: "orchard", target: "packhouse", kind: "supplies" },
          { source: "farm", target: "packhouse", kind: "supplies", animation: "particles", thickness: 8 },
          { source: "packhouse", target: "shop-a", kind: "sells" },
          { source: "packhouse", target: "shop-b", kind: "sells", animation: "pulse" },
          { source: "other", target: "shop-b", kind: "sells" },
        ]}
        {...props}
      />
    </div>
  );
}

/** The supply chain lit by kind: functions cannot cross into a component test, so the harness holds it. */
export function SameKindHarness() {
  return <RichHarness hoverHighlight={(current, graph) => graph.nodes.filter((n) => n.kind === current.kind).map((n) => n.id)} />;
}

/** The chapter graph with every node drawn by `renderNode`. */
export function RenderNodeHarness() {
  return (
    <GraphHarness
      renderNode={(current, state) => <circle data-testid={`custom-${current.id}`} r={state.radius} fill={state.color} />}
    />
  );
}

/** A live graph that reports its pins, held by the graph itself or by the parent. */
export function PinHarness({ controlled = false }: { controlled?: boolean }) {
  const [pinnedIds, setPinnedIds] = React.useState<string[]>(["waikato"]);
  const [calls, setCalls] = React.useState<string[]>([]);
  return (
    <div>
      <output aria-label="Pin changes">{calls.join(" | ")}</output>
      <GraphHarness
        layout="force"
        defaultPinnedIds={controlled ? undefined : ["waikato"]}
        pinnedIds={controlled ? pinnedIds : undefined}
        onPinnedChange={(ids) => {
          setPinnedIds(ids);
          setCalls((previous) => [...previous, [...ids].sort().join(",") || "none"]);
        }}
      />
    </div>
  );
}
