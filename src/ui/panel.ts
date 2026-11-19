import { copy, groupOf, incoming, nodeById, outgoing } from "../data/graph.ts";
import { groups } from "../data/graph.ts";
import type { GraphNode } from "../graph/types.ts";
import { linkifyRosterJoy, mentionsRosterJoy } from "./rosterjoy-link.ts";

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
    const title = phone ? "" : `<h2 class="panel-title">${linkifyRosterJoy(copy.introTitle)}</h2>`;
    root.innerHTML = `
      <p class="panel-kicker">${linkifyRosterJoy(copy.introKicker)}</p>
      ${title}
      ${body.map((p) => `<p class="panel-blurb">${linkifyRosterJoy(p)}</p>`).join("")}
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
      actions.push(
        `<button type="button" class="panel-action" data-claim="true">${escapeHtml(copy.claimSlot)}</button>`,
      );
    }

    const related = [
      ...outs.map((link) => {
        const other = nodeById(link.target);
        return {
          id: other.id,
          label: other.label,
          rel: `${link.rel} →`,
          context: nodeContext(other),
        };
      }),
      ...ins.map((link) => {
        const other = nodeById(link.source);
        return {
          id: other.id,
          label: other.label,
          rel: `← ${link.rel}`,
          context: nodeContext(other),
        };
      }),
    ];
    const context = nodeContext(node);

    root.innerHTML = `
      <div class="panel-head">
        <p class="panel-kicker"><span class="glyph glyph-${groupOf(node)}"></span>${linkifyRosterJoy(group.kind, context)}</p>
        ${preview ? "" : `<button type="button" class="panel-close" data-close="true">${escapeHtml(copy.close)}</button>`}
      </div>
      <h2 class="panel-title">${linkifyRosterJoy(node.label, context)}${node.now ? `<span class="now-tag">${escapeHtml(copy.now)}</span>` : ""}</h2>
      ${node.sub ? `<p class="panel-sub">${linkifyRosterJoy(node.sub, context)}</p>` : ""}
      <p class="panel-blurb">${linkifyRosterJoy(node.blurb, context)}</p>
      ${actions.length ? `<div class="panel-actions">${actions.join("")}</div>` : ""}
      <div class="panel-connections">
        <p class="panel-kicker">${escapeHtml(copy.connections)} (${count})</p>
        <ul>
          ${related.map((row) => connectionRow(row)).join("")}
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
    root.querySelectorAll<HTMLAnchorElement>("a.conn-label").forEach((anchor) => {
      anchor.addEventListener("click", () => {
        const id = anchor.dataset.id;
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

function nodeContext(node: GraphNode): string {
  return [node.label, node.sub ?? "", node.blurb].filter(Boolean).join(" ");
}

function connectionRow(row: { id: string; label: string; rel: string; context: string }): string {
  const linked = mentionsRosterJoy(row.label);
  const label = linked ? "" : `<span class="conn-label">${escapeHtml(row.label)}</span>`;
  const brand = linked
    ? linkifyRosterJoy(row.label, row.context, {
        className: "conn-label text-link",
        dataId: row.id,
      })
    : "";
  const name = linked ? ` aria-label="${escapeAttr(`${row.rel} ${row.label}`)}"` : "";
  return `<li><button type="button" class="conn" data-id="${escapeAttr(row.id)}"${name}><span class="conn-rel">${escapeHtml(row.rel)}</span>${label}</button>${brand}</li>`;
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
