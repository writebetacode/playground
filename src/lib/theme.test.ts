import { afterEach, describe, expect, it } from "vitest";
import {
	type AppliedTheme,
	getThemeStorage,
	parseThemeChoice,
	readStoredChoice,
	resolveTheme,
	THEME_STORAGE_KEY,
	type ThemeChoice,
	type ThemeStorage,
	writeStoredChoice,
} from "./theme";

/**
 * Theme resolution is a pure function of the stored theme choice and the browser's
 * `prefers-color-scheme`, so every case here passes plain data in and asserts on the
 * value that comes back. Storage is represented by a stand-in object rather than a
 * real `localStorage`, which keeps these cases in the node test environment: nothing
 * below mounts a DOM, opens a socket, or spawns a process.
 *
 * What these cases do not reach: writing `data-theme` onto the document element,
 * subscribing to a `prefers-color-scheme` change, and the pre-paint script in the
 * entry document. Those are the component and document layers and are evidenced
 * elsewhere.
 */

/** A browser that permits storage: a map behind the two methods the theme module uses. */
function workingStorage(
	initial: ReadonlyArray<readonly [string, string]> = [],
): ThemeStorage & { readonly entries: Map<string, string> } {
	const entries = new Map<string, string>(initial);
	return {
		entries,
		getItem(key: string): string | null {
			return entries.get(key) ?? null;
		},
		setItem(key: string, value: string): void {
			entries.set(key, value);
		},
	};
}

/**
 * A browser that refuses storage, as in private browsing with storage disabled:
 * the object exists but every operation on it throws.
 */
function refusingStorage(): ThemeStorage {
	return {
		getItem(): string | null {
			throw new Error("SecurityError: The operation is insecure.");
		},
		setItem(): void {
			throw new Error("QuotaExceededError: The quota has been exceeded.");
		},
	};
}

/** A later visit reading the same origin's storage as an earlier one. */
function nextVisit(
	previous: ThemeStorage & { readonly entries: Map<string, string> },
): ThemeStorage & { readonly entries: Map<string, string> } {
	return workingStorage([...previous.entries]);
}

describe("the theme follows the browser preference by default", () => {
	const cases: ReadonlyArray<{
		preference: AppliedTheme;
		applied: AppliedTheme;
	}> = [
		{ preference: "dark", applied: "dark" },
		{ preference: "light", applied: "light" },
	];

	it.each(cases)(
		"a visitor who has never used the control gets $applied from a $preference preference",
		({ preference, applied }) => {
			const storage = workingStorage();

			const choice = readStoredChoice(storage);

			expect(choice).toBe("system");
			expect(resolveTheme(choice, preference)).toBe(applied);
		},
	);

	it.each(cases)(
		"a visitor whose browser refuses storage still gets $applied from a $preference preference",
		({ preference, applied }) => {
			const choice = readStoredChoice(refusingStorage());

			expect(choice).toBe("system");
			expect(resolveTheme(choice, preference)).toBe(applied);
		},
	);
});

describe("an explicit theme choice overrides the browser preference", () => {
	const cases: ReadonlyArray<{
		preference: AppliedTheme;
		label: string;
		choice: ThemeChoice;
		applied: AppliedTheme;
	}> = [
		{ preference: "dark", label: "Light", choice: "light", applied: "light" },
		{ preference: "light", label: "Dark", choice: "dark", applied: "dark" },
		{ preference: "dark", label: "System", choice: "system", applied: "dark" },
	];

	it.each(cases)(
		"selecting $label under a $preference preference applies $applied",
		({ preference, choice, applied }) => {
			const storage = workingStorage();

			writeStoredChoice(storage, choice);

			expect(resolveTheme(readStoredChoice(storage), preference)).toBe(applied);
		},
	);

	const resolutionCases: ReadonlyArray<{
		choice: ThemeChoice;
		preference: AppliedTheme;
		applied: AppliedTheme;
	}> = [
		{ choice: "system", preference: "dark", applied: "dark" },
		{ choice: "system", preference: "light", applied: "light" },
		{ choice: "light", preference: "dark", applied: "light" },
		{ choice: "light", preference: "light", applied: "light" },
		{ choice: "dark", preference: "dark", applied: "dark" },
		{ choice: "dark", preference: "light", applied: "dark" },
	];

	it.each(resolutionCases)(
		"the $choice choice under a $preference preference resolves to $applied",
		({ choice, preference, applied }) => {
			expect(resolveTheme(choice, preference)).toBe(applied);
		},
	);
});

describe("a chosen theme persists across visits", () => {
	const preferences: ReadonlyArray<{ preference: AppliedTheme }> = [
		{ preference: "dark" },
		{ preference: "light" },
	];

	it.each(preferences)(
		"a visitor who selected Light earlier gets light again under a $preference preference",
		({ preference }) => {
			const earlierVisit = workingStorage();
			writeStoredChoice(earlierVisit, "light");

			const laterVisit = nextVisit(earlierVisit);

			expect(readStoredChoice(laterVisit)).toBe("light");
			expect(resolveTheme(readStoredChoice(laterVisit), preference)).toBe(
				"light",
			);
		},
	);

	const storedChoices: ReadonlyArray<{ choice: ThemeChoice }> = [
		{ choice: "system" },
		{ choice: "light" },
		{ choice: "dark" },
	];

	it.each(storedChoices)(
		"the $choice choice is stored under the one theme key and read back unchanged",
		({ choice }) => {
			const storage = workingStorage();

			writeStoredChoice(storage, choice);

			expect([...storage.entries.keys()]).toEqual([THEME_STORAGE_KEY]);
			expect(readStoredChoice(nextVisit(storage))).toBe(choice);
		},
	);
});

