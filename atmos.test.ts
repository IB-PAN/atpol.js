import { expect, test } from "bun:test";
import { ATMOS } from "./main";

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
