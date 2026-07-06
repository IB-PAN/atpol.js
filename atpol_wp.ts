import * as ATPOL from "./atpol";

/**
 * Regex for a Wojciech Paul (WP) variant ATPOL grid code: a regular
 * non-divided ATPOL grid code (letter pair + up to 5 digit pairs), followed
 * by a slash and one or more division digits (0-3). Each division digit
 * halves the current square and selects one of its four quadrants, clockwise
 * from the NW corner: 0 = NW, 1 = NE, 2 = SE, 3 = SW.
 * Input needs to be upper-cased and have whitespace removed.
 */
export const GRID_REGEX: RegExp = /^(?<letters>[A-G]{2})(?<digits>(?:[0-9]{2}){0,5})\/(?<division>[0-3]+)$/;

/**
 * Checks whether a string is a valid WP ATPOL grid code.
 * @param grid WP ATPOL grid code, e.g. "GF91/032"
 * @returns `true` if the string is a valid WP ATPOL grid code, `false` otherwise
 */
export function grid_is_valid(grid: string): boolean {
	return GRID_REGEX.test(grid.toUpperCase().replaceAll(/\s+/g, ""));
}

/**
 * Strips whitespace and uppercases a WP ATPOL grid code.
 * @param grid WP ATPOL grid code
 * @returns the normalized grid code, e.g. "GF91/032"
 * @throws if `grid` is not a valid WP ATPOL grid code
 */
export function grid_normalize(grid: string): string {
	const m = GRID_REGEX.exec(grid.toUpperCase().replaceAll(/\s+/g, ""));
	if (!m || !m.groups)
		throw new Error(`[ATPOL.WP.grid_normalize] Invalid WP ATPOL grid string: ${grid}`);
	return `${m.groups.letters}${m.groups.digits}/${m.groups.division}`;
}

/**
 * Converts a WP ATPOL grid code to an ATPOL XY point.
 *
 * The part of the code before the slash is a regular non-divided ATPOL grid
 * code, and is resolved with `ATPOL.grid_to_xy`. Each division digit after
 * the slash then halves the remaining square and moves into one of its four
 * quadrants (0 = NW, 1 = NE, 2 = SE, 3 = SW), narrowing down to the final
 * (most subdivided) square.
 *
 * @param grid WP ATPOL grid code, e.g. "GF91/032"
 * @param xoffset horizontal position within the final square, 0-1 (default 0 = west edge, 1 = east edge)
 * @param yoffset vertical position within the final square, 0-1 (default 0 = north edge, 1 = south edge)
 * @returns ATPOL XY coordinates (in km)
 * @throws if `grid` is not a valid WP ATPOL grid code, or if the offsets are outside 0-1
 */
export function grid_to_xy(grid: string, xoffset: number = 0, yoffset: number = 0): ATPOL.XY {
	if (!grid_is_valid(grid))
		throw new Error(`[ATPOL.WP.grid_to_xy] Invalid WP ATPOL grid string: ${grid}`);
	if (!(xoffset >= 0 && xoffset <= 1 && yoffset >= 0 && yoffset <= 1))
		throw new Error(`[ATPOL.WP.grid_to_xy] Invalid ATPOL offsets: ${JSON.stringify({ xoffset, yoffset })}`);

	const { letters, digits, division } = GRID_REGEX.exec(grid.toUpperCase().replaceAll(/\s+/g, ""))!.groups!;

	// Accumulate the (x, y) offset of the final square's NW corner within the
	// base (non-divided) square, as a fraction of the base square's side,
	// halving the contribution of each subsequent division digit.
	let x_frac = 0;
	let y_frac = 0;
	let scale = 0.5;
	for (const digit of division!) {
		const d = parseInt(digit, 10);
		if (d === 1 || d === 2) x_frac += scale; // NE or SE: east half
		if (d === 2 || d === 3) y_frac += scale; // SE or SW: south half
		scale /= 2;
	}
	// `scale` is now half the side of the final square (as a fraction of the
	// base square); apply the requested offset within that final square.
	x_frac += xoffset * scale * 2;
	y_frac += yoffset * scale * 2;

	return ATPOL.grid_to_xy(`${letters}${digits}`, x_frac, y_frac);
}

/**
 * Converts a WP ATPOL grid code to WGS84 coordinates.
 * @param grid WP ATPOL grid code
 * @param xoffset horizontal position within the final square, 0-1 (default 0 = west edge)
 * @param yoffset vertical position within the final square, 0-1 (default 0 = north edge)
 * @returns WGS84 (EPSG:4326) coordinates
 */
export function grid_to_latlon(grid: string, xoffset: number = 0, yoffset: number = 0): ATPOL.LatLon {
	return ATPOL.xy_to_latlon(grid_to_xy(grid, xoffset, yoffset));
}

/**
 * Returns the bounding box (all four corners plus center) of a WP ATPOL grid square as ATPOL XY coordinates.
 * @param grid WP ATPOL grid code
 * @returns the bounding box in ATPOL XY coordinates
 */
export function grid_to_xy_bounds(grid: string): ATPOL.Bounds_XY {
	const nw = grid_to_xy(grid, 0, 0);
	const ne = grid_to_xy(grid, 1, 0);
	const sw = grid_to_xy(grid, 0, 1);
	const se = grid_to_xy(grid, 1, 1);
	const center = grid_to_xy(grid, 0.5, 0.5);
	return {
		nw, ne, sw, se, center,
	};
}

