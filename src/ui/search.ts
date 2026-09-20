import { copy } from "../data/graph.ts";

export function mountSearch(input: HTMLInputElement, onQuery: (value: string) => void, onEnter: () => void): void {
  input.placeholder = copy.searchPlaceholder;
  input.setAttribute("aria-label", copy.searchPlaceholder);
  input.addEventListener("input", () => onQuery(input.value));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onEnter();
    }
  });
}
