import { render } from "solid-js/web";

function App() {
	return <p>Playground</p>;
}

const root = document.getElementById("root");

if (root) {
	render(() => <App />, root);
}
