// beartype has one page after startup; this name still gates a handful of
// "are we on the test page" checks scattered through the typing code (see
// `states/core.ts`), so it stays even though the router that once picked
// between pages is gone.
export type PageName = "loading" | "test";
