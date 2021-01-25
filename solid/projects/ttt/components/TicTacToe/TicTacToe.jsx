import { StoreonProvider } from "@storeon/solidjs";
import { store } from "../../store/store";
import { Header } from "../Header/Header";
import { Board } from "../Board/Board";

import styles from "./TicTacToe.module.css";

export const TicTacToe = () => {
  console.log(styles);

  return (
    <StoreonProvider store={store}>
      <div>
        <Header />
        <Board />
      </div>
    </StoreonProvider>
  );
}

export default TicTacToe;
