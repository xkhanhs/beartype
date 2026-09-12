//extend expect with dom matchers
import "@testing-library/jest-dom";

// happy-dom fetches the stylesheets a component adds to <head> (the theme
// <link>), and no server runs behind the tests. Answer with an empty
// stylesheet, still asynchronously, so a test fires load/error itself first.
const happyDOM = (
  window as unknown as {
    happyDOM: {
      settings: {
        fetch: { interceptor: { beforeAsyncRequest: () => Promise<Response> } };
      };
    };
  }
).happyDOM;
happyDOM.settings.fetch.interceptor = {
  beforeAsyncRequest: async () =>
    new window.Response("", { headers: { "content-type": "text/css" } }),
};
