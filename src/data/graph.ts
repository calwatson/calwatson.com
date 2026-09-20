import data from "./graph.data.json" with { type: "json" };
import type { GraphData, GraphLink, GraphNode, GroupId, NodeType, TypeStyle } from "../graph/types.ts";

const graph = data as GraphData;

export const graphData: GraphData = graph;

export const nodes: GraphNode[] = graph.nodes;
export const links: GraphLink[] = graph.links;
export const copy = graph.copy;
export const typeStyles: Record<NodeType, TypeStyle> = graph.types;
export const groups = graph.groups;

export const byId: ReadonlyMap<string, GraphNode> = new Map(nodes.map((node) => [node.id, node]));

export const adjacency: ReadonlyMap<string, readonly string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const node of nodes) map.set(node.id, []);
  for (const link of links) {
    map.get(link.source)?.push(link.target);
    map.get(link.target)?.push(link.source);
  }
  return map;
})();

export const outgoing = (() => {
  const map = new Map<string, GraphLink[]>();
  for (const node of nodes) map.set(node.id, []);
  for (const link of links) map.get(link.source)?.push(link);
  return map;
})();

export const incoming = (() => {
  const map = new Map<string, GraphLink[]>();
  for (const node of nodes) map.set(node.id, []);
  for (const link of links) map.get(link.target)?.push(link);
  return map;
})();

export function groupOf(node: GraphNode): GroupId {
  return typeStyles[node.type].group;
}

export function nodeById(id: string): GraphNode {
  const node = byId.get(id);
  if (!node) throw new Error(`Unknown node: ${id}`);
  return node;
}

export function neighborsOf(id: string): readonly string[] {
  return adjacency.get(id) ?? [];
}

export function countByGroup(group: GroupId): number {
  return nodes.filter((node) => groupOf(node) === group).length;
}
