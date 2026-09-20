import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { typeStyles } from "../data/graph.ts";
import type { GraphLink, GraphNode, NodeType } from "./types.ts";
import { LEAF_TYPES } from "./types.ts";
import { clamp, mulberry32 } from "../util.ts";

export interface LayoutNode extends GraphNode, SimulationNodeDatum {
  x: number;
  y: number;
  tx?: number;
  ty?: number;
  sx?: number;
  sy?: number;
}

export interface LayoutLink extends SimulationLinkDatum<LayoutNode> {
  rel: string;
  sourceId: string;
  targetId: string;
}

export interface LayoutMetrics {
  width: number;
  height: number;
  scale: number;
  portrait: boolean;
  compact: boolean;
}

export interface LayoutResult {
  nodes: LayoutNode[];
  links: LayoutLink[];
  metrics: LayoutMetrics;
  simulation: Simulation<LayoutNode, LayoutLink>;
}

function idOf(end: string | number | LayoutNode): string {
  if (typeof end === "object") return end.id;
  return String(end);
}

function chargeFor(type: NodeType, s2: number): number {
  if (type === "person") return -700 * s2;
  if (type === "arc") return -520 * s2;
  if (type === "product") return -420 * s2;
  if (type === "org") return -300 * s2;
  return -190 * s2;
}

export function measureCanvas(width: number, height: number): LayoutMetrics {
  const w = Math.max(280, width);
  const h = Math.max(300, height);
  return {
    width: w,
    height: h,
    scale: clamp(Math.min(w / 1000, h / 700), 0.68, 1.4),
    portrait: h > 1.05 * w,
    compact: window.innerWidth <= 899 || w < 700,
  };
}

function targetsFor(nodes: LayoutNode[], metrics: LayoutMetrics): void {
  const { width: W, height: H, portrait } = metrics;
  const byArc = new Map<string, LayoutNode[]>();

  for (const node of nodes) {
    if ((node.type === "org" || node.type === "product") && node.arc) {
      const list = byArc.get(node.arc) ?? [];
      list.push(node);
      byArc.set(node.arc, list);
    }
  }

  for (const node of nodes) {
    node.fx = undefined;
    node.fy = undefined;
    if (node.type === "arc") {
      const idx = node.idx ?? 0;
      if (portrait) {
        node.tx = 0.5 * W;
        node.ty = H * (0.26 + 0.19 * idx);
        node.sx = 0.5;
        node.sy = 1;
      } else {
        node.tx = W * (0.13 + 0.245 * idx);
        node.ty = 0.56 * H;
        node.sx = 0.42;
        node.sy = 0.3;
      }
      continue;
    }

    if ((node.type === "org" || node.type === "product") && node.arc) {
      const parent = nodes.find((n) => n.id === node.arc);
      const siblings = byArc.get(node.arc) ?? [];
      const index = siblings.findIndex((n) => n.id === node.id);
      if (portrait) {
        const sign = index % 2 === 0 ? -1 : 1;
        node.tx = 0.5 * W + sign * 0.3 * W;
        node.ty = parent?.ty ?? 0.5 * H;
        node.sx = 0.14;
        node.sy = 0.16;
      } else {
        node.tx = parent?.tx ?? 0.5 * W;
        node.ty = 0.56 * H;
        node.sx = 0.07;
        node.sy = 0.02;
      }
      continue;
    }

    if (node.id === "cal") {
      if (portrait) {
        node.tx = 0.5 * W;
        node.ty = 0.07 * H;
        node.sx = 0.3;
        node.sy = 0.5;
      } else {
        node.tx = 0.5 * W;
        node.ty = 0.13 * H;
        node.sx = 0.14;
        node.sy = 0.3;
      }
      continue;
    }

    node.tx = 0.5 * W;
    node.ty = 0.5 * H;
    node.sx = 0.03;
    node.sy = 0.03;
  }
}

function linkDistance(link: LayoutLink, S: number, portrait: boolean): number {
  const source = idOf(link.source);
  const target = idOf(link.target);
  const sourceNode = typeof link.source === "object" ? link.source : undefined;
  const targetNode = typeof link.target === "object" ? link.target : undefined;
  const sourceType = sourceNode?.type;
  const targetType = targetNode?.type;
  const touchesCal = source === "cal" || target === "cal";
  const arcToArc = sourceType === "arc" && targetType === "arc";
  const arcToOther = sourceType === "arc" || targetType === "arc";
  if (touchesCal) return 150 * S;
  if (arcToArc) return (portrait ? 150 : 220) * S;
  if (arcToOther) return 105 * S;
  return 84 * S;
}

