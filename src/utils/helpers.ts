import * as cheerio from "cheerio";
import { generate } from "random-words";
import { FilterOptions } from "./types";
import { db } from "../db";
import { and, eq } from "drizzle-orm";
import { Session, repeatedWordsTable } from "../db/schema";
import { Context } from "hono";
import { StatusCode } from "hono/utils/http-status";

// Gets the Cheerio object based on the url
export async function getCheerioFromUrl(url: string) {
  try {
    const response = await fetch(url);
    const html = await response.text();

    // Use Cheerio to parse the HTML
    return cheerio.load(html);
  } catch (error) {
    console.log(error);
    throw new Error();
  }
}

// Returns the word and its transcriptions
export async function getTranscribedWord(propWord?: string) {
  const set: Set<string> = new Set();
  const randomWord = generate(1);

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

// Filters the phonemic string based on criteria in options
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

// Checks wether thw word is included in the user's list
export async function isWordInList(word: string, session: Session) {
  const res = await db
    .select()
    .from(repeatedWordsTable)
    .where(
      and(
        eq(repeatedWordsTable.word, word),
        eq(repeatedWordsTable.userId, session.userId)
      )
    );

  return res.length !== 0;
}

export function sendErrorJson(
  c: Context,
  message: string,
  code: StatusCode = 400
) {
  c.status(code);
  return c.json({ message });
}
