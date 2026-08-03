import { render } from "solid-js/web";
import { ThemeControl } from "./app/components/ThemeControl/ThemeControl";
import { ThemeProvider } from "./app/ThemeProvider";
import "./styles/global.css";

function App() {
	return (
		<ThemeProvider>
			<ThemeControl />
			<p>Playground</p>
		</ThemeProvider>
	);
}

const root = document.getElementById("root");

if (root) {
	render(() => <App />, root);
}
