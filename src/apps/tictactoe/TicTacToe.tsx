import type { Component } from "solid-js";
import { Board } from "./components/Board/Board";
import { Status } from "./components/Status/Status";
import { createGameStore } from "./store";
import styles from "./TicTacToe.module.css";

/**
 * The app's screen: one game, the status line above the board, and the two
 * things a visitor can do wired to the store.
 */
const TicTacToe: Component = () => {
	const store = createGameStore();

	return (
		<div class={styles.game}>
			<Status game={store.game} onPlayAgain={store.playAgain} />
			<Board game={store.game} onMark={store.mark} />
		</div>
	);
};

export default TicTacToe;
