import type { RouteSectionProps } from "@solidjs/router";
import type { Component } from "solid-js";
import styles from "./AppShell.module.css";
import { Footer } from "./components/Footer/Footer";
import { Header } from "./components/Header/Header";

/**
 * The router's root: whatever route matches renders as this layout's children,
 * which is what puts the same header and footer around every screen without a
 * route repeating the frame.
 */
export const AppShell: Component<RouteSectionProps> = (props) => {
	return (
		<div class={styles.shell}>
			<Header />
			<main class={styles.content}>{props.children}</main>
			<Footer />
		</div>
	);
};
