import { select, type BaseType, type Selection } from "d3-selection";
import {
  symbol,
  symbolCircle,
  symbolDiamond,
  symbolSquare,
  symbolStar,
  symbolTriangle,
  symbolWye,
  type SymbolType,
} from "d3-shape";
import { zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import { groups, typeStyles } from "../data/graph.ts";
import type { GroupId, ShapeKind } from "./types.ts";
import { LEAF_TYPES } from "./types.ts";
import type { LayoutLink, LayoutNode, LayoutResult } from "./layout.ts";
import { prefersReducedMotion } from "../util.ts";

const SHAPES: Record<ShapeKind, SymbolType> = {
  circle: symbolCircle,
  ring: symbolCircle,
  square: symbolSquare,
  star: symbolStar,
  triangle: symbolTriangle,
  diamond: symbolDiamond,
  wye: symbolWye,
};

type Sel<El extends BaseType> = Selection<El, unknown, BaseType | null, unknown>;

export interface RenderHandles {
  svg: Sel<SVGSVGElement>;
  world: Sel<SVGGElement>;
  edges: Sel<SVGGElement>;
  edgeLabels: Sel<SVGGElement>;
  nodes: Sel<SVGGElement>;
}

function colorVar(node: LayoutNode): string {
  switch (node.type) {
    case "person":
      return "var(--c-person)";
    case "arc":
    case "invite":
      return "var(--c-arc)";
    case "org":
      return "var(--c-org)";
    case "product":
    case "usecase":
      return "var(--c-product)";
    case "school":
      return "var(--c-school)";
    case "skill":
    case "note":
    case "place":
      return "var(--c-skill)";
    case "principle":
      return "var(--c-principle)";
    case "link":
      return "var(--c-link)";
  }
}

function isSpine(link: LayoutLink): boolean {
  return link.rel === "then";
}

function linkKey(link: LayoutLink): string {
  return `${link.sourceId}::${link.targetId}::${link.rel}`;
}

export function createSvg(host: HTMLElement): RenderHandles {
  const svg = select(host)
    .append("svg")
    .attr("class", "graph-svg")
    .attr("role", "group")
    .attr("aria-label", "Career knowledge graph");
  const world = svg.append("g").attr("class", "world");
  const edges = world.append("g").attr("class", "edges");
  const edgeLabels = world.append("g").attr("class", "edge-labels");
  const nodes = world.append("g").attr("class", "nodes");
  return { svg, world, edges, edgeLabels, nodes };
}

export function drawGraph(handles: RenderHandles, layout: LayoutResult): void {
  const { edges, edgeLabels, nodes } = handles;

  edges
    .selectAll<SVGLineElement, LayoutLink>("line")
    .data(layout.links, linkKey)
    .join("line")
    .attr("class", (d) => (isSpine(d) ? "edge spine" : "edge"))
    .attr("data-source", (d) => d.sourceId)
    .attr("data-target", (d) => d.targetId);

  edgeLabels
    .selectAll<SVGTextElement, LayoutLink>("text")
    .data(layout.links, linkKey)
    .join("text")
    .attr("class", "edge-label")
    .attr("data-source", (d) => d.sourceId)
    .attr("data-target", (d) => d.targetId)
    .text((d) => d.rel);

  const nodeSel = nodes
    .selectAll<SVGGElement, LayoutNode>("g.node")
    .data(layout.nodes, (d) => d.id)
    .join((enter) => {
      const g = enter.append("g").attr("class", "node").attr("data-id", (d) => d.id);
      g.append("circle").attr("class", "hit");
      g.append("path").attr("class", "symbol");
      g.append("text").attr("class", "label");
      return g;
    });

  nodeSel
    .attr("data-type", (d) => d.type)
    .attr("data-group", (d) => typeStyles[d.type].group)
    .attr("tabindex", 0)
    .attr("role", "button")
    .attr("aria-label", (d) => `${d.label}, ${groups[typeStyles[d.type].group].kind}`);

  nodeSel
    .select(".hit")
    .attr("r", (d) => Math.max(typeStyles[d.type].r + 4, 17))
    .attr("fill", "transparent");

  nodeSel
    .select<SVGPathElement>(".symbol")
    .attr("d", (d) => {
      const style = typeStyles[d.type];
      return symbol(SHAPES[style.shape], style.size)() ?? "";
    })
    .attr("fill", (d) => (d.type === "arc" || d.type === "invite" || d.type === "principle" ? "var(--bg)" : colorVar(d)))
    .attr("stroke", (d) => colorVar(d))
    .attr("stroke-width", (d) => {
      if (d.type === "arc" || d.type === "invite") return 2.4;
      if (d.type === "principle" || d.type === "note") return 1.6;
      return 1.1;
    })
    .attr("stroke-dasharray", (d) =>
      d.type === "invite" || d.type === "note" ? "3.5 3" : null,
    )
    .classed("now", (d) => Boolean(d.now))
    .classed("pulse", (d) => d.type === "invite" && !prefersReducedMotion());

  nodeSel
    .select<SVGTextElement>(".label")
    .attr("y", (d) => typeStyles[d.type].r + 14)
    .attr("text-anchor", "middle")
    .text((d) => d.label)
    .classed("display", (d) => d.type === "person" || d.type === "arc" || d.type === "product");

  tick(layout);
}

export function tick(layout: LayoutResult): void {
  if (!layout.nodes.length) return;
  const host = document.querySelector(".graph-svg");
  if (!host) return;
  const svg = select(host);

  svg
    .selectAll<SVGLineElement, LayoutLink>(".edge")
    .attr("x1", (d) => (typeof d.source === "object" ? d.source.x : 0))
    .attr("y1", (d) => (typeof d.source === "object" ? d.source.y : 0))
    .attr("x2", (d) => (typeof d.target === "object" ? d.target.x : 0))
    .attr("y2", (d) => (typeof d.target === "object" ? d.target.y : 0));

  svg
    .selectAll<SVGTextElement, LayoutLink>(".edge-label")
    .attr("x", (d) => {
      if (typeof d.source !== "object" || typeof d.target !== "object") return 0;
      return (d.source.x + d.target.x) / 2;
    })
    .attr("y", (d) => {
      if (typeof d.source !== "object" || typeof d.target !== "object") return 0;
      return (d.source.y + d.target.y) / 2 - 6;
    });

  svg.selectAll<SVGGElement, LayoutNode>(".node").attr("transform", (d) => `translate(${d.x},${d.y})`);
}

export function applyHiddenGroups(hidden: ReadonlySet<GroupId>): void {
  const svg = select(".graph-svg");
  svg.selectAll<SVGGElement, LayoutNode>(".node").classed("is-hidden", (d) =>
    hidden.has(typeStyles[d.type].group),
  );
  svg.selectAll<SVGLineElement, LayoutLink>(".edge").classed("is-hidden", (d) => {
    if (typeof d.source !== "object" || typeof d.target !== "object") return false;
    return hidden.has(typeStyles[d.source.type].group) || hidden.has(typeStyles[d.target.type].group);
  });
  svg.selectAll<SVGTextElement, LayoutLink>(".edge-label").classed("is-hidden", (d) => {
    if (typeof d.source !== "object" || typeof d.target !== "object") return false;
    return hidden.has(typeStyles[d.source.type].group) || hidden.has(typeStyles[d.target.type].group);
  });
}

export interface HighlightState {
  focus: string | null;
  neighbors: ReadonlySet<string>;
  search: string;
  k: number;
  compact: boolean;
}

export function applyHighlight(state: HighlightState): void {
  const svg = select(".graph-svg");
  const q = state.search.trim().toLowerCase();

  svg.selectAll<SVGGElement, LayoutNode>(".node").each(function (d) {
    const el = select(this);
    const matchesSearch =
      !q || d.label.toLowerCase().includes(q) || (d.sub ?? "").toLowerCase().includes(q);
    const inFocus = !state.focus || d.id === state.focus || state.neighbors.has(d.id);
    const dim = !matchesSearch || !inFocus;
    el.classed("dim", dim).classed("focus", d.id === state.focus);
    const hideLeafLabel = state.compact && state.k < 1.45 && LEAF_TYPES.has(d.type) && !inFocus;
    el.select(".label").classed("is-hidden", hideLeafLabel);
  });

  svg.selectAll<SVGLineElement, LayoutLink>(".edge").each(function (d) {
    const el = select(this);
    const hot = Boolean(state.focus && (d.sourceId === state.focus || d.targetId === state.focus));
    el.classed("hot", hot);
  });

  const showEdgeLabels = !state.compact || state.k >= 1;
  svg.selectAll<SVGTextElement, LayoutLink>(".edge-label").each(function (d) {
    const el = select(this);
    const hot = Boolean(state.focus && (d.sourceId === state.focus || d.targetId === state.focus));
    el.classed("visible", hot && showEdgeLabels);
  });
}

export function visibleBounds(
  layout: LayoutResult,
  hidden: ReadonlySet<GroupId>,
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  const visible = layout.nodes.filter((n) => !hidden.has(typeStyles[n.type].group));
  if (!visible.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of visible) {
    const r = typeStyles[node.type].r;
    minX = Math.min(minX, node.x - r);
    maxX = Math.max(maxX, node.x + r);
    minY = Math.min(minY, node.y - r);
    maxY = Math.max(maxY, node.y + r + 22);
  }
  return { minX, minY, maxX, maxY };
}

export function fitTransform(
  layout: LayoutResult,
  hidden: ReadonlySet<GroupId>,
  canvas: DOMRect,
  bottomInset: number,
  zoomBehavior: ZoomBehavior<SVGSVGElement, unknown>,
): ZoomTransform {
  const bounds = visibleBounds(layout, hidden);
  if (!bounds) return zoomIdentity;
  const pad = 56;
  const bw = bounds.maxX - bounds.minX + pad * 2;
  const bh = bounds.maxY - bounds.minY + pad * 2;
  const availW = Math.max(1, canvas.width);
  const availH = Math.max(80, canvas.height - bottomInset);
  const k = clampK(Math.min(availW / bw, availH / bh));
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  const tx = canvas.width / 2 - k * cx;
  const ty = (canvas.height - bottomInset) / 2 - k * cy;
  void zoomBehavior;
  return zoomIdentity.translate(tx, ty).scale(k);
}

function clampK(k: number): number {
  return Math.min(1.5, Math.max(0.3, k));
}
