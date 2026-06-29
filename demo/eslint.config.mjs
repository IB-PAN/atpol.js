// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
	// Your custom configs here
)
	.overrideRules({
		"@stylistic/max-statements-per-line": ["error", { max: 2, ignoredNodes: ["BreakStatement", "TryStatement"] }],
	});
