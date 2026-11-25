import { describe, expect, it } from "vitest";
import {
  LINK_DISTANCE,
  MAX_ZOOM,
  MIN_ZOOM,
  NODE_RADIUS,
  buildNeighbours,
  createLiveSimulation,
  highlightStructure,
  linksAmong,
  nodeRadius,
  simulationPositions,
  fitView,
  graphSignature,
  layoutGraph,
  linkBows,
  linkGeometry,
  nextFocusId,
  shapePath,
  truncateLabel,
  visibleGraph,
  zoomView,
  type GraphLinkLike,
  type GraphNodeLike,
  type GraphPositions,
} from "./network-graph-layout";

const nodes: GraphNodeLike[] = [
  { id: "acme", kind: "company" },
  { id: "birch", kind: "company" },
  { id: "cedar", kind: "company" },
  { id: "dana", kind: "person" },
  { id: "eli", kind: "person" },
];
const links: GraphLinkLike[] = [
  { source: "acme", target: "birch", kind: "supplies" },
  { source: "birch", target: "cedar", kind: "supplies" },
  { source: "dana", target: "acme", kind: "directs" },
  { source: "eli", target: "cedar", kind: "directs" },
];

const distance = (positions: GraphPositions, a: string, b: string) =>
  Math.hypot(positions[a].x - positions[b].x, positions[a].y - positions[b].y);

