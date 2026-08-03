import {
	createContext,
	createEffect,
	createSignal,
	onCleanup,
	type ParentComponent,
	useContext,
} from "solid-js";
import {
	type AppliedTheme,
	getThemeStorage,
	PREFERS_DARK_QUERY,
	readStoredChoice,
	resolveTheme,
	type ThemeChoice,
	writeStoredChoice,
} from "../lib/theme";

/** Reactive theme state exposed to the rest of the application. */
export type ThemeContextValue = {
	/** What the visitor picked: System, Light, or Dark. */
	readonly choice: () => ThemeChoice;
	/** The theme actually rendered, after resolving the choice against the browser. */
	readonly applied: () => AppliedTheme;
	/** Records a new choice, applies it immediately, and persists it best-effort. */
	readonly setChoice: (choice: ThemeChoice) => void;
};

const ThemeContext = createContext<ThemeContextValue>();

function currentPreference(): AppliedTheme {
	if (typeof matchMedia !== "function") {
		return "light";
	}
	return matchMedia(PREFERS_DARK_QUERY).matches ? "dark" : "light";
}

/**
 * Holds the theme choice and the browser preference as reactive state, resolves
 * them into the applied theme, and writes that theme onto the document element.
 * While the choice is System, it keeps following the browser preference for the
 * rest of the session rather than sampling it once at load.
 */
export const ThemeProvider: ParentComponent = (props) => {
	const storage = getThemeStorage();
	const [choice, setChoiceSignal] = createSignal<ThemeChoice>(
		readStoredChoice(storage),
	);
	const [preference, setPreference] = createSignal<AppliedTheme>(
		currentPreference(),
	);

	const applied = (): AppliedTheme => resolveTheme(choice(), preference());

	createEffect(() => {
		document.documentElement.setAttribute("data-theme", applied());
	});

	if (typeof matchMedia === "function") {
		const media = matchMedia(PREFERS_DARK_QUERY);
		const onPreferenceChange = (event: MediaQueryListEvent): void => {
			setPreference(event.matches ? "dark" : "light");
		};
		media.addEventListener("change", onPreferenceChange);
		onCleanup(() => {
			media.removeEventListener("change", onPreferenceChange);
		});
	}

	function setChoice(next: ThemeChoice): void {
		setChoiceSignal(next);
		writeStoredChoice(storage, next);
	}

	const value: ThemeContextValue = { choice, applied, setChoice };

	return (
		<ThemeContext.Provider value={value}>
			{props.children}
		</ThemeContext.Provider>
	);
};

/** Reads the theme context. Throws when used outside a `ThemeProvider`. */
export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
