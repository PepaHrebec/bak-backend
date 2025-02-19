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

  const $ = await getCheerioFromUrl(
    `https://dictionary.cambridge.org/dictionary/english/${
      propWord ?? randomWord
    }`
  );

  $(".superentry .uk.dpron-i .pron.dpron .ipa").each(function () {
    const word = $(this).text();
    const filteredWord = filterPhonemicString(word);

    // Transcriptions sometimes include "-"-marked words which aren't nouns or verbs
    if (!filteredWord.startsWith("-")) {
      set.add(filteredWord);
    }
  });

  return {
    array: Array.from(set),
    word: propWord ?? randomWord[0],
  };
}

export function filterPhonemicString(
  string: string,
  options: FilterOptions = {
    syllables: true,
    borders: true,
    trim: true,
    initialDash: false,
  }
) {
  for (const key in options) {
    switch (key as keyof FilterOptions) {
      case "borders":
        string = string.replaceAll("/", "");
        break;

      case "syllables":
        string = string.replaceAll(".", "");
        break;

      case "trim":
        string = string.trim();
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
