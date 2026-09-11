import { JSXElement } from "solid-js";
import { render } from "solid-js/web";

import { qsa } from "../utils/dom";
import { MissDrillButton } from "./beartype/MissDrillButton";
import { ResultHistory } from "./beartype/ResultHistory";
import { Theme } from "./core/Theme";
import { Footer } from "./layout/footer/Footer";
import { Header } from "./layout/header/Header";
import { Overlays } from "./layout/overlays/Overlays";
import { CapsWarning } from "./pages/test/CapsWarning";
import { LiveStatsMini } from "./pages/test/live-stats/LiveStatsMini";
import { TestModesNotice } from "./pages/test/modes-notice/TestModesNotice";
import { OutOfFocusWarning } from "./pages/test/OutOfFocusWarning";
import { TestConfig } from "./pages/test/TestConfig";

const components: Record<string, () => JSXElement> = {
  footer: () => <Footer />,
  overlays: () => <Overlays />,
  theme: () => <Theme />,
  header: () => <Header />,
  testconfig: () => <TestConfig />,
  testmodesnotice: () => <TestModesNotice />,
  capswarning: () => <CapsWarning />,
  outoffocuswarning: () => <OutOfFocusWarning />,
  livestatsmini: () => <LiveStatsMini />,
  missdrill: () => <MissDrillButton />,
  resulthistory: () => <ResultHistory />,
};

function mountToMountpoint(name: string, component: () => JSXElement): void {
  for (const mountPoint of qsa(name)) {
    render(component, mountPoint.native);
  }
}

export function mountComponents(): void {
  for (const [query, component] of Object.entries(components)) {
    mountToMountpoint(`mount[data-component=${query}]`, component);
  }
}
