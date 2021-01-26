import { Link, useRouter } from "@rturnq/solid-router";
import { createMemo } from "solid-js";
import "./Header.css";

export const Header = (props) => {
  const router = useRouter(),
    appName = createMemo(() => {
      for (let app of props.apps) {
        if (router.location.path.indexOf(app.path) > 0) {
          return app.name;
        }
      }
      return "";
    }, "");

  return (
    <header>
      <h1><Link class="link" href="/">Apps</Link></h1>
      <div class="name">
        <h1>{appName()}</h1>
      </div>
    </header>
  );
};


export default Header;
