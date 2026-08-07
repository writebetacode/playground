import { useLocation } from "@solidjs/router";
import { type Component, Show } from "solid-js";
import { apps, findAppForPath } from "../../../apps/registry";
import { ThemeControl } from "../ThemeControl/ThemeControl";
import styles from "./Header.module.css";

/** What the header calls the site while no app is open. */
export const SITE_NAME = "Playground";

/** The line under the site name on the selector screen. */
export const SITE_TAGLINE = "Prototypes for AI and UI experiments";

/**
 * The site chrome's top half: a title that is the site's name at the root and the
 * open app's name inside an app, and the theme control. It learns which app is
 * open from the registry rather than from a list of its own, so a new experiment
 * never edits this file.
 */
export const Header: Component = () => {
	const location = useLocation();
	const openApp = () => findAppForPath(apps, location.pathname);
	const title = () => openApp()?.name ?? SITE_NAME;

	return (
		<header class={styles.header}>
			<div class={styles.identity}>
				<h1 class={styles.title}>{title()}</h1>
				<Show when={openApp() === undefined}>
					<p class={styles.tagline}>{SITE_TAGLINE}</p>
				</Show>
			</div>
			<ThemeControl />
		</header>
	);
};
