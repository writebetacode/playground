import { Link, useRouter } from "@rturnq/solid-router";
import { createMemo } from "solid-js";
import "./Header.css";

export const Header = (props) => {
  const defaultTitle = "Click on an app!",
    router = useRouter(),
    appName = createMemo(() => {
      for (let app of props.apps) {
        if (router.location.path.indexOf(app.path) > 0) {
          return app.name;
        }
      }
      return defaultTitle;
    }),
    isChoosingClass = createMemo(() => {
      return appName() === defaultTitle ? "is-choosing" : "";
    }, appName());

  return (
    <header class={isChoosingClass()}>
      <div class="apps-icon">
        <h1>
          <Link class="link" href="/">App List</Link>
        </h1>
      </div>
      <div class="name">
        <h1>{appName()}</h1>
      </div>
    </header>
  );
};


export default Header;
