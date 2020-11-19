import { createMemo, splitProps } from "solid-js";
import { useStoreon } from "@storeon/solidjs";
import { BOARD_A_CLICK_SQUARE } from "../../store/board";
import './Board.css';

export const Board = () => {
  const [state, _] = useStoreon(),
  classes = createMemo(() => [
    "board",
    state.board.winner === "" ? "" : "winner-found"
  ], state.board.winner);

  return (
    <div class={classes().join(" ")}>
      <For each={state.board.rows}>{(row, yIndex) =>
        <Row row={row} yIndex={yIndex} />
      }</For>
    </div>
  );
}

const Row = (props) => {
  return (
    <div class="row">
      <For each={props.row}>{(square, xIndex) =>
        <Square square={square} yIndex={props.yIndex} xIndex={xIndex} />
      }</For>
    </div>
  )
}

const Square = (props) => {
  const [_, dispatch] = useStoreon(),
    {yIndex, xIndex} = splitProps(props, ["yIndex", "xIndex"]).shift(),
    clickSquare = () => dispatch(BOARD_A_CLICK_SQUARE, [yIndex(), xIndex()]),
    classes = createMemo(() => [
      "square",
      props.square.isWinner ? "winner" : "",
    ], props.square.isWinner);

  return (
    <div class={classes().join(" ")} onClick={clickSquare}>
      <span class="player">
        {props.square.player}
      </span>
    </div>
  );
}

export default Board;
