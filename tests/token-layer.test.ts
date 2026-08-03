import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * The token layer is what every screen after this task reads its colours from, so
 * two properties of it are worth holding still rather than re-eyeballing per task:
 * that body text clears the 4.5:1 contrast ratio in both themes, and that no file
 * outside the token layer names a colour at all.
 *
 * Contrast is computed from the shipped `tokens.css` values by the WCAG 2.1
 * relative-luminance formula, so these cases are arithmetic over file data and
 * cross no boundary. They cover the ratio, which is a number; whether a focus ring
 * reads as visible to a person, and whether the control announces itself, are
 * judgements that stay with the recorded hand checks for criterion 6.
 */

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const tokensPath = join(repositoryRoot, "src/styles/tokens.css");

function readTokens(): string {
	return readFileSync(tokensPath, "utf8");
}

/** The declarations inside the first block matching a selector. */
function blockFor(selector: RegExp): string {
	const source = readTokens();
	const opening = selector.exec(source);
	if (opening === null) {
		throw new Error(`no block matching ${selector} in tokens.css`);
	}
	const start = source.indexOf("{", opening.index);
	const end = source.indexOf("}", start);
	return source.slice(start + 1, end);
}

function declarationsIn(block: string): Map<string, string> {
	const found = new Map<string, string>();
	for (const match of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
		found.set(match[1], match[2].trim());
	}
	return found;
}

