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
