import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createContext, runInContext } from "node:vm";
import { describe, expect, it } from "vitest";
import {
	type AppliedTheme,
	parseThemeChoice,
	resolveTheme,
	THEME_STORAGE_KEY,
} from "../src/lib/theme";

/**
 * The applied theme has to be right on the first painted frame, which depends on a
 * small inline script in the entry document running before the browser paints.
 *
 * These cases are a file fact over the real `index.html`: they read the document that
 * actually ships, assert where its inline script sits and how it is loaded, and run
 * its extracted text -- not a copy written here -- against stubbed storage and media
 * query objects, checking that the `data-theme` it applies is the one `resolveTheme`
 * returns for the same stored choice and preference.
 *
 * What that establishes: the shipped script's logic, its position ahead of the module
 * entry, and its agreement with the resolution function on every combination.
 *
 * What it does not establish: that the browser painted nothing before the script ran.
 * No test in this suite reaches that; only a hand check in a real browser does, and
 * criterion 5 is not satisfied by these cases alone.
 *
 * The sandbox deliberately provides nothing beyond `document`, `localStorage`,
 * `matchMedia`, and `window`, so a script reaching for anything else fails these cases
 * rather than passing quietly on an API the stub happened to invent.
 */

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const entryDocument = readFileSync(`${repositoryRoot}index.html`, "utf8");

type ScriptTag = {
	/** Offset of the opening tag within the whole document. */
	readonly at: number;
	readonly attributes: string;
	readonly body: string;
};

function headOf(document: string): string {
	const head = /<head[^>]*>([\s\S]*?)<\/head>/i.exec(document);
	return head === null ? "" : head[1];
}

function scriptTagsIn(markup: string, offset: number): ScriptTag[] {
	const pattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
	const found: ScriptTag[] = [];
	for (const match of markup.matchAll(pattern)) {
		found.push({
			at: offset + (match.index ?? 0),
			attributes: match[1],
			body: match[2],
		});
	}
	return found;
}

function inlineHeadScripts(): ScriptTag[] {
	const head = headOf(entryDocument);
	return scriptTagsIn(head, entryDocument.indexOf(head)).filter(
		(script) => /\bsrc\s*=/i.test(script.attributes) === false,
	);
}

function prePaintScript(): ScriptTag {
	const scripts = inlineHeadScripts();
	if (scripts.length !== 1) {
		throw new Error(
			`expected exactly one inline script in the head, found ${scripts.length}`,
		);
	}
	return scripts[0];
}

type StorageMode = "working" | "absent" | "access throws" | "read throws";

type SandboxRun = {
	readonly applied: string | undefined;
	readonly failure: unknown;
};

/** Runs the entry document's own inline script against a stubbed browser. */
function runPrePaintScript(options: {
	stored: string | null;
	preference: AppliedTheme;
	storage?: StorageMode;
}): SandboxRun {
	const { stored, preference, storage = "working" } = options;
	const attributes = new Map<string, string>();

	const documentElement = {
		setAttribute(name: string, value: string): void {
			attributes.set(name, String(value));
		},
		getAttribute(name: string): string | null {
			return attributes.get(name) ?? null;
		},
		removeAttribute(name: string): void {
			attributes.delete(name);
		},
		dataset: {
			get theme(): string | undefined {
				return attributes.get("data-theme");
			},
			set theme(value: string) {
				attributes.set("data-theme", String(value));
			},
		},
		style: {} as Record<string, string>,
	};

	const context = createContext({});
	Object.assign(context, {
		document: { documentElement },
		matchMedia(query: string) {
			const asksForDark = /prefers-color-scheme\s*:\s*dark/i.test(query);
			const asksForLight = /prefers-color-scheme\s*:\s*light/i.test(query);
			return {
				media: query,
				matches: asksForDark
					? preference === "dark"
					: asksForLight && preference === "light",
				addEventListener(): void {},
				removeEventListener(): void {},
				addListener(): void {},
				removeListener(): void {},
			};
		},
	});

	if (storage === "access throws") {
		Object.defineProperty(context, "localStorage", {
			configurable: true,
			get(): never {
				throw new Error("SecurityError: The operation is insecure.");
			},
		});
	} else if (storage === "read throws") {
		Object.assign(context, {
			localStorage: {
				getItem(): never {
					throw new Error("SecurityError: The operation is insecure.");
				},
				setItem(): void {},
			},
		});
	} else if (storage === "working") {
		Object.assign(context, {
			localStorage: {
				getItem(key: string): string | null {
					return key === THEME_STORAGE_KEY ? stored : null;
				},
				setItem(): void {},
			},
		});
	}

	Object.defineProperty(context, "window", {
		configurable: true,
		get: () => context,
	});

	let failure: unknown;
	try {
		runInContext(prePaintScript().body, context);
	} catch (error) {
		failure = error;
	}

	return { applied: attributes.get("data-theme"), failure };
}