describe("layoutGraph", () => {
  it("gives every node a finite position", () => {
    const positions = layoutGraph({ nodes, links });
    expect(Object.keys(positions).sort()).toEqual(["acme", "birch", "cedar", "dana", "eli"]);
    for (const point of Object.values(positions)) {
      expect(Number.isFinite(point.x)).toBe(true);
      expect(Number.isFinite(point.y)).toBe(true);
    }
  });

  it("lays the same graph out the same way every time", () => {
    expect(layoutGraph({ nodes, links })).toEqual(layoutGraph({ nodes, links }));
  });

  it("keeps nodes apart and linked nodes near each other", () => {
    const positions = layoutGraph({ nodes, links });
    for (const a of nodes) {
      for (const b of nodes) {
        if (a.id < b.id) expect(distance(positions, a.id, b.id)).toBeGreaterThan(NODE_RADIUS * 2);
      }
    }
    for (const link of links) expect(distance(positions, link.source, link.target)).toBeLessThan(LINK_DISTANCE * 2);
  });

  it("keeps every existing node exactly where it was when a node is added", () => {
    const before = layoutGraph({ nodes, links });
    const after = layoutGraph({
      nodes: [...nodes, { id: "fern", kind: "company" }],
      links: [...links, { source: "fern", target: "acme", kind: "supplies" }],
      previous: before,
    });
    for (const node of nodes) expect(after[node.id]).toEqual(before[node.id]);
    expect(after.fern).toBeDefined();
  });

  it("places a new node near the node it links to", () => {
    const before = layoutGraph({ nodes, links });
    const after = layoutGraph({
      nodes: [...nodes, { id: "fern" }],
      links: [...links, { source: "fern", target: "eli" }],
      previous: before,
    });
    expect(distance(after, "fern", "eli")).toBeLessThan(LINK_DISTANCE * 2);
    expect(distance(after, "fern", "eli")).toBeGreaterThan(NODE_RADIUS * 2);
  });

  it("hangs a chain of new nodes off the node it joins", () => {
    const before = layoutGraph({ nodes, links });
    const after = layoutGraph({
      nodes: [...nodes, { id: "gus" }, { id: "fern" }],
      links: [...links, { source: "gus", target: "fern" }, { source: "fern", target: "dana" }],
      previous: before,
    });
    expect(distance(after, "fern", "dana")).toBeLessThan(LINK_DISTANCE * 2);
    expect(distance(after, "gus", "fern")).toBeLessThan(LINK_DISTANCE * 2);
    for (const node of nodes) expect(after[node.id]).toEqual(before[node.id]);
  });

  it("places a new node with no links without moving the rest", () => {
    const before = layoutGraph({ nodes, links });
    const after = layoutGraph({ nodes: [...nodes, { id: "lone" }], links, previous: before });
    for (const node of nodes) expect(after[node.id]).toEqual(before[node.id]);
    expect(Number.isFinite(after.lone.x)).toBe(true);
    for (const node of nodes) expect(distance(after, "lone", node.id)).toBeGreaterThan(NODE_RADIUS * 2);
  });

  it("drops a removed node and leaves the others where they were", () => {
    const before = layoutGraph({ nodes, links });
    const remaining = nodes.filter((node) => node.id !== "birch");
    const after = layoutGraph({ nodes: remaining, links, previous: before });
    expect(after.birch).toBeUndefined();
    for (const node of remaining) expect(after[node.id]).toEqual(before[node.id]);
  });

  it("draws two groups left far apart together again when loose", () => {
    // Two pairs, each placed far from the other, as a search leaves two clusters.
    const pairs: GraphNodeLike[] = [{ id: "a1" }, { id: "a2" }, { id: "b1" }, { id: "b2" }];
    const pairLinks: GraphLinkLike[] = [
      { source: "a1", target: "a2" },
      { source: "b1", target: "b2" },
    ];
    const apart: GraphPositions = {
      a1: { x: -900, y: 0 },
      a2: { x: -780, y: 0 },
      b1: { x: 900, y: 0 },
      b2: { x: 780, y: 0 },
    };
    const kept = layoutGraph({ nodes: pairs, links: pairLinks, previous: apart });
    expect(kept).toEqual(apart);
    const settled = layoutGraph({ nodes: pairs, links: pairLinks, previous: apart, loose: true });
    expect(distance(settled, "a1", "b1")).toBeLessThan(distance(apart, "a1", "b1") / 2);
    expect(distance(settled, "a1", "a2")).toBeLessThan(LINK_DISTANCE * 2);
    expect(settled).toEqual(layoutGraph({ nodes: pairs, links: pairLinks, previous: apart, loose: true }));
  });

  it("does not move anything when only links change", () => {
    const before = layoutGraph({ nodes, links });
    const after = layoutGraph({ nodes, links: [...links, { source: "dana", target: "eli" }], previous: before });
    expect(after).toEqual(before);
  });

  it("stays put through a run of live updates", () => {
    let positions = layoutGraph({ nodes, links });
    const first = positions;
    let liveNodes = [...nodes];
    let liveLinks = [...links];
    for (let i = 0; i < 20; i += 1) {
      liveNodes = [...liveNodes, { id: `new-${i}` }];
      liveLinks = [...liveLinks, { source: `new-${i}`, target: liveNodes[i].id }];
      positions = layoutGraph({ nodes: liveNodes, links: liveLinks, previous: positions });
    }
    for (const node of nodes) expect(positions[node.id]).toEqual(first[node.id]);
    expect(Object.keys(positions)).toHaveLength(25);
  });

  it("lays out from scratch when nothing carries over, and copes with no nodes", () => {
    expect(layoutGraph({ nodes: [], links: [] })).toEqual({});
    expect(layoutGraph({ nodes, links, previous: {} })).toEqual(layoutGraph({ nodes, links }));
  });

  it("ignores links to nodes that do not exist", () => {
    expect(() => layoutGraph({ nodes, links: [...links, { source: "acme", target: "ghost" }] })).not.toThrow();
  });
});

describe("graphSignature", () => {
  it("changes when a node or link is added, and not when the data is only rebuilt", () => {
    const signature = graphSignature(nodes, links);
    expect(graphSignature([...nodes], links.map((link) => ({ ...link })))).toBe(signature);
    expect(graphSignature([...nodes, { id: "fern" }], links)).not.toBe(signature);
    expect(graphSignature(nodes, links.slice(1))).not.toBe(signature);
  });
});

