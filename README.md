# atpol

TypeScript library for working with the **ATPOL botanical grid system** — a coordinate grid used in Polish and Central European flora atlases to record plant occurrences. It covers the area roughly between 49–55°N and 14–25°E.

## Installation

```
npm install @ib-pan/atpol
```

```ts
import { ATPOL } from "@ib-pan/atpol";
```

---

## Coordinate systems

The library works with three coordinate representations:

| Type | Description |
|------|-------------|
| `ATPOL.LatLon` | WGS84 GPS coordinates (`{ lat, lon }` in degrees, EPSG:4326) |
| `ATPOL.XY` | ATPOL Cartesian coordinates (`{ x, y }` in km). Origin (0, 0) is the NW corner of the grid; x increases eastward, y increases southward. The geographic center of Poland (52°N, 19°E) maps to approximately `{ x: 330, y: 350 }`. |
| `string` | ATPOL grid code (e.g. `"DF695501"`) |

---

## Grid code format

A grid code is built from a **letter pair** followed by zero to five **digit pairs**, with an optional **division suffix**:

```
ED  26  27  20  61  33
^^  ^^  ^^  ^^  ^^  ^^
│   │   │   │   │   └─ 5th digit pair → 1 m side
│   │   │   │   └───── 4th digit pair → 10 m side
│   │   │   └───────── 3rd digit pair → 100 m side
│   │   └───────────── 2nd digit pair → 1 km side
│   └───────────────── 1st digit pair → 10 km side
└───────────────────── letter pair    → 100 km side
```

Each additional digit pair narrows the square by a factor of 10. Letters range A–G (x/easting first, y/southing second).

Within each digit pair the first digit encodes the y (northing) step and the second digit encodes x (easting), both running 0–9 from the NW corner.

### Division suffixes

An optional suffix subdivides the square more finely:

| Suffix         | Name                | Square side   | Digit ranges |
|----------------|---------------------|---------------|--------------|
| `d` + 2 digits | halves ("**d**wa")      | 1/2 of parent | 0–1 each     |
| `c` + 2 digits | quarters ("**c**ztery") | 1/4 of parent | 0–3 each     |
| `p` + 2 digits | fifths ("**p**ięć")     | 1/5 of parent | 0–4 each     |

The suffix digits are `(y_index)(x_index)` from the NW corner.

Examples: `ED26d01`, `DF695501c32`, `EG00p31`

### Square sizes at each precision level

| Code length | Side length | Example |
|-------------|-------------|---------|
| 2 (letters) | 100 km | `ED` |
| 4 | 10 km | `ED26` |
| 6 | 1 km | `ED2627` |
| 8 | 100 m | `ED262720` |
| 10 | 10 m | `ED26272061` |
| 12 | 1 m | `ED2627206133` |
| + `d` suffix | ×½ of base | `ED26d01` → 5 km |
| + `c` suffix | ×¼ of base | `ED26c02` → 2.5 km |
| + `p` suffix | ×⅕ of base | `ED26p13` → 2 km |

---

## API reference

### `grid_is_valid(grid)`

Returns `true` if the string is a valid ATPOL grid code. Case-insensitive, whitespace is ignored.

```ts
ATPOL.grid_is_valid("ED26")       // true  — 10 km square
ATPOL.grid_is_valid("ED26p13")    // true  — 2 km sub-square (fifths division)
ATPOL.grid_is_valid("ED26c02")    // true  — 2.5 km sub-square (quarters division)
ATPOL.grid_is_valid("ED26d01")    // true  — 5 km sub-square (halves division)
ATPOL.grid_is_valid("ED2627p55")  // false — digit 5 exceeds the allowed 0–4 for 'p'
ATPOL.grid_is_valid("ED2627c44")  // false — digit 4 exceeds the allowed 0–3 for 'c'
ATPOL.grid_is_valid("XZ99")       // false — letters out of A–G range
```

---

### `grid_normalize(grid, sep?)`

Strips all whitespace, uppercases the letter pair, lowercases the division suffix, and optionally inserts a separator `sep` between each component. Throws if the input is invalid.

```ts
ATPOL.grid_normalize("ED 26 27 20 P11")       // "ED262720p11"
ATPOL.grid_normalize("ED 26 27 20 P11", " ")  // "ED 26 27 20 p11"
ATPOL.grid_normalize("ed00")                  // "ED00"
ATPOL.grid_normalize("ED")                    // "ED"
```

