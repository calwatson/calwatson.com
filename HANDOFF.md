# calwatson.com: build hand-off for Cursor

**Owner:** Cal Watson (cal.watson@gmail.com)
**Goal:** Turn the working prototype in `prototype/index.html` into a production Vite + TypeScript site, deployed to Vercel at `www.calwatson.com`.
**Status of the prototype:** Design and behavior are approved. Port it faithfully; do not redesign it.

---

## 1. What this site is

The entire site is one full-screen, interactive **knowledge graph of Cal's career**: chapters, companies, RosterJoy, skills, schools, principles, draft notes, and links elsewhere. There are no pages and no scrolling sections. Hover or tap a node to read about it and see how it connects to everything else.

Cal is a founder and engineer in Columbia, SC. He is building **RosterJoy** (rosterjoy.com, signup sheets for real life) and works as a Solutions Architect at Cursor. The site replaces a plain text page at the same domain.

**Audience:** recruiters, peers, and prospective RosterJoy users. Must work well on phones.

## 2. Locked decisions (do not reopen)

| Decision | Choice |
| --- | --- |
| Stack | Vite + TypeScript, no UI framework |
| Graph library | D3 v7, **modular imports only** (`d3-force`, `d3-selection`, `d3-zoom`, `d3-drag`, `d3-shape`, `d3-transition`, `d3-array`) |
| Hosting | Vercel, static output (`dist`) |
| Contact | `mailto:` link built at click time so the address is never in the HTML or DOM |
| Look | One dark green-black theme. No light theme, no theme toggle |
| Routing | None. Single page |
| Analytics / cookies | None |
| Copy | Cal's words. Do not rewrite, "improve", or add copy |

## 3. What is in this bundle

```
HANDOFF.md                  this file
AGENTS.md                   short always-on rules; copy to the repo root
prototype/index.html        source of truth for behavior and visuals (single file, uses D3 from cdnjs)
data/graph.data.json        all nodes, links, node types, filter groups (45 nodes, 52 links, verified connected)
design/tokens.css           extracted CSS custom properties
reference/*.png             target renders at 1440x900, 390x844, 360x640, and a selected-node state
```

The reference PNGs were rendered in a sandbox **without web fonts**, so text shows in a fallback face. The real faces are in section 7.

There is also a private preview of the prototype at https://claude.ai/artifact/Xf4c4frBbxWARYL7Weanjb (only Cal can open it).

## 4. Target architecture

```
calwatson/
  index.html                 semantic shell + static plain-text section + meta/OG/JSON-LD
  package.json  tsconfig.json  vite.config.ts  vercel.json
  public/                    favicon.svg, og.png (to create), robots.txt, sitemap.xml
  scripts/                   optional: check-plaintext.ts
  src/
    main.ts                  boot: build graph, wire UI
    config.ts                CONTACT = { user, host } (placeholder, see section 12)
    data/
      graph.data.json        copied from bundle; the only place content lives
      graph.ts               typed loader + indexes (byId, adjacency)
    graph/
      types.ts               NodeType, GroupId, GraphNode, GraphLink
      layout.ts              targets, forces, settle(), fit(), relayout
      render.ts              SVG creation, symbols, labels, tick
      interaction.ts         zoom, drag, select, hover, highlight, reveal
    ui/
      panel.ts               detail panel + phone sheet
      chips.ts               filter chips (incl. phone defaults)
      search.ts              desktop search
      contact-modal.ts       dialog, form, mailto builder, focus trap
    styles/
      tokens.css  base.css  bar.css  graph.css  panel.css  modal.css  mobile.css
  tests/
    data.test.ts             Vitest, data integrity
    e2e/smoke.spec.ts        Playwright
```

Keep modules small and typed. No `any`. Content must come only from `graph.data.json`; components never hard-code labels.

### Data model

