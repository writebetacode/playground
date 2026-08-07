import type { RouteDefinition } from "@solidjs/router";
import { lazy } from "solid-js";
import type { AppDefinition } from "../apps/registry";
import { AppList } from "./components/AppList/AppList";
import { NotFound } from "./components/NotFound/NotFound";

/**
 * Every route the site answers, derived from the registry: the selector at the
 * root, one path per registered app, and a catch-all for everything else. An
 * app's component arrives through `lazy`, so it is a chunk of its own that the
 * selector never downloads, and nothing here names a particular app.
 */
export function buildRoutes(
	registry: readonly AppDefinition[],
): RouteDefinition[] {
	return [
		{ path: "/", component: AppList },
		...registry.map((app) => ({
			path: `/${app.id}`,
			component: lazy(app.load),
		})),
		{ path: "*", component: NotFound },
	];
}
