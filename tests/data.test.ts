import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import graph from "../src/data/graph.data.json" with { type: "json" };
import { adjacency, byId } from "../src/data/graph.ts";
import type { GraphData, NodeType } from "../src/graph/types.ts";

const data = graph as GraphData;
const html = readFileSync(resolve("index.html"), "utf8");

describe("graph data integrity", () => {
  it("has 45 nodes and 52 links", () => {
    expect(data.nodes).toHaveLength(45);
    expect(data.links).toHaveLength(52);
  });

  it("has unique node ids", () => {
    const ids = data.nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has a type definition for every node type", () => {
    for (const node of data.nodes) {
      expect(data.types[node.type as NodeType]).toBeTruthy();
    }
  });

  it("resolves every link endpoint", () => {
    for (const link of data.links) {
      expect(byId.has(link.source), link.source).toBe(true);
      expect(byId.has(link.target), link.target).toBe(true);
    }
  });

  it("resolves every arc reference", () => {
    for (const node of data.nodes) {
      if (node.arc) expect(byId.has(node.arc), node.arc).toBe(true);
    }
  });

  it("has four consecutive arc indexes 0..3", () => {
    const idxs = data.nodes
      .filter((n) => n.type === "arc")
      .map((n) => n.idx)
      .sort((a, b) => (a ?? 0) - (b ?? 0));
    expect(idxs).toEqual([0, 1, 2, 3]);
  });

  it("is connected from cal", () => {
    const seen = new Set<string>(["cal"]);
    const queue = ["cal"];
    while (queue.length) {
      const id = queue.pop();
      if (!id) break;
      for (const next of adjacency.get(id) ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    expect(seen.size).toBe(data.nodes.length);
  });

  it("embeds org, school, arc, and product labels in the plaintext section", () => {
    for (const node of data.nodes) {
      if (node.type === "org" || node.type === "school" || node.type === "arc" || node.type === "product") {
        expect(html.includes(node.label), node.label).toBe(true);
      }
    }
  });
});
