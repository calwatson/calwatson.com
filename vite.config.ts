import { defineConfig, type Connect, type Plugin } from "vite";

/** Vercel serves `/_vercel/insights/script.js` once Web Analytics is enabled. */
function localAnalyticsScript(): Plugin {
  const serve: Connect.NextHandleFunction = (req, res, next) => {
    const path = req.url?.split("?")[0];
    if (path !== "/_vercel/insights/script.js") {
      next();
      return;
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/javascript; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end("/* Vercel serves the real Web Analytics script in deployment. */\n");
  };

  return {
    name: "local-analytics-script",
    configureServer(server) {
      server.middlewares.use(serve);
    },
    configurePreviewServer(server) {
      server.middlewares.use(serve);
    },
  };
}

export default defineConfig({
  plugins: [localAnalyticsScript()],
  build: {
    target: "es2022",
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
