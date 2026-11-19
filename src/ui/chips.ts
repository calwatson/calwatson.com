import { countByGroup, groups } from "../data/graph.ts";
import { CHIP_ORDER, type GroupId } from "../graph/types.ts";
import { mentionsRosterJoy, rosterJoyHref } from "./rosterjoy-link.ts";

export function mountChips(
  root: HTMLElement,
  hidden: ReadonlySet<GroupId>,
  onToggle: (group: GroupId, pressed: boolean) => void,
): { sync: (hidden: ReadonlySet<GroupId>) => void } {
  root.replaceChildren();
  const buttons = new Map<GroupId, HTMLButtonElement>();
  const shells = new Map<GroupId, HTMLElement>();

  for (const group of CHIP_ORDER) {
    const def = groups[group];
    const count = countByGroup(group);
    const on = !hidden.has(group);
    const brand = mentionsRosterJoy(def.label);

    if (!brand) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `chip chip-${group}`;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.innerHTML = `<span class="glyph glyph-${group}"></span><span>${escapeText(def.label)}</span> <em>${count}</em>`;
      btn.addEventListener("click", () => {
        const next = btn.getAttribute("aria-pressed") !== "true";
        onToggle(group, next);
      });
      root.append(btn);
      buttons.set(group, btn);
      continue;
    }

    const shell = document.createElement("span");
    shell.className = `chip chip-${group} chip-brand${on ? " is-on" : ""}`;
    const glyph = document.createElement("span");
    glyph.className = `glyph glyph-${group}`;
    glyph.setAttribute("aria-hidden", "true");
    const link = document.createElement("a");
    link.className = "text-link";
    link.href = rosterJoyHref(def.label);
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = def.label;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute("aria-label", `${def.label} ${count}`);
    btn.innerHTML = `<em>${count}</em>`;
    shell.append(glyph, link, btn);
    shell.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("a")) return;
      const next = btn.getAttribute("aria-pressed") !== "true";
      onToggle(group, next);
    });
    root.append(shell);
    buttons.set(group, btn);
    shells.set(group, shell);
  }

  return {
    sync: (nextHidden) => {
      for (const [group, btn] of buttons) {
        const on = !nextHidden.has(group);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        shells.get(group)?.classList.toggle("is-on", on);
      }
    },
  };
}

function escapeText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
