import { createStore } from "solid-js/store";
import {
	applyMove,
	createGame,
	type Game,
	pickStartingPlayer,
} from "./lib/rules";

/** The reactive game, and the two things a visitor can do to it. */
export type GameStore = {
	readonly game: Game;
	readonly mark: (square: number) => void;
	readonly playAgain: () => void;
};

/**
 * Holds one game as a Solid store and calls into the rules for every change.
 * No rule lives here: marking a square asks the rules what the game becomes,
 * and playing again starts a fresh one with a newly drawn starting player.
 */
export function createGameStore(): GameStore {
	const [game, setGame] = createStore<Game>(createGame(pickStartingPlayer()));

	return {
		game,
		mark: (square: number) => {
			const played = applyMove(game, square);
			// The rules hand the same game back when they refuse a move, so there is
			// nothing to write and no reason to invalidate what is on screen.
			if (played !== game) {
				setGame(played);
			}
		},
		playAgain: () => setGame(createGame(pickStartingPlayer())),
	};
}
