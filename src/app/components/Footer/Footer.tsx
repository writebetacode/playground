import { useLocation } from "@solidjs/router";
import type { Component } from "solid-js";
import { apps, findAppForPath } from "../../../apps/registry";
import { buildSourceUrl } from "../../../lib/source-url";
import styles from "./Footer.module.css";

/**
 * The site chrome's bottom half: one source link that retargets itself. At the
 * root it points at the repository; inside an app it points at that app's own
 * folder on the default branch. The link opens in a new tab so a visitor reading
 * the code does not lose the game they were part-way through.
 */
export const Footer: Component = () => {
	const location = useLocation();
	const openApp = () => findAppForPath(apps, location.pathname);
	const label = () =>
		openApp() === undefined
			? "Source on GitHub"
			: "This app's source on GitHub";

	return (
		<footer class={styles.footer}>
			<a
				class={styles.source}
				href={buildSourceUrl(openApp()?.sourcePath)}
				target="_blank"
				rel="noreferrer noopener"
			>
				{label()}
			</a>
		</footer>
	);
};