describe("buildNeighbours", () => {
  it("lists the nodes one link away, in either direction", () => {
    const neighbours = buildNeighbours(nodes, links);
    expect([...neighbours.get("acme")!].sort()).toEqual(["birch", "dana"]);
    expect([...neighbours.get("cedar")!].sort()).toEqual(["birch", "eli"]);
    expect([...neighbours.get("dana")!]).toEqual(["acme"]);
  });

  it("gives a node with no links an empty set", () => {
    expect(buildNeighbours([...nodes, { id: "lone" }], links).get("lone")!.size).toBe(0);
  });

  it("ignores links to itself and links to missing nodes", () => {
    const neighbours = buildNeighbours(nodes, [
      { source: "acme", target: "acme" },
      { source: "acme", target: "ghost" },
    ]);
    expect(neighbours.get("acme")!.size).toBe(0);
    expect(neighbours.has("ghost")).toBe(false);
  });

  it("counts two links between the same pair once", () => {
    const neighbours = buildNeighbours(nodes, [
      { source: "acme", target: "birch" },
      { source: "birch", target: "acme" },
    ]);
    expect([...neighbours.get("acme")!]).toEqual(["birch"]);
  });
});

describe("visibleGraph", () => {
  it("shows everything when nothing is hidden", () => {
    expect(visibleGraph(nodes, links)).toEqual({ nodes, links });
    expect(visibleGraph(nodes, links, { nodes: [], links: [] })).toEqual({ nodes, links });
  });

  it("removes nodes of a hidden kind and every link that touched them", () => {
    const shown = visibleGraph(nodes, links, { nodes: ["person"] });
    expect(shown.nodes.map((node) => node.id)).toEqual(["acme", "birch", "cedar"]);
    expect(shown.links.map((link) => `${link.source}>${link.target}`)).toEqual(["acme>birch", "birch>cedar"]);
  });

  it("removes links of a hidden kind and keeps their nodes", () => {
    const shown = visibleGraph(nodes, links, { links: ["supplies"] });
    expect(shown.nodes).toHaveLength(5);
    expect(shown.links.map((link) => link.kind)).toEqual(["directs", "directs"]);
  });

  it("keeps node kinds and link kinds apart when they share a name", () => {
    const shown = visibleGraph(
      [{ id: "a", kind: "owner" }, { id: "b", kind: "asset" }],
      [{ source: "a", target: "b", kind: "owner" }],
      { links: ["owner"] },
    );
    expect(shown.nodes).toHaveLength(2);
    expect(shown.links).toHaveLength(0);
  });

  it("leaves out links to nodes that do not exist", () => {
    expect(visibleGraph(nodes, [{ source: "acme", target: "ghost" }]).links).toEqual([]);
  });
});

