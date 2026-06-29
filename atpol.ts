/**
 * WGS84
 * EPSG:4326
 */
export interface LatLon {
	lat: number;
	lon: number;
}

/**
 * ATPOL's carthesian coordinates.
 */
export interface XY {
	x: number;
	y: number;
}

export interface Bounds_XY {
	center: XY;
	nw: XY; // upper-left
	ne: XY; // upper-right
	sw: XY; // bottom-left
	se: XY; // bottom-right
}

export interface Bounds_LatLon {
	center: LatLon;
	nw: LatLon; // upper-left
	ne: LatLon; // upper-right
	sw: LatLon; // bottom-left
	se: LatLon; // bottom-right
}

const A52 = 0.907571211037051;
const RAD_TO_DEG = 57.2957795130823;
const EARTH_RADIUS = 6390;
const LAMBDA_ZERO = 19;
const X_ZERO = 330;
const Y_ZERO = 350;

// Input needs to be upper-cased and have whitespace removed
export const GRID_REGEX: RegExp = /^(?<letters>[A-G]{2})(?<digits>(?:[0-9]{2}){0,5})(?<division>D[0-1]{2}|C[0-3]{2}|P[0-4]{2})?$/;

/**
 * @param coords WGS84 (EPSG:4326) GPS coordinates
 * @returns (X,Y) coordinates in PUWG 1992 (EPSG:2180)
 */
export function latlon_to_xy(coords: LatLon): XY {
	let { lat, lon } = coords;
	lon = lon - LAMBDA_ZERO;
	lon = lon / RAD_TO_DEG;
	lat = lat / RAD_TO_DEG;
	const r = Math.cos(A52) / Math.sin(A52) - Math.tan(lat - A52);
	let x = r * Math.sin(lon * Math.sin(A52));
	let y = r * Math.cos(lon * Math.sin(A52));
	y = y - Math.cos(A52) / Math.sin(A52);
	x = x * EARTH_RADIUS + X_ZERO;
	y = y * EARTH_RADIUS + Y_ZERO;
	return { x, y };
}

export function xy_to_latlon(coords: XY): LatLon {
	let { x, y } = coords;
	x = (x - X_ZERO) / EARTH_RADIUS;
	y = (y - Y_ZERO) / EARTH_RADIUS;
	y = y + Math.cos(A52) / Math.sin(A52);
	const lon = Math.atan(x / y) / Math.sin(A52);
	const r = Math.sqrt(x * x + y * y);
	const lat = A52 - Math.atan(r - Math.cos(A52) / Math.sin(A52));
	return {
		lat: lat * RAD_TO_DEG,
		lon: lon * RAD_TO_DEG + LAMBDA_ZERO,
	};
}

export function grid_is_valid(grid: string): boolean {
	return GRID_REGEX.test(grid.toUpperCase().replaceAll(/\s+/g, ""));
}

export function grid_normalize(grid: string, sep: string = ""): string {
	const m = GRID_REGEX.exec(grid.toUpperCase().replaceAll(/\s+/g, ""));
	if (!m || !m.groups || !m.groups.letters)
		throw new Error(`[ATPOL.grid_normalize] Invalid ATPOL grid string: ${grid}`);
	const groups = m.groups;
	let new_grid = `${groups.letters}${sep}${groups.digits!.match(/.{2}/g)?.join(sep) || ""}`;
	if (groups.division) {
		new_grid += `${sep}${groups.division.toLowerCase()}`;
	}
	return new_grid;
}

