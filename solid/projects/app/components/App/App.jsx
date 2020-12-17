import { Router, pathIntegration, MatchRoute, NavLink } from "@rturnq/solid-router";
import { lazy } from "solid-js";
import { AppChooser } from "../AppChooser/AppChooser";
import "./App.css";

const TicTacToe = lazy(() => import("../../../tictactoe/components/TicTacToe/TicTacToe"));

export const App = () => {
  return (
    <Router integration={pathIntegration()}>
      <header>
        <nav>
          <NavLink class="link" href="/">Home</NavLink>
          <NavLink class="link" href="/tictactoe">Tic Tac Toe</NavLink>
        </nav>
      </header>
      <main>
        <Switch fallback={<AppChooser />}>
          <MatchRoute end>
            <AppChooser/>
          </MatchRoute>
          <MatchRoute path="tictactoe">
            <TicTacToe />
          </MatchRoute>
        </Switch>
      </main>
    </Router>
  );
}

export default App;
