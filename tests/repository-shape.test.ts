import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const selfPath = toRepoPath(fileURLToPath(import.meta.url));

/** Directories that hold no repository source: build output, installed packages, git internals. */
const uninspectedDirectories = new Set([".git", "node_modules", "dist"]);

/** Planning documents describe the retired experiment by design and are not repository sources. */
const planningPrefix = "plans/";

function toRepoPath(absolutePath: string): string {
	return relative(repositoryRoot, absolutePath).split(sep).join("/");
}

function listRepositoryFiles(directory: string = repositoryRoot): string[] {
	const found: string[] = [];
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const absolutePath = join(directory, entry.name);
		if (entry.isDirectory()) {
			if (uninspectedDirectories.has(entry.name)) {
				continue;
			}
			found.push(...listRepositoryFiles(absolutePath));
			continue;
		}
		found.push(toRepoPath(absolutePath));
	}
	return found;
}

describe("the retired prototype is gone", () => {
	const retiredPaths: ReadonlyArray<{ label: string; path: string }> = [
		{ label: "the prototype directory", path: "solid" },
		{ label: "the Rollup build configuration", path: "solid/rollup.config.js" },
		{ label: "the Babel preset configuration", path: "solid/.babelrc" },
		{ label: "the PostCSS configuration", path: "solid/.postcssrc.json" },
		{ label: "the browser target list", path: "solid/.browserlistrc" },
		{ label: "the prototype Makefile", path: "solid/Makefile" },
		{ label: "the prototype app list", path: "solid/apps.js" },
		{ label: "the prototype mount point", path: "solid/main.js" },
		{ label: "the prototype manifest", path: "solid/package.json" },
		{ label: "the prototype lockfile", path: "solid/package-lock.json" },
		{ label: "the prototype project tree", path: "solid/projects" },
		{ label: "the prototype global styles", path: "solid/styles" },
		{ label: "the colorsays sources", path: "solid/projects/colorsays" },
		{
			label: "the colorsays document",
			path: "solid/projects/colorsays/README.md",
		},
	];

	it.each(retiredPaths)("$label no longer exists at $path", ({ path }) => {
		expect(existsSync(join(repositoryRoot, path))).toBe(false);
	});

	const retiredToolchainFilenames: ReadonlyArray<{ label: string; filename: string }> = [
		{ label: "Rollup", filename: "rollup.config.js" },
		{ label: "Rollup", filename: "rollup.config.mjs" },
		{ label: "Rollup", filename: "rollup.config.ts" },
		{ label: "Nollup", filename: "nollup.config.js" },
		{ label: "Babel", filename: ".babelrc" },
		{ label: "Babel", filename: ".babelrc.json" },
		{ label: "Babel", filename: "babel.config.js" },
		{ label: "Babel", filename: "babel.config.cjs" },
		{ label: "Babel", filename: "babel.config.json" },
	];

	it.each(retiredToolchainFilenames)(
		"no $label configuration named $filename remains anywhere in the repository",
		({ filename }) => {
			const matches = listRepositoryFiles().filter(
				(path) => path === filename || path.endsWith(`/${filename}`),
			);
			expect(matches).toEqual([]);
		},
	);

	it("names the retired experiment in no repository path", () => {
		const matches = listRepositoryFiles().filter(
			(path) =>
				path.startsWith(planningPrefix) === false &&
				path.toLowerCase().includes("colorsays"),
		);
		expect(matches).toEqual([]);
	});

	it("names the retired experiment in no repository source or document", () => {
		const matches = listRepositoryFiles()
			.filter((path) => path.startsWith(planningPrefix) === false && path !== selfPath)
			.filter((path) => {
				const contents = readFileSync(join(repositoryRoot, path), "utf8");
				return contents.toLowerCase().includes("colorsays");
			});
		expect(matches).toEqual([]);
	});
});

describe("the pinned Node version is picked up automatically", () => {
	const nodeVersionPath = join(repositoryRoot, ".node-version");

	function readNodeVersion(): string {
		return readFileSync(nodeVersionPath, "utf8");
	}

	it("pins the Node version in the file fnm reads on directory entry", () => {
		expect(existsSync(nodeVersionPath)).toBe(true);
	});

	const pinRules: ReadonlyArray<{ label: string; pattern: RegExp }> = [
		{ label: "holds a single line", pattern: /^[^\n]+\n?$/ },
		{
			label: "carries only a version, with no comment or shell decoration fnm would not parse",
			pattern: /^v?[0-9]+(\.[0-9]+){0,2}\n?$/,
		},
		{ label: "pins the Node major to 26", pattern: /^v?26(\.[0-9]+){0,2}\n?$/ },
	];

	it.each(pinRules)("the pin $label", ({ pattern }) => {
		expect(readNodeVersion()).toMatch(pattern);
	});
});
