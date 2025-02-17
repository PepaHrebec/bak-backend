import * as cheerio from "cheerio";
import { generate } from "random-words";
import { FilterOptions } from "./types";

// Gets the Cheerio object based on the url
export async function getCheerioFromUrl(url: string) {
  try {
    const response = await fetch(url);
    const html = await response.text();

    // Use Cheerio to parse the HTML
    return cheerio.load(html);
  } catch (error) {
    throw new Error();
  }
}

export async function getTranscribedWord(propWord?: string) {
  const set: Set<string> = new Set();
  const randomWord = generate(1);

  // FIX PERSON ERROR
  // WHEN REMOVING "-" LOOK FOR STRESS MARK DIFFS

  const $ = await getCheerioFromUrl(
    `https://dictionary.cambridge.org/dictionary/english/${
      propWord ?? randomWord
    }`
  );

  $(".superentry .uk.dpron-i .pron.dpron").each(function () {
    set.add(filterPhonemicString($(this).text()));
  });

  return {
    array: Array.from(set),
    word: propWord ?? randomWord,
  };
}

export function filterPhonemicString(
  string: string,
  options: FilterOptions = { syllables: true, borders: true, initialDash: true }
) {
  for (const key in options) {
    switch (key as keyof FilterOptions) {
      case "borders":
        string = string.replaceAll("/", "");
        break;

      case "syllables":
        string = string.replaceAll(".", "");
        break;

      case "initialDash":
        string = string.replace("-", "");
        break;

      default:
        break;
    }
  }

  return string;
}
