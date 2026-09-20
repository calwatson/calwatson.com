# calwatson.com

A full-screen interactive knowledge graph of Cal Watson's work. Vite + TypeScript + modular D3, static on Vercel.

This is a map, not a résumé: chapters, companies, RosterJoy, skills, schools, principles, and how they connect.

## Commands

```bash
npm install
npx playwright install chromium
npm run dev          # http://localhost:5173
npm run typecheck
npm test             # Vitest data integrity
npm run test:e2e     # Playwright smoke (1440×900 and 390×844)
npm run build        # production output in dist/
npm run og           # regenerate public/og.png
```

## Layout

Content lives in `src/data/graph.data.json`. Behavior is specified in `HANDOFF.md`. `AGENTS.md` is the always-on rule set.

## Deploy

Vercel project, framework preset Vite, output `dist`. Primary host `www.calwatson.com`; apex redirects to www.

The contact address is assembled at click time from `src/config.ts` (placeholder `hello@calwatson.com`) and must not appear in the HTML or DOM beforehand.
