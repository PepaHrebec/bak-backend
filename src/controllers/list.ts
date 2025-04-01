import { eq, and } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import { getTranscribedWord, sendErrorJson } from "../utils/helpers";
import { HonoVariables } from "../utils/types";
import { listsTable, transcriptionsTable, wordsTable } from "../db/schema";

const list = new Hono<{ Variables: HonoVariables }>();

list.get("/", async (c) => {
  const transcriptionMap = new Map<string, string[]>();
  const wordMap = new Map<number, string>();

  const session = c.get("session");
  if (!session) {
    return sendErrorJson(
      c,
      "You have to be logged-in to access this functionality.",
      401
    );
  }

  const rtrn = await db
    .select({
      id: listsTable.id,
      word: wordsTable.word,
      transcriptions: transcriptionsTable.transcription,
    })
    .from(listsTable)
    .leftJoin(wordsTable, eq(listsTable.wordId, wordsTable.id))
    .leftJoin(
      transcriptionsTable,
      eq(transcriptionsTable.wordId, wordsTable.id)
    )
    .where(eq(listsTable.userId, session.userId));

  // Map of word to transcription[]
  rtrn.forEach((value) => {
    const mapArray = transcriptionMap.get(value.word!);
    if (
      mapArray !== null &&
      mapArray !== undefined &&
      value.transcriptions !== null
    ) {
      transcriptionMap.set(value.word!, [...mapArray, value.transcriptions]);
    } else {
      transcriptionMap.set(value.word!, [value.transcriptions!]);
    }
  });

  // Map of id to word
  rtrn.forEach((value) => {
    if (!wordMap.has(value.id)) {
      wordMap.set(value.id, value.word!);
    }
  });

  // Create the array of unique words with arrays of their transcriptions
  const finalProduct = Array.from(wordMap).map((keyvalue) => {
    return {
      id: keyvalue[0],
      word: keyvalue[1],
      transcriptions: transcriptionMap.get(keyvalue[1]),
    };
  });

  return c.json({
    words: finalProduct,
  });
});

list.post("/", async (c) => {
  const body: { word: string; transcriptions: string[] } = await c.req.json();

  const session = c.get("session");
  if (!session) {
    return sendErrorJson(
      c,
      "You have to be logged-in to access this functionality.",
      401
    );
  }

  // Checks if there isn't this word added by this user already
  const res = await db
    .select()
    .from(listsTable)
    .leftJoin(wordsTable, eq(listsTable.wordId, wordsTable.id))
    .where(
      and(eq(wordsTable.word, body.word), eq(listsTable.userId, session.userId))
    );

  if (res.length !== 0) {
    return sendErrorJson(c, "This word is already in your list.");
  }

  const wordAlreadyInDb = await db
    .select({ id: wordsTable.id })
    .from(wordsTable)
    .where(eq(wordsTable.word, body.word));

  // Word is already in the DB -> we just connect the word and the user
  if (wordAlreadyInDb.length !== 0) {
    await db
      .insert(listsTable)
      .values({ userId: session.userId, wordId: wordAlreadyInDb[0].id });
    return c.json({});
  }

  // Inserts the word
  const wordId = await db
    .insert(wordsTable)
    .values({
      word: body.word,
    })
    .$returningId();

  // Inserts all of the transcriptions
  await Promise.all(
    body.transcriptions.map(async (transcription) => {
      await db
        .insert(transcriptionsTable)
        .values({ transcription: transcription, wordId: wordId[0].id });
    })
  );

  // Inserts the connection
  await db
    .insert(listsTable)
    .values({ userId: session.userId, wordId: wordId[0].id });

  return c.json({});
});

list.post("/own-word", async (c) => {
  const body: { word: string } = await c.req.json();

  const session = c.get("session");
  if (!session) {
    return sendErrorJson(
      c,
      "You have to be logged-in to access this functionality.",
      401
    );
  }

  // Checks if there isn't this word added by this user already
  const res = await db
    .select()
    .from(listsTable)
    .leftJoin(wordsTable, eq(listsTable.wordId, wordsTable.id))
    .where(
      and(eq(wordsTable.word, body.word), eq(listsTable.userId, session.userId))
    );

  if (res.length !== 0) {
    return sendErrorJson(c, "This word is already in your list.");
  }

  const wordAlreadyInDb = await db
    .select({ id: wordsTable.id })
    .from(wordsTable)
    .where(eq(wordsTable.word, body.word));

  // Word is already in the DB -> we just connect the word and the user
  if (wordAlreadyInDb.length !== 0) {
    await db
      .insert(listsTable)
      .values({ userId: session.userId, wordId: wordAlreadyInDb[0].id });
    return c.json({});
  }

  const transcribed = await getTranscribedWord(body.word);

  if (transcribed.array.length === 0) {
    return sendErrorJson(c, "There has been an error inserting your word.");
  }

  // Inserts the word
  const wordId = await db
    .insert(wordsTable)
    .values({
      word: transcribed.word,
    })
    .$returningId();

  // Inserts all of the transcriptions
  await Promise.all(
    transcribed.array.map(async (transcription) => {
      await db
        .insert(transcriptionsTable)
        .values({ transcription: transcription, wordId: wordId[0].id });
    })
  );

  // Inserts the connection
  await db
    .insert(listsTable)
    .values({ userId: session.userId, wordId: wordId[0].id });

  return c.json({});
});

list.delete("/:id", async (c) => {
  const session = c.get("session");
  if (!session) {
    return sendErrorJson(
      c,
      "You have to be logged-in to access this functionality.",
      401
    );
  }

  const { id } = c.req.param();
  const numberedId = Number(id);

  await db.delete(listsTable).where(eq(listsTable.id, numberedId));

  return c.json({});
});

export default list;
