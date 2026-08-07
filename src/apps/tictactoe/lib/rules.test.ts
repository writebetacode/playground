import { describe, expect, it } from "vitest";
import {
	applyMove,
	type Board,
	createGame,
	findWinningLine,
	type Game,
	isDraw,
	type Player,
	pickStartingPlayer,
	WINNING_LINES,
} from "./rules";

/**
 * The rules take and return plain data: a board is nine squares, a move is an
 * index, and applying one hands back a new game. Nothing here imports a
 * framework or touches a store, so every case states a board, applies a move,
 * and asserts on what comes back.
 *
 * Boards are written as nine characters read left to right, top to bottom, with
 * a dot for an empty square, which keeps a case's precondition legible at a
 * glance.
 */

function boardFrom(pattern: string): Board {
	return [...pattern.replace(/\s/g, "")].map((mark) =>
		mark === "X" || mark === "O" ? mark : null,
	);
}

function gameFrom(pattern: string, currentPlayer: Player): Game {
	return {
		board: boardFrom(pattern),
		currentPlayer,
		status: { kind: "playing" },
	};
}

function patternOf(board: Board): string {
	return board.map((square) => square ?? ".").join("");
}

const other = (player: Player): Player => (player === "X" ? "O" : "X");

/** A game where the player to move already holds two squares of the line. */
function twoOfLine(line: readonly number[], player: Player): Game {
	const board: Array<Player | null> = Array(9).fill(null);
	board[line[0]] = player;
	board[line[1]] = player;
	const elsewhere = [...Array(9).keys()].filter(
		(index) => line.includes(index) === false,
	);
	board[elsewhere[0]] = other(player);
	board[elsewhere[1]] = other(player);
	return { board, currentPlayer: player, status: { kind: "playing" } };
}

describe("a new game announces a starting player", () => {
	const draws: ReadonlyArray<{ draw: number; player: Player }> = [
		{ draw: 0, player: "X" },
		{ draw: 0.25, player: "X" },
		{ draw: 0.4999, player: "X" },
		{ draw: 0.5, player: "O" },
		{ draw: 0.75, player: "O" },
		{ draw: 0.9999, player: "O" },
	];

	it.each(draws)("a draw of $draw starts $player", ({ draw, player }) => {
		expect(pickStartingPlayer(() => draw)).toBe(player);
	});

	it("can start either player", () => {
		const started = draws.map(({ draw }) => pickStartingPlayer(() => draw));

		expect([...new Set(started)].sort()).toEqual(["O", "X"]);
	});

	const starters: ReadonlyArray<{ player: Player }> = [
		{ player: "X" },
		{ player: "O" },
	];

	it.each(starters)(
		"a game started by $player has $player to move",
		({ player }) => {
			const game = createGame(player);

			expect(game.currentPlayer).toBe(player);
			expect(patternOf(game.board)).toBe(".........");
			expect(game.status).toEqual({ kind: "playing" });
		},
	);
});

describe("marks alternate between players", () => {
	const openings: ReadonlyArray<{
		player: Player;
		square: number;
		next: Player;
	}> = [
		{ player: "X", square: 0, next: "O" },
		{ player: "X", square: 4, next: "O" },
		{ player: "O", square: 8, next: "X" },
		{ player: "O", square: 2, next: "X" },
	];

	it.each(openings)(
		"$player marking square $square leaves $next to move",
		({ player, square, next }) => {
			const game = applyMove(createGame(player), square);

			expect(game.board[square]).toBe(player);
			expect(game.currentPlayer).toBe(next);
			expect(game.status).toEqual({ kind: "playing" });
		},
	);

	it("marks only the square that was played", () => {
		const game = applyMove(createGame("X"), 4);

		expect(patternOf(game.board)).toBe("....X....");
	});

	it("keeps alternating as the game runs on", () => {
		const first = applyMove(createGame("X"), 0);
		const second = applyMove(first, 1);
		const third = applyMove(second, 3);

		expect(patternOf(third.board)).toBe("XO.X.....");
		expect(third.currentPlayer).toBe("O");
	});
});

describe("a completed line wins the game", () => {
	const lines: ReadonlyArray<{
		line: string;
		squares: readonly [number, number, number];
	}> = [
		{ line: "the top row", squares: [0, 1, 2] },
		{ line: "the middle row", squares: [3, 4, 5] },
		{ line: "the bottom row", squares: [6, 7, 8] },
		{ line: "the left column", squares: [0, 3, 6] },
		{ line: "the middle column", squares: [1, 4, 7] },
		{ line: "the right column", squares: [2, 5, 8] },
		{ line: "the top-left diagonal", squares: [0, 4, 8] },
		{ line: "the top-right diagonal", squares: [2, 4, 6] },
	];

	const players: ReadonlyArray<Player> = ["X", "O"];
	const cases = lines.flatMap((entry) =>
		players.map((player) => ({ ...entry, player })),
	);

	it.each(cases)(
		"$player completing $line wins and highlights it",
		({ squares, player }) => {
			const game = twoOfLine(squares, player);

			const played = applyMove(game, squares[2]);

			expect(played.status).toEqual({
				kind: "won",
				winner: player,
				line: squares,
			});
		},
	);

	it.each(cases)("$line is one of the eight winning lines", ({ squares }) => {
		expect(WINNING_LINES).toContainEqual(squares);
	});

	it("knows exactly eight winning lines", () => {
		expect(WINNING_LINES).toHaveLength(8);
	});

	it.each(cases)(
		"$player holding $line is found by the win check",
		({ squares, player }) => {
			const board = twoOfLine(squares, player).board.map((square, index) =>
				index === squares[2] ? player : square,
			);

			expect(findWinningLine(board, player)).toEqual(squares);
			expect(findWinningLine(board, other(player))).toBe(null);
		},
	);

	it("finds no line while one is still incomplete", () => {
		expect(findWinningLine(boardFrom("XX.OO...."), "X")).toBe(null);
	});
});

