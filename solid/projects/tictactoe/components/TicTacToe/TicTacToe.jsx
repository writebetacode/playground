import { StoreonProvider } from "@storeon/solidjs";
import { store } from "../../store/store";
import { Header } from "../Header/Header";
import { Board } from "../Board/Board";
import "./TicTacToe.css";

export const TicTacToe = () => {
  return (
    <StoreonProvider store={store}>
      <div class="tic-tac-toe">
        <Header />
        <Board />
      </div>
    </StoreonProvider>
  );
}

export default TicTacToe;
