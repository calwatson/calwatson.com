import { drag } from "d3-drag";
import { zoom, zoomTransform, type ZoomBehavior } from "d3-zoom";
import "d3-transition";
import { neighborsOf } from "../data/graph.ts";
import type { GroupId } from "./types.ts";
import type { LayoutNode, LayoutResult } from "./layout.ts";
import { applyHiddenGroups, applyHighlight, fitTransform, tick, type RenderHandles } from "./render.ts";
import { isPhoneViewport, prefersReducedMotion } from "../util.ts";

export interface GraphController {
  selectNode: (id: string | null) => void;
  hoverNode: (id: string | null) => void;
  setSearch: (query: string) => void;
  setGroupHidden: (group: GroupId, hidden: boolean) => void;
  revealGroup: (group: GroupId) => void;
  hiddenGroups: () => Set<GroupId>;
  selectedId: () => string | null;
  fit: (duration?: number) => void;
  zoomBy: (factor: number) => void;
  reveal: (id: string) => void;
  currentFocus: () => string | null;
  k: () => number;
}

export interface InteractionCallbacks {
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  panelHeight: () => number;
}

export function wireInteraction(
  handles: RenderHandles,
  layout: LayoutResult,
  hiddenStart: Iterable<GroupId>,
  callbacks: InteractionCallbacks,
): GraphController {
  const hidden = new Set<GroupId>(hiddenStart);
  let selected: string | null = null;
  let hovered: string | null = null;
  let search = "";
  let currentK = 1;

  const zoomBehavior: ZoomBehavior<SVGSVGElement, unknown> = zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.3, 4])
    .filter((event: { type: string; ctrlKey?: boolean; touches?: TouchList }) => {
      if (event.type === "dblclick") return false;
      if (event.type === "wheel") return true;
      if (event.touches && event.touches.length === 1) {
        const t = event.touches.item(0);
        if (!t) return true;
        const el = document.elementFromPoint(t.clientX, t.clientY);
        if (el?.closest(".node")) return false;
      }
      return true;
    })
    .on("zoom", (event) => {
      currentK = event.transform.k;
      handles.world.attr("transform", event.transform.toString());
      paint();
    });

  handles.svg.call(zoomBehavior);
  handles.svg.on("dblclick.zoom", null);

  const nodeDrag = drag<SVGGElement, LayoutNode>()
    .on("start", (event, d) => {
      if (!event.active) layout.simulation.alphaTarget(0.25).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on("drag", (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
      d.x = event.x;
      d.y = event.y;
      tick(layout);
    })
    .on("end", (event, d) => {
      if (!event.active) layout.simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    });

  function focusId(): string | null {
    return hovered ?? selected;
  }

  function paint(): void {
    applyHiddenGroups(hidden);
    const focus = focusId();
    applyHighlight({
      focus,
      neighbors: new Set(focus ? neighborsOf(focus) : []),
      search,
      k: currentK,
      compact: layout.metrics.compact,
    });
  }

  function selectNode(id: string | null): void {
    selected = id;
    if (id) hovered = null;
    callbacks.onSelect(id);
    paint();
  }

  function hoverNode(id: string | null): void {
    hovered = id;
    callbacks.onHover(id);
    paint();
  }

  const canHover = window.matchMedia("(hover: hover)").matches;

  handles.nodes
    .selectAll<SVGGElement, LayoutNode>(".node")
    .call(nodeDrag)
    .on("pointerenter", (_event, d) => {
      if (canHover) hoverNode(d.id);
    })
    .on("pointerleave", () => {
      if (canHover) hoverNode(null);
    })
    .on("click", (event, d) => {
      event.stopPropagation();
      selectNode(d.id);
    })
    .on("keydown", (event: KeyboardEvent, d) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectNode(d.id);
      }
    });

  handles.svg.on("click", (event) => {
    const target = event.target as Element;
    if (target.closest(".node")) return;
    selectNode(null);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !document.querySelector("dialog[open]")) selectNode(null);
  });

  layout.simulation.on("tick", () => tick(layout));

  function bottomInset(): number {
    if (isPhoneViewport()) return Math.max(callbacks.panelHeight(), 220) + 96;
    return 30;
  }

  function applyZoomTransform(next: ReturnType<typeof zoomTransform>, duration: number): void {
    const svgEl = handles.svg.node();
    if (!svgEl) return;
    if (prefersReducedMotion() || duration === 0) {
      handles.svg.call(zoomBehavior.transform, next);
      return;
    }
    handles.svg.transition().duration(duration).call(zoomBehavior.transform, next);
  }

  function fit(duration = 450): void {
    const svgEl = handles.svg.node();
    if (!svgEl) return;
    const box = svgEl.getBoundingClientRect();
    if (box.width < 10 || box.height < 10) return;
    const t = fitTransform(layout, hidden, box, bottomInset(), zoomBehavior);
    currentK = t.k;
    applyZoomTransform(t, duration);
  }

  function zoomBy(factor: number): void {
    if (prefersReducedMotion()) handles.svg.call(zoomBehavior.scaleBy, factor);
    else handles.svg.transition().duration(200).call(zoomBehavior.scaleBy, factor);
  }

  function reveal(id: string): void {
    if (!isPhoneViewport()) return;
    const node = layout.nodes.find((n) => n.id === id);
    const svgEl = handles.svg.node();
    if (!node || !svgEl) return;
    const box = svgEl.getBoundingClientRect();
    const t = zoomTransform(svgEl);
    const sy = t.y + t.k * node.y;
    const limit = box.height - bottomInset() - 24;
    if (sy > limit || sy < 40) {
      const ty = box.height / 2 - bottomInset() / 2 - t.k * node.y;
      applyZoomTransform(t.translate(0, ty - t.y), 350);
    }
  }

  paint();

  return {
    selectNode,
    hoverNode,
    setSearch: (query: string) => {
      search = query;
      paint();
    },
    setGroupHidden: (group, isHidden) => {
      if (isHidden) hidden.add(group);
      else hidden.delete(group);
      paint();
    },
    revealGroup: (group) => {
      hidden.delete(group);
      paint();
    },
    hiddenGroups: () => new Set(hidden),
    selectedId: () => selected,
    fit,
    zoomBy,
    reveal,
    currentFocus: focusId,
    k: () => currentK,
  };
}

export function firstSearchMatch(query: string, nodes: LayoutNode[]): LayoutNode | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return nodes.find(
    (n) => n.label.toLowerCase().includes(q) || (n.sub ?? "").toLowerCase().includes(q),
  );
}
