import { lazy } from "solid-js";
import {
  MatchRoute,
  pathIntegration,
  Router
} from "@rturnq/solid-router";
import { AppChooser } from "../AppChooser/AppChooser";
import { Header } from "../Header/Header";
import { Footer } from "../Footer/Footer";
import { apps } from "../../../../apps";
import "./App.css";

const TicTacToe = lazy(() =>
  import("../../../tictactoe/components/TicTacToe/TicTacToe")),
  ColorMemory = lazy(() =>
    import("../../../colorsays/components/ColorSays/ColorSays"));

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
        <MatchRoute path="colorsays">
          <ColorMemory />
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