/**
 * Returns the bounding box (all four corners plus center) of a WP ATPOL grid square as WGS84 coordinates.
 * @param grid WP ATPOL grid code
 * @returns the bounding box in WGS84 coordinates
 */
export function grid_to_latlon_bounds(grid: string): ATPOL.Bounds_LatLon {
	const bounds = grid_to_xy_bounds(grid);
	return {
		nw: ATPOL.xy_to_latlon(bounds.nw),
		ne: ATPOL.xy_to_latlon(bounds.ne),
		sw: ATPOL.xy_to_latlon(bounds.sw),
		se: ATPOL.xy_to_latlon(bounds.se),
		center: ATPOL.xy_to_latlon(bounds.center),
	};
}

/**
 * Returns the side length, in meters, of a WP ATPOL grid square. Every
 * division digit after the slash halves the side length of the base
 * (non-divided) grid code.
 * @param grid WP ATPOL grid code
 * @returns square side length in meters
 */
export function grid_to_square_side_in_meters(grid: string): number {
	if (!grid_is_valid(grid))
		throw new Error(`[ATPOL.WP.grid_to_square_side_in_meters] Invalid WP ATPOL grid string: ${grid}`);
	const { letters, digits, division } = GRID_REGEX.exec(grid.toUpperCase().replaceAll(/\s+/g, ""))!.groups!;
	const base_metres = ATPOL.grid_to_square_side_in_meters(`${letters}${digits}`);
	return base_metres / (2 ** division!.length);
}

/**
 * Returns the side length, in kilometers, of a WP ATPOL grid square.
 * @param grid WP ATPOL grid code
 * @returns square side length in kilometers
 */
export function grid_to_square_side_in_km(grid: string): number {
	return grid_to_square_side_in_meters(grid) / 1000;
}

/**
 * Returns the length, in meters, of the diagonal of the WP ATPOL grid square
 * (i.e. the distance between two opposite corners).
 * @param grid WP ATPOL grid code
 * @returns coordinate uncertainty in meters
 */
export function grid_to_coordinate_uncertainty_in_meters(grid: string): number {
	const square_side_in_meters = grid_to_square_side_in_meters(grid);
	return Math.ceil(Math.sqrt(Math.pow(square_side_in_meters, 2) + Math.pow(square_side_in_meters, 2)));
}

/**
 * Returns a WKT `POLYGON` with the bounding box of the WP ATPOL square (use in `footprintWKT` in Darwin Core).
 * @param grid WP ATPOL grid code
 * @returns WKT (Well-known Text) string
 */
export function grid_to_polygonWKT(grid: string): string {
	return ATPOL.latlon_bounds_to_polygonWKT(grid_to_latlon_bounds(grid));
}

const superscriptNumber = (number: number) => [...(number | 0).toString()].map(n => "⁰¹²³⁴⁵⁶⁷⁸⁹"[parseInt(n)]).join("");

/**
 * Returns a set of Darwin Core fields describing the location of the given WP ATPOL grid square.
 * All values are strings, ready to be inserted into a Darwin Core record.
 * @param grid WP ATPOL grid code
 */
export function grid_to_darwincore_fields(grid: string): ATPOL.DarwinCoreFields {
	const bounds = grid_to_latlon_bounds(grid);
	const m = grid_to_square_side_in_meters(grid);
	const sizeStr = m >= 1000 ? `${m / 1000}×${m / 1000} km` : `${m}×${m} m`;
	const grid_normalized = grid_normalize(grid);

	const base = grid_normalized.split("/")[0]!;
	const m_base = ATPOL.grid_to_square_side_in_meters(base);
	const sizeStr_base = m >= 1000 ? `${m_base / 1000}×${m_base / 1000} km` : `${m_base}×${m_base} m`;
	const division_multiplier = m_base / m;
	const power = Math.log(division_multiplier) / Math.log(2);
	const power_display = `2${superscriptNumber(power)}`;

	return {
		footprintWKT: grid_to_polygonWKT(grid),
		footprintSRS: "EPSG:4326",
		decimalLatitude: bounds.center.lat.toString(),
		decimalLongitude: bounds.center.lon.toString(),
		geodeticDatum: "EPSG:4326",
		coordinateUncertaintyInMeters: grid_to_coordinate_uncertainty_in_meters(grid).toString(),
		verbatimCoordinates: grid,
		verbatimCoordinateSystem: "ATPOL-WP",
		georeferenceProtocol: `Coordinates represent the centroid of an ATPOL (Wojciech Paul variant) ${sizeStr} grid (ATPOL base ${sizeStr_base} grid divided by ${power_display})`,
		georeferenceSources: `ATPOL (Polish geobotanical grid), Wojciech Paul division variant, reference: https://ib-pan.github.io/atpol.js/calculator-from-grid-code/#WP:${grid_normalized}`,
		sampleSizeValue: (m >= 1000 ? m / 1000 : m).toString(),
		sampleSizeUnit: m >= 1000 ? "km²" : "m²", // square kilometre / square metre
	};
}
