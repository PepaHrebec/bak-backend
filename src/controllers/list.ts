import { eq, and } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import { repeatedWordsTable } from "../db/schema";
import { sendErrorJson } from "../utils/helpers";
import { HonoVariables } from "../utils/types";

const list = new Hono<{ Variables: HonoVariables }>();

list.get("/", async (c) => {
  const session = c.get("session");
  if (!session) {
    return sendErrorJson(
      c,
      "You have to be logged-in to access this functionality.",
      401
    );
  }

  const repeatedWords = await db
    .select({
      id: repeatedWordsTable.id,
      word: repeatedWordsTable.word,
      transcription: repeatedWordsTable.transcription,
    })
    .from(repeatedWordsTable)
    .where(eq(repeatedWordsTable.userId, session.userId));

  return c.json({
    words: repeatedWords,
  });
});

list.post("/", async (c) => {
  const body: { word: string; transcription: string } = await c.req.json();
  console.log(body.word);

  const session = c.get("session");
  if (!session) {
    return sendErrorJson(
      c,
      "You have to be logged-in to access this functionality.",
      401
    );
  }

  const res = await db
    .select()
    .from(repeatedWordsTable)
    .where(
      and(
        eq(repeatedWordsTable.word, body.word),
        eq(repeatedWordsTable.userId, session.userId)
      )
    );

  console.log(body.word);
  console.log(res.length);
  if (res.length !== 0) {
    return sendErrorJson(c, "This word is already in your list.");
  }

  await db.insert(repeatedWordsTable).values({
    userId: session.userId,
    word: body.word,
    transcription: body.transcription,
  });

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

  await db
    .delete(repeatedWordsTable)
    .where(eq(repeatedWordsTable.id, numberedId));

  return c.json({});
});

export default list;
