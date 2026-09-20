export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let handle = 0;
  const wrapped = ((...args: never[]) => {
    window.clearTimeout(handle);
    handle = window.setTimeout(() => fn(...args), ms);
  }) as T;
  return wrapped;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isPhoneViewport(): boolean {
  return window.innerWidth <= 899;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
