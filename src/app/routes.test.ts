import type { Component } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import type { AppDefinition } from "../apps/registry";

/**
 * Route building is a pure function of the registry: a list of plain values in, a
 * list of route definitions out. That is what makes adding an experiment one
 * folder plus one entry -- no route table is edited -- and it is where the
 * catch-all that answers an unknown path is guaranteed to exist even while the
 * registry is empty.
 *
 * The one stub below is not a DOM harness. `@solidjs/router` records the history
 * depth as its module initialises, which is the only global it touches before a
 * router is created, so the three properties it reads stand in for a browser and
 * the routes are then built from plain data. Nothing below renders anything: the
 * components are compared by identity only.
 */

vi.stubGlobal("window", {
	history: { state: { _depth: 0 }, length: 1, replaceState: () => {} },
});

const { buildRoutes } = await import("./routes");
const { AppList } = await import("./components/AppList/AppList");
const { NotFound } = await import("./components/NotFound/NotFound");

const placeholder: Component = () => null;

function defineApp(id: string): AppDefinition {
	return {
		id,
		name: id,
		description: `The ${id} experiment.`,
		tags: ["solid"],
		sourcePath: `src/apps/${id}`,
		load: async () => ({ default: placeholder }),
	};
}

function pathsOf(apps: readonly AppDefinition[]): Array<string | undefined> {
	return buildRoutes(apps).map((route) => route.path as string | undefined);
}

describe("routes are generated from the registry", () => {
	const registries: ReadonlyArray<{
		label: string;
		ids: readonly string[];
		paths: readonly string[];
	}> = [
		{ label: "an empty registry", ids: [], paths: ["/", "*"] },
		{
			label: "a single app",
			ids: ["tictactoe"],
			paths: ["/", "/tictactoe", "*"],
		},
		{
			label: "several apps",
			ids: ["tictactoe", "colour-lab", "signals"],
			paths: ["/", "/tictactoe", "/colour-lab", "/signals", "*"],
		},
	];

	it.each(registries)("$label generates $paths", ({ ids, paths }) => {
		expect(pathsOf(ids.map(defineApp))).toEqual(paths);
	});

	it.each(registries)(
		"$label leaves every route with a component",
		({ ids }) => {
			const componentless = buildRoutes(ids.map(defineApp)).filter(
				(route) => route.component === undefined,
			);

			expect(componentless).toEqual([]);
		},
	);

	it("adds one route per entry and edits no other route", () => {
		const before = pathsOf([defineApp("tictactoe")]);

		const after = pathsOf([defineApp("tictactoe"), defineApp("colour-lab")]);

		expect(after).toEqual(["/", "/tictactoe", "/colour-lab", "*"]);
		expect(after.filter((path) => before.includes(path))).toEqual(before);
	});
});

describe("an unknown path falls through to the not-found screen", () => {
	it("ends every registry in a catch-all", () => {
		expect(pathsOf([defineApp("tictactoe")]).at(-1)).toBe("*");
	});

	it("answers the catch-all with the not-found screen", () => {
		const routes = buildRoutes([defineApp("tictactoe")]);

		expect(routes.at(-1)?.component).toBe(NotFound);
	});

	it("keeps the catch-all while the registry is empty", () => {
		expect(buildRoutes([]).at(-1)?.component).toBe(NotFound);
	});
});

describe("the site root renders the selector", () => {
	it("answers the root path with the app list", () => {
		expect(buildRoutes([]).at(0)?.component).toBe(AppList);
	});
});

describe("an app arrives as its own chunk", () => {
	it("does not load an app while the routes are built", () => {
		let loads = 0;
		const counted: AppDefinition = {
			...defineApp("tictactoe"),
			load: async () => {
				loads += 1;
				return { default: placeholder };
			},
		};

		buildRoutes([counted]);

		expect(loads).toBe(0);
	});

	it("hands the registry's own loader to the route", () => {
		const app = defineApp("tictactoe");

		const route = buildRoutes([app]).at(1);

		expect(route?.path).toBe("/tictactoe");
		expect(typeof route?.component).toBe("function");
	});
});