describe("choosing system resumes following the browser", () => {
	const laterPreferences: ReadonlyArray<{
		preference: AppliedTheme;
		applied: AppliedTheme;
	}> = [
		{ preference: "light", applied: "light" },
		{ preference: "dark", applied: "dark" },
	];

	it.each(laterPreferences)(
		"after Dark then System, a $preference preference applies $applied",
		({ preference, applied }) => {
			const storage = workingStorage();
			writeStoredChoice(storage, "dark");

			writeStoredChoice(storage, "system");
			const choice = readStoredChoice(storage);

			expect(choice).toBe("system");
			expect(resolveTheme(choice, preference)).toBe(applied);
		},
	);

	it("keeps following the preference when it changes later in the session", () => {
		const storage = workingStorage();
		writeStoredChoice(storage, "dark");
		writeStoredChoice(storage, "system");

		const choice = readStoredChoice(storage);
		const beforeChange = resolveTheme(choice, "light");
		const afterChange = resolveTheme(choice, "dark");

		expect([beforeChange, afterChange]).toEqual(["light", "dark"]);
	});
});

describe("an absent or unrecognised stored value is treated as system", () => {
	const parseCases: ReadonlyArray<{
		label: string;
		raw: string | null | undefined;
		choice: ThemeChoice;
	}> = [
		{ label: "the system choice", raw: "system", choice: "system" },
		{ label: "the light choice", raw: "light", choice: "light" },
		{ label: "the dark choice", raw: "dark", choice: "dark" },
		{ label: "a missing value", raw: null, choice: "system" },
		{ label: "an undefined value", raw: undefined, choice: "system" },
		{ label: "an empty value", raw: "", choice: "system" },
		{ label: "a blank value", raw: " ", choice: "system" },
		{ label: "a differently cased value", raw: "Dark", choice: "system" },
		{ label: "a value from another vocabulary", raw: "auto", choice: "system" },
		{ label: "a JSON-quoted value", raw: '"light"', choice: "system" },
		{ label: "a numeric value", raw: "1", choice: "system" },
	];

	it.each(parseCases)("$label parses to $choice", ({ raw, choice }) => {
		expect(parseThemeChoice(raw)).toBe(choice);
	});

	it.each(parseCases)(
		"$label in storage reads back as $choice",
		({ raw, choice }) => {
			const storage =
				raw == null
					? workingStorage()
					: workingStorage([[THEME_STORAGE_KEY, raw]]);

			expect(readStoredChoice(storage)).toBe(choice);
		},
	);
});

describe("storage the browser refuses does not break the theme", () => {
	const unusable: ReadonlyArray<{
		label: string;
		storage: ThemeStorage | null | undefined;
	}> = [
		{ label: "storage that is absent", storage: null },
		{ label: "storage that is undefined", storage: undefined },
		{
			label: "storage that refuses every operation",
			storage: refusingStorage(),
		},
	];

	it.each(unusable)(
		"reading $label yields the system choice",
		({ storage }) => {
			expect(() => readStoredChoice(storage)).not.toThrow();
			expect(readStoredChoice(storage)).toBe("system");
		},
	);

	it.each(unusable)("writing to $label raises nothing", ({ storage }) => {
		expect(() => writeStoredChoice(storage, "dark")).not.toThrow();
	});

	it.each(unusable)(
		"a choice made against $label still applies for the session",
		({ storage }) => {
			writeStoredChoice(storage, "dark");

			expect(resolveTheme("dark", "light")).toBe("dark");
		},
	);

	const nextLoadCases: ReadonlyArray<{
		preference: AppliedTheme;
		applied: AppliedTheme;
	}> = [
		{ preference: "light", applied: "light" },
		{ preference: "dark", applied: "dark" },
	];

	it.each(nextLoadCases)(
		"the next load after a refused write falls back to a $preference preference",
		({ preference, applied }) => {
			const storage = refusingStorage();
			writeStoredChoice(storage, "dark");

			expect(resolveTheme(readStoredChoice(storage), preference)).toBe(applied);
		},
	);
});

describe("the storage the theme uses is resolved when it is asked for", () => {
	const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

	afterEach(() => {
		if (original === undefined) {
			Reflect.deleteProperty(globalThis, "localStorage");
			return;
		}
		Object.defineProperty(globalThis, "localStorage", original);
	});

	it("hands back the storage the host provides", () => {
		const provided = workingStorage([[THEME_STORAGE_KEY, "light"]]);
		Object.defineProperty(globalThis, "localStorage", {
			configurable: true,
			get: () => provided,
		});

		expect(readStoredChoice(getThemeStorage())).toBe("light");
	});

	it("hands back nothing when the host has no storage", () => {
		Reflect.deleteProperty(globalThis, "localStorage");

		expect(getThemeStorage()).toBe(null);
	});

	it("hands back nothing when reaching for storage throws", () => {
		Object.defineProperty(globalThis, "localStorage", {
			configurable: true,
			get: () => {
				throw new Error("SecurityError: The operation is insecure.");
			},
		});

		expect(() => getThemeStorage()).not.toThrow();
		expect(getThemeStorage()).toBe(null);
	});
});
