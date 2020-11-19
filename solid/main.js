import { render } from "solid-js/web";
import { App } from "./projects/app/components/App/App";

let app = document.getElementById("app");
if (!app) {
  render(() => <div id="app"></div>, document.body);
  app = document.getElementById("app");
}

render(() => <App />, app);
