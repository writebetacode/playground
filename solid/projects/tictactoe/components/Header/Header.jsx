import { createMemo } from "solid-js";
import { useStoreon } from "@storeon/solidjs";
import { BOARD_V_DRAW, BOARD_A_RESET } from "../../store/board";
import "./Header.css";

export const Header = () => {
  const [state, dispatch] = useStoreon();

  const playerText = createMemo(() => {
    if (state.board.winner === "") {
      return `${state.board.currentPlayer}'s move`;
    }

    if (state.board.winner === BOARD_V_DRAW) {
      return "Draw!";
    }

    return `${state.board.winner} is the Winner!`;
  }),
  headerClasses = createMemo(() => {
    let classes = ["header"]
    if (state.board.winner.length) {
      classes = [...classes, "winner-found"];
    }
    return classes;
  }),
  resetBoard = () => dispatch(BOARD_A_RESET);

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
