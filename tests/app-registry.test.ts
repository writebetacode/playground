import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { apps } from "../src/apps/registry";

/**
 * A registry entry makes two claims about the repository that no unit test can
 * settle from the value alone: that the folder it names as its source is really
 * there, and that its id is usable as a route segment. Both are read off disk
 * here, which is what keeps a source link from resolving to a GitHub not-found
 * page and an id from arriving with a character a path cannot carry.
 */

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));

const entries = apps.map((app) => ({
	id: app.id,
	name: app.name,
	sourcePath: app.sourcePath,
}));

describe("every registered app points at a folder that exists", () => {
	it("registers at least one app", () => {
		expect(entries.length).toBeGreaterThan(0);
	});

	it.each(entries)(
		"$id names a source path that is on disk",
		({ sourcePath }) => {
			expect(existsSync(join(repositoryRoot, sourcePath))).toBe(true);
		},
	);

	it.each(entries)(
		"$id names a folder rather than a file",
		({ sourcePath }) => {
			expect(statSync(join(repositoryRoot, sourcePath)).isDirectory()).toBe(
				true,
			);
		},
	);

	it.each(entries)(
		"$id keeps its sources under that folder",
		({ id, sourcePath }) => {
			expect(sourcePath).toBe(`src/apps/${id}`);
		},
	);
});

describe("every registered id is usable as a route segment", () => {
	it.each(entries)("$id carries no character a path would escape", ({ id }) => {
		expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
	});

	it.each(entries)("$id names the app it opens", ({ name }) => {
		expect(name.trim().length).toBeGreaterThan(0);
	});
});
