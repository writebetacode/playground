import { lazy } from "solid-js";
import {
  MatchRoute,
  pathIntegration,
  Router
} from "@rturnq/solid-router";
import { AppChooser } from "../AppChooser/AppChooser";
import { Header } from "../Header/Header";
import { Footer } from "../Footer/Footer";
import "./App.css";

const TicTacToe = lazy(() =>
  import("../../../tictactoe/components/TicTacToe/TicTacToe"));

const apps = [
  {
    path: "tictactoe",
    name: "Tic Tac Toe",
    description: `Simple Tic Tac Toe implementation that has allowed me to test
    out css grid / flexbox while creating something with solid-js and storeon.`
  }
];

const Content = () => {
  return (
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
  );
};

export const App = () => {
  return (
    <Router integration={pathIntegration()}>
      <Header apps={apps} />
      <Content />
      <Footer apps={apps} />
    </Router>
  );
}

export default App;
