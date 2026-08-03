/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
	plugins: [solid()],
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
