import type { SelectItem } from "#ui/types";
import { ATPOL } from "../../../main";

export const gridSizes: SelectItem[] = [
	{ type: "label", label: "Siatka standardowa" },
	{ label: "100×100 km", value: "100km" },
	{ label: "10×10 km", value: "10km" },
	{ label: "1×1 km", value: "1km" },
	{ label: "100×100 m", value: "100m" },
	{ label: "10×10 m", value: "10m" },
	{ label: "1×1 m", value: "1m" },
	{ type: "separator" },
	{ type: "label", label: "Nietypowy — podział siatki 10×10 km" },
	{ label: "5×5 km (typ d)", value: "5km" },
	{ label: "2.5×2.5 km (typ c)", value: "2.5km" },
	{ label: "2×2 km (typ p)", value: "2km" },
	{ type: "separator" },
	{ type: "label", label: "Nietypowy — podział siatki 1×1 km" },
	{ label: "500×500 m (typ d)", value: "500m" },
	{ label: "250×250 m (typ c)", value: "250m" },
	{ label: "200×200 m (typ p)", value: "200m" },
	{ type: "separator" },
	{ type: "label", label: "Nietypowy — podział siatki 100×100 m" },
	{ label: "50×50 m (typ d)", value: "50m" },
	{ label: "25×25 m (typ c)", value: "25m" },
	{ label: "20×20 m (typ p)", value: "20m" },
] as const;

export const GRID_CONFIG = {
	"100km": { length: 2 },
	"10km": { length: 4 },
	"5km": { length: 4, div: "D" },
	"2.5km": { length: 4, div: "C" },
	"2km": { length: 4, div: "P" },
	"1km": { length: 6 },
	"500m": { length: 6, div: "D" },
	"250m": { length: 6, div: "C" },
	"200m": { length: 6, div: "P" },
	"100m": { length: 8 },
	"50m": { length: 8, div: "D" },
	"25m": { length: 8, div: "C" },
	"20m": { length: 8, div: "P" },
	"10m": { length: 10 },
	"1m": { length: 12 },
} as const satisfies Record<string, { length: number; div?: "D" | "C" | "P" }>;

export type GridSizeKey = keyof typeof GRID_CONFIG;

export function computeGridCode(xy: ATPOL.XY, gridSize: GridSizeKey) {
	const cfg = GRID_CONFIG[gridSize];
	const { grid } = ATPOL.xy_to_grid(xy, cfg.length, "div" in cfg ? cfg.div : null);
	return grid;
}

export function formatSideLabel(grid: string) {
	const m = ATPOL.grid_to_square_side_in_meters(grid);
	const div = ATPOL.grid_get_division_type(grid)?.toLowerCase();
	const sizeStr = m >= 1000 ? `${m / 1000} × ${m / 1000} km` : `${m} × ${m} m`;
	return div ? `${sizeStr} (typ ${div})` : sizeStr;
}

export function gridCodeToGridSizeKey(grid: string, wp: boolean = false) {
	const m = (wp ? ATPOL.WP : ATPOL).grid_to_square_side_in_meters(grid);
	const sizeStr = m >= 1000 ? `${m / 1000}km` : `${m}m`;
	return sizeStr as GridSizeKey;
}