```ts
type NodeType =
  | "person" | "place" | "invite" | "link"
  | "arc" | "org" | "product" | "usecase"
  | "skill" | "school" | "principle" | "note";

type GroupId = "core" | "arc" | "org" | "product" | "skill" | "school" | "principle" | "note";

interface GraphNode {
  id: string;
  type: NodeType;
  label: string;        // short; shown on the graph
  sub?: string;         // subtitle in the panel
  blurb: string;        // panel body
  idx?: number;         // arcs only: 0..3, chronological
  arc?: string;         // orgs and the product: id of parent arc
  now?: boolean;        // shows a "Now" tag and a glow
  url?: string;         // external link button in the panel
  urlLabel?: string;
}
interface GraphLink { source: string; target: string; rel: string; }
```

`graph.data.json` also holds `types` (shape, symbol area, radius, group) and `groups` (chip labels, `hiddenByDefaultOnPhones`). `link.rel` reads left to right (`cal -> cursor: "works at"`); the panel shows `rel →` for outgoing and `← rel` for incoming.

**Integrity rules (enforce in tests):** ids unique; every link endpoint exists; every `arc` reference exists; arcs have `idx` 0..3 with no gaps; the graph is connected from `cal`; every node type is defined in `types`.

## 5. Behavior spec (port exactly)

### 5.1 Layout (deterministic force simulation)

- World size equals the canvas size (min 280 x 300). `S = clamp(min(W/1000, H/700), 0.68, 1.4)`. `portrait = H > 1.05 * W`. `compact = viewport <= 899px || W < 700`.
- Forces: `link`, `manyBody`, `collide` (2 iterations), `x`, `y`.
- **Link distance:** any link touching `cal` = 150S. Arc to arc = 220S (landscape) or 150S (portrait). Arc to anything else = 105S. All others = 84S.
- **Link strength:** touching `cal` = 0.25 (0.03 for `cal` to `cursor` or `rosterjoy` in portrait, so they do not drag the chapters out of order). Arc to arc = 0.5. Others = 0.8.
- **Charge (times S squared):** person -700, arc -520, product -420, org -300, everything else -190.
- **Collide radius:** `r + 6 + label allowance`. Allowance = `min(len * 2.4, 34)` landscape, `min(len * 3.2, 46)` portrait, and 0 for leaf types when `compact` (their labels are hidden).
- **Targets (x, y, strengthX, strengthY):**

| Node | Landscape | Portrait |
| --- | --- | --- |
| arc | x = W(0.13 + 0.245 idx), y = 0.56H, 0.42, 0.30 | x = 0.5W, y = H(0.26 + 0.19 idx), 0.5, 1 |
| org / product (has `arc`) | x = parent arc x, y = 0.56H, 0.07, 0.02 | x = 0.5W plus or minus 0.3W (alternate by index within the arc), y = parent arc y, 0.14, 0.16 |
| `cal` | (0.5W, 0.13H), 0.14, 0.30 | (0.5W, 0.07H), 0.30, 0.50 |
| everything else | (0.5W, 0.5H), 0.03, 0.03 | same |

- **Precompute:** set all positions to NaN, then `sim.alpha(1).tick(420)` synchronously before first paint, so the first frame is already settled. It is deterministic; the same input gives the same layout.
- **Drag:** `alphaTarget(0.25)` on start, pin `fx/fy`, release on end.
- **Relayout:** on resize (debounced 200 ms) if canvas width changes by more than 24 px or height by more than 60 px, re-run targets, settle, and fit. Resets manual drags; that is acceptable.
- **Fit:** bounding box of visible nodes plus 56 px padding (plus 22 px extra at the bottom for labels). Bottom inset: on phones `max(panelHeight, 150) + 46`, on desktop 30. `k = clamp(min(availW/bw, availH/bh), 0.3, 1.5)`, centered.

The spine (the four `arc` nodes joined by `rel: "then"`) runs **left to right in landscape and top to bottom in portrait**, earlier to now. That ordering is the core idea of the layout; never let it break.

### 5.2 Rendering

- One SVG, one `<g>` transformed by zoom. Draw order: edges, edge labels, nodes.
- Each node: transparent hit circle (`r = max(r + 4, 17)`, so touch targets are at least 34 px), a `d3.symbol` shape by type, and a label at `y = r + 14`.
- Shapes: person circle, arc ring (filled with background, mint stroke), org square, product star, use case dot, skill dot, school triangle, principle hollow diamond, note dashed circle, link wye, invite dashed ring (pulses; disabled under `prefers-reduced-motion`).
- Edge between arcs (`then`) is the mint "spine": 3 px, 0.75 opacity. Other edges are 1.2 px `--edge`.
- Nodes with `now: true` get a soft mint glow (`drop-shadow`).
- **Label visibility:** on compact screens with zoom `k < 1.45`, hide labels of leaf types (skill, usecase, note, place, school, principle, link) unless the node is highlighted.

