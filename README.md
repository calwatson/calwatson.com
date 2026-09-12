# calwatson.com

Personal site for Cal Watson — founder, operator, and engineer. A quiet home base, not a product landing page or a résumé. Built to deploy on Vercel at [calwatson.com](https://calwatson.com).

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- `create-next-app` defaults otherwise (`src/`, ESLint, `@/*` imports)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build   # production build
npm start       # serve the production build
npm run lint    # ESLint
```

## Project layout

- `src/app/page.tsx` — homepage composition
- `src/app/layout.tsx` — fonts, metadata, Open Graph
- `src/app/opengraph-image.tsx` — generated social card
- `src/app/icon.tsx` / `apple-icon.tsx` — monogram favicon
- `src/components/` — hero, building now, how I work, path, elsewhere, footer
- `src/lib/links.ts` — RosterJoy, LinkedIn, GitHub

## Deploy on Vercel

1. Push this repo to GitHub: `https://github.com/calwatson/calwatson.com`
2. In [Vercel](https://vercel.com), **Add New Project** and import that repository
3. Framework preset should be Next.js. Leave the build command as `next build` (or `npm run build`) and the output as the default
4. Deploy

### Attach the custom domain

1. In the Vercel project: **Settings → Domains**
2. Add `calwatson.com` and `www.calwatson.com`
3. At your DNS host, follow Vercel’s records (typically an A record for the apex and a CNAME for `www`)
4. Wait for HTTPS to provision. Prefer the apex (`calwatson.com`) as the primary and redirect `www` to it, or the reverse — pick one and keep it consistent with `metadataBase` in `src/app/layout.tsx` (currently `https://calwatson.com`)

## First push to GitHub

From this directory, after creating an empty `calwatson/calwatson.com` repo:

```bash
git init
git add .
git commit -m "Initial calwatson.com personal site"
git branch -M main
git remote add origin https://github.com/calwatson/calwatson.com.git
git push -u origin main
```

Then import the repo in Vercel as above.
