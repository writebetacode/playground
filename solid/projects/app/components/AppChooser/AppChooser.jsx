import { Link } from "@rturnq/solid-router";
import "./AppChooser.css";

export const AppChooser = (props) => {
  return (
    <div class="app-chooser">
      <For each={props.apps}>{app =>
        <div class="card">
          <span class="name">{app.name}</span>
          <p class="desc">{app.description}</p>
          <Link class="link" href={`/${app.path}`}>Demo</Link>
        </div>
      }</For>
    </div>
  );
}
