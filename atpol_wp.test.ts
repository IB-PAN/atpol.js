import { expect, test } from "bun:test";
import { ATPOL } from "./main";

test("Grid validity", () => {
	expect(ATPOL.WP.grid_is_valid("GF91/0")).toBeTrue();
	expect(ATPOL.WP.grid_is_valid("GF91/1")).toBeTrue();
	expect(ATPOL.WP.grid_is_valid("GF91/3")).toBeTrue();
	expect(ATPOL.WP.grid_is_valid("GF91/2")).toBeTrue();
	expect(ATPOL.WP.grid_is_valid("GF91/00")).toBeTrue();
	expect(ATPOL.WP.grid_is_valid("GF91/01")).toBeTrue();
	expect(ATPOL.WP.grid_is_valid("GF91/10")).toBeTrue();
	expect(ATPOL.WP.grid_is_valid("GF91/11")).toBeTrue();
	expect(ATPOL.WP.grid_is_valid("GF91/03")).toBeTrue();
	expect(ATPOL.WP.grid_is_valid("GF91/02")).toBeTrue();
	expect(ATPOL.WP.grid_is_valid("GF91/13")).toBeTrue();
	expect(ATPOL.WP.grid_is_valid("GF91/12")).toBeTrue();
	expect(ATPOL.WP.grid_is_valid("GF91/30")).toBeTrue();
	expect(ATPOL.WP.grid_is_valid("GF91/31")).toBeTrue();
	expect(ATPOL.WP.grid_is_valid("GF91/20")).toBeTrue();
	expect(ATPOL.WP.grid_is_valid("GF91/21")).toBeTrue();
	expect(ATPOL.WP.grid_is_valid("GF91/33")).toBeTrue();
	expect(ATPOL.WP.grid_is_valid("GF91/32")).toBeTrue();
	expect(ATPOL.WP.grid_is_valid("GF91/23")).toBeTrue();
	expect(ATPOL.WP.grid_is_valid("GF91/22")).toBeTrue();

	expect(ATPOL.WP.grid_is_valid("GF91/44")).toBeFalse();
	expect(ATPOL.WP.grid_is_valid("GF91")).toBeFalse();
});

test("Grid square side", () => {
	expect(ATPOL.WP.grid_to_square_side_in_km("ED26/0")).toBe(5);
	expect(ATPOL.WP.grid_to_square_side_in_km("ED26/00")).toBe(2.5);
	expect(ATPOL.WP.grid_to_square_side_in_km("ED26/000")).toBe(1.25);
	expect(ATPOL.WP.grid_to_square_side_in_km("ED26/0000")).toBe(0.625);
	expect(ATPOL.WP.grid_to_square_side_in_km("ED26/00000")).toBe(0.3125);
	expect(ATPOL.WP.grid_to_square_side_in_km("ED26/000000")).toBe(0.15625);

	expect(ATPOL.WP.grid_to_square_side_in_meters("ED26/0")).toBe(5000);
	expect(ATPOL.WP.grid_to_square_side_in_meters("ED26/00")).toBe(2500);
	expect(ATPOL.WP.grid_to_square_side_in_meters("ED26/000")).toBe(1250);
	expect(ATPOL.WP.grid_to_square_side_in_meters("ED26/0000")).toBe(625);
	expect(ATPOL.WP.grid_to_square_side_in_meters("ED26/00000")).toBe(312.5);
	expect(ATPOL.WP.grid_to_square_side_in_meters("ED26/000000")).toBe(156.25);
});

