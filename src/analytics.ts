import { inject } from "@vercel/analytics";

let started = false;

function envString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * Start Vercel Web Analytics once.
 *
 * Production builds send page views after Web Analytics is enabled on the
 * Vercel project. Vercel injects `VITE_VERCEL_OBSERVABILITY_CLIENT_CONFIG`
 * at build time (script and intake stay on the site origin). Local dev and
 * preview pin the same-origin script path so the package's third-party
 * debug script is never requested.
 */
export function initAnalytics(): void {
  if (started) return;
  started = true;

  const basePath = envString(import.meta.env.VITE_VERCEL_OBSERVABILITY_BASEPATH);
  const config = envString(import.meta.env.VITE_VERCEL_OBSERVABILITY_CLIENT_CONFIG);

  inject(
    {
      mode: import.meta.env.PROD ? "production" : "development",
      debug: false,
      ...(import.meta.env.DEV ? { scriptSrc: "/_vercel/insights/script.js" } : {}),
      ...(basePath ? { basePath } : {}),
    },
    config,
  );
}