---

### `latlon_to_xy(coords)`

Converts WGS84 coordinates to ATPOL Cartesian XY (in km).

```ts
ATPOL.latlon_to_xy({ lat: 52, lon: 19 })
// { x: 330, y: 350 }
// 52°N 19°E is the reference origin of the ATPOL projection

ATPOL.latlon_to_xy({ lat: 50.069, lon: 19.909 })
// { x: 395.12, y: 565.03 }  (near Kraków)
```

---

### `xy_to_latlon(coords)`

Inverse of `latlon_to_xy` — converts ATPOL XY back to WGS84.

```ts
ATPOL.xy_to_latlon({ x: 330, y: 350 })
// { lat: 52, lon: 19 }

ATPOL.xy_to_latlon({ x: 0, y: 0 })
// { lat: 55.030, lon: 13.840 }
// The NW corner of the entire grid — northwest of Poland
```

---

### `grid_to_xy(grid, xoffset?, yoffset?)`

Converts a grid code to an ATPOL XY point. By default (`xoffset=0, yoffset=0`) returns the **NW (upper-left) corner** of the square. Use offsets in the range 0–1 to get any point within the square; `(0.5, 0.5)` gives the center.

```ts
ATPOL.grid_to_xy("EG00")
// { x: 400, y: 600 }  — NW corner of the EG00 square

ATPOL.grid_to_xy("EG00", 0.5, 0.5)
// center of the square

ATPOL.grid_to_xy("EG00", 1, 1)
// { x: 410, y: 610 }  — SE corner (one 10 km step east and south)
```

When the grid code contains a division suffix, the offset is applied within that sub-square:

```ts
ATPOL.grid_to_xy("EG00p31")
// NW corner of the p31 fifth-subdivision within EG00
// equivalent to ATPOL.grid_to_xy("EG00", 1 * 0.2, 3 * 0.2)
// { x: 402, y: 606 }
```

---

### `grid_to_latlon(grid, xoffset?, yoffset?)`

Like `grid_to_xy`, but returns WGS84 coordinates directly.

```ts
ATPOL.grid_to_latlon("EG00")
// { lat: 49.7553, lon: 19.9708 }  — NW corner of EG00

ATPOL.grid_to_latlon("EG00", 0.5, 0.5)
// center of the square in GPS coordinates
```

---

### `xy_to_grid(coords, length?, div?)`

Converts ATPOL XY to a grid code string.

- `length` (default `8`): total character length of the letter+digit part. Must be even and between 2 and 12.
- `div` (default `null`): optionally append a division suffix — `"D"`, `"C"`, or `"P"`.

Returns `{ grid, xoffset, yoffset }` where the offsets (0–1) describe where within the resulting square the original point lies.

```ts
const xy = ATPOL.latlon_to_xy({ lat: 50.069, lon: 19.909 });

ATPOL.xy_to_grid(xy, 2).grid   // "DF"        — 100 km square
ATPOL.xy_to_grid(xy, 4).grid   // "DF69"      — 10 km square
ATPOL.xy_to_grid(xy, 6).grid   // "DF6955"    — 1 km square
ATPOL.xy_to_grid(xy, 8).grid   // "DF695501"  — 100 m square (default)
ATPOL.xy_to_grid(xy, 10).grid  // "DF69550132" — 10 m square
ATPOL.xy_to_grid(xy, 12).grid  // "DF6955013220" — 1 m square

// With a division suffix on the 10 km square:
ATPOL.xy_to_grid(xy, 4, "D").grid  // e.g. "DF69d10"  — halves
ATPOL.xy_to_grid(xy, 4, "C").grid  // e.g. "DF69c32"  — quarters
ATPOL.xy_to_grid(xy, 4, "P").grid  // e.g. "DF69p43"  — fifths

// The offsets tell you exactly where within the resulting square the point is:
const result = ATPOL.xy_to_grid(xy, 4);
// result.grid    === "DF69"
// result.xoffset ≈ 0.512  — point is 51.2% of the way across the square (E direction)
// result.yoffset ≈ 0.503  — point is 50.3% of the way down the square (S direction)
```

---

### `latlon_to_grid(coords, length?, div?)`

Shortcut for `xy_to_grid(latlon_to_xy(coords), length, div)` — converts WGS84 coordinates directly to a grid code without an intermediate `latlon_to_xy` call. Parameters and return value are identical to `xy_to_grid`.

