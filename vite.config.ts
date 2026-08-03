/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from "vite";
import solid from "vite-plugin-solid";

/**
 * Deep-link fallback: copies the built entry document to `404.html` so a static
 * host without server-side routing serves the application shell for any path
 * below the site root, letting the client-side router take over from there.
 */
function deepLinkFallback(): Plugin {
	return {
		name: "deep-link-fallback",
		enforce: "post",
		generateBundle(_options, bundle) {
			const entry = bundle["index.html"];
			if (entry === undefined || entry.type !== "asset") {
				return;
			}
			this.emitFile({
				type: "asset",
				fileName: "404.html",
				source: entry.source,
			});
		},
	};
}

export default defineConfig({
	plugins: [solid(), deepLinkFallback()],
	css: {
		modules: {
			generateScopedName: "[name]__[local]__[hash:base64:5]",
		},
	},
	test: {
		environment: "node",
		include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
	},
});
