import { Hono } from "hono";
import { getTranscribedWord } from "./utils/helpers";
import { cors } from "hono/cors";

const app = new Hono();

app.use("/*", cors());

// TODO: Add refetch limiter
app.get("/:word?", async (c) => {
  const { word } = c.req.param();
  let transcribed = await getTranscribedWord(word);

  // Fetches a different word in case of a blank transcription
  while (transcribed.array.length === 0) {
    transcribed = await getTranscribedWord();
  }

  return c.json({
    originalWord: transcribed.word,
    transcriptions: transcribed.array,
  });
});

export default app;
