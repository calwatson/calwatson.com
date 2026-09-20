import { countByGroup, groups } from "../data/graph.ts";
import { CHIP_ORDER, type GroupId } from "../graph/types.ts";

export function mountChips(
  root: HTMLElement,
  hidden: ReadonlySet<GroupId>,
  onToggle: (group: GroupId, pressed: boolean) => void,
): { sync: (hidden: ReadonlySet<GroupId>) => void } {
  root.replaceChildren();
  const buttons = new Map<GroupId, HTMLButtonElement>();

  for (const group of CHIP_ORDER) {
    const def = groups[group];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `chip chip-${group}`;
    btn.setAttribute("aria-pressed", hidden.has(group) ? "false" : "true");
    btn.innerHTML = `<span class="glyph glyph-${group}"></span><span>${escapeText(def.label)}</span> <em>${countByGroup(group)}</em>`;
    btn.addEventListener("click", () => {
      const next = btn.getAttribute("aria-pressed") !== "true";
      onToggle(group, next);
    });
    root.append(btn);
    buttons.set(group, btn);
  }

  return {
    sync: (nextHidden) => {
      for (const [group, btn] of buttons) {
        btn.setAttribute("aria-pressed", nextHidden.has(group) ? "false" : "true");
      }
    },
  };
}

function escapeText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
