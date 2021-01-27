import { lazy } from "solid-js";
import {
  MatchRoute,
  pathIntegration,
  Router
} from "@rturnq/solid-router";
import { AppChooser } from "../AppChooser/AppChooser";
import { Header } from "../Header/Header";
import "./App.css";

const TicTacToe = lazy(() =>
  import("../../../tictactoe/components/TicTacToe/TicTacToe"));

const apps = [
  {
    path: "tictactoe",
    name: "Tic Tac Toe",
    description: "simple game of tic tac toe",
  }
];

export const App = () => {
  return (
    <Router integration={pathIntegration()}>
      <Header apps={apps} />
      <main>
        <Switch fallback={<AppChooser apps={apps} />}>
          <MatchRoute end>
            <AppChooser apps={apps} />
          </MatchRoute>
          <MatchRoute path="tictactoe">
            <TicTacToe />
          </MatchRoute>
        </Switch>
      </main>
      <footer>
        <a
          href="https://github.com/writebetacode/playground"
          target="blank">Github Repo</a>
      </footer>
    </Router>
  );
}

export default App;
