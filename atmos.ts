import { ATPOL } from "./main";

export const GRID_REGEX: RegExp = /^(?<letters>[A-G][a-g])(?:[ -–]?(?<digits>(?:[0-9]{2}){1,5}))?$/;

/**
 * Checks whether a string is a valid ATMOS grid code.
 * @param grid ATMOS grid code, e.g. "Gf-91"
 * @returns `true` if the string is a valid ATMOS grid code, `false` otherwise
 */
export function grid_is_valid(grid: string): boolean {
	return GRID_REGEX.test(grid.trim());
}

/**
 *
 * @param grid ATMOS grid code
 * @param sep Separator between letters and numbers (note that this is different from what `sep` means in `ATPOL.grid_normalize`)
 * @returns the normalized grid code, e.g. "Gf-91"
 * @throws if `grid` is not a valid ATMOS grid code
 */
export function grid_normalize(grid: string, sep: string = "-"): string {
	const m = GRID_REGEX.exec(grid.trim());
	if (!m || !m.groups)
		throw new Error(`[ATMOS.grid_normalize] Invalid ATMOS grid string: ${grid}`);
	const letters = `${m.groups.letters![0]!.toUpperCase()}${m.groups.letters![1]!.toLowerCase()}`;
	if (m.groups.digits)
		return `${letters}${sep}${m.groups.digits}`;
	return `${letters}`;
}

export function _atmos_to_atpol(grid: string): string {
	const m = GRID_REGEX.exec(grid.trim());
	if (!m || !m.groups)
		throw new Error(`[ATMOS._atmos_to_atpol] Invalid ATMOS grid string: ${grid}`);
	const letters = `${m.groups.letters![1]!.toUpperCase()}${m.groups.letters![0]!.toUpperCase()}`;
	return letters + (m.groups.digits || "");
}

export function _atpol_to_atmos(grid: string): string {
	const m = ATPOL.GRID_REGEX.exec(grid.toUpperCase().replaceAll(/\s+/g, ""));
	if (!m || !m.groups)
		throw new Error(`[ATMOS._atpol_to_atmos] Invalid ATPOL grid string: ${grid}`);
	if (m.groups!.digits!.length > 2 || m.groups!.division)
		throw new Error(`[ATMOS._atpol_to_atmos] Cannot convert this ATPOL grid string to ATMOS: ${grid}`);
	const letters = `${m.groups.letters![1]!.toUpperCase()}${m.groups.letters![0]!.toLowerCase()}`;
	if (m.groups.digits)
		return `${letters}-${m.groups.digits}`;
	return `${letters}`;
}

/**
 * Converts an ATMOS grid code to an ATPOL XY point (via `_atmos_to_atpol` and `ATPOL.grid_to_xy`).
 * @param grid ATMOS grid code
 * @param xoffset horizontal position within the square, 0-1 (default 0 = west edge, 1 = east edge)
 * @param yoffset vertical position within the square, 0-1 (default 0 = north edge, 1 = south edge)
 * @returns ATPOL XY coordinates (in km)
 * @throws if `grid` is not a valid ATMOS grid code, or if the offsets are outside 0-1
 */
export function grid_to_xy(grid: string, xoffset: number = 0, yoffset: number = 0): ATPOL.XY {
	return ATPOL.grid_to_xy(_atmos_to_atpol(grid), xoffset, yoffset);
}

/**
 * Converts an ATMOS grid code to WGS84 coordinates.
 * @param grid ATMOS grid code
 * @param xoffset horizontal position within the square, 0-1 (default 0 = west edge)
 * @param yoffset vertical position within the square, 0-1 (default 0 = north edge)
 * @returns WGS84 (EPSG:4326) coordinates
 */
export function grid_to_latlon(grid: string, xoffset: number = 0, yoffset: number = 0): ATPOL.LatLon {
	return ATPOL.xy_to_latlon(grid_to_xy(grid, xoffset, yoffset));
}

/**
 * Converts WGS84 coordinates to an ATMOS grid code (via `ATPOL.latlon_to_xy`, `ATPOL.xy_to_grid` and `_atpol_to_atmos`).
 * @param coords WGS84 (EPSG:4326) coordinates
 * @param length total character length of the underlying ATPOL letter+digit part (default `4` = 10 km square, the most commonly used ATMOS resolution)
 * @throws if `length` results in a resolution finer than 10 km (ATMOS is rarely, if ever, subdivided further in the literature)
 */
