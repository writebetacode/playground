import { createMemo } from "solid-js";
import { BOARD_V_DRAW, BOARD_A_RESET, useBoard } from "../../store/board";
import "./Header.css";

export const Header = () => {
  const [state, methods] = useBoard(),
    playerText = createMemo(() => {
      if (state.board.winner === "") {
        return `${state.board.currentPlayer}'s move`;
      }

      if (state.board.winner === BOARD_V_DRAW) {
        return "Draw!";
      }

      return `${state.board.winner} is the Winner!`;
    }),
    headerClasses = createMemo(() => [
      "header",
      state.board.winner.length ? "winner-found" : "",
    ]),
    resetBoard = () => methods[BOARD_A_RESET]();

  return (
    <div class={headerClasses().join(" ")}>
      <div class="player-text">
        {playerText()}
      </div>
      <div class="replay-button">
        <button type="button" onClick={resetBoard}>Play Again!</button>
      </div>
    </div>
  );
}