export function xy_to_grid(coords: XY, length: number = 8, div: null | "D" | "C" | "P" = null): {
	grid: string;
	xoffset: number;
	yoffset: number;
} {
	const { x, y } = coords;
	if (!(length >= 2 && length <= 12 && (length | 0) === length && (length % 2) === 0))
		throw new Error(`[ATPOL.xy_to_grid] Invalid grid code length requested: ${length}`);
	if (!(x >= 0 && x <= 700 && y >= 0 && y <= 700))
		throw new Error(`[ATPOL.xy_to_grid] Invalid parameters: ${JSON.stringify({ x, y })}`);
	if (!(div === null || ["D", "C", "P".includes(div)]))
		throw new Error(`[ATPOL.xy_to_grid] Invalid division requested: ${div}`);

	const xs = (1e15 + Math.round(x * 1000) + "").slice(-6);
	const ys = (1e15 + Math.round(y * 1000) + "").slice(-6);

	let grid_full = String.fromCharCode(xs.charCodeAt(0) + 17, ys.charCodeAt(0) + 17);
	for (let i = 1; i < 6; i++) {
		grid_full += ys[i]! + xs[i]!;
	}
	let grid = grid_full.substring(0, length);

	let xoffset_str = (1e15 + Math.round(x * 1000000) + "").slice(-9);
	let yoffset_str = (1e15 + Math.round(y * 1000000) + "").slice(-9);
	xoffset_str = "0." + xoffset_str.slice(-9 + length / 2);
	yoffset_str = "0." + yoffset_str.slice(-9 + length / 2);

	const xoffset = parseFloat(xoffset_str);
	const yoffset = parseFloat(yoffset_str);

	if (typeof div === "string") {
		const div_count = {
			D: 2,
			C: 5,
			P: 5,
		}[div];
		const div_y = Math.min(div_count - 1, Math.floor(yoffset * div_count));
		const div_x = Math.min(div_count - 1, Math.floor(xoffset * div_count));
		grid += `${div.toLowerCase()}${div_y}${div_x}`;
	}

	return { grid, xoffset, yoffset };
}

export function grid_to_xy(grid: string, xoffset: number = 0, yoffset: number = 0): XY {
	if (!grid_is_valid(grid))
		throw new Error(`[ATPOL.grid_to_xy] Invalid ATPOL grid string: ${grid}`);
	grid = grid.toUpperCase().replaceAll(/\s+/g, "");
	if (!(xoffset >= 0 && xoffset <= 1 && yoffset >= 0 && yoffset <= 1))
		throw new Error(`[ATPOL.grid_to_xy] Invalid ATPOL offsets: ${JSON.stringify({ xoffset, yoffset })}`);

	const { letters, digits, division } = GRID_REGEX.exec(grid.toUpperCase().replaceAll(/\s+/g, ""))!.groups!;

	let xs = String.fromCharCode(letters!.charCodeAt(0) - 17);
	let ys = String.fromCharCode(letters!.charCodeAt(1) - 17);

	if (digits) {
		for (const pair of digits!.match(/.{2}/g)!) {
			xs = xs + pair[1];
			ys = ys + pair[0];
		}
	}

	xs = xs.padEnd(6, "0");
	ys = ys.padEnd(6, "0");

	if (division) {
		const square_size = {
			P: 0.2, // 1/5
			C: 0.25, // 1/4
			D: 0.5, // 1/2
		}[division[0]!]!;
		const div_x = parseInt(division[2]!);
		const div_y = parseInt(division[1]!);

		xoffset = square_size * (div_x + xoffset);
		yoffset = square_size * (div_y + yoffset);
	}

	const km = 10 ** (2 - digits!.length / 2);
	const x = parseInt(xs) / 1000 + km * xoffset;
	const y = parseInt(ys) / 1000 + km * yoffset;
	return { x, y };
}

export function grid_to_latlon(grid: string, xoffset: number = 0, yoffset: number = 0): LatLon {
	return xy_to_latlon(grid_to_xy(grid, xoffset, yoffset));
}

export function grid_to_xy_bounds(grid: string): Bounds_XY {
	const nw = grid_to_xy(grid, 0, 0);
	const ne = grid_to_xy(grid, 1, 0);
	const sw = grid_to_xy(grid, 0, 1);
	const se = grid_to_xy(grid, 1, 1);
	const center = grid_to_xy(grid, 0.5, 0.5);
	return {
		nw, ne, sw, se, center,
	};
}