describe("a full board with no completed line is a draw", () => {
	const almostFull: ReadonlyArray<{
		label: string;
		pattern: string;
		square: number;
		player: Player;
	}> = [
		{
			label: "the centre square left last",
			pattern: "XOX.OXOXO",
			square: 3,
			player: "X",
		},
		{
			label: "a corner left last",
			pattern: ".OXXXOOXO",
			square: 0,
			player: "X",
		},
	];

	it.each(almostFull)(
		"marking $label completes a draw",
		({ pattern, square, player }) => {
			const game = gameFrom(pattern, player);

			const played = applyMove(game, square);

			expect(played.status).toEqual({ kind: "draw" });
			expect(patternOf(played.board).includes(".")).toBe(false);
		},
	);

	it.each(almostFull)(
		"$label leaves no winning line highlighted",
		({ pattern, square, player }) => {
			const played = applyMove(gameFrom(pattern, player), square);

			expect(played.status).not.toHaveProperty("line");
		},
	);

	const drawChecks: ReadonlyArray<{
		label: string;
		pattern: string;
		drawn: boolean;
	}> = [
		{ label: "a full board", pattern: "XOXXOXOXO", drawn: true },
		{
			label: "a board with one square left",
			pattern: "XOXXOX.XO",
			drawn: false,
		},
		{ label: "an empty board", pattern: ".........", drawn: false },
	];

	it.each(drawChecks)("$label reads as drawn: $drawn", ({ pattern, drawn }) => {
		expect(isDraw(boardFrom(pattern))).toBe(drawn);
	});

	it("does not call a full board with a winning line a draw", () => {
		const game = gameFrom("XOOOXXXO.", "X");

		const played = applyMove(game, 8);

		expect(patternOf(played.board).includes(".")).toBe(false);
		expect(played.status).toEqual({
			kind: "won",
			winner: "X",
			line: [0, 4, 8],
		});
	});
});

describe("an occupied square rejects a second mark", () => {
	const occupied: ReadonlyArray<{
		label: string;
		pattern: string;
		player: Player;
		square: number;
	}> = [
		{
			label: "a square the mover already holds",
			pattern: "X........",
			player: "O",
			square: 0,
		},
		{
			label: "a square the opponent holds",
			pattern: "XO.......",
			player: "X",
			square: 1,
		},
		{
			label: "a square in a part-played game",
			pattern: "XOX.O....",
			player: "X",
			square: 4,
		},
	];

	it.each(occupied)(
		"marking $label leaves the board and the turn unchanged",
		({ pattern, player, square }) => {
			const game = gameFrom(pattern, player);

			const played = applyMove(game, square);

			expect(patternOf(played.board)).toBe(pattern);
			expect(played.currentPlayer).toBe(player);
			expect(played.status).toEqual({ kind: "playing" });
		},
	);

	const outOfBounds: ReadonlyArray<{ square: number }> = [
		{ square: -1 },
		{ square: 9 },
		{ square: 42 },
	];

	it.each(outOfBounds)(
		"a mark at square $square changes nothing",
		({ square }) => {
			const game = gameFrom("XOX......", "O");

			const played = applyMove(game, square);

			expect(patternOf(played.board)).toBe("XOX......");
			expect(played.currentPlayer).toBe("O");
		},
	);
});

describe("a finished game ignores further marks", () => {
	function wonGame(): Game {
		const game = applyMove(twoOfLine([0, 1, 2], "X"), 2);
		expect(game.status).toEqual({
			kind: "won",
			winner: "X",
			line: [0, 1, 2],
		});
		return game;
	}

	function drawnGame(): Game {
		const game = applyMove(gameFrom("XOX.OXOXO", "X"), 3);
		expect(game.status).toEqual({ kind: "draw" });
		return game;
	}

	const finished: ReadonlyArray<{ label: string; build: () => Game }> = [
		{ label: "a won game", build: wonGame },
		{ label: "a drawn game", build: drawnGame },
	];

	it.each(finished)(
		"$label takes no further mark on any empty square",
		({ build }) => {
			const game = build();
			const empties = game.board
				.map((square, index) => (square === null ? index : -1))
				.filter((index) => index >= 0);

			for (const empty of [...empties, 0, 4, 8]) {
				const played = applyMove(game, empty);

				expect(patternOf(played.board)).toBe(patternOf(game.board));
				expect(played.status).toEqual(game.status);
				expect(played.currentPlayer).toBe(game.currentPlayer);
			}
		},
	);
});

describe("restarting clears the board", () => {
	const starters: ReadonlyArray<{ player: Player }> = [
		{ player: "X" },
		{ player: "O" },
	];

	it.each(starters)(
		"a game restarted as $player is empty and undecided",
		({ player }) => {
			const finished = applyMove(twoOfLine([0, 1, 2], "X"), 2);

			const restarted = createGame(player);

			expect(finished.status).toEqual({
				kind: "won",
				winner: "X",
				line: [0, 1, 2],
			});
			expect(patternOf(restarted.board)).toBe(".........");
			expect(restarted.status).toEqual({ kind: "playing" });
			expect(restarted.currentPlayer).toBe(player);
		},
	);
});
