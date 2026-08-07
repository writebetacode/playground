import type { Component } from "solid-js";

/**
 * One entry per experiment. Routes, selector cards, and source links all read
 * this list, so adding an app is its own folder plus one entry here and never a
 * change to the shell.
 */
export type AppDefinition = {
	/** Route segment and lookup key, for example `tictactoe`. */
	readonly id: string;
	/** Display name, for example `Tic Tac Toe`. */
	readonly name: string;
	/** One or two sentences for the selector card. */
	readonly description: string;
	/** Short labels for what the app demonstrates. */
	readonly tags: readonly string[];
	/** Repository-relative folder the source link points at. */
	readonly sourcePath: string;
	/** Loads the app's component, which is what splits it into its own chunk. */
	readonly load: () => Promise<{ default: Component }>;
};

/** Every registered app. Tic-tac-toe arrives in the next task. */
export const apps: readonly AppDefinition[] = [];

/** The app registered under an id, or nothing when no entry claims it. */
export function findAppById(
	registry: readonly AppDefinition[],
	id: string,
): AppDefinition | undefined {
	return registry.find((app) => app.id === id);
}

/**
 * The app a location has open, derived by matching the first path segment
 * against the registered ids. A path below an app still counts as that app being
 * open, and a path claimed by no entry -- including a stale bookmark to an
 * experiment that has been retired -- opens nothing.
 */
export function findAppForPath(
	registry: readonly AppDefinition[],
	pathname: string,
): AppDefinition | undefined {
	const [segment = ""] = pathname.replace(/^\/+/, "").split("/");
	return segment === "" ? undefined : findAppById(registry, segment);
}