export function grid_to_latlon_bounds(grid: string): Bounds_LatLon {
	const bounds = grid_to_xy_bounds(grid);
	return {
		nw: xy_to_latlon(bounds.nw),
		ne: xy_to_latlon(bounds.ne),
		sw: xy_to_latlon(bounds.sw),
		se: xy_to_latlon(bounds.se),
		center: xy_to_latlon(bounds.center),
	};
}

/**
 * For example, for ED26 it returns 10000 m (= 10 km)
 * @param grid ATPOL grid code
 */
export function grid_to_square_side_in_meters(grid: string): number {
	if (!grid_is_valid(grid))
		throw new Error(`Invalid ATPOL grid string: ${grid}`);
	grid = grid.toUpperCase().replaceAll(/\s+/g, "");
	const { _letters, digits, division } = GRID_REGEX.exec(grid.toUpperCase().replaceAll(/\s+/g, ""))!.groups!;
	// const km = 10 ** (2 - digits!.length/2); // less accurate
	// const metres = 100000 / (10 ** (digits!.length/2));
	const metres = 10 ** (5 - digits!.length / 2);
	if (division) {
		const square_size = {
			P: 0.2, // 1/5
			C: 0.25, // 1/4
			D: 0.5, // 1/2
		}[division[0]!]!;
		return square_size * metres;
	}
	return metres;
}

/**
 * For example, for ED26 it returns 10 km
 * @param grid ATPOL grid code
 */
export function grid_to_square_side_in_km(grid: string): number {
	return grid_to_square_side_in_meters(grid) / 1000;
}

/**
 * Get the circumference of the smallest circle circumscribed around the given ATPOL square
 * 2 km = 2000 m -> Pythagore 1000 m (a x b = ?) to get radius
 * @param grid ATPOL grid code
 */
export function grid_to_coordinate_uncertainty_in_meters(grid: string): number {
	const square_side_in_meters = grid_to_square_side_in_meters(grid);
	const a = square_side_in_meters / 2;
	return Math.ceil(Math.sqrt(Math.pow(a, 2) + Math.pow(a, 2)));
}

/**
 * Get a WKT with the bounding box of the ATPOL square (use in footprintWKT in DarwinCore).
 * Counter-clockwise as recommended by the RFC.
 * @param grid ATPOL grid code
 * @returns WKT (Well-known Text) string
 */
export function grid_to_polygonWKT(grid: string): string {
	const bounds = grid_to_latlon_bounds(grid);
	const polygon_str_arr: string[] = [];
	polygon_str_arr.push(`${bounds.nw.lon} ${bounds.nw.lat}`);
	polygon_str_arr.push(`${bounds.sw.lon} ${bounds.sw.lat}`);
	polygon_str_arr.push(`${bounds.se.lon} ${bounds.se.lat}`);
	polygon_str_arr.push(`${bounds.ne.lon} ${bounds.ne.lat}`);
	polygon_str_arr.push(polygon_str_arr[0]!);
	// POLYGON ((10 20, 11 20, 11 21, 10 21, 10 20))
	// https://polygon.clearsky.vision/wkt-validator
	// https://wktmap.com/
	return `POLYGON ((${polygon_str_arr.join(", ")}))`;
}

export function grid_to_centroidWKT(grid: string): string {
	const bounds = grid_to_latlon_bounds(grid);
	return `POINT (${bounds.center.lon} ${bounds.center.lat})`;
}

export function grid_get_division_type(grid: string): null | "D" | "C" | "P" {
	const divMatch = grid_normalize(grid).match(/([dcp])\d{2}$/)?.[1]?.toUpperCase() || null;
	return divMatch as null | "D" | "C" | "P";
}
