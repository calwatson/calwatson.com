import { copy, groupOf, incoming, nodeById, outgoing } from "../data/graph.ts";
import { groups } from "../data/graph.ts";
import type { GraphNode } from "../graph/types.ts";

export interface PanelHandles {
  root: HTMLElement;
  renderIntro: () => void;
  renderNode: (node: GraphNode, preview: boolean) => void;
  height: () => number;
}

export function mountPanel(
  root: HTMLElement,
  onClose: () => void,
  onSelectRelated: (id: string) => void,
  onClaim: () => void,
): PanelHandles {
  function renderIntro(): void {
    root.dataset.state = "intro";
    const phone = window.innerWidth <= 899;
    const body = phone ? copy.introPhone : copy.introBody;
    const title = phone ? "" : `<h2 class="panel-title">${escapeHtml(copy.introTitle)}</h2>`;
    root.innerHTML = `
      <p class="panel-kicker">${escapeHtml(copy.introKicker)}</p>
      ${title}
      ${body.map((p) => `<p class="panel-blurb">${escapeHtml(p)}</p>`).join("")}
    `;
  }

  function renderNode(node: GraphNode, preview: boolean): void {
    root.dataset.state = preview ? "preview" : "selected";
    const group = groups[groupOf(node)];
    const outs = outgoing.get(node.id) ?? [];
    const ins = incoming.get(node.id) ?? [];
    const count = outs.length + ins.length;
    const actions: string[] = [];
    if (node.url) {
      actions.push(
        `<a class="panel-action" href="${escapeAttr(node.url)}" target="_blank" rel="noopener">${escapeHtml(node.urlLabel ?? copy.visit)}</a>`,
      );
    }
    if (node.type === "invite") {
      actions.push(`<button type="button" class="panel-action" data-claim="true">${escapeHtml(copy.claimSlot)}</button>`);
    }

    const related = [
      ...outs.map((link) => {
        const other = nodeById(link.target);
        return { id: other.id, label: other.label, rel: `${link.rel} →` };
      }),
      ...ins.map((link) => {
        const other = nodeById(link.source);
        return { id: other.id, label: other.label, rel: `← ${link.rel}` };
      }),
    ];

    root.innerHTML = `
      <div class="panel-head">
        <p class="panel-kicker"><span class="glyph glyph-${groupOf(node)}"></span>${escapeHtml(group.kind)}</p>
        ${preview ? "" : `<button type="button" class="panel-close" data-close="true">${escapeHtml(copy.close)}</button>`}
      </div>
      <h2 class="panel-title">${escapeHtml(node.label)}${node.now ? `<span class="now-tag">${escapeHtml(copy.now)}</span>` : ""}</h2>
      ${node.sub ? `<p class="panel-sub">${escapeHtml(node.sub)}</p>` : ""}
      <p class="panel-blurb">${escapeHtml(node.blurb)}</p>
      ${actions.length ? `<div class="panel-actions">${actions.join("")}</div>` : ""}
      <div class="panel-connections">
        <p class="panel-kicker">${escapeHtml(copy.connections)} (${count})</p>
        <ul>
          ${related
            .map(
              (row) =>
                `<li><button type="button" class="conn" data-id="${escapeAttr(row.id)}"><span class="conn-rel">${escapeHtml(row.rel)}</span><span class="conn-label">${escapeHtml(row.label)}</span></button></li>`,
            )
            .join("")}
        </ul>
      </div>
    `;

    root.querySelector("[data-close]")?.addEventListener("click", onClose);
    root.querySelector("[data-claim]")?.addEventListener("click", onClaim);
    root.querySelectorAll<HTMLButtonElement>(".conn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        if (id) onSelectRelated(id);
      });
    });
  }

  renderIntro();

  return {
    root,
    renderIntro,
    renderNode,
    height: () => root.getBoundingClientRect().height,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}
