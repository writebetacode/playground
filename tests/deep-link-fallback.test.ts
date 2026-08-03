import { describe, expect, it } from "vitest";
import viteConfig from "../vite.config";

/**
 * The build's deep-link fallback: Vite writes the entry document as `dist/index.html`,
 * and the build must place a byte-equivalent copy at `dist/404.html` so a static host
 * answers an unmatched path with the application shell.
 *
 * These cases run the configured plugins' `generateBundle` hooks over a synthetic bundle
 * rather than reading `dist/`, which is git-ignored and absent from a fresh clone. The
 * harness reproduces one property of the real pipeline that a naive bundle would hide:
 * Vite's own HTML plugin puts `index.html` into the bundle partway through the hook
 * sequence, so a hook running before that point sees no entry document to copy.
 */

type BundleEntry = {
	type: "asset" | "chunk";
	fileName: string;
	name?: string;
	source?: string;
	code?: string;
};

type EmittedFile = {
	type?: string;
	fileName?: string;
	name?: string;
	source?: string;
};

type HookContext = {
	emitFile: (file: EmittedFile) => string;
};

type GenerateBundleHandler = (
	this: HookContext,
	options: Record<string, unknown>,
	bundle: Record<string, BundleEntry>,
	isWrite: boolean,
) => unknown;

type PluginLike = {
	name?: string;
	enforce?: "pre" | "post";
	generateBundle?:
		| GenerateBundleHandler
		| { handler: GenerateBundleHandler; order?: "pre" | "post" | null };
};

/** Stand-in for Vite's own HTML plugin, which adds the entry document to the bundle. */
const entryDocumentStep = Symbol("vite html plugin");
type PipelineStep = PluginLike | typeof entryDocumentStep;

type HookOrder = "pre" | "normal" | "post";
const hookOrders: ReadonlyArray<HookOrder> = ["pre", "normal", "post"];

function listPlugins(): ReadonlyArray<PluginLike> {
	const declared = (viteConfig as { plugins?: unknown }).plugins;
	const flattened: unknown[] = Array.isArray(declared)
		? declared.flat(Number.POSITIVE_INFINITY)
		: [];
	return flattened.filter(
		(plugin): plugin is PluginLike =>
			typeof plugin === "object" && plugin !== null,
	);
}

/**
 * The plugin sequence Vite builds: `enforce: "pre"` plugins, then plugins with no
 * `enforce`, then Vite's HTML plugin, then `enforce: "post"` plugins.
 */
function pipeline(): ReadonlyArray<PipelineStep> {
	const plugins = listPlugins();
	return [
		...plugins.filter((plugin) => plugin.enforce === "pre"),
		...plugins.filter((plugin) => plugin.enforce === undefined),
		entryDocumentStep,
		...plugins.filter((plugin) => plugin.enforce === "post"),
	];
}

/** Rollup runs every `order: "pre"` hook, then unordered hooks, then every `order: "post"` hook. */
function hookOrderOf(step: PipelineStep): HookOrder {
	if (step === entryDocumentStep) {
		return "normal";
	}
	const hook = step.generateBundle;
	if (typeof hook === "object" && hook !== null && hook.order != null) {
		return hook.order;
	}
	return "normal";
}

function toHandler(step: PipelineStep): GenerateBundleHandler | null {
	if (step === entryDocumentStep) {
		return null;
	}
	const hook = step.generateBundle;
	if (typeof hook === "function") {
		return hook;
	}
	if (typeof hook === "object" && hook !== null) {
		return hook.handler;
	}
	return null;
}

/** Runs the configured build hooks against a bundle the way Vite's build does. */
function runBuild(entryDocument: string | null): {
	bundle: Record<string, BundleEntry>;
	produced: string[];
} {
	const bundle: Record<string, BundleEntry> = {
		"assets/index-A1B2C3D4.js": {
			type: "chunk",
			fileName: "assets/index-A1B2C3D4.js",
			code: "/* entry chunk */",
		},
	};

	const emitted: EmittedFile[] = [];
	const emittedNames = new Set<string>();
	const context: HookContext = {
		emitFile(file) {
			emitted.push(file);
			if (file.fileName !== undefined) {
				emittedNames.add(file.fileName);
				bundle[file.fileName] = {
					type: "asset",
					fileName: file.fileName,
					source: file.source,
				};
			}
			return "emitted";
		},
	};

	for (const order of hookOrders) {
		for (const step of pipeline()) {
			if (hookOrderOf(step) !== order) {
				continue;
			}
			if (step === entryDocumentStep) {
				if (entryDocument !== null) {
					bundle["index.html"] = {
						type: "asset",
						fileName: "index.html",
						name: "index.html",
						source: entryDocument,
					};
				}
				continue;
			}
			toHandler(step)?.call(context, {}, bundle, true);
		}
	}

	const produced = [
		...emitted
			.filter((file) => file.fileName === "404.html")
			.map((file) => file.source ?? ""),
		...Object.values(bundle)
			.filter(
				(entry) =>
					entry.fileName === "404.html" &&
					emittedNames.has(entry.fileName) === false,
			)
			.map((entry) => entry.source ?? ""),
	];

	return { bundle, produced };
}

describe("a direct deep link is served the application shell", () => {
	const entryDocuments: ReadonlyArray<{ label: string; entry: string }> = [
		{
			label: "a minimal shell",
			entry:
				'<!doctype html><html lang="en"><body><div id="root"></div></body></html>',
		},
		{
			label: "a shell referencing hashed assets",
			entry: [
				"<!doctype html>",
				'<html lang="en">',
				"<head>",
				'<link rel="stylesheet" href="/assets/index-Z9Y8X7W6.css">',
				'<script type="module" crossorigin src="/assets/index-A1B2C3D4.js"></script>',
				"</head>",
				'<body><div id="root"></div></body>',
				"</html>",
			].join("\n"),
		},
		{
			label: "a shell carrying an inline pre-paint script",
			entry: [
				"<!doctype html>",
				'<html lang="en">',
				"<head><title>Playground</title>",
				'<script>document.documentElement.dataset.theme = "dark";</script>',
				"</head>",
				'<body><div id="root"></div></body>',
				"</html>",
			].join("\n"),
		},
	];

	it.each(entryDocuments)(
		"the build produces one 404.html from $label",
		({ entry }) => {
			expect(runBuild(entry).produced).toHaveLength(1);
		},
	);

	it.each(entryDocuments)(
		"the 404.html carries the same markup and asset references as $label",
		({ entry }) => {
			expect(runBuild(entry).produced[0]).toBe(entry);
		},
	);

	it("leaves the entry document itself untouched", () => {
		const entry = entryDocuments[1].entry;
		expect(runBuild(entry).bundle["index.html"].source).toBe(entry);
	});

	it("produces no fallback when the build produced no entry document", () => {
		expect(runBuild(null).produced).toEqual([]);
	});
});
