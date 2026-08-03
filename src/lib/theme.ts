/**
 * Theme resolution keeps three concepts separate: the stored theme choice, the
 * browser's `prefers-color-scheme`, and the applied theme that results from
 * resolving one against the other. Resolution is a pure function so it can be
 * tested directly with no storage or DOM access inside it.
 */

/** What the visitor picked: System, Light, or Dark. */
export type ThemeChoice = "system" | "light" | "dark";

/** The theme actually rendered after resolving the choice against the preference. */
export type AppliedTheme = "light" | "dark";

/** The storage surface the theme module needs, matching `Storage.getItem`/`setItem`. */
export type ThemeStorage = {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
};

/** The one key the theme choice is stored under. */
export const THEME_STORAGE_KEY = "playground:theme";

/**
 * The media query the applied theme resolves the "system" choice against. The
 * pre-paint script in `index.html` cannot import this -- it runs before any
 * module loads -- so it restates this string verbatim; this constant is what
 * that restatement is checked against.
 */
export const PREFERS_DARK_QUERY = "(prefers-color-scheme: dark)";

const KNOWN_CHOICES: ReadonlySet<string> = new Set<ThemeChoice>([
	"system",
	"light",
	"dark",
]);

/**
 * Resolves a stored choice and the browser's preference into the theme to render.
 * A choice of "system" follows the preference; "light" and "dark" override it.
 */
export function resolveTheme(
	choice: ThemeChoice,
	preference: AppliedTheme,
): AppliedTheme {
	if (choice === "system") {
		return preference;
	}
	return choice;
}

/**
 * Parses a raw stored value into a theme choice. Anything that is not exactly
 * one of the three known choices -- missing, empty, differently cased, or from
 * another vocabulary entirely -- is treated as System.
 */
export function parseThemeChoice(raw: string | null | undefined): ThemeChoice {
	if (raw != null && KNOWN_CHOICES.has(raw)) {
		return raw as ThemeChoice;
	}
	return "system";
}

/**
 * Reads the stored theme choice. Storage is best-effort: a missing storage
 * object or one that throws on read degrades to System rather than failing.
 */
export function readStoredChoice(
	storage: ThemeStorage | null | undefined,
): ThemeChoice {
	if (storage == null) {
		return "system";
	}
	try {
		return parseThemeChoice(storage.getItem(THEME_STORAGE_KEY));
	} catch {
		return "system";
	}
}

/**
 * Writes the theme choice to storage. Storage is best-effort: a missing storage
 * object or one that throws on write is silently ignored so the choice still
 * applies for the current session.
 */
export function writeStoredChoice(
	storage: ThemeStorage | null | undefined,
	choice: ThemeChoice,
): void {
	if (storage == null) {
		return;
	}
	try {
		storage.setItem(THEME_STORAGE_KEY, choice);
	} catch {
		// Storage refused the write; the choice still applies for this session.
	}
}

/**
 * Resolves the host's `localStorage` at call time rather than caching it at
 * module load, so a later change in availability is picked up. Returns null
 * when storage is absent or reaching for it throws.
 */
export function getThemeStorage(): ThemeStorage | null {
	try {
		const storage = (globalThis as { localStorage?: ThemeStorage })
			.localStorage;
		return storage ?? null;
	} catch {
		return null;
	}
}
