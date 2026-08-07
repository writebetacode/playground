import { A } from "@solidjs/router";
import type { Component } from "solid-js";
import styles from "./NotFound.module.css";

/**
 * The screen behind the catch-all route: what a visitor gets from a mistyped
 * path or a bookmark to an experiment that is no longer registered. It says so
 * and offers the way back rather than leaving a blank page.
 */
export const NotFound: Component = () => {
	return (
		<section class={styles.notFound}>
			<h2 class={styles.heading}>Nothing is registered at this path</h2>
			<p class={styles.message}>
				The link may be out of date, or the experiment it pointed at may have
				been retired.
			</p>
			<A class={styles.back} href="/">
				Back to the app selector
			</A>
		</section>
	);
};
