import { lazy } from "solid-js";
import {
  Link,
  MatchRoute,
  NavLink,
  pathIntegration,
  Router
} from "@rturnq/solid-router";
import { AppChooser } from "../AppChooser/AppChooser";
import "./App.css";

const TicTacToe = lazy(
  () => import("../../../tictactoe/components/TicTacToe/TicTacToe")
);

export const App = () => {
  const apps = [
    {
      path: "tictactoe",
      name: "Tic Tac Toe",
      description: "simple game of tic tac toe",
      Component: TicTacToe
    }
  ];

  return (
    <Router integration={pathIntegration()}>
      <header>
        <nav class="header">
          <Link class="link default" href="/">Home</Link>
          <For each={apps}>{app =>
            <NavLink class="link" href={`/${app.path}`}>{app.name}</NavLink>
          }</For>
        </nav>
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