### 5.3 Interaction

- **Focus set** = hovered node, else selected node. Neighbors of the focus stay at full opacity; everything else dims to 0.14. Edges touching the focus turn mint and show their `rel` label.
- **Hover** previews in the panel only when `(hover: hover)` matches. **Click / tap / Enter / Space** selects and locks the panel. Clicking empty canvas, the panel's Close button, or pressing Esc clears the selection.
- Connection rows in the panel are buttons that select the other node.
- **Zoom/pan:** scale extent 0.3 to 4. Wheel always zooms. Touch: pinch zooms and one-finger drag pans, except a one-finger touch that starts on a node drags the node. Double-click zoom is off. Buttons: zoom in, zoom out, reset (re-fit).
- **Search (desktop only):** dims non-matches on label or subtitle; Enter selects the first match.
- **Filters:** one chip per group with a count and `aria-pressed`. Off groups get `display: none` on nodes, edges, and edge labels. Positions do not change. `core` nodes (person, place, invite, link) are never filterable. On phones (`max-width: 899px`) skill, school, principle, and note start **off**. Selecting a node in an off group (for example from a panel connection) turns its group back on.

### 5.4 Panel

- **Desktop (>= 900px):** fixed 340 px column at the right. Default state is the "How to read this" intro.
- **Phone (< 900px):** a bottom sheet overlaying the graph, max 46% of the canvas height, 10 px margins, respects `env(safe-area-inset-bottom)`. Empty state is a compact 2-line intro. On selection the sheet grows and `reveal()` pans the node into the free area above it if it would be covered.
- Contents: kind label with group glyph and a Close button (when selected), title (with "Now" tag if set), subtitle, blurb, action buttons, then "Connections (n)".
- Action buttons: `url` becomes an external link (`target="_blank" rel="noopener"`). The `invite` node gets a **Claim the slot** button that opens the contact modal.

### 5.5 Contact modal

- Opened by the top-bar "Say hi" button and the invite node's button. Full-screen backdrop, card max 480 px.
- Fields: reason (radio chips: Working together, RosterJoy, Talking shop, Just saying hi; default first), name (handwriting-style input), note (ruled textarea). Inputs are 16 px minimum on phones to prevent iOS zoom.
- Submit builds `mailto:{user}@{host}?subject={encodeURIComponent("calwatson.com: " + reason)}&body={encodeURIComponent(note + "\n\n— " + name)}` from `config.ts` at click time. Show status text: "Opening your mail app. If nothing happens, LinkedIn works too."
- Esc, backdrop click, and Close all dismiss; focus returns to the opener. **Implement a real focus trap** (the prototype does not).
- The address must not appear in `index.html`, the rendered DOM, or any `href` before the click.

## 6. Layout shell

- `html, body { height: 100%; overflow: hidden }`. `.app` is a flex column: top bar, chips row, body.
- **Top bar (desktop):** name (h1), tagline with the amber highlight under "real people", search input, "Say hi" button. **Phone:** name and "Say hi" only; tagline and search hidden.
- **Chips row:** horizontally scrollable, hidden scrollbar.
- **Body:** desktop grid `1fr 340px`; phone single column with the panel absolutely positioned.
- Use dynamic viewport handling so the browser toolbar on phones never hides the sheet or chips.

## 7. Design tokens

Use `design/tokens.css` as-is.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#07120E` | page and graph field |
| `--panel` | `#0C1A14` | panel, modal, inputs |
| `--line` | `#1C3126` | borders |
| `--ink` / `--ink2` | `#E8F3EC` / `#98B0A4` | primary and muted text |
| `--c-arc` | `#5FE0A3` | mint: chapters, spine, primary buttons, focus ring |
| `--c-org` | `#6DB8FF` | organizations |
| `--c-product` | `#FFB047` | RosterJoy and use cases; the tagline highlight |
| `--c-school` | `#FF8B78` | schools |
| `--c-skill` | `#B9CBC1` | skills and notes |
| `--c-person` / `--c-link` / `--c-principle` | near-white | Cal, links, principles |

