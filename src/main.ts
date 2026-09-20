import "d3-transition";
import "@fontsource-variable/bricolage-grotesque/wght.css";
import "@fontsource/figtree/400.css";
import "@fontsource/figtree/500.css";
import "@fontsource/figtree/600.css";
import "@fontsource/caveat/600.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/bar.css";
import "./styles/graph.css";
import "./styles/panel.css";
import "./styles/modal.css";
import "./styles/mobile.css";

import { copy, groupOf, links, nodes } from "./data/graph.ts";
import { groups } from "./data/graph.ts";
import { buildLayout, relayout, type LayoutResult } from "./graph/layout.ts";
import { createSvg, drawGraph } from "./graph/render.ts";
import { firstSearchMatch, wireInteraction, type GraphController } from "./graph/interaction.ts";
import { mountChips } from "./ui/chips.ts";
import { mountContactModal } from "./ui/contact-modal.ts";
import { mountPanel } from "./ui/panel.ts";
import { mountSearch } from "./ui/search.ts";
import { debounce, isPhoneViewport } from "./util.ts";
import type { GraphNode } from "./graph/types.ts";
import type { GroupId } from "./graph/types.ts";

const canvas = document.getElementById("graph");
const panelEl = document.getElementById("panel");
const chipsEl = document.getElementById("chips");
const searchEl = document.getElementById("search") as HTMLInputElement | null;
const sayHi = document.getElementById("say-hi");
const dialog = document.getElementById("contact") as HTMLDialogElement | null;
const zoomIn = document.getElementById("zoom-in");
const zoomOut = document.getElementById("zoom-out");
const zoomReset = document.getElementById("zoom-reset");

if (!canvas || !panelEl || !chipsEl || !dialog || !sayHi) {
  throw new Error("Missing shell elements");
}

const initialHidden = new Set<GroupId>();
if (isPhoneViewport()) {
  for (const [id, def] of Object.entries(groups)) {
    if (def.hiddenByDefaultOnPhones) initialHidden.add(id as GroupId);
  }
}

function requireNode(id: string): GraphNode {
  const node = nodes.find((n) => n.id === id);
  if (!node) throw new Error(`Unknown node ${id}`);
  return node;
}

const modal = mountContactModal(dialog);
let graph!: GraphController;
let layout: LayoutResult = buildLayout(nodes, links, canvas.clientWidth, canvas.clientHeight);
const handles = createSvg(canvas);
drawGraph(handles, layout);

const panel = mountPanel(
  panelEl,
  () => graph.selectNode(null),
  (id) => {
    graph.revealGroup(groupOf(requireNode(id)));
    chips.sync(graph.hiddenGroups());
    graph.selectNode(id);
    graph.reveal(id);
  },
  () => modal.open(sayHi),
);

graph = wireInteraction(handles, layout, initialHidden, {
  onSelect: (id) => {
    if (!id) {
      panel.renderIntro();
      return;
    }
    const node = requireNode(id);
    graph.revealGroup(groupOf(node));
    chips.sync(graph.hiddenGroups());
    panel.renderNode(node, false);
    graph.reveal(id);
  },
  onHover: (id) => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    if (id) {
      panel.renderNode(requireNode(id), graph.selectedId() !== id);
      return;
    }
    const selected = graph.selectedId();
    if (selected) panel.renderNode(requireNode(selected), false);
    else panel.renderIntro();
  },
  panelHeight: () => panel.height(),
});

const chips = mountChips(chipsEl, graph.hiddenGroups(), (group, pressed) => {
  graph.setGroupHidden(group, !pressed);
  chips.sync(graph.hiddenGroups());
});

if (searchEl) {
  mountSearch(
    searchEl,
    (value) => graph.setSearch(value),
    () => {
      const match = firstSearchMatch(searchEl.value, layout.nodes);
      if (match) graph.selectNode(match.id);
    },
  );
}

sayHi.addEventListener("click", () => modal.open(sayHi));
zoomIn?.addEventListener("click", () => graph.zoomBy(1.2));
zoomOut?.addEventListener("click", () => graph.zoomBy(1 / 1.2));
zoomReset?.addEventListener("click", () => graph.fit());

requestAnimationFrame(() => graph.fit());

let lastW = canvas.clientWidth;
let lastH = canvas.clientHeight;
const onResize = debounce(() => {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (Math.abs(w - lastW) <= 24 && Math.abs(h - lastH) <= 60) return;
  lastW = w;
  lastH = h;
  layout = relayout(layout, w, h);
  drawGraph(handles, layout);
  graph.fit();
}, 200);
window.addEventListener("resize", onResize);

document.querySelector(".tagline-highlight")?.replaceChildren(copy.taglineHighlight);
document.querySelectorAll("[data-copy='say-hi']").forEach((el) => {
  el.textContent = copy.sayHi;
});
