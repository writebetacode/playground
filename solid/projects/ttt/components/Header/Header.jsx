import { createMemo } from "solid-js";
import { useStoreon } from "@storeon/solidjs";
import { BOARD_V_DRAW, BOARD_A_RESET } from "../../store/board";

import styles from "./Header.module.css";

export const Header = () => {
  const [state, dispatch] = useStoreon();

  const playerText = createMemo(() => {
    if(state.board.winner === "") {
      return `${state.board.currentPlayer}'s move`;
    }

    if(state.board.winner === BOARD_V_DRAW) {
      return "Draw!";
    }

    return `${state.board.winner} is the Winner!`;
  }),
  buttonClasses = createMemo(() => [
    "replay-button",
    state.board.winner === "" ? "hidden" : ""
  ], state.board.winner),
  resetBoard = () => dispatch(BOARD_A_RESET);

  return (
    <div class="header">
      <div class="player-text">
        {playerText()}
      </div>
      <div class={buttonClasses().join(" ")}>
        <button type="button" onClick={resetBoard}>Play Again!</button>
      </div>
    </div>
  );
}
