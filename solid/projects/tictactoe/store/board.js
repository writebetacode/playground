import { klona } from "klona";

// actions
export const BOARD_A_CLICK_SQUARE = "store/board/click_square";
export const BOARD_A_RESET = "store/board/reset";

// values
export const BOARD_V_DRAW = "DRAW";

const checkForWin = (rows, player) => {
  const isWinningCase = (winCase) => {
    let playerSquares = 0;
    for(const pos of winCase) {
      const row = Math.floor(pos / winCase.length),
            column = pos % winCase.length;

      if(rows[row][column].player === player) {
        playerSquares++
      }
    }

    return playerSquares === winCase.length;
  },

  winCases = [
    [0, 1, 2],// top row
    [3, 4, 5],// middle row
    [6, 7, 8],// bottom row
    [0, 4, 8],// diagonal right
    [2, 4, 6],// diagonal left
    [0, 3, 6],// left column
    [1, 4, 7],// middle column
    [2, 5, 8]// right column
  ];

  let winCaseFound = null;
  for(const winCase of winCases) {
    if(winCaseFound !== null) {
      return;
    }

    if(isWinningCase(winCase)) {
      winCaseFound = [];
      for(const pos of winCase) {
        winCaseFound.push({
          row: Math.floor(pos / winCase.length),
          column: pos % winCase.length
        });
      }

      return [...winCaseFound];
    }
  }

  if(winCaseFound === null) {
    let takenSquares = 0,
        maxSquares = Math.pow(winCases[0].length, 2);

    for(const row of rows) {
      for(const square of row) {
        if(square.player !== "") {
          takenSquares++
        }
      }
    }

    return takenSquares === maxSquares ? BOARD_V_DRAW : null;
  }

  return winCaseFound;
},

chooseRandomPlayer = () => (Math.round(Math.random()) === 0) ? "O" : "X",

defaultState = {
  board: {
    winner: "",
    currentPlayer: chooseRandomPlayer(),
    rows: [
      Array(3).fill({ player:"", isWinner: 0 }),
      Array(3).fill({ player:"", isWinner: 0 }),
      Array(3).fill({ player:"", isWinner: 0 })
    ]
  }
};

export const board = (store) => {
  store.on("@init", () => klona(defaultState));

  store.on(BOARD_A_CLICK_SQUARE, (state, [yIndex, xIndex]) => {
    let board = klona(state.board),
        square = board.rows[yIndex][xIndex];

    if(board.winner === "" && square.player === "") {
      board.rows[yIndex][xIndex] = { ...square, player: board.currentPlayer };

      let winCaseFound = checkForWin(board.rows, board.currentPlayer);
      if(winCaseFound === BOARD_V_DRAW) {
        board.winner = BOARD_V_DRAW;
      } else if (Array.isArray(winCaseFound)) {
        board.winner = board.currentPlayer;



        for(let i = 0; i < winCaseFound.length; i++ ) {
          const {row, column} = winCaseFound[i];
          board.rows[row][column].isWinner = 1;
        }
      }

      board.currentPlayer = board.currentPlayer === "X" ? "O" : "X";
    }

    return { board };
  });

  store.on(BOARD_A_RESET, () => ({
    board: {
      ...klona(defaultState.board),
      currentPlayer: chooseRandomPlayer()
    }
  }));
};
