import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Whether a focus ring reads as visible, and whether a screen reader speaks the
 * result, are judgements about a rendered page and stay with the recorded hand
 * check. What can be held still without a browser is the markup those judgements
 * depend on: that a square is a real button rather than a clickable div, that it
 * carries its own focus-visible styling and an accessible name, that the status
 * is a live region, and that nothing in the app moves focus when a game ends.
 *
 * These are facts about the files that ship, read straight off disk. Nothing here
 * mounts a DOM, spawns a process, or opens a socket.
 */

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));

function readSource(path: string): string {
	return readFileSync(join(repositoryRoot, path), "utf8");
}

const boardPath = "src/apps/tictactoe/components/Board/Board.tsx";
const boardStylePath = "src/apps/tictactoe/components/Board/Board.module.css";
const statusPath = "src/apps/tictactoe/components/Status/Status.tsx";
const screenPath = "src/apps/tictactoe/TicTacToe.tsx";

describe("the board is playable by keyboard", () => {
	const boardRules: ReadonlyArray<{ label: string; pattern: RegExp }> = [
		{ label: "renders each square as a button", pattern: /<button\b/ },
		{
			label: "types those buttons so they never submit a form",
			pattern: /type="button"/,
		},
		{ label: "gives every square an accessible name", pattern: /aria-label=/ },
		{
			label: "names the square's position in that label",
			pattern: /[Rr]ow\b[^\n]*[Cc]olumn\b/,
		},
		{
			label: "marks a square from a keyboard-operable handler",
			pattern: /onClick=/,
		},
	];

	it.each(boardRules)("the board $label", ({ pattern }) => {
		expect(readSource(boardPath)).toMatch(pattern);
	});

	it("renders no clickable element that is not a button", () => {
		const clickable = [
			...readSource(boardPath).matchAll(/<(\w+)[^>]*onClick=/g),
		].map((match) => match[1]);

		expect(clickable.filter((element) => element !== "button")).toEqual([]);
	});

	it("never disables a square, which would take it out of the tab order", () => {
		expect(readSource(boardPath)).not.toMatch(/\bdisabled\b/);
	});

	const focusRules: ReadonlyArray<{ label: string; pattern: RegExp }> = [
		{ label: "draws a focus indicator", pattern: /:focus-visible\b/ },
		{
			label: "draws it from the focus-ring token",
			pattern: /outline[^;]*var\(--color-focus-ring\)/,
		},
		{
			label: "holds the indicator clear of the square's edge",
			pattern: /outline-offset\s*:/,
		},
	];

	it.each(focusRules)("the board stylesheet $label", ({ pattern }) => {
		expect(readSource(boardStylePath)).toMatch(pattern);
	});
});

describe("the game result is announced to assistive technology", () => {
	const statusRules: ReadonlyArray<{ label: string; pattern: RegExp }> = [
		{ label: "is a live region", pattern: /role="status"/ },
		{
			label: "announces politely rather than interrupting",
			pattern: /aria-live="polite"/,
		},
		{
			label: "offers the play-again control as a button",
			pattern: /<button\b[^>]*type="button"/,
		},
	];

	it.each(statusRules)("the status $label", ({ pattern }) => {
		expect(readSource(statusPath)).toMatch(pattern);
	});

	it("keeps the live region outside the board", () => {
		expect(readSource(boardPath)).not.toMatch(/aria-live=|role="status"/);
	});

	const focusMovers: ReadonlyArray<{ label: string; path: string }> = [
		{ label: "the board", path: boardPath },
		{ label: "the status", path: statusPath },
		{ label: "the screen", path: screenPath },
	];

	it.each(focusMovers)("$label moves focus nowhere itself", ({ path }) => {
		expect(readSource(path)).not.toMatch(/\.focus\(\)|autofocus|autoFocus/);
	});

	it("renders the status alongside the board rather than inside it", () => {
		const screen = readSource(screenPath);

		expect(screen).toMatch(/<Status\b/);
		expect(screen).toMatch(/<Board\b/);
		expect(readSource(statusPath)).not.toMatch(/<Board\b/);
	});
});
