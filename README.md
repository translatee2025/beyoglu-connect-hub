# Beyoğlu Connect

A neighborhood community hub for **Beyoğlu, İstanbul** — a directory of real local
venues (food & drink, health, shopping & services, pets, culture & leisure),
plus events, classifieds, rentals, parking, lost & found, jobs, and a community feed.

## Tech stack
- **Vite + React 18 + TypeScript**, React Router, TanStack Query
- **Tailwind CSS + shadcn/ui**, Leaflet maps
- **Supabase** (Postgres, Auth, Storage, Realtime) — backend project **CityHub**

## Develop
```sh
npm install
npm run dev          # http://localhost:8080
```

## Test
```sh
npm test             # Vitest unit tests
```

## Build / preview
```sh
npm run build        # outputs to dist/
npm run preview
```

## Environment
The Supabase connection is read from `.env`:
```
VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon public key>"
VITE_SUPABASE_PROJECT_ID="<project-ref>"
```

## Deploy
Pushes to `main` auto-build and deploy to **GitHub Pages** via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). The production
site is served from the `/beyoglu-connect-hub/` base path (configured in
`vite.config.ts` and the router `basename`).

## Documentation
See [DOCUMENTATION.md](DOCUMENTATION.md) for the full feature, data-model and workflow reference.
