import type { Component } from "solid-js";
import type { Game } from "../../lib/rules";
import styles from "./Status.module.css";

type StatusProps = {
	readonly game: Game;
	readonly onPlayAgain: () => void;
};

/**
 * The status line and the play-again control. The line is a polite live region,
 * so a win or a draw is announced where it is written rather than by pulling
 * focus off the board the visitor is still standing on.
 */
export const Status: Component<StatusProps> = (props) => {
	const message = (): string => {
		const status = props.game.status;
		if (status.kind === "won") {
			return `${status.winner} wins`;
		}
		if (status.kind === "draw") {
			return "A draw. Nobody takes a line";
		}
		return `${props.game.currentPlayer} to move`;
	};

	return (
		<div class={styles.status}>
			<p class={styles.message} role="status" aria-live="polite">
				{message()}
			</p>
			<button
				type="button"
				class={styles.playAgain}
				onClick={() => props.onPlayAgain()}
			>
				Play again
			</button>
		</div>
	);
};
