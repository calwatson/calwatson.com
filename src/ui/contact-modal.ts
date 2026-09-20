import { CONTACT } from "../config.ts";
import { copy } from "../data/graph.ts";

export interface ContactModal {
  open: (opener: HTMLElement) => void;
  close: () => void;
}

export function mountContactModal(dialog: HTMLDialogElement): ContactModal {
  let opener: HTMLElement | null = null;
  const form = dialog.querySelector("form");
  const status = dialog.querySelector<HTMLElement>("[data-status]");
  const closeBtn = dialog.querySelector<HTMLButtonElement>("[data-close-modal]");

  if (!form) throw new Error("Contact form missing");

  const focusable = () =>
    [
      ...dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
      ),
    ].filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);

  function trap(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusable();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function open(from: HTMLElement): void {
    opener = from;
    if (status) status.textContent = "";
    dialog.showModal();
    const first = dialog.querySelector<HTMLElement>("input, textarea, button");
    first?.focus();
    dialog.addEventListener("keydown", trap);
  }

  function close(): void {
    dialog.close();
    dialog.removeEventListener("keydown", trap);
    opener?.focus();
  }

  closeBtn?.addEventListener("click", close);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const reason = String(data.get("reason") || copy.reasons[0]);
    const name = String(data.get("name") || "").trim();
    const note = String(data.get("note") || "").trim();
    const address = `${CONTACT.user}@${CONTACT.host}`;
    const mailto = `mailto:${address}?subject=${encodeURIComponent(`calwatson.com: ${reason}`)}&body=${encodeURIComponent(`${note}\n\n— ${name}`)}`;
    if (status) status.textContent = copy.submitStatus;
    window.location.assign(mailto);
  });

  return { open, close };
}
