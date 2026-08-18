import { expect, test } from "bun:test";
import { ATMOS, ATPOL } from "./main";

test("Grid validity", () => {
	expect(ATMOS.grid_is_valid("Gd")).toBeTrue();
	expect(ATMOS.grid_is_valid("Gd-59")).toBeTrue();
	expect(ATMOS.grid_is_valid("Gd–59")).toBeTrue();
	expect(ATMOS.grid_is_valid("Gd59")).toBeTrue();
	expect(ATMOS.grid_is_valid("Gd 59")).toBeTrue();
	expect(ATMOS.grid_is_valid("Ge-3265")).toBeTrue();
});

test("Grid normalization", () => {
	expect(ATMOS.grid_normalize("Gd")).toBe("Gd");
	expect(ATMOS.grid_normalize("Gd-59")).toBe("Gd-59");
	expect(ATMOS.grid_normalize("Gd–59")).toBe("Gd-59");
	expect(ATMOS.grid_normalize("Gd59")).toBe("Gd-59");
	expect(ATMOS.grid_normalize("Gd 59")).toBe("Gd-59");
	expect(ATMOS.grid_normalize("Gd59", " ")).toBe("Gd 59");
});

test("ATMOS to ATPOL code", () => {
	expect(ATMOS._atmos_to_atpol("Gd")).toBe("DG");
	expect(ATMOS._atmos_to_atpol("Gd-59")).toBe("DG59");
	expect(ATMOS._atmos_to_atpol("Gd–59")).toBe("DG59");
	expect(ATMOS._atmos_to_atpol("Gd59")).toBe("DG59");
	expect(ATMOS._atmos_to_atpol("Gd 59")).toBe("DG59");
	expect(ATMOS._atmos_to_atpol("Ge-3265")).toBe("EG3265");
});

test("ATPOL to ATMOS code", () => {
	expect(ATMOS._atpol_to_atmos("DG")).toBe("Gd");
	expect(ATMOS._atpol_to_atmos("DG59")).toBe("Gd-59");
	expect(() => ATMOS._atpol_to_atmos("DG5959")).toThrowError();
	expect(() => ATMOS._atpol_to_atmos("DG59p00")).toThrowError();
	expect(() => ATMOS._atpol_to_atmos("DGF")).toThrowError();
});

test("Grid bounds matching ATPOL", () => {
	expect(ATMOS.grid_to_xy_bounds("Gd-59")).toMatchObject(ATPOL.grid_to_xy_bounds("DG59"));
	expect(ATMOS.grid_to_latlon_bounds("Gd-59")).toMatchObject(ATPOL.grid_to_latlon_bounds("DG59"));
	expect(ATMOS.grid_to_xy_bounds("Ge-3265")).toMatchObject(ATPOL.grid_to_xy_bounds("EG3265"));
	expect(ATMOS.grid_to_xy_bounds("Gd")).toMatchObject(ATPOL.grid_to_xy_bounds("DG"));
});

test("Grid point conversion matching ATPOL", () => {
	expect(ATMOS.grid_to_xy("Gd-59", 0.5, 0.5)).toMatchObject(ATPOL.grid_to_xy("DG59", 0.5, 0.5));
	expect(ATMOS.grid_to_latlon("Gd-59")).toMatchObject(ATPOL.grid_to_latlon("DG59"));
});

test("Grid square side and coordinate uncertainty", () => {
	expect(ATMOS.grid_to_square_side_in_km("Gd")).toBe(100);
	expect(ATMOS.grid_to_square_side_in_km("Gd-59")).toBe(10);
	expect(ATMOS.grid_to_square_side_in_meters("Gd-59")).toBe(10000);
	expect(ATMOS.grid_to_coordinate_uncertainty_in_meters("Gd-59")).toBe(ATPOL.grid_to_coordinate_uncertainty_in_meters("DG59"));
});

test("Grid WKT matching ATPOL", () => {
	expect(ATMOS.grid_to_polygonWKT("Gd-59")).toBe(ATPOL.grid_to_polygonWKT("DG59"));
	expect(ATMOS.grid_to_centroidWKT("Gd-59")).toBe(ATPOL.grid_to_centroidWKT("DG59"));
});

test("XY / LatLon to grid roundtrip", () => {
	const xy = ATPOL.grid_to_xy("DG59");
	expect(ATMOS.xy_to_grid(xy).grid).toBe("Gd-59");
	expect(ATMOS.latlon_to_grid(ATPOL.xy_to_latlon(xy)).grid).toBe("Gd-59");
	expect(ATMOS.xy_to_grid(xy, 2).grid).toBe("Gd");
	expect(() => ATMOS.xy_to_grid(xy, 6)).toThrowError();
});

test("Darwin Core fields", () => {
	const fields = ATMOS.grid_to_darwincore_fields("Gd-59");
	const atpolFields = ATPOL.grid_to_darwincore_fields("DG59");
	expect(fields.footprintWKT).toBe(atpolFields.footprintWKT);
	expect(fields.decimalLatitude).toBe(atpolFields.decimalLatitude);
	expect(fields.decimalLongitude).toBe(atpolFields.decimalLongitude);
	expect(fields.coordinateUncertaintyInMeters).toBe(atpolFields.coordinateUncertaintyInMeters);
	expect(fields.verbatimCoordinates).toBe("Gd-59");
	expect(fields.verbatimCoordinateSystem).toBe("ATMOS");
	expect(fields.georeferenceProtocol).toBe("Coordinates represent the centroid of an ATMOS 10×10 km grid cell");
	expect(fields.georeferenceSources).toBe("ATMOS (Polish geobotanical grid), reference: https://botany.edu.pl/atmos-grid-code/Gd-59");
	expect(fields.sampleSizeValue).toBe("10");
	expect(fields.sampleSizeUnit).toBe("km²");
});
