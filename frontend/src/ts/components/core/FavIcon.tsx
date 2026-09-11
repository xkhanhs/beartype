import { Link } from "@solidjs/meta";
import { createMemo, JSXElement } from "solid-js";

import { Theme } from "../../constants/themes";
import { isDevEnvironment } from "../../utils/env";

// beartype: "bt" in place of upstream's "mt", as in the header's logo
export function FavIcon(props: { theme: Theme }): JSXElement {
  const icon = createMemo<string>(() => {
    let { main, bg } = props.theme;
    if (isDevEnvironment()) {
      [main, bg] = [bg, main];
    }
    if (bg === main) {
      bg = "#111";
      main = "#eee";
    }

    const svgPre = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <style>
        #bg{fill:${bg};}
        path{fill:${main};}
      </style>
      <g>
        <path id="bg" d="M0 16Q0 0 16 0h32q16 0 16 16v32q0 16-16 16H16Q0 64 0 48"/>
        <path d="M9.09 14h5.12v31.3H9.09z"/>
        <path fill-rule="evenodd" d="M13.4 34.7a11.5 11.5 0 1 0 23 0a11.5 11.5 0 1 0-23 0zM18.9 34.7a6 6 0 1 0 12 0a6 6 0 1 0-12 0z"/>
        <path d="M47 18.9v5.12h-4.61v5.12H47v16.1h5.12v-16.1h4.61v-5.12h-4.61V18.9"/>
      </g>
    </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svgPre)}`;
  });

  return (
    <Link id="favicon" rel="shortcut icon" type="image/svg+xml" href={icon()} />
  );
}
