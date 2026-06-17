import { expect, test } from "bun:test";
import * as ATPOL from "./main";

test("Grid validity", () => {
	expect(ATPOL.grid_is_valid("ED")).toBeTrue();
	expect(ATPOL.grid_is_valid("EDd01")).toBeTrue();
	expect(ATPOL.grid_is_valid("EDc02")).toBeTrue();
	expect(ATPOL.grid_is_valid("EDp13")).toBeTrue();
	expect(ATPOL.grid_is_valid("ED26")).toBeTrue();
	expect(ATPOL.grid_is_valid("ED26d01")).toBeTrue();
	expect(ATPOL.grid_is_valid("ED26c02")).toBeTrue();
	expect(ATPOL.grid_is_valid("ED26p13")).toBeTrue();
	expect(ATPOL.grid_is_valid("ED2627")).toBeTrue();
	expect(ATPOL.grid_is_valid("ED2627d00")).toBeTrue();
	expect(ATPOL.grid_is_valid("ED2627p10")).toBeTrue();
	expect(ATPOL.grid_is_valid("ED262720")).toBeTrue();
	expect(ATPOL.grid_is_valid("ED262720d10")).toBeTrue();
	expect(ATPOL.grid_is_valid("ED262720p30")).toBeTrue();
	expect(ATPOL.grid_is_valid("ED26272061")).toBeTrue();
	expect(ATPOL.grid_is_valid("ED2627206133")).toBeTrue();
	
	expect(ATPOL.grid_is_valid("ED2627d22")).toBeFalse();
	expect(ATPOL.grid_is_valid("ED2627c44")).toBeFalse();
	expect(ATPOL.grid_is_valid("ED2627p55")).toBeFalse();
});

test("Grid normalize", () => {
	expect(ATPOL.grid_normalize("ED 26 27 20 P11")).toBe("ED262720p11");
	expect(ATPOL.grid_normalize("ED 26 27 20 P11", " ")).toBe("ED 26 27 20 p11");
	expect(ATPOL.grid_normalize("ED00")).toBe("ED00");
	expect(ATPOL.grid_normalize("ED")).toBe("ED");
});

test("Grid square side", () => {
	expect(ATPOL.grid_to_square_side_in_km("ED")).toBe(100);
	expect(ATPOL.grid_to_square_side_in_km("ED26")).toBe(10);
	expect(ATPOL.grid_to_square_side_in_km("ED26272061")).toBe(0.01);
	expect(ATPOL.grid_to_square_side_in_meters("ED")).toBe(100000);
	expect(ATPOL.grid_to_square_side_in_meters("EDd01")).toBe(50000);
	expect(ATPOL.grid_to_square_side_in_meters("EDc02")).toBe(25000);
	expect(ATPOL.grid_to_square_side_in_meters("EDp13")).toBe(20000);
	expect(ATPOL.grid_to_square_side_in_meters("ED26")).toBe(10000);
	expect(ATPOL.grid_to_square_side_in_meters("ED26d01")).toBe(5000);
	expect(ATPOL.grid_to_square_side_in_meters("ED26c02")).toBe(2500);
	expect(ATPOL.grid_to_square_side_in_meters("ED26p13")).toBe(2000);
	expect(ATPOL.grid_to_square_side_in_meters("ED2627")).toBe(1000);
	expect(ATPOL.grid_to_square_side_in_meters("ED2627d00")).toBe(500);
	expect(ATPOL.grid_to_square_side_in_meters("ED2627p10")).toBe(200);
	expect(ATPOL.grid_to_square_side_in_meters("ED262720")).toBe(100);
	expect(ATPOL.grid_to_square_side_in_meters("ED262720d10")).toBe(50);
	expect(ATPOL.grid_to_square_side_in_meters("ED262720p30")).toBe(20);
	expect(ATPOL.grid_to_square_side_in_meters("ED26272061")).toBe(10);
});

test("Grid coordinate uncertainty in meters", () => {
	expect(ATPOL.grid_to_square_side_in_meters("ED26p13")).toBe(2000);
	expect(ATPOL.grid_to_coordinate_uncertainty_in_meters("ED26p13")).toBe(1415);
	expect(ATPOL.grid_to_square_side_in_meters("ED26")).toBe(10000);
	expect(ATPOL.grid_to_coordinate_uncertainty_in_meters("ED26")).toBe(7072);
	expect(ATPOL.grid_to_square_side_in_meters("ED")).toBe(100000);
	expect(ATPOL.grid_to_coordinate_uncertainty_in_meters("ED")).toBe(70711);
});