/** Light values come from the root; the dark theme overrides a subset of them. */
function tokensFor(theme: "light" | "dark"): Map<string, string> {
	const light = declarationsIn(blockFor(/:root\s*\{/));
	if (theme === "light") {
		return light;
	}
	const dark = declarationsIn(
		blockFor(/\[data-theme\s*=\s*["']?dark["']?\]\s*\{/),
	);
	return new Map([...light, ...dark]);
}

function channelsOf(value: string): [number, number, number] {
	const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
	if (hex === null) {
		throw new Error(`token value ${value} is not a hex colour`);
	}
	const digits =
		hex[1].length === 3
			? [...hex[1]].map((digit) => `${digit}${digit}`)
			: [hex[1].slice(0, 2), hex[1].slice(2, 4), hex[1].slice(4, 6)];
	const [red, green, blue] = digits.map((pair) => Number.parseInt(pair, 16));
	return [red, green, blue];
}

/** WCAG 2.1 relative luminance. */
function luminanceOf(value: string): number {
	const linear = channelsOf(value)
		.map((channel) => channel / 255)
		.map((channel) =>
			channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
		);
	return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastBetween(foreground: string, background: string): number {
	const first = luminanceOf(foreground);
	const second = luminanceOf(background);
	const lighter = Math.max(first, second);
	const darker = Math.min(first, second);
	return (lighter + 0.05) / (darker + 0.05);
}

function tokenValue(theme: "light" | "dark", token: string): string {
	const value = tokensFor(theme).get(token);
	if (value === undefined) {
		throw new Error(`the ${theme} theme declares no ${token}`);
	}
	return value;
}

const themes: ReadonlyArray<"light" | "dark"> = ["light", "dark"];

describe("body text meets the contrast ratio in both themes", () => {
	const textPairs: ReadonlyArray<{
		label: string;
		foreground: string;
		background: string;
	}> = [
		{
			label: "body text on the page background",
			foreground: "--color-text",
			background: "--color-background",
		},
		{
			label: "body text on a raised surface",
			foreground: "--color-text",
			background: "--color-surface",
		},
		{
			label: "muted text on the page background",
			foreground: "--color-text-muted",
			background: "--color-background",
		},
		{
			label: "muted text on a raised surface",
			foreground: "--color-text-muted",
			background: "--color-surface",
		},
		{
			label: "text on an accent fill",
			foreground: "--color-accent-text",
			background: "--color-accent",
		},
	];

	const textCases = themes.flatMap((theme) =>
		textPairs.map((pair) => ({ theme, ...pair })),
	);

	it.each(textCases)(
		"$label clears 4.5:1 in the $theme theme",
		({ theme, foreground, background }) => {
			const ratio = contrastBetween(
				tokenValue(theme, foreground),
				tokenValue(theme, background),
			);

			expect(ratio).toBeGreaterThanOrEqual(4.5);
		},
	);

	/**
	 * A focus ring is a non-text indicator, which WCAG 1.4.11 puts at 3:1. Clearing
	 * that is necessary for the ring to be visible but not sufficient: whether it
	 * reads as an indicator is the hand check's call, not this one's.
	 */
	const ringCases = themes.flatMap((theme) =>
		[
			{ label: "the page background", background: "--color-background" },
			{ label: "a raised surface", background: "--color-surface" },
		].map((pair) => ({ theme, ...pair })),
	);

	it.each(ringCases)(
		"the focus ring clears 3:1 against $label in the $theme theme",
		({ theme, background }) => {
			const ratio = contrastBetween(
				tokenValue(theme, "--color-focus-ring"),
				tokenValue(theme, background),
			);

			expect(ratio).toBeGreaterThanOrEqual(3);
		},
	);
});

describe("both themes declare the same token vocabulary", () => {
	it("the dark theme overrides only tokens the root declares", () => {
		const light = [...tokensFor("light").keys()];
		const dark = [
			...declarationsIn(
				blockFor(/\[data-theme\s*=\s*["']?dark["']?\]\s*\{/),
			).keys(),
		];

		expect(dark.filter((token) => light.includes(token) === false)).toEqual([]);
	});

	const requiredGroups: ReadonlyArray<{ label: string; prefix: string }> = [
		{ label: "colour", prefix: "--color-" },
		{ label: "spacing", prefix: "--space-" },
		{ label: "radius", prefix: "--radius-" },
		{ label: "shadow", prefix: "--shadow-" },
		{ label: "typography", prefix: "--font-" },
	];

	it.each(requiredGroups)("the root declares $label tokens", ({ prefix }) => {
		const declared = [...tokensFor("light").keys()].filter((token) =>
			token.startsWith(prefix),
		);

		expect(declared.length).toBeGreaterThan(0);
	});

	it.each(themes.map((theme) => ({ theme })))(
		"the $theme theme declares its colour-scheme so the browser canvas matches",
		({ theme }) => {
			const block =
				theme === "light"
					? blockFor(/:root\s*\{/)
					: blockFor(/\[data-theme\s*=\s*["']?dark["']?\]\s*\{/);

			expect(block).toMatch(new RegExp(`color-scheme\\s*:\\s*${theme}\\b`));
		},
	);
});

describe("no file outside the token layer names a colour", () => {
	const tokenLayer = "src/styles/tokens.css";

	function listSourceFiles(directory: string): string[] {
		const found: string[] = [];
		for (const entry of readdirSync(directory, { withFileTypes: true })) {
			const absolutePath = join(directory, entry.name);
			if (entry.isDirectory()) {
				found.push(...listSourceFiles(absolutePath));
				continue;
			}
			found.push(relative(repositoryRoot, absolutePath).split(sep).join("/"));
		}
		return found;
	}

	function styledSources(): string[] {
		return listSourceFiles(join(repositoryRoot, "src")).filter(
			(path) =>
				path !== tokenLayer &&
				(path.endsWith(".css") ||
					path.endsWith(".tsx") ||
					(path.endsWith(".ts") && path.endsWith(".test.ts") === false)),
		);
	}

	const colourLiterals: ReadonlyArray<{ label: string; pattern: RegExp }> = [
		{ label: "a hex colour", pattern: /#[0-9a-f]{3,8}\b/i },
		{ label: "an rgb or hsl function", pattern: /\b(?:rgba?|hsla?)\s*\(/i },
		{
			label: "a named colour",
			pattern:
				/(?<![\w-])(?:white|black|red|green|blue|grey|gray|silver|navy|teal|orange|purple|yellow)(?![\w-])/i,
		},
	];

	it.each(colourLiterals)("no source hard-codes $label", ({ pattern }) => {
		const offenders = styledSources().filter((path) =>
			pattern.test(readFileSync(join(repositoryRoot, path), "utf8")),
		);

		expect(offenders).toEqual([]);
	});

	it("every stylesheet outside the shared styles folder is a CSS Module", () => {
		const leaking = listSourceFiles(join(repositoryRoot, "src"))
			.filter((path) => path.endsWith(".css"))
			.filter(
				(path) =>
					path.startsWith("src/styles/") === false &&
					path.endsWith(".module.css") === false,
			);

		expect(leaking).toEqual([]);
	});
});

describe("the global stylesheet is built on the tokens", () => {
	const globalPath = join(repositoryRoot, "src/styles/global.css");

	function readGlobal(): string {
		return readFileSync(globalPath, "utf8");
	}

	it("ships a global stylesheet", () => {
		expect(existsSync(globalPath)).toBe(true);
	});

	const globalRules: ReadonlyArray<{ label: string; pattern: RegExp }> = [
		{ label: "reads its values from the tokens", pattern: /var\(--/ },
		{
			label: "sets the page background from a token",
			pattern: /background[^;]*var\(--color-/,
		},
		{
			label: "sets the body colour from a token",
			pattern: /color\s*:\s*var\(--color-/,
		},
		{
			label: "styles the keyboard focus indicator",
			pattern: /:focus-visible\b/,
		},
	];

	it.each(globalRules)("the global stylesheet $label", ({ pattern }) => {
		expect(readGlobal()).toMatch(pattern);
	});
});
