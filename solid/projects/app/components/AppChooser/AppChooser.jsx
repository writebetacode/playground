import { Link } from "@rturnq/solid-router";
import "./AppChooser.css";

export const AppChooser = (props) => {
  return (
    <div class="app-chooser">
      <For each={props.apps}>{app =>
        <div class="card">
          <div class="name">{app.name}</div>
          <div class="desc">{app.description}</div>
          <div class="link">
            <Link href={`/${app.path}`}>Demo</Link>
          </div>
        </div>
      }</For>
    </div>
  );
}