test("Grid to lat-lon coordinate conversion compatibility", () => {
	expect(ATPOL.grid_to_xy("EG00", 0, 0)).toMatchObject({ x: 400, y: 600 });
	expect(ATPOL.grid_to_latlon("EG00", 0, 0)).toMatchObject({ lat: 49.75533994502857, lon: 19.970803446537847 });
	expect(ATPOL.grid_to_xy("EG", 0, 0)).toMatchObject({ x: 400, y: 600 });
	expect(ATPOL.grid_to_latlon("EG", 0, 0)).toMatchObject({ lat: 49.75533994502857, lon: 19.970803446537847 });
	expect(ATPOL.grid_to_xy("EG00", 1*0.2, 3*0.2)).toMatchObject({ x: 402, y: 606 }); // EG00P31
	expect(ATPOL.grid_to_latlon("EG00", 1*0.2, 3*0.2)).toMatchObject({ lat: 49.701388209139274, lon: 19.99739586213447 }); // EG00P31

	expect(ATPOL.grid_to_latlon_bounds("EG00").nw).toMatchObject(ATPOL.grid_to_latlon_bounds("EG").nw);
	expect(ATPOL.grid_to_latlon_bounds("EG0000p00").nw).toMatchObject(ATPOL.grid_to_latlon_bounds("EG").nw);

	const bounds_10x10_EG00 = ATPOL.grid_to_latlon_bounds("EG00");
	expect(bounds_10x10_EG00.nw.lat.toFixed(6)).toBe("49.755340");
	expect(bounds_10x10_EG00.nw.lon.toFixed(6)).toBe("19.970803");
	expect(bounds_10x10_EG00.ne.lat.toFixed(6)).toBe("49.754059");
	expect(bounds_10x10_EG00.ne.lon.toFixed(6)).toBe("20.109469");
	expect(bounds_10x10_EG00.sw.lat.toFixed(6)).toBe("49.665826");
	expect(bounds_10x10_EG00.sw.lon.toFixed(6)).toBe("19.968955");
	expect(bounds_10x10_EG00.se.lat.toFixed(6)).toBe("49.664548");
	expect(bounds_10x10_EG00.se.lon.toFixed(6)).toBe("20.107357");
	expect(bounds_10x10_EG00.center.lat.toFixed(6)).toBe("49.709963");
	expect(bounds_10x10_EG00.center.lon.toFixed(6)).toBe("20.039146");
	const bounds_2x2_EG00P00 = ATPOL.grid_to_latlon_bounds("EG00p00");
	expect(bounds_10x10_EG00.nw.lat.toFixed(6)).toBe(bounds_2x2_EG00P00.nw.lat.toFixed(6));
	expect(bounds_10x10_EG00.nw.lon.toFixed(6)).toBe(bounds_2x2_EG00P00.nw.lon.toFixed(6));

	const bounds_2x2_EG00P31 = ATPOL.grid_to_latlon_bounds("EG00p31");
	expect(bounds_2x2_EG00P31.nw.lat.toFixed(6)).toBe("49.701388");
	expect(bounds_2x2_EG00P31.nw.lon.toFixed(6)).toBe("19.997396");
	expect(bounds_2x2_EG00P31.ne.lat.toFixed(6)).toBe("49.701139");
	expect(bounds_2x2_EG00P31.ne.lon.toFixed(6)).toBe("20.025098");
	expect(bounds_2x2_EG00P31.sw.lat.toFixed(6)).toBe("49.683486");
	expect(bounds_2x2_EG00P31.sw.lon.toFixed(6)).toBe("19.997016");
	expect(bounds_2x2_EG00P31.se.lat.toFixed(6)).toBe("49.683237");
	expect(bounds_2x2_EG00P31.se.lon.toFixed(6)).toBe("20.024707");
	expect(bounds_2x2_EG00P31.center.lat.toFixed(6)).toBe("49.692313");
	expect(bounds_2x2_EG00P31.center.lon.toFixed(6)).toBe("20.011054");

	const bounds_2x2_EG00P01 = ATPOL.grid_to_latlon_bounds("EG00p01");
	expect(bounds_2x2_EG00P01.nw.lat.toFixed(6)).toBe("49.755097");
	expect(bounds_2x2_EG00P01.nw.lon.toFixed(6)).toBe("19.998537");
	expect(bounds_2x2_EG00P01.ne.lat.toFixed(6)).toBe("49.754848");
	expect(bounds_2x2_EG00P01.ne.lon.toFixed(6)).toBe("20.026271");
	expect(bounds_2x2_EG00P01.sw.lat.toFixed(6)).toBe("49.737194");
	expect(bounds_2x2_EG00P01.sw.lon.toFixed(6)).toBe("19.998156");
	expect(bounds_2x2_EG00P01.se.lat.toFixed(6)).toBe("49.736945");
	expect(bounds_2x2_EG00P01.se.lon.toFixed(6)).toBe("20.025879");
	expect(bounds_2x2_EG00P01.center.lat.toFixed(6)).toBe("49.746022");
	expect(bounds_2x2_EG00P01.center.lon.toFixed(6)).toBe("20.012211");

	const bounds_25x25_FE60C02 = ATPOL.grid_to_latlon_bounds("FE60c02");
	expect(bounds_25x25_FE60C02.nw.lat.toFixed(6)).toBe("50.986893");
	expect(bounds_25x25_FE60C02.nw.lon.toFixed(6)).toBe("21.492772");
	expect(bounds_25x25_FE60C02.ne.lat.toFixed(6)).toBe("50.986119");
	expect(bounds_25x25_FE60C02.ne.lon.toFixed(6)).toBe("21.528354");
	expect(bounds_25x25_FE60C02.sw.lat.toFixed(6)).toBe("50.964497");
	expect(bounds_25x25_FE60C02.sw.lon.toFixed(6)).toBe("21.491552");
	expect(bounds_25x25_FE60C02.se.lat.toFixed(6)).toBe("50.963723");
	expect(bounds_25x25_FE60C02.se.lon.toFixed(6)).toBe("21.527117");
	expect(bounds_25x25_FE60C02.center.lat.toFixed(6)).toBe("50.975309");
	expect(bounds_25x25_FE60C02.center.lon.toFixed(6)).toBe("21.509949");
});

