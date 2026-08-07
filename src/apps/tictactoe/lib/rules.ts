/**
 * The rules of tic-tac-toe as pure functions over plain data. Nothing here
 * imports a framework or reaches for state: a board is nine squares read left to
 * right, top to bottom, a move is an index into it, and applying one returns a
 * new game rather than editing the old one.
 */

/** The two marks. */
export type Player = "X" | "O";

/** One square: a mark, or nothing while it is empty. */
export type Square = Player | null;

/** Nine squares, read left to right, top to bottom. */
export type Board = readonly Square[];

/** Three squares that win when one player holds all of them. */
export type Line = readonly [number, number, number];

/** How the game stands: still running, won by someone, or drawn. */
export type GameStatus =
	| { readonly kind: "playing" }
	| { readonly kind: "won"; readonly winner: Player; readonly line: Line }
	| { readonly kind: "draw" };

/** A whole game: the board, whose turn it is, and how it stands. */
export type Game = {
	readonly board: Board;
	readonly currentPlayer: Player;
	readonly status: GameStatus;
};

/** The eight lines that win: three rows, three columns, two diagonals. */
export const WINNING_LINES: readonly Line[] = [
	[0, 1, 2],
	[3, 4, 5],
	[6, 7, 8],
	[0, 3, 6],
	[1, 4, 7],
	[2, 5, 8],
	[0, 4, 8],
	[2, 4, 6],
];

const SQUARE_COUNT = 9;

/** Picks who starts. The draw is passed in so the choice stays testable. */
export function pickStartingPlayer(random: () => number = Math.random): Player {
	return random() < 0.5 ? "X" : "O";
}

/** A fresh game on an empty board, with the given player to move. */
export function createGame(startingPlayer: Player): Game {
	return {
		board: Array<Square>(SQUARE_COUNT).fill(null),
		currentPlayer: startingPlayer,
		status: { kind: "playing" },
	};
}

/** The line a player holds all three squares of, or nothing. */
export function findWinningLine(board: Board, player: Player): Line | null {
	return (
		WINNING_LINES.find((line) =>
			line.every((square) => board[square] === player),
		) ?? null
	);
}

/** Whether every square is marked. Says nothing about who won. */
export function isDraw(board: Board): boolean {
	return board.every((square) => square !== null);
}

/**
 * Applies a move to a game. A square that is already marked, an index off the
 * board, and any move at all once the game is decided are all refused by
 * handing back the game untouched, so neither the board nor the turn moves on.
 */
export function applyMove(game: Game, square: number): Game {
	const playable =
		game.status.kind === "playing" &&
		square >= 0 &&
		square < SQUARE_COUNT &&
		game.board[square] === null;
	if (playable === false) {
		return game;
	}

	const board = game.board.map((existing, index) =>
		index === square ? game.currentPlayer : existing,
	);
	const line = findWinningLine(board, game.currentPlayer);

	if (line !== null) {
		return {
			board,
			currentPlayer: game.currentPlayer,
			status: { kind: "won", winner: game.currentPlayer, line },
		};
	}

	return {
		board,
		currentPlayer: game.currentPlayer === "X" ? "O" : "X",
		status: isDraw(board) ? { kind: "draw" } : { kind: "playing" },
	};
}
