import * as TestLogic from "../test/test-logic";
import Page from "./page";
import { blurInputElement } from "../input/input-element";
import { qsr } from "../utils/dom";
import { resetIncompleteTests } from "../states/test";

export const page = new Page({
  id: "test",
  element: qsr(".page.pageTest"),
  path: "/",
  beforeHide: async (): Promise<void> => {
    blurInputElement();
  },
  afterHide: async (): Promise<void> => {
    void TestLogic.restart({
      noAnim: true,
    });
  },
  beforeShow: async (): Promise<void> => {
    resetIncompleteTests();
    void TestLogic.restart({
      noAnim: true,
    });
  },
});