```ts
ATPOL.latlon_to_grid({ lat: 50.069, lon: 19.909 })
// { grid: "DF695501", xoffset: ..., yoffset: ... }  — 100 m square (default length 8)

ATPOL.latlon_to_grid({ lat: 50.069, lon: 19.909 }, 4)
// { grid: "DF69", xoffset: 0.512, yoffset: 0.503 }  — 10 km square

ATPOL.latlon_to_grid({ lat: 50.069, lon: 19.909 }, 4, "P")
// { grid: "DF69p43", xoffset: ..., yoffset: ... }  — fifths division
```

---

### `grid_to_xy_bounds(grid)`

Returns the bounding box of a grid square as ATPOL XY coordinates.

```ts
ATPOL.grid_to_xy_bounds("DF69")
// {
//   nw:     { x: 390, y: 560 },  // upper-left  (minimum x, minimum y)
//   ne:     { x: 400, y: 560 },  // upper-right
//   sw:     { x: 390, y: 570 },  // lower-left
//   se:     { x: 400, y: 570 },  // lower-right
//   center: { x: 395, y: 565 },
// }
```

---

### `grid_to_latlon_bounds(grid)`

Returns the bounding box as WGS84 coordinates. Because the ATPOL projection is a conic projection, the sides of the square are not perfectly aligned with parallels/meridians, so all four corners have distinct lat/lon values.

```ts
ATPOL.grid_to_latlon_bounds("EG00")
// {
//   nw:     { lat: 49.755340, lon: 19.970803 },
//   ne:     { lat: 49.754059, lon: 20.109469 },
//   sw:     { lat: 49.665826, lon: 19.968955 },
//   se:     { lat: 49.664548, lon: 20.107357 },
//   center: { lat: 49.709963, lon: 20.039146 },
// }
// Note the slight lat difference between nw and ne (0.001°) —
// this reflects the convergence of meridians in the conic projection.
```

---

### `grid_to_square_side_in_meters(grid)`

Returns the side length of the grid square in meters.

```ts
ATPOL.grid_to_square_side_in_meters("ED")        // 100000  (100 km)
ATPOL.grid_to_square_side_in_meters("EDd01")     //  50000  (50 km — halves division)
ATPOL.grid_to_square_side_in_meters("EDc02")     //  25000  (25 km — quarters division)
ATPOL.grid_to_square_side_in_meters("EDp13")     //  20000  (20 km — fifths division)
ATPOL.grid_to_square_side_in_meters("ED26")      //  10000  (10 km)
ATPOL.grid_to_square_side_in_meters("ED2627")    //   1000  (1 km)
ATPOL.grid_to_square_side_in_meters("ED262720")  //    100  (100 m)
```

---

### `grid_to_square_side_in_km(grid)`

Same as above but in kilometers.

```ts
ATPOL.grid_to_square_side_in_km("ED")    // 100
ATPOL.grid_to_square_side_in_km("ED26")  //  10
ATPOL.grid_to_square_side_in_km("ED2627206133")  // 0.001
```

---

### `grid_to_coordinate_uncertainty_in_meters(grid)`

Returns the radius of the **smallest circle circumscribing** the grid square (i.e. the distance from the center to a corner). This is the value to use as `coordinateUncertaintyInMeters` in Darwin Core records when a grid code is the only location information.

```ts
ATPOL.grid_to_coordinate_uncertainty_in_meters("ED")      // 70711
// side = 100 000 m, half-diagonal = ceil(√(50000² + 50000²)) = 70711

ATPOL.grid_to_coordinate_uncertainty_in_meters("ED26")    //  7072
// side = 10 000 m, half-diagonal = ceil(√(5000² + 5000²))  = 7072

ATPOL.grid_to_coordinate_uncertainty_in_meters("ED26p13") //  1415
// side = 2 000 m,  half-diagonal = ceil(√(1000² + 1000²))  = 1415
```

---

### `grid_to_polygonWKT(grid)`

Returns a WKT `POLYGON` string representing the bounding box, suitable for use as `footprintWKT` in DarwinCore. Vertices are listed counter-clockwise (NW → SW → SE → NE → NW) as recommended by the OGC RFC.

