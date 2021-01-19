import { lazy } from "solid-js";
import {
  Link,
  MatchRoute,
  pathIntegration,
  Router,
  useRouter
} from "@rturnq/solid-router";
import { AppChooser } from "../AppChooser/AppChooser";
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
      <header>
        <Link class="link" href="/">Apps</Link>
        <span class="name">Page Name Goes Here</span>
      </header>
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
        footer content here
      </footer>
    </Router>
  );
}

export default App;
