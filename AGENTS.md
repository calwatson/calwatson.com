# AGENTS.md

Project: calwatson.com, a full-screen interactive knowledge-graph site for Cal Watson. Vite + TypeScript + modular D3 v7, static, deployed on Vercel.

Read `HANDOFF.md` first. It is the full brief, behavior spec, milestone list, and acceptance criteria. `prototype/index.html` is the source of truth for behavior and visuals; port it, do not redesign it.

## Commands

- `npm run dev` start the dev server
- `npm run typecheck` strict TypeScript, no emit
- `npm test` Vitest (data integrity)
- `npm run test:e2e` Playwright smoke tests (desktop 1440x900 and phone 390x844)
- `npm run build` production build to `dist`

Run `typecheck`, `test`, and `build` after every milestone before committing.

## Rules

- Content lives only in `src/data/graph.data.json`. Components never hard-code labels, blurbs, or links.
- Copy is Cal's. Do not rewrite, add, rename, or reorder it without approval.
- Keep the palette in `src/styles/tokens.css` (one dark theme, no light theme, no toggle).
- Keep node shapes and layout targets exactly as specified in `HANDOFF.md` section 5. The four chapters form a spine: left to right on landscape, top to bottom on portrait, earlier to now. Never break that ordering.
- D3: import modules (`d3-force`, `d3-selection`, `d3-zoom`, `d3-drag`, `d3-shape`, `d3-transition`, `d3-array`), never the `d3` bundle.
- No UI framework, router, state library, CSS framework, analytics, cookies, or third-party requests. Fonts are self-hosted via `@fontsource`.
- The contact email address must never appear in `index.html`, the DOM, or any `href` before the click. It is assembled from `src/config.ts` inside the submit handler. The value in `config.ts` is a placeholder; do not invent a real address.
- TypeScript strict mode, no `any`, small single-purpose modules.
- Accessibility is required: keyboard-operable nodes, visible focus, a static visually hidden plain-text version of the site in `index.html`, `prefers-reduced-motion` respected, contact modal focus trap.
- Touch targets on graph nodes are at least 34 px (hit circle radius 17).
- Budgets: JS under 60 KB gzip, CSS under 10 KB gzip, Lighthouse mobile Performance 90+, Accessibility 95+, SEO 100.

## When unsure

Prefer the prototype's behavior over your own judgment. If the prototype and `HANDOFF.md` disagree, follow `HANDOFF.md` and flag it. Stop for review after milestones M3 and M6, and list anything you could not verify.