describe("the entry document carries a pre-paint theme script", () => {
	it("holds exactly one inline script in the head", () => {
		expect(inlineHeadScripts()).toHaveLength(1);
	});

	const disqualifyingAttributes: ReadonlyArray<{
		label: string;
		pattern: RegExp;
	}> = [
		{ label: "deferred to after parsing", pattern: /\bdefer\b/i },
		{ label: "loaded asynchronously", pattern: /\basync\b/i },
		{
			label: "a module, which defers by definition",
			pattern: /\btype\s*=\s*["']?module/i,
		},
		{ label: "external rather than inline", pattern: /\bsrc\s*=/i },
	];

	it.each(disqualifyingAttributes)(
		"the script is not $label",
		({ pattern }) => {
			expect(prePaintScript().attributes).not.toMatch(pattern);
		},
	);

	const laterMarkup: ReadonlyArray<{ label: string; pattern: RegExp }> = [
		{
			label: "the module entry script",
			pattern: /<script[^>]*type=["']module["']/i,
		},
		{
			label: "any stylesheet link",
			pattern: /<link[^>]*rel=["']stylesheet["']/i,
		},
		{ label: "the body", pattern: /<body\b/i },
	];

	it.each(laterMarkup)("the script precedes $label", ({ pattern }) => {
		const match = pattern.exec(entryDocument);
		if (match === null) {
			return;
		}
		expect(prePaintScript().at).toBeLessThan(match.index);
	});

	it("applies the theme through the data-theme attribute the styles key on", () => {
		expect(
			runPrePaintScript({ stored: "dark", preference: "light" }).applied,
		).toBe("dark");
	});
});

describe("the pre-paint script applies the theme the resolution function returns", () => {
	const storedValues: ReadonlyArray<{ label: string; stored: string | null }> =
		[
			{ label: "nothing stored", stored: null },
			{ label: "the system choice", stored: "system" },
			{ label: "the light choice", stored: "light" },
			{ label: "the dark choice", stored: "dark" },
			{ label: "an empty value", stored: "" },
			{ label: "a differently cased value", stored: "Dark" },
			{ label: "a value from another vocabulary", stored: "auto" },
			{ label: "a JSON-quoted value", stored: '"light"' },
		];

	const preferences: ReadonlyArray<{ preference: AppliedTheme }> = [
		{ preference: "dark" },
		{ preference: "light" },
	];

	const cases = storedValues.flatMap((stored) =>
		preferences.map((preference) => ({
			...stored,
			...preference,
			applied: resolveTheme(
				parseThemeChoice(stored.stored),
				preference.preference,
			),
		})),
	);

	it.each(cases)(
		"$label under a $preference preference paints $applied",
		({ stored, preference, applied }) => {
			const run = runPrePaintScript({ stored, preference });

			expect(run.failure).toBe(undefined);
			expect(run.applied).toBe(applied);
		},
	);
});

describe("the pre-paint script survives storage the browser refuses", () => {
	const modes: ReadonlyArray<{ storage: StorageMode }> = [
		{ storage: "absent" },
		{ storage: "access throws" },
		{ storage: "read throws" },
	];

	const preferences: ReadonlyArray<{ preference: AppliedTheme }> = [
		{ preference: "dark" },
		{ preference: "light" },
	];

	const cases = modes.flatMap((mode) =>
		preferences.map((preference) => ({ ...mode, ...preference })),
	);

	it.each(cases)(
		"with $storage, a $preference preference still paints $preference",
		({ storage, preference }) => {
			const run = runPrePaintScript({ stored: null, preference, storage });

			expect(run.failure).toBe(undefined);
			expect(run.applied).toBe(preference);
		},
	);
});

describe("the dark theme the script names is the one the tokens define", () => {
	const tokens = (): string =>
		readFileSync(`${repositoryRoot}src/styles/tokens.css`, "utf8");

	const selectors: ReadonlyArray<{ label: string; pattern: RegExp }> = [
		{ label: "light theme tokens on the root", pattern: /:root\b/ },
		{
			label: "dark theme overrides under the attribute the script writes",
			pattern: /\[data-theme\s*=\s*["']?dark["']?\]/,
		},
	];

	it.each(selectors)("the token layer declares $label", ({ pattern }) => {
		expect(tokens()).toMatch(pattern);
	});
});