describe("nextFocusId", () => {
  // A cross: hub in the middle, one neighbour on each side, and a far node
  // linked only to the one on the right.
  const cross: GraphNodeLike[] = [{ id: "hub" }, { id: "north" }, { id: "east" }, { id: "south" }, { id: "west" }, { id: "far" }];
  const crossLinks: GraphLinkLike[] = [
    { source: "hub", target: "north" },
    { source: "east", target: "hub" },
    { source: "hub", target: "south" },
    { source: "west", target: "hub" },
    { source: "east", target: "far" },
  ];
  const at: GraphPositions = {
    hub: { x: 0, y: 0 },
    north: { x: 0, y: -100 },
    east: { x: 100, y: 0 },
    south: { x: 0, y: 100 },
    west: { x: -100, y: 0 },
    far: { x: 200, y: 10 },
  };
  const go = (key: Parameters<typeof nextFocusId>[0], from: string) => nextFocusId(key, from, cross, crossLinks, at);

  it("moves along a link in the arrow's direction, whichever way the link points", () => {
    expect(go("ArrowUp", "hub")).toBe("north");
    expect(go("ArrowRight", "hub")).toBe("east");
    expect(go("ArrowDown", "hub")).toBe("south");
    expect(go("ArrowLeft", "hub")).toBe("west");
    expect(go("ArrowLeft", "east")).toBe("hub");
  });

  it("only moves to connected nodes", () => {
    // "far" lies to the right of the hub but is not linked to it.
    expect(go("ArrowRight", "east")).toBe("far");
    expect(go("ArrowRight", "far")).toBeNull();
    expect(go("ArrowUp", "north")).toBeNull();
  });

  it("stays put when no connected node lies that way", () => {
    expect(go("ArrowUp", "east")).toBeNull();
    expect(go("ArrowDown", "north")).toBe("hub");
  });

  it("prefers the node most nearly in line, then the nearer one", () => {
    const fan: GraphNodeLike[] = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
    const fanLinks: GraphLinkLike[] = [
      { source: "a", target: "b" },
      { source: "a", target: "c" },
      { source: "a", target: "d" },
    ];
    const fanAt: GraphPositions = { a: { x: 0, y: 0 }, b: { x: 100, y: 60 }, c: { x: 100, y: -10 }, d: { x: 300, y: -30 } };
    expect(nextFocusId("ArrowRight", "a", fan, fanLinks, fanAt)).toBe("c");
    expect(nextFocusId("ArrowDown", "a", fan, fanLinks, fanAt)).toBe("b");
    const tie: GraphPositions = { ...fanAt, c: { x: 200, y: 0 }, d: { x: 100, y: 0 } };
    expect(nextFocusId("ArrowRight", "a", fan, fanLinks, tie)).toBe("d");
  });

  it("steps through every node in order with Page Down and Page Up, without wrapping", () => {
    const visited = ["hub"];
    for (let next = go("PageDown", "hub"); next; next = go("PageDown", next)) visited.push(next);
    expect(visited).toEqual(["hub", "north", "east", "south", "west", "far"]);
    expect(go("PageUp", "north")).toBe("hub");
    expect(go("PageUp", "hub")).toBeNull();
  });

  it("jumps to the first and last node with Home and End", () => {
    expect(go("Home", "south")).toBe("hub");
    expect(go("End", "south")).toBe("far");
    expect(go("Home", "hub")).toBeNull();
  });

  it("starts from the first node when the current one is not on show", () => {
    expect(go("ArrowRight", "gone")).toBe("hub");
  });
});

describe("truncateLabel", () => {
  it("leaves a short label alone", () => {
    expect(truncateLabel("Acme Holdings")).toBe("Acme Holdings");
  });

  it("cuts a long label to the limit and ends it with an ellipsis", () => {
    const cut = truncateLabel("Northern Regional Freight and Logistics Limited", 24);
    expect(cut).toBe("Northern Regional Freig…");
    expect(Array.from(cut)).toHaveLength(24);
  });

  it("does not leave a space before the ellipsis", () => {
    expect(truncateLabel("Acme Holdings Limited", 6)).toBe("Acme…");
  });
});

describe("fitView and zoomView", () => {
  it("centres the nodes and never zooms in past 1", () => {
    expect(fitView([{ x: 100, y: 40 }, { x: 140, y: 80 }], 800, 600)).toEqual({ k: 1, x: -120, y: -60 });
  });

  it("zooms in up to the given most, so a few nodes can fill the box", () => {
    // 184 by 128 with padding: 800 / 184 is about 4.3, 600 / 128 about 4.7.
    expect(fitView([{ x: 100, y: 40 }, { x: 140, y: 80 }], 800, 600, 2).k).toBe(2);
    expect(fitView([{ x: 100, y: 40 }, { x: 140, y: 80 }], 400, 600, 3).k).toBeCloseTo(400 / 184, 2);
  });

  it("zooms out to fit a graph larger than the box", () => {
    const view = fitView([{ x: -1000, y: 0 }, { x: 1000, y: 0 }], 500, 400);
    expect(view.k).toBeLessThan(0.25);
    expect(view.k).toBeGreaterThanOrEqual(MIN_ZOOM);
    // Both ends land inside the box.
    expect(Math.abs(view.x + view.k * 1000)).toBeLessThan(250);
    expect(Math.abs(view.x - view.k * 1000)).toBeLessThan(250);
  });

  it("returns the resting view for no nodes or no box", () => {
    expect(fitView([], 800, 600)).toEqual({ k: 1, x: 0, y: 0 });
    expect(fitView([{ x: 5, y: 5 }], 0, 0)).toEqual({ k: 1, x: 0, y: 0 });
  });

  it("zooms about a point, leaving that point where it is", () => {
    const before = { k: 1, x: 10, y: -20 };
    const after = zoomView(before, 2, 100, 50);
    // The graph point under (100, 50) before and after.
    expect((100 - after.x) / after.k).toBeCloseTo((100 - before.x) / before.k);
    expect((50 - after.y) / after.k).toBeCloseTo((50 - before.y) / before.k);
  });

  it("keeps the zoom within its limits", () => {
    expect(zoomView({ k: 1, x: 0, y: 0 }, 100).k).toBe(MAX_ZOOM);
    expect(zoomView({ k: 1, x: 0, y: 0 }, 0.001).k).toBe(MIN_ZOOM);
  });
});

