import type { Component } from "solid-js";
import { describe, expect, it } from "vitest";
import {
	type AppDefinition,
	apps,
	findAppById,
	findAppForPath,
} from "./registry";

/**
 * The registry is a list of plain values and the two lookups over it are pure
 * functions of that list and a string, so every case here passes a list in and
 * asserts on what comes back. The chrome derives the open app through
 * `findAppForPath`, which is what lets the header title and the source link
 * retarget without either of them knowing that a particular app exists.
 */

const placeholder: Component = () => null;

function defineApp(id: string, sourcePath = `src/apps/${id}`): AppDefinition {
	return {
		id,
		name: id,
		description: `The ${id} experiment.`,
		tags: ["solid"],
		sourcePath,
		load: async () => ({ default: placeholder }),
	};
}

const registry: readonly AppDefinition[] = [
	defineApp("tictactoe"),
	defineApp("colour-lab", "src/apps/colour-lab"),
];

describe("the registry ships empty until an app is added", () => {
	it("lists no app yet", () => {
		expect(apps).toEqual([]);
	});
});

describe("an app is looked up by its id", () => {
	const byId: ReadonlyArray<{ label: string; id: string; found: boolean }> = [
		{ label: "a registered id", id: "tictactoe", found: true },
		{ label: "another registered id", id: "colour-lab", found: true },
		{ label: "an unregistered id", id: "retired-experiment", found: false },
		{ label: "an empty id", id: "", found: false },
		{ label: "a differently cased id", id: "TicTacToe", found: false },
		{ label: "an id carrying a separator", id: "tictactoe/", found: false },
	];

	it.each(byId)("$label is found: $found", ({ id, found }) => {
		expect(findAppById(registry, id)?.id).toBe(found ? id : undefined);
	});

	it("finds nothing in an empty registry", () => {
		expect(findAppById([], "tictactoe")).toBe(undefined);
	});
});

describe("the open app is derived from the first path segment", () => {
	const byPath: ReadonlyArray<{
		label: string;
		pathname: string;
		id: string | undefined;
	}> = [
		{ label: "the site root", pathname: "/", id: undefined },
		{ label: "an empty path", pathname: "", id: undefined },
		{ label: "an app path", pathname: "/tictactoe", id: "tictactoe" },
		{
			label: "an app path with a trailing separator",
			pathname: "/tictactoe/",
			id: "tictactoe",
		},
		{
			label: "a path below an app",
			pathname: "/tictactoe/settings",
			id: "tictactoe",
		},
		{ label: "another app's path", pathname: "/colour-lab", id: "colour-lab" },
		{
			label: "a stale bookmark to a retired experiment",
			pathname: "/retired-experiment",
			id: undefined,
		},
		{ label: "an unknown path", pathname: "/nowhere", id: undefined },
		{
			label: "a path whose case does not match an id",
			pathname: "/TicTacToe",
			id: undefined,
		},
		{
			label: "a path carrying a query",
			pathname: "/?from=elsewhere",
			id: undefined,
		},
	];

	it.each(byPath)("$label opens $id", ({ pathname, id }) => {
		expect(findAppForPath(registry, pathname)?.id).toBe(id);
	});

	it.each(byPath)(
		"$label opens nothing while the registry is empty",
		({ pathname }) => {
			expect(findAppForPath([], pathname)).toBe(undefined);
		},
	);
});