export function latlon_to_grid(coords: ATPOL.LatLon, length: number = 4): { grid: string; xoffset: number; yoffset: number } {
	return xy_to_grid(ATPOL.latlon_to_xy(coords), length);
}

/**
 * Converts ATPOL XY coordinates to an ATMOS grid code (via `ATPOL.xy_to_grid` and `_atpol_to_atmos`).
 * @param coords ATPOL XY coordinates (in km)
 * @param length total character length of the underlying ATPOL letter+digit part (default `4` = 10 km square, the most commonly used ATMOS resolution)
 * @throws if `length` results in a resolution finer than 10 km (ATMOS is rarely, if ever, subdivided further in the literature)
 */
export function xy_to_grid(coords: ATPOL.XY, length: number = 4): { grid: string; xoffset: number; yoffset: number } {
	const result = ATPOL.xy_to_grid(coords, length);
	return { ...result, grid: _atpol_to_atmos(result.grid) };
}

/**
 * Returns the bounding box (all four corners plus center) of an ATMOS grid square as ATPOL XY coordinates.
 * @param grid ATMOS grid code
 * @returns the bounding box in ATPOL XY coordinates
 */
export function grid_to_xy_bounds(grid: string): ATPOL.Bounds_XY {
	return ATPOL.grid_to_xy_bounds(_atmos_to_atpol(grid));
}

/**
 * Returns the bounding box (all four corners plus center) of an ATMOS grid square as WGS84 coordinates.
 * @param grid ATMOS grid code
 * @returns the bounding box in WGS84 coordinates
 */
export function grid_to_latlon_bounds(grid: string): ATPOL.Bounds_LatLon {
	return ATPOL.grid_to_latlon_bounds(_atmos_to_atpol(grid));
}

/**
 * Returns the side length, in meters, of an ATMOS grid square.
 * @param grid ATMOS grid code
 * @returns square side length in meters
 */
export function grid_to_square_side_in_meters(grid: string): number {
	return ATPOL.grid_to_square_side_in_meters(_atmos_to_atpol(grid));
}

/**
 * Returns the side length, in kilometers, of an ATMOS grid square.
 * @param grid ATMOS grid code
 * @returns square side length in kilometers
 */
export function grid_to_square_side_in_km(grid: string): number {
	return grid_to_square_side_in_meters(grid) / 1000;
}

/**
 * Returns the radius, in meters, of the smallest circle circumscribing the ATMOS grid square.
 * @param grid ATMOS grid code
 * @returns coordinate uncertainty in meters
 */
export function grid_to_coordinate_uncertainty_in_meters(grid: string): number {
	return ATPOL.grid_to_coordinate_uncertainty_in_meters(_atmos_to_atpol(grid));
}

/**
 * Returns a WKT `POLYGON` with the bounding box of the ATMOS square (use in `footprintWKT` in Darwin Core).
 * @param grid ATMOS grid code
 * @returns WKT (Well-known Text) string
 */
export function grid_to_polygonWKT(grid: string): string {
	return ATPOL.grid_to_polygonWKT(_atmos_to_atpol(grid));
}

/**
 * Returns a WKT `POINT` for the center of the ATMOS grid square.
 * @param grid ATMOS grid code
 * @returns WKT (Well-known Text) string
 */
export function grid_to_centroidWKT(grid: string): string {
	return ATPOL.grid_to_centroidWKT(_atmos_to_atpol(grid));
}

/**
 * Returns a set of Darwin Core fields describing the location of the given ATMOS grid square.
 * All values are strings, ready to be inserted into a Darwin Core record.
 * @param grid ATMOS grid code
 */
export function grid_to_darwincore_fields(grid: string): ATPOL.DarwinCoreFields {
	const grid_normalized = grid_normalize(grid);
	const grid_atpol = _atmos_to_atpol(grid);
	const fields = ATPOL.grid_to_darwincore_fields(grid_atpol);
	return {
		...fields,
		verbatimCoordinateSystem: "ATMOS",
		verbatimCoordinates: grid_normalized,
		georeferenceProtocol: fields.georeferenceProtocol.replaceAll("ATPOL", "ATMOS"),
		georeferenceSources: `ATMOS (Polish geobotanical grid), reference: https://botany.edu.pl/atmos-grid-code/${grid_normalized}`,
	};
}
