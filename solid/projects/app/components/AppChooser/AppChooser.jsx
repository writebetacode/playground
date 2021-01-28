import { useRouter } from "@rturnq/solid-router";
import "./AppChooser.css";

export const AppChooser = (props) => {
  const router = useRouter();

  return (
    <div class="app-chooser">
      <For each={props.apps}>{app =>
        <div class="card"
          onClick={() => router.push("/"+app.path)}>
          <span class="name">{app.name}</span>
          <p class="desc">{app.description}</p>
        </div>
      }</For>
    </div>
  );
}