function linkStrength(link: LayoutLink, portrait: boolean): number {
  const source = idOf(link.source);
  const target = idOf(link.target);
  const sourceType = typeof link.source === "object" ? link.source.type : undefined;
  const targetType = typeof link.target === "object" ? link.target.type : undefined;
  const touchesCal = source === "cal" || target === "cal";
  const other = source === "cal" ? target : source;
  if (touchesCal) {
    if (portrait && (other === "cursor" || other === "rosterjoy")) return 0.03;
    return 0.25;
  }
  if (sourceType === "arc" && targetType === "arc") return 0.5;
  return 0.8;
}

function collideRadius(node: LayoutNode, metrics: LayoutMetrics): number {
  const style = typeStyles[node.type];
  const r = style.r;
  const leaf = LEAF_TYPES.has(node.type);
  let allowance = 0;
  if (!(metrics.compact && leaf)) {
    const len = node.label.length;
    allowance = metrics.portrait ? Math.min(len * 3.2, 46) : Math.min(len * 2.4, 34);
  }
  return r + 6 + allowance;
}

export function buildLayout(
  graphNodes: GraphNode[],
  graphLinks: GraphLink[],
  width: number,
  height: number,
): LayoutResult {
  const metrics = measureCanvas(width, height);
  const { scale: S, portrait } = metrics;
  const s2 = S * S;

  const nodes: LayoutNode[] = graphNodes.map((node) => ({
    ...node,
    x: Number.NaN,
    y: Number.NaN,
  }));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const links: LayoutLink[] = graphLinks.map((link) => ({
    source: byId.get(link.source) ?? link.source,
    target: byId.get(link.target) ?? link.target,
    rel: link.rel,
    sourceId: link.source,
    targetId: link.target,
  }));

  targetsFor(nodes, metrics);

  const simulation = forceSimulation<LayoutNode, LayoutLink>(nodes)
    .randomSource(mulberry32(1))
    .force(
      "link",
      forceLink<LayoutNode, LayoutLink>(links)
        .id((d) => d.id)
        .distance((d) => linkDistance(d, S, portrait))
        .strength((d) => linkStrength(d, portrait)),
    )
    .force(
      "charge",
      forceManyBody<LayoutNode>().strength((d) => chargeFor(d.type, s2)),
    )
    .force(
      "collide",
      forceCollide<LayoutNode>()
        .radius((d) => collideRadius(d, metrics))
        .iterations(2),
    )
    .force(
      "x",
      forceX<LayoutNode>((d) => d.tx ?? metrics.width / 2).strength((d) => d.sx ?? 0.03),
    )
    .force(
      "y",
      forceY<LayoutNode>((d) => d.ty ?? metrics.height / 2).strength((d) => d.sy ?? 0.03),
    )
    .stop();

  simulation.alpha(1).tick(420);

  return { nodes, links, metrics, simulation };
}

export function relayout(result: LayoutResult, width: number, height: number): LayoutResult {
  const next = measureCanvas(width, height);
  result.metrics = next;
  targetsFor(result.nodes, next);
  const { scale: S, portrait } = next;
  const s2 = S * S;

  result.simulation
    .force(
      "link",
      forceLink<LayoutNode, LayoutLink>(result.links)
        .id((d) => d.id)
        .distance((d) => linkDistance(d, S, portrait))
        .strength((d) => linkStrength(d, portrait)),
    )
    .force(
      "charge",
      forceManyBody<LayoutNode>().strength((d) => chargeFor(d.type, s2)),
    )
    .force(
      "collide",
      forceCollide<LayoutNode>()
        .radius((d) => collideRadius(d, result.metrics))
        .iterations(2),
    )
    .force(
      "x",
      forceX<LayoutNode>((d) => d.tx ?? next.width / 2).strength((d) => d.sx ?? 0.03),
    )
    .force(
      "y",
      forceY<LayoutNode>((d) => d.ty ?? next.height / 2).strength((d) => d.sy ?? 0.03),
    );

  for (const node of result.nodes) {
    node.x = Number.NaN;
    node.y = Number.NaN;
    node.vx = 0;
    node.vy = 0;
    node.fx = undefined;
    node.fy = undefined;
  }

  result.simulation.nodes(result.nodes);
  result.simulation.alpha(1).tick(420);
  return result;
}