test("ATPOL reference values", () => {
	expect(ATPOL.latlon_to_xy({ lat: 55, lon: 14 }).x).toBeCloseTo(9.96845890586781, 11);
	expect(ATPOL.latlon_to_xy({ lat: 55, lon: 14 }).y).toBeCloseTo(4.10616177706436, 11);
	expect(ATPOL.latlon_to_xy({ lat: 55, lon: 24 }).x).toBeCloseTo(650.0315410941322, 11);
	expect(ATPOL.latlon_to_xy({ lat: 55, lon: 24 }).y).toBeCloseTo(4.10616177706436, 11);
	expect(ATPOL.latlon_to_xy({ lat: 49, lon: 15 }).x).toBeCloseTo(37.0741890073075, 11);
	expect(ATPOL.latlon_to_xy({ lat: 49, lon: 15 }).y).toBeCloseTo(676.8262355927, 11);
	expect(ATPOL.latlon_to_xy({ lat: 49, lon: 24 }).x).toBeCloseTo(696.053360616178, 11);
	expect(ATPOL.latlon_to_xy({ lat: 49, lon: 24 }).y).toBeCloseTo(672.294567958272, 11);
	expect(ATPOL.latlon_to_xy({ lat: 52, lon: 19 }).x).toBeCloseTo(330, 11);
	expect(ATPOL.latlon_to_xy({ lat: 52, lon: 19 }).y).toBeCloseTo(350, 11);
	expect(ATPOL.xy_to_latlon({ x: 0, y: 0 }).lat).toBeCloseTo(55.0304039936488, 11);
	expect(ATPOL.xy_to_latlon({ x: 0, y: 0 }).lon).toBeCloseTo(13.840227318521, 11);
	expect(ATPOL.xy_to_latlon({ x: 700, y: 0 }).lat).toBeCloseTo(55.0035155052185, 11);
	expect(ATPOL.xy_to_latlon({ x: 700, y: 0 }).lon).toBeCloseTo(24.7827071842711, 11);
	expect(ATPOL.xy_to_latlon({ x: 0, y: 700 }).lat).toBeCloseTo(48.7738478347478, 11);
	expect(ATPOL.xy_to_latlon({ x: 0, y: 700 }).lon).toBeCloseTo(14.514453594615, 11);
	expect(ATPOL.xy_to_latlon({ x: 700, y: 700 }).lat).toBeCloseTo(48.750476070495, 11);
	expect(ATPOL.xy_to_latlon({ x: 700, y: 700 }).lon).toBeCloseTo(24.0276107635605, 11);
	expect(ATPOL.xy_to_latlon({ x: 330, y: 350 }).lat).toBeCloseTo(52, 11);
	expect(ATPOL.xy_to_latlon({ x: 330, y: 350 }).lon).toBeCloseTo(19, 11);
});

test("WKT", () => {
	expect(ATPOL.grid_to_polygonWKT("DF97p21")).toBe("POLYGON ((19.58317163873754 49.811734287228084, 19.582948996344328 49.79382827146329, 19.61070719646412 49.793681290336835, 19.610940439413625 49.81158724644106, 19.58317163873754 49.811734287228084))");
	expect(ATPOL.grid_to_centroidWKT("DF97p21")).toBe("POINT (19.596942067739906 49.80270857490112)");
});