**Type:** Bricolage Grotesque 800 for name, chapter/product labels, and panel titles. Figtree 400 to 600 for body and UI. Caveat 600 **only** for the "Sign here" input. Self-host with `@fontsource-variable/bricolage-grotesque`, `@fontsource/figtree`, and `@fontsource/caveat` (latin subset, `font-display: swap`, preload the two above-the-fold faces). Remove the Google Fonts and cdnjs requests from the prototype.

## 8. Accessibility (required)

- Landmarks: `header`, `main`, `aside`; one `h1`.
- Every node is `tabindex="0" role="button"` with `aria-label="{label}, {kind}"`. Visible focus ring.
- A **static, visually hidden plain-text version** of the whole site stays in `index.html` (About, RosterJoy, How I work, Path, Education, Elsewhere). It must be in the initial HTML, not generated by JS. Add a test that every `org`, `school`, `arc`, and `product` label appears in it, so it cannot drift from the data.
- The panel is `aria-live="polite"`. Chips use `aria-pressed`. Modal has `role="dialog" aria-modal="true"` and a labelled heading.
- `prefers-reduced-motion`: no pulse, no smooth transitions on zoom.
- Contrast: all text and UI colors above pass WCAG AA on `--bg`; confirm with axe.

## 9. SEO and sharing

- `<title>Cal Watson</title>`; meta description (see prototype); canonical `https://www.calwatson.com/`.
- Open Graph and Twitter card tags; **create `public/og.png` (1200 x 630)**: name in Bricolage Grotesque on `--bg` with a fragment of the graph. Render it from an HTML file with Playwright rather than hand-drawing it.
- JSON-LD `Person`: name, url, `sameAs` (LinkedIn `https://www.linkedin.com/in/jcfive`, GitHub `https://github.com/calwatson`), address Columbia, SC, `alumniOf` (Emory, Villanova, Wake Forest). Add `worksFor` for Cursor **only after Cal confirms** (section 12).
- `robots.txt` allowing all; `sitemap.xml` with the single URL.

## 10. Performance budget

- Total JS at most 60 KB gzip, CSS at most 10 KB gzip, no third-party requests.
- Settled first paint: precompute must take under 50 ms on a mid-range phone.
- No layout shift after load. Lighthouse (mobile): Performance >= 90, Accessibility >= 95, Best Practices >= 95, SEO 100.

## 11. Milestones and acceptance criteria

Work in order. After each milestone run `npm run typecheck && npm test && npm run build`, and commit.

| # | Milestone | Done when |
| --- | --- | --- |
| M0 | Scaffold: Vite + TS, ESLint, Prettier, Vitest, Playwright, scripts (`dev`, `build`, `preview`, `typecheck`, `test`, `test:e2e`) | `npm run dev` serves a blank shell; CI-style command passes |
| M1 | Data + types: import `graph.data.json`, typed loader, indexes, `tests/data.test.ts` | All integrity rules pass; 45 nodes, 52 links |
| M2 | Shell + tokens + fonts: top bar, chips row, body grid, self-hosted fonts | Matches `reference/desktop-1440x900.png` chrome |
| M3 | Layout + render: forces, precompute, fit, SVG, symbols, labels, zoom controls | Desktop graph visually matches the reference; spine runs left to right; **pause for Cal's review** |
| M4 | Interaction: hover, select, highlight, edge labels, keyboard, Esc, drag, zoom/pan | All of 5.3 works with mouse and keyboard |
| M5 | Panel, chips, search | Panel content matches 5.4; filters work; search works |
| M6 | Phone: portrait layout, bottom sheet, `reveal()`, default-hidden groups, touch | Matches `reference/phone-*.png`; spine runs top to bottom; no horizontal scroll at 360 px; **pause for Cal's review on a real phone** |
| M7 | Contact modal + config | Form builds the correct `mailto`; focus trap works; address absent from HTML/DOM |
| M8 | A11y, SEO, plain-text section, JSON-LD, OG image | axe: zero violations; Lighthouse targets met |
| M9 | Deploy: Vercel project, headers, domain | Site live at `www.calwatson.com`; apex redirects to www |

