# atpol.js

TypeScript library implementing the **ATPOL botanical grid system** — a coordinate grid used in Polish and Central European flora atlases to record plant occurrences. Covers roughly 49–55°N, 14–25°E (Poland).

## Repo layout

```
/                   ← library root (npm package @ib-pan/atpol)
  atpol.ts          ← all library implementation
  main.ts           ← public entry: re-exports everything as ATPOL namespace
  atpol.test.ts     ← Bun test suite
  bunup.config.ts   ← build config (bunup, outputs ESM + CJS + .d.ts to dist/)
demo/               ← standalone Nuxt web app (separate npm workspace)
  app/
    pages/          ← calculator-from-grid-code, calculator-to-grid-code, converter, docs
    components/     ← AtpolMap (Leaflet), AtpolBoundsTable, DarwinCoreFields, etc.
    utils/
      atpol-export.ts  ← KML / GeoJSON / Shapefile ZIP export (pure browser, no deps)
      coord-utils.ts   ← DD ↔ DMS conversion helpers
```

## Library

### Coordinate systems

| Type | Description |
|------|-------------|
| `ATPOL.LatLon` | WGS84 GPS `{ lat, lon }` in degrees (EPSG:4326) |
| `ATPOL.XY` | ATPOL Cartesian `{ x, y }` in km. Origin = NW corner; x eastward, y southward. Center of Poland (52°N 19°E) ≈ `{ x: 330, y: 350 }`. |
| `string` | ATPOL grid code e.g. `"DF695501"` |

### Grid code format

`ED 26 27 20 61 33` — letter pair (100 km) + up to 5 digit pairs (each ×10 finer), plus optional division suffix `d`/`c`/`p` for halving, quartering, or quintupling.

### Public API (`main.ts` → namespace `ATPOL`)

- `latlon_to_xy`, `xy_to_latlon` — convert between WGS84 and ATPOL Cartesian
- `xy_to_grid`, `grid_to_xy` — convert between Cartesian and grid code (with xoffset/yoffset)
- `latlon_to_grid`, `grid_to_latlon` — combined convenience functions
- `grid_to_latlon_bounds`, `grid_to_xy_bounds` — get all four corners + center
- `grid_is_valid`, `grid_normalize`, `grid_get_division_type`
- `grid_to_square_side_in_meters`, `grid_to_square_side_in_km`, `grid_to_coordinate_uncertainty_in_meters`
- `grid_to_polygonWKT`, `grid_to_centroidWKT` — WKT strings (for Darwin Core `footprintWKT`)
- `grid_to_darwincore_fields` — returns a complete `DarwinCoreFields` object (all strings, ready for GBIF/Darwin Core records)

### Build & test

```sh
# from repo root
bun run build          # bunup → dist/index.js, dist/index.cjs, dist/index.d.ts
bun test               # run atpol.test.ts
```

## Demo

Nuxt 4 SPA in Polish, published to GitHub Pages. Uses Nuxt UI (TailwindCSS 4), Leaflet for the interactive map, highlight.js for syntax highlighting, and Plausible analytics.

```sh
# from demo/
bun run dev            # dev server
bun run build          # generate static output → demo/.output/public/
bun run typecheck      # vue-tsc typecheck
bun run lint           # eslint
```

The demo imports the library **directly from the repo root** (`../main`) — not from npm — so it always runs the local source.

## Code style

- Tabs for indentation (4 spaces wide), LF line endings
- Semicolons, double quotes
- Ignore ESLint style errors (only logic/type errors matter)
- JSON files use 2-space indentation (see `.editorconfig`)

## Key constraints

- Library has **no runtime dependencies** — only `typescript` as a peer dep and `bunup`/`@types/bun` as devDeps.
- `bunup.config.ts` sets `target: "bun"` — keep this; do not change to `"node"`.
- The demo's `atpol-export.ts` intentionally has no external deps (generates KML/GeoJSON/SHP in pure browser JS).
- The demo is a **static SPA** (no server-side rendering beyond generation) for GitHub Pages deployment.
