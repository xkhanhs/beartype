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
        <path fill-rule="evenodd" d="M8 15.5a3.5 3.5 0 0 1 7 0V24h9a12 12 0 0 1 0 24H8zM15 30.5v11h9a5.5 5.5 0 0 0 0-11z"/>
        <path d="M42.5 19.5a3.25 3.25 0 0 1 6.5 0V24h6v6.5h-6V48h-6.5V30.5H38V24h4.5z"/>
      </g>
    </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svgPre)}`;
  });

  return (
    <Link id="favicon" rel="shortcut icon" type="image/svg+xml" href={icon()} />
  );
}
