import { describe, expect, it } from "vitest";
import { apps } from "../apps/registry";
import { buildSourceUrl, DEFAULT_BRANCH, REPOSITORY_URL } from "./source-url";

/**
 * A source link is a string built from a repository, a default branch, and an
 * optional repository-relative path, so every case here passes plain data in and
 * asserts on the URL that comes back. The chrome and the selector cards both read
 * this one function, which is what keeps the shape of the link stated in a single
 * place.
 *
 * What these cases do not reach: that the anchor carrying the URL opens in a new
 * tab, and that GitHub serves the page it points at. The first is a fact about the
 * shipped footer and the second crosses into a host this repository does not own.
 */

describe("the source link points at the repository when no app is open", () => {
	const noApp: ReadonlyArray<{
		label: string;
		sourcePath: string | null | undefined;
	}> = [
		{ label: "no argument at all", sourcePath: undefined },
		{ label: "an absent app", sourcePath: null },
		{ label: "an empty source path", sourcePath: "" },
		{ label: "a blank source path", sourcePath: "   " },
		{ label: "a bare separator", sourcePath: "/" },
	];

	it.each(noApp)(
		"$label yields the repository's own page",
		({ sourcePath }) => {
			expect(buildSourceUrl(sourcePath)).toBe(REPOSITORY_URL);
		},
	);

	it("names the repository the site is published from", () => {
		expect(REPOSITORY_URL).toBe("https://github.com/writebetacode/playground");
	});

	it("names the branch the links resolve against", () => {
		expect(DEFAULT_BRANCH).toBe("main");
	});
});

describe("the source link retargets to the open app", () => {
	it.each(apps.map((app) => ({ id: app.id, sourcePath: app.sourcePath })))(
		"$id resolves to its own folder on the default branch",
		({ sourcePath }) => {
			expect(buildSourceUrl(sourcePath)).toBe(
				`${REPOSITORY_URL}/tree/${DEFAULT_BRANCH}/${sourcePath}`,
			);
		},
	);

	it("sends tic-tac-toe to its own folder rather than the repository root", () => {
		const tictactoe = apps.find((app) => app.id === "tictactoe");

		expect(buildSourceUrl(tictactoe?.sourcePath)).toBe(
			"https://github.com/writebetacode/playground/tree/main/src/apps/tictactoe",
		);
		expect(buildSourceUrl(tictactoe?.sourcePath)).not.toBe(REPOSITORY_URL);
	});
});

describe("a source path resolves to that folder on the default branch", () => {
	const paths: ReadonlyArray<{
		label: string;
		sourcePath: string;
		url: string;
	}> = [
		{
			label: "an app folder",
			sourcePath: "src/apps/tictactoe",
			url: "https://github.com/writebetacode/playground/tree/main/src/apps/tictactoe",
		},
		{
			label: "a nested folder inside an app",
			sourcePath: "src/apps/tictactoe/lib",
			url: "https://github.com/writebetacode/playground/tree/main/src/apps/tictactoe/lib",
		},
		{
			label: "a single segment",
			sourcePath: "src",
			url: "https://github.com/writebetacode/playground/tree/main/src",
		},
		{
			label: "a path written with a leading separator",
			sourcePath: "/src/apps/tictactoe",
			url: "https://github.com/writebetacode/playground/tree/main/src/apps/tictactoe",
		},
		{
			label: "a path written with a trailing separator",
			sourcePath: "src/apps/tictactoe/",
			url: "https://github.com/writebetacode/playground/tree/main/src/apps/tictactoe",
		},
		{
			label: "a path padded with whitespace",
			sourcePath: "  src/apps/tictactoe  ",
			url: "https://github.com/writebetacode/playground/tree/main/src/apps/tictactoe",
		},
		{
			label: "a path that exists in no tree",
			sourcePath: "src/apps/never-written",
			url: "https://github.com/writebetacode/playground/tree/main/src/apps/never-written",
		},
	];

	it.each(paths)("$label resolves to $url", ({ sourcePath, url }) => {
		expect(buildSourceUrl(sourcePath)).toBe(url);
	});

	it.each(paths)(
		"$label is built from the repository and the default branch",
		({ sourcePath }) => {
			const prefix = `${REPOSITORY_URL}/tree/${DEFAULT_BRANCH}/`;

			expect(buildSourceUrl(sourcePath).startsWith(prefix)).toBe(true);
		},
	);
});
