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
      <div class="apps-icon"
      style={{
        "visibility": appName() === defaultName ? "hidden" : "visible",
      }}>
        <h1>
          <Link class="link" href="/">{defaultName}</Link>
        </h1>
      </div>
      <div class="name">
        <h1>{appName()}</h1>
      </div>
    </header>
  );
};


export default Header;