```ts
ATPOL.grid_to_polygonWKT("DF97p21")
// "POLYGON ((19.58317163873754 49.811734287228084, 19.582948996344328 49.79382827146329, 19.61070719646412 49.793681290336835, 19.610940439413625 49.81158724644106, 19.58317163873754 49.811734287228084))"
```

---

### `grid_to_centroidWKT(grid)`

Returns a WKT `POINT` string for the center of the grid square, suitable for use as `footprintWKT` or to derive `decimalLatitude`/`decimalLongitude` in DarwinCore.

```ts
ATPOL.grid_to_centroidWKT("DF97p21")
// "POINT (19.596942067739906 49.80270857490112)"
```

---

### `grid_to_darwincore_fields(grid)`

Returns a `DarwinCoreFields` object with all key DarwinCore location fields filled in for the given ATPOL grid square. All values are strings, ready to be inserted directly into a Darwin Core record.

| Field | Description |
|-------|-------------|
| `footprintWKT` | WKT polygon of the square's bounding box (see `grid_to_polygonWKT`) |
| `footprintSRS` | `"EPSG:4326"` |
| `decimalLatitude` | Latitude of the square's centroid |
| `decimalLongitude` | Longitude of the square's centroid |
| `geodeticDatum` | `"EPSG:4326"` |
| `coordinateUncertaintyInMeters` | Radius of the circumscribed circle (see `grid_to_coordinate_uncertainty_in_meters`) |
| `verbatimCoordinates` | The original ATPOL grid code as passed in |
| `verbatimCoordinateSystem` | `"ATPOL"` |
| `georeferenceProtocol` | Human-readable note about the centroid and square size |
| `georeferenceSources` | `"ATPOL (Polish geobotanical grid)"` |

```ts
ATPOL.grid_to_darwincore_fields("EF25p44")
// {
//   footprintWKT: "POLYGON ((20.79964292570421 50.39018677093136, 20.798947347955973 50.37227361671613, 20.827044160538623 50.3718268689209, 20.827750593067336 50.38973984253578, 20.79964292570421 50.39018677093136))",
//   footprintSRS: "EPSG:4326",
//   decimalLatitude: "50.38100760114409",
//   decimalLongitude: "20.813346256816548",
//   geodeticDatum: "EPSG:4326",
//   coordinateUncertaintyInMeters: "1415",
//   verbatimCoordinates: "EF25p44",
//   verbatimCoordinateSystem: "ATPOL",
//   georeferenceProtocol: "Coordinates represent the centroid of an ATPOL 2×2 km grid",
//   georeferenceSources: "ATPOL (Polish geobotanical grid)",
// }
```

---

### `grid_get_division_type(grid)`

Returns the division type suffix letter (`"D"`, `"C"`, or `"P"`) or `null` if the grid code has no division suffix.

```ts
ATPOL.grid_get_division_type("EF25")     // null
ATPOL.grid_get_division_type("EF25d10")  // "D"
ATPOL.grid_get_division_type("EF25c32")  // "C"
ATPOL.grid_get_division_type("EF25p43")  // "P"
```

---

### `GRID_REGEX`

The compiled `RegExp` used internally to parse and validate grid codes. Exported for use in your own validation or extraction logic. Expects the input to be already uppercased and stripped of whitespace.

Named capture groups: `letters`, `digits`, `division`.

```ts
ATPOL.GRID_REGEX.test("ED262720P11")  // true

const m = ATPOL.GRID_REGEX.exec("ED262720P11");
// m.groups.letters  === "ED"
// m.groups.digits   === "262720"
// m.groups.division === "P11"
```

---

## Types

```ts
interface ATPOL.LatLon {
    lat: number;  // WGS84 latitude  (EPSG:4326)
    lon: number;  // WGS84 longitude (EPSG:4326)
}

interface ATPOL.XY {
    x: number;  // ATPOL easting in km
    y: number;  // ATPOL southing in km
}

interface ATPOL.Bounds_XY {
    center: ATPOL.XY;
    nw: ATPOL.XY;  // upper-left
    ne: ATPOL.XY;  // upper-right
    sw: ATPOL.XY;  // lower-left
    se: ATPOL.XY;  // lower-right
}

interface ATPOL.Bounds_LatLon {
    center: ATPOL.LatLon;
    nw: ATPOL.LatLon;
    ne: ATPOL.LatLon;
    sw: ATPOL.LatLon;
    se: ATPOL.LatLon;
}
```
