# nanomountains

A Philippine mountain guide with a pre-climb planner for clubs and groups.

- **Browse** any mountain in 3D: terrain, trail, and POIs from jump-off to summit.
- **Plan your climb** from a mountain page: itinerary pinned to POIs, climb crew and roles, group vs individual gear, and meal planning, all shown on the same 3D view.
- **Fly the itinerary** steps the camera through each stop in order, so the whole group can see the climb during the pre-climb meeting.

This is a prototype. Plans are saved in the browser and shared by link (the plan is encoded in the URL); there is no backend yet.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## How it's built

| Piece | Choice | Cost |
|---|---|---|
| UI | React + TypeScript + Vite | free |
| 3D map | [MapLibre GL JS](https://maplibre.org/) with terrain, hillshade and color relief | free, open source |
| Elevation | [Mapzen Terrain Tiles on AWS Open Data](https://registry.opendata.aws/terrain-tiles/) (Terrarium) | free, no API key |
| Optional basemaps | OpenTopoMap, Esri World Imagery | free with attribution |
| Hosting | Cloudflare Pages (`public/_redirects` handles SPA routes) | free |

## Project layout

```
src/
  data/types.ts        Mountain, Trail, Poi, ClimbPlan types
  data/mountains.ts    Mountain data (one entry per mountain)
  data/plans.ts        Plan storage, share links, BMC-style starter plan
  components/MountainMap.tsx   The reusable 3D mountain view
  pages/               Home, mountain page, plan page
```

Routes: `/mountains/:mountainId` (browse) and `/mountains/:mountainId/plans/:planId` (plan).

## Adding a mountain

Every mountain uses the same 3D view, so a new mountain is just data in `src/data/mountains.ts`: a center/camera, one or more trails (`path` as `[lng, lat]` points from jump-off to summit), and POIs along the trail.

The trail lines for Mt. Pulag and Mt. Batulao are **hand-placed approximations**. Replace them with a real GPX track from a club climb before relying on them.

## Next steps

- GPX import for trails and POIs
- Supabase (Postgres + PostGIS, auth, realtime) so crews can edit a plan together during the pre-climb
- Elevation profile along the trail
- Weather at camp and summit (Open-Meteo)
- Post-climb: compare the actual GPX track with the plan
