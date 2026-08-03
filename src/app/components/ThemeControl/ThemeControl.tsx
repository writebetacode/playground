import type { Component } from "solid-js";
import { For } from "solid-js";
import type { ThemeChoice } from "../../../lib/theme";
import { useTheme } from "../../ThemeProvider";
import styles from "./ThemeControl.module.css";

const OPTIONS: ReadonlyArray<{ value: ThemeChoice; label: string }> = [
	{ value: "system", label: "System" },
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
];

/**
 * The three-way theme control: a native radio group, which gets keyboard
 * operation (Tab into the group, arrow keys between options), a visible focus
 * indicator, and the current selection exposed to assistive technology for
 * free from the platform, rather than reimplemented with ARIA.
 */
export const ThemeControl: Component = () => {
	const theme = useTheme();

	return (
		<fieldset class={styles.control}>
			<legend class={styles.legend}>Theme</legend>
			<div class={styles.options}>
				<For each={OPTIONS}>
					{(option) => (
						<label class={styles.option}>
							<input
								type="radio"
								name="theme-choice"
								class={styles.input}
								value={option.value}
								checked={theme.choice() === option.value}
								onChange={() => theme.setChoice(option.value)}
							/>
							<span>{option.label}</span>
						</label>
					)}
				</For>
			</div>
		</fieldset>
	);
};
