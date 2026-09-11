import { Language, LanguageObject } from "../schemas/languages";
import { LayoutObject } from "../schemas/layouts";
//pin implementation
const fetch = window.fetch;

/**
 * Fetches JSON data from the specified URL using the fetch API.
 * @param url - The URL to fetch the JSON data from.
 * @returns A promise that resolves to the parsed JSON data.
 * @throws {Error} If the URL is not provided or if the fetch request fails.
 */
async function fetchJson<T>(url: string): Promise<T> {
  try {
    if (!url) throw new Error("No URL");
    const res = await fetch(url);
    if (res.ok) {
      if (!res.headers.get("content-type")?.startsWith("application/json")) {
        throw new Error("Content is not JSON");
      }
      return (await res.json()) as T;
    } else {
      throw new Error(`${res.status} ${res.statusText}`);
    }
  } catch (e) {
    console.error(`Error fetching JSON: ${url}`, e);
    throw e;
  }
}

/**
 * Memoizes an asynchronous function.
 * @template P   Cache key type
 * @template Args Function argument tuple
 * @template R   Resolved value of the Promise
 * @param fn The async function to memoize.
 * @param getKey Optional function to compute a cache key from the function arguments. If omitted, the first argument is used as the key.
 * @returns A memoized version of the async function with the same signature.
 */
function memoizeAsync<P, Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
  getKey?: (...args: Args) => P,
): (...args: Args) => Promise<R> {
  const cache = new Map<P, Promise<R>>();

  return async (...args: Args): Promise<R> => {
    const key = getKey ? getKey(...args) : (args[0] as P);

    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Memoizes the fetchJson function to cache the results of fetch requests.
 * @param url - The URL used to fetch JSON data.
 * @returns A promise that resolves to the cached JSON data.
 */
const cachedFetchJson = memoizeAsync(fetchJson);

/**
 * Fetches a layout by name from the server.
 * @param layoutName The name of the layout to fetch.
 * @returns A promise that resolves to the layout object.
 * @throws {Error} If the layout list or layout doesn't exist.
 */
export async function getLayout(layoutName: string): Promise<LayoutObject> {
  return await cachedFetchJson<LayoutObject>(`/layouts/${layoutName}.json`);
}

let currentLanguage: LanguageObject;

const cachedFetchLanguage = memoizeAsync(
  async (lang: Language): Promise<LanguageObject> =>
    await fetchJson<LanguageObject>(`/languages/${lang}.json`),
);
/**
 * Fetches the language object for a given language from the server.
 * @param lang The language code.
 * @returns A promise that resolves to the language object.
 */
export async function getLanguage(lang: Language): Promise<LanguageObject> {
  // try {
  if (currentLanguage === undefined || currentLanguage.name !== lang) {
    const loaded = await cachedFetchLanguage(lang);

    currentLanguage = loaded;
  }
  return currentLanguage;
}