### Test plan

**Vitest (`tests/data.test.ts`):** integrity rules from section 4; the plain-text section contains every `org`, `school`, `arc`, and `product` label; `types` covers every node type.

**Playwright (`tests/e2e/smoke.spec.ts`), at 1440x900 and 390x844:**

1. Page loads with no console errors and no requests to other origins.
2. 45 node groups exist in the SVG (fewer visible on phone because of default-hidden groups: assert 23 visible, meaning 45 minus 13 skills, 3 schools, 3 principles, and 3 notes).
3. Clicking `Mendix` shows "Senior Solutions Architect" in the panel; Esc clears it.
4. Toggling the Skills chip hides the 13 skill nodes and their edges.
5. On phone, selecting a node from a hidden group via a panel connection turns that chip on.
6. "Say hi" opens the modal; submitting with reason "RosterJoy" navigates to a `mailto:` URL whose subject is `calwatson.com: RosterJoy`.
7. `document.documentElement.scrollWidth <= window.innerWidth` at 360, 390, 1024, 1440.
8. The address string never appears in `document.documentElement.outerHTML` before the click.

## 12. Deploy (Vercel)

- Framework preset: Vite. Build `npm run build`, output `dist`. Node 20+.
- Domains: `www.calwatson.com` (primary) and `calwatson.com` (redirect to www). Cal manages DNS at his registrar; give him the exact records Vercel shows.
- `vercel.json` (starting point; verify nothing breaks):

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

D3's `.style()` writes through the CSSOM, which CSP allows. If any inline style attribute is still needed, prefer a class over loosening `style-src`.

## 13. Known gaps in the prototype (fix while porting)

1. D3 and fonts load from CDNs; bundle both locally.
2. No focus trap in the contact modal.
3. On desktop, the bottom-right hint text can sit close to the lowest labels; the fit adds a 30 px bottom pad. Verify at 1280x720 and 1440x900, and move the hint into the panel's intro if it collides.
4. On phones, edge labels can overlap node labels when a node is selected. Acceptable for v1; consider showing edge labels only at `k >= 1`.
5. Relayout on resize discards manual drags.
6. No tests, no CI, no OG image.
7. The page has been checked in headless Chromium only. Test on a real iPhone (Safari) and Android (Chrome) at M6.

## 14. Do not

- Add a framework, router, state library, CSS framework, or analytics.
- Rewrite or add copy, rename nodes, or add nodes without Cal's approval.
- Change the palette, node shapes, or layout targets.
- Put the contact address in the HTML, DOM, or a pre-click `href`.
- Add a light theme or theme toggle.

## 15. Open items for Cal (Cursor: leave these as clearly marked placeholders)

1. **Real contact address.** `config.ts` ships with the placeholder `hello@calwatson.com`. Cal must confirm it exists or supply another.
2. **Cursor role.** The graph and plain text say "Solutions Architect, Cursor" (Cal's current role). Confirm he wants it public before JSON-LD `worksFor` is added.
3. **Notes.** The three notes ("Why sign-ups break", "Naming for neighbors", "Demo before they ask") are drafts marked "Drafting" with no page behind them. Keep them as dashed draft nodes until real writing exists.
4. **Domain / DNS access** for the Vercel cutover.
5. **Canonical host.** Assumed `www.calwatson.com`; confirm.

## 16. First prompt to paste into Cursor (Agent mode)

> Read `AGENTS.md` and `HANDOFF.md` in full. Open `prototype/index.html` and the images in `reference/`. Scaffold the project as described in section 4 and build it milestone by milestone (M0 to M9). The prototype is the source of truth for behavior and look; port it into typed modules without changing copy, palette, shapes, or layout targets. After each milestone run `npm run typecheck && npm test && npm run build` and commit. Stop for my review after M3 and after M6. Leave the contact address as the placeholder in `src/config.ts` and list anything you could not verify.
