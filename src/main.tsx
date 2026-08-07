import { Router } from "@solidjs/router";
import { render } from "solid-js/web";
import { AppShell } from "./app/AppShell";
import { buildRoutes } from "./app/routes";
import { ThemeProvider } from "./app/ThemeProvider";
import { apps } from "./apps/registry";
import "./styles/global.css";

function App() {
	return (
		<ThemeProvider>
			<Router root={AppShell}>{buildRoutes(apps)}</Router>
		</ThemeProvider>
	);
}

const root = document.getElementById("root");

if (root) {
	render(() => <App />, root);
}