test("Grid coordinate uncertainty in meters", () => {
	expect(ATPOL.WP.grid_to_square_side_in_meters("ED26/0")).toBe(5000);
	expect(ATPOL.WP.grid_to_coordinate_uncertainty_in_meters("ED26/0")).toBe(7072);
	expect(ATPOL.WP.grid_to_square_side_in_meters("ED26/00")).toBe(2500);
	expect(ATPOL.WP.grid_to_coordinate_uncertainty_in_meters("ED26/00")).toBe(3536);
	expect(ATPOL.WP.grid_to_square_side_in_meters("ED26/000")).toBe(1250);
	expect(ATPOL.WP.grid_to_coordinate_uncertainty_in_meters("ED26/000")).toBe(1768);
	expect(ATPOL.WP.grid_to_square_side_in_meters("ED26/0000")).toBe(625);
	expect(ATPOL.WP.grid_to_coordinate_uncertainty_in_meters("ED26/0000")).toBe(884);
	expect(ATPOL.WP.grid_to_square_side_in_meters("ED26/00000")).toBe(312.5);
	expect(ATPOL.WP.grid_to_coordinate_uncertainty_in_meters("ED26/00000")).toBe(442);
	expect(ATPOL.WP.grid_to_square_side_in_meters("ED26/000000")).toBe(156.25);
	expect(ATPOL.WP.grid_to_coordinate_uncertainty_in_meters("ED26/000000")).toBe(221);
});

test("5 x 5 km grid matching", () => {
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/0")).toMatchObject(ATPOL.grid_to_xy_bounds("GF91d00"));
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/1")).toMatchObject(ATPOL.grid_to_xy_bounds("GF91d01"));
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/3")).toMatchObject(ATPOL.grid_to_xy_bounds("GF91d10"));
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/2")).toMatchObject(ATPOL.grid_to_xy_bounds("GF91d11"));
});

test("2.5 x 2.5 km grid matching", () => {
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/00")).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c00"));
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/01")).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c01"));
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/10")).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c02"));
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/11")).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c03"));
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/03")).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c10"));
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/02")).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c11"));
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/13")).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c12"));
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/12")).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c13"));
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/30")).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c20"));
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/31")).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c21"));
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/20")).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c22"));
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/21")).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c23"));
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/33")).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c30"));
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/32")).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c31"));
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/23")).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c32"));
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/22")).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c33"));
});

test("1.25 x 1.25 km grid matching (upper-left corner)", () => {
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/000").nw).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c00").nw);
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/010").nw).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c01").nw);
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/100").nw).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c02").nw);
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/110").nw).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c03").nw);
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/030").nw).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c10").nw);
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/020").nw).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c11").nw);
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/130").nw).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c12").nw);
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/120").nw).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c13").nw);
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/300").nw).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c20").nw);
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/310").nw).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c21").nw);
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/200").nw).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c22").nw);
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/210").nw).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c23").nw);
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/330").nw).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c30").nw);
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/320").nw).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c31").nw);
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/230").nw).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c32").nw);
	expect(ATPOL.WP.grid_to_xy_bounds("GF91/220").nw).toMatchObject(ATPOL.grid_to_xy_bounds("GF91c33").nw);
});

test("Darwin Core fields", () => {
	const fields = ATPOL.WP.grid_to_darwincore_fields("ED26/000");
	expect(fields.footprintWKT).toBe("POLYGON ((20.904326569294952 52.25372711625628, 20.903847221854292 52.24252307482466, 20.92214495789876 52.24222822728583, 20.922628908037723 52.2534321949979, 20.904326569294952 52.25372711625628))");
	expect(fields.footprintSRS).toBe("EPSG:4326");
	expect(fields.decimalLatitude).toBe("52.24797800844594");
	expect(fields.decimalLongitude).toBe("20.913236914271433");
	expect(fields.geodeticDatum).toBe("EPSG:4326");
	expect(fields.coordinateUncertaintyInMeters).toBe("1768");
	expect(fields.verbatimCoordinates).toBe("ED26/000");
	expect(fields.verbatimCoordinateSystem).toBe("ATPOL-WP");
	expect(fields.georeferenceProtocol).toBe("Coordinates represent the centroid of an ATPOL (Wojciech Paul variant) 1.25×1.25 km grid");
	expect(fields.georeferenceSources).toBe("ATPOL (Polish geobotanical grid), Wojciech Paul division variant");
});