describe("link drawing", () => {
  it("stops a straight link short of both nodes and points the arrow at the target", () => {
    const geometry = linkGeometry({ x: 0, y: 0 }, { x: 100, y: 0 });
    expect(geometry.path).toBe("M17,0L74,0");
    expect(geometry.arrow).toBe("M83,0L74,4.5L74,-4.5Z");
    expect([geometry.labelX, geometry.labelY]).toEqual([50, 0]);
  });

  it("bows a link sideways by the amount asked", () => {
    const geometry = linkGeometry({ x: 0, y: 0 }, { x: 100, y: 0 }, 14);
    expect(geometry.path).toContain("Q50,-28");
    expect([geometry.labelX, geometry.labelY]).toEqual([50, -14]);
  });

  it("keeps a lone link straight and fans out links that share two nodes", () => {
    expect(
      linkBows([
        { source: "a", target: "b" },
        { source: "b", target: "c" },
        { source: "b", target: "a" },
      ]),
    ).toEqual([-14, 0, -14]);
    expect(linkBows([{ source: "a", target: "b" }, { source: "a", target: "b" }])).toEqual([-14, 14]);
  });

  it("puts two opposite links between the same nodes on opposite sides", () => {
    const [there, back] = linkBows([{ source: "a", target: "b" }, { source: "b", target: "a" }]);
    const a = { x: 0, y: 0 };
    const b = { x: 100, y: 0 };
    expect(linkGeometry(a, b, there).labelY).toBe(-linkGeometry(b, a, back).labelY);
  });
});

describe("shapePath", () => {
  it("draws a closed outline for every shape", () => {
    for (const shape of ["circle", "square", "diamond", "triangle", "hexagon"] as const) {
      const path = shapePath(shape, 12);
      expect(path.startsWith("M")).toBe(true);
      expect(path.endsWith("Z")).toBe(true);
      expect(path).not.toContain("NaN");
    }
  });
});

describe("highlightStructure", () => {
  // a → b → c → d, and e → b.
  const chain: GraphLinkLike[] = [
    { source: "a", target: "b" },
    { source: "b", target: "c" },
    { source: "c", target: "d" },
    { source: "e", target: "b" },
  ];
  const sorted = (set: Set<string | number>) => [...set].sort();

  it("lights a node's neighbours either way", () => {
    const lit = highlightStructure("neighbours", "b", chain);
    expect(sorted(lit.nodes)).toEqual(["a", "b", "c", "e"]);
    expect(sorted(lit.links)).toEqual([0, 1, 3]);
  });

  it("lights only the arrows out of or into a node", () => {
    expect(sorted(highlightStructure("outgoing", "b", chain).nodes)).toEqual(["b", "c"]);
    expect(sorted(highlightStructure("incoming", "b", chain).nodes)).toEqual(["a", "b", "e"]);
  });

  it("follows arrows all the way down or up", () => {
    const down = highlightStructure("downstream", "a", chain);
    expect(sorted(down.nodes)).toEqual(["a", "b", "c", "d"]);
    expect(sorted(down.links)).toEqual([0, 1, 2]);
    const up = highlightStructure("upstream", "c", chain);
    expect(sorted(up.nodes)).toEqual(["a", "b", "c", "e"]);
    expect(sorted(up.links)).toEqual([0, 1, 3]);
  });

  it("stops at a cycle", () => {
    const loop: GraphLinkLike[] = [
      { source: "a", target: "b" },
      { source: "b", target: "a" },
    ];
    expect(sorted(highlightStructure("downstream", "a", loop).nodes)).toEqual(["a", "b"]);
  });

  it("finds the links among a set of nodes", () => {
    expect(sorted(linksAmong(new Set(["a", "b", "e"]), chain))).toEqual([0, 3]);
  });
});

