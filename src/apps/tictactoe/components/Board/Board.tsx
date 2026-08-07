import { type Component, For } from "solid-js";
import type { Game, Square } from "../../lib/rules";
import styles from "./Board.module.css";

type BoardProps = {
	readonly game: Game;
	readonly onMark: (square: number) => void;
};

/** Names a square the way it should be read out: its position, then its mark. */
function labelFor(index: number, mark: Square): string {
	const row = Math.floor(index / 3) + 1;
	const column = (index % 3) + 1;
	return `Row ${row}, column ${column}, ${mark ?? "empty"}`;
}

/**
 * The board as nine real buttons in a grid, so the platform gives keyboard
 * reach, activation, and a focus ring rather than any of it being rebuilt here.
 * A decided game leaves its squares enabled and lets the rules refuse the move,
 * which keeps the board's tab order the same before and after the result.
 */
export const Board: Component<BoardProps> = (props) => {
	const winningLine = (): readonly number[] =>
		props.game.status.kind === "won" ? props.game.status.line : [];

	return (
		<div class={styles.board}>
			<For each={props.game.board}>
				{(mark, index) => (
					<button
						type="button"
						class={styles.square}
						classList={{ [styles.winning]: winningLine().includes(index()) }}
						aria-label={labelFor(index(), mark)}
						onClick={() => props.onMark(index())}
					>
						<span aria-hidden="true">{mark}</span>
					</button>
				)}
			</For>
		</div>
	);
};
