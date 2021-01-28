import { useRouter } from "@rturnq/solid-router";
import { createMemo } from "solid-js";
import "./Footer.css";

export const Footer = (props) => {
  const repoUrl = "https://github.com/writebetacode/playground",
    router = useRouter(),
    url = createMemo(() => {
      for (let app of props.apps) {
        if (router.location.path.indexOf(app.path) > 0) {
          return `${repoUrl}/tree/main/solid/projects/${app.path}`;
        }
      }
      return repoUrl;
    });

  return (
    <footer>
      <a href={url()} target="blank">Github Repo</a>
    </footer>
  );
}

export default Footer;
