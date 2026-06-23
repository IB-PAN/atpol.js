import { defineConfig } from "bunup";

export default defineConfig({
	entry: ["main.ts"],
	format: ["esm", "cjs"],
	dts: true,
	target: "bun", // or "browser", but not "node"
});
