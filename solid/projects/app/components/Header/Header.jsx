import { Link, useRouter } from "@rturnq/solid-router";
import { createMemo } from "solid-js";
import "./Header.css";

export const Header = (props) => {
  const defaultName = "Apps",
    router = useRouter(),
    appName = createMemo(() => {
      for (let app of props.apps) {
        if (router.location.path.indexOf(app.path) > 0) {
          return app.name;
        }
      }
      return defaultName;
    }, defaultName);

  return (
    <header>
      <h1 style={{
        "visibility": appName() === defaultName ? "hidden" : "visible",
      }}>
        <Link class="link" href="/">Apps</Link>
      </h1>
      <div class="name">
        <h1>{appName()}</h1>
      </div>
    </header>
  );
};


export default Header;