describe("node size", () => {
  it("scales the radius, clamped to 0.5–3 times", () => {
    expect(nodeRadius({ id: "a" })).toBe(NODE_RADIUS);
    expect(nodeRadius({ id: "a", size: 2 })).toBe(NODE_RADIUS * 2);
    expect(nodeRadius({ id: "a", size: 10 })).toBe(NODE_RADIUS * 3);
    expect(nodeRadius({ id: "a", size: 0 })).toBe(NODE_RADIUS * 0.5);
  });

  it("lays out a graph with no sizes exactly as before", () => {
    const sized = layoutGraph({ nodes: nodes.map((node) => ({ ...node, size: 1 })), links });
    expect(sized).toEqual(layoutGraph({ nodes, links }));
  });

  it("keeps larger nodes further apart", () => {
    const pair: GraphNodeLike[] = [{ id: "a" }, { id: "b" }];
    const join: GraphLinkLike[] = [{ source: "a", target: "b" }];
    const gap = (positions: GraphPositions) => Math.hypot(positions.a.x - positions.b.x, positions.a.y - positions.b.y);
    const small = gap(layoutGraph({ nodes: pair, links: join }));
    const large = gap(layoutGraph({ nodes: pair.map((node) => ({ ...node, size: 3 })), links: join }));
    expect(large).toBeGreaterThan(small);
  });
});

describe("linkGeometry with node sizes", () => {
  it("ends the arrow at the target's own edge", () => {
    const geometry = linkGeometry({ x: 0, y: 0 }, { x: 200, y: 0 }, 0, NODE_RADIUS, { targetRadius: 30 });
    expect(geometry.arrow.startsWith("M165,0")).toBe(true);
    expect(geometry.path.startsWith("M17,0")).toBe(true);
  });

  it("draws a larger arrowhead for a thick line", () => {
    const plain = linkGeometry({ x: 0, y: 0 }, { x: 200, y: 0 });
    const thick = linkGeometry({ x: 0, y: 0 }, { x: 200, y: 0 }, 0, NODE_RADIUS, { arrowScale: 2 });
    expect(plain.path).toBe("M17,0L174,0");
    expect(thick.path).toBe("M17,0L165,0");
  });
});

describe("createLiveSimulation", () => {
  const start = layoutGraph({ nodes, links });

  it("starts at rest where the layout left each node", () => {
    const live = createLiveSimulation(nodes, links, start);
    expect(simulationPositions(live)).toEqual(start);
    live.stop();
  });

  it("pulls a dragged node's neighbours after it, and keeps pinned nodes still", () => {
    const linked = links[0];
    const other = linked.source === "acme" ? linked.target : linked.source;
    const pinnedId = nodes.find((node) => node.id !== "acme" && node.id !== other)!.id;
    const live = createLiveSimulation(nodes, links, start, new Set([pinnedId]));
    const dragged = live.nodes().find((node) => node.id === "acme")!;
    dragged.fx = start.acme.x + 400;
    dragged.fy = start.acme.y;
    live.alpha(0.5).tick(60);
    const after = simulationPositions(live);
    live.stop();
    expect(after.acme.x).toBeCloseTo(start.acme.x + 400);
    expect(after[other].x).toBeGreaterThan(start[other].x);
    expect(after[pinnedId]).toEqual(start[pinnedId]);
  });
});
