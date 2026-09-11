import { Config } from "../config/store";
import { showNoticeNotification } from "../states/notifications";
import * as PractiseWordsModal from "../modals/practise-words";
import { qs } from "../utils/dom";

const testPage = qs(".pageTest");

testPage?.onChild("click", "#practiseWordsButton", () => {
  if (Config.mode === "zen") {
    showNoticeNotification("Practice words is unsupported in zen mode");
    return;
  }
  PractiseWordsModal.show();
});
