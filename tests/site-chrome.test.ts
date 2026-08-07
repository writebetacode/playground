import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * The chrome is a rendered thing, and what it looks like on the page is a hand
 * check. What can be held still without a browser is its composition: that the
 * shell puts a header above the routed content and a footer below it, that the
 * header hosts the theme control, that the footer's link is built by the source-URL
 * function rather than by a literal of its own, and that every route the router
 * answers sits inside that shell because the shell is the router's root.
 *
 * These are facts about the files that ship, read straight off disk. They cross no
 * more boundary than the unit tests beside them: nothing here mounts a DOM, spawns
 * a process, or opens a socket.
 */

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));

function readSource(path: string): string {
	return readFileSync(join(repositoryRoot, path), "utf8");
}

/** The single-quoted or double-quoted value a source assigns to a constant. */
function constantIn(path: string, name: string): string {
	const match = new RegExp(`${name}\\s*=\\s*"([^"]*)"`).exec(readSource(path));
	if (match === null) {
		throw new Error(`${path} declares no ${name}`);
	}
	return match[1];
}

const shellPath = "src/app/AppShell.tsx";
const headerPath = "src/app/components/Header/Header.tsx";
const footerPath = "src/app/components/Footer/Footer.tsx";
const notFoundPath = "src/app/components/NotFound/NotFound.tsx";
const entryPath = "src/main.tsx";

describe("every screen is framed by the site chrome", () => {
	const shellRules: ReadonlyArray<{ label: string; pattern: RegExp }> = [
		{ label: "renders the header", pattern: /<Header\b/ },
		{ label: "renders the routed content", pattern: /props\.children/ },
		{ label: "renders the footer", pattern: /<Footer\b/ },
	];

	it.each(shellRules)("the shell $label", ({ pattern }) => {
		expect(readSource(shellPath)).toMatch(pattern);
	});

	it("frames the routed content between the header and the footer", () => {
		const shell = readSource(shellPath);

		const header = shell.search(/<Header\b/);
		const content = shell.search(/props\.children/);
		const footer = shell.search(/<Footer\b/);

		expect(header).toBeLessThan(content);
		expect(content).toBeLessThan(footer);
	});

	const entryRules: ReadonlyArray<{ label: string; pattern: RegExp }> = [
		{ label: "mounts the router", pattern: /<Router\b/ },
		{
			label: "wraps every route in the shell as the router's root",
			pattern: /root=\{AppShell\}/,
		},
		{
			label: "hands the router the routes built from the registry",
			pattern: /buildRoutes\(apps\)/,
		},
		{
			label: "keeps the theme provider around the router",
			pattern: /<ThemeProvider\b/,
		},
	];

	it.each(entryRules)("the entry point $label", ({ pattern }) => {
		expect(readSource(entryPath)).toMatch(pattern);
	});

	it("hosts the theme control in the header", () => {
		expect(readSource(headerPath)).toMatch(/<ThemeControl\b/);
	});

	it("carries the source link in the footer", () => {
		expect(readSource(footerPath)).toMatch(/buildSourceUrl\(/);
	});
});

describe("the header names the site at the root", () => {
	it("reads the site name from the header, and the browser tab agrees", () => {
		const title = /<title>([^<]*)<\/title>/.exec(readSource("index.html"));

		expect(title?.[1]).toBe(constantIn(headerPath, "SITE_NAME"));
	});

	const headerStrings: ReadonlyArray<{
		label: string;
		name: string;
		value: string;
	}> = [
		{ label: "the site name", name: "SITE_NAME", value: "Playground" },
		{
			label: "the tagline",
			name: "SITE_TAGLINE",
			value: "Prototypes for AI and UI experiments",
		},
	];

	it.each(headerStrings)("the header declares $label", ({ name, value }) => {
		expect(constantIn(headerPath, name)).toBe(value);
	});

	const headerRules: ReadonlyArray<{ label: string; pattern: RegExp }> = [
		{
			label: "derives the open app from the location",
			pattern: /findAppForPath\(/,
		},
		{
			label: "falls back to the site name when no app is open",
			pattern: /\?\?\s*SITE_NAME/,
		},
		{
			label: "shows the tagline only while no app is open",
			pattern: /<Show\b[^>]*when=\{[^}]*openApp\(\)\s*===\s*undefined\}/,
		},
	];

	it.each(headerRules)("the header $label", ({ pattern }) => {
		expect(readSource(headerPath)).toMatch(pattern);
	});
});

describe("an unknown path offers a way back", () => {
	const notFoundRules: ReadonlyArray<{ label: string; pattern: RegExp }> = [
		{ label: "links back to the app selector", pattern: /href="\/"/ },
		{ label: "uses the router's own link", pattern: /<A\b/ },
		{
			label: "says that nothing is registered there",
			pattern: /Nothing is registered/,
		},
	];

	it.each(notFoundRules)("the not-found screen $label", ({ pattern }) => {
		expect(readSource(notFoundPath)).toMatch(pattern);
	});
});

describe("the source link points at the repository when no app is open", () => {
	const footerRules: ReadonlyArray<{ label: string; pattern: RegExp }> = [
		{
			label: "builds its href with the source-URL function",
			pattern: /href=\{[^}]*buildSourceUrl\(/,
		},
		{
			label: "passes the open app's source path, and nothing when none is open",
			pattern: /buildSourceUrl\(\s*openApp\(\)\?\.sourcePath\s*\)/,
		},
		{ label: "opens the link in a new tab", pattern: /target="_blank"/ },
		{
			label: "hands the new tab no reference back to the site",
			pattern: /rel="[^"]*noreferrer[^"]*"/,
		},
	];

	it.each(footerRules)("the footer $label", ({ pattern }) => {
		expect(readSource(footerPath)).toMatch(pattern);
	});

	it("names no repository URL of its own", () => {
		expect(readSource(footerPath)).not.toMatch(/https:\/\/github\.com/);
	});
});
