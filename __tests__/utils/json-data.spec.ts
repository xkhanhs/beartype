import { describe, it, expect, vi } from "vitest";

describe("getLanguage", () => {
  it("fetches again after a failed load", async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ name: "english", words: ["a"] }), {
          headers: { "content-type": "application/json" },
        }),
      );
    // json-data keeps the fetch it finds when it loads
    vi.stubGlobal("fetch", fetch);
    const { getLanguage } = await import("../../src/ts/utils/json-data");
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(getLanguage("english")).rejects.toThrow("Failed to fetch");
    await expect(getLanguage("english")).resolves.toMatchObject({
      name: "english",
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
