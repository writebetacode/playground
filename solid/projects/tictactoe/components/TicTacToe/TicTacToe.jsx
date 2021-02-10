import { BoardProvider } from "../../store/board";
import { Header } from "../Header/Header";
import { Board } from "../Board/Board";
import "./TicTacToe.css";


export const TicTacToe = () => {
  return (
    <BoardProvider >
      <div class="tic-tac-toe">
        <Header />
        <Board />
      </div>
    </BoardProvider>
  );
}

export default TicTacToe;
